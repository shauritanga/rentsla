<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Mail\StaffCredentialsMail;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class StaffController extends Controller
{
    /**
     * Get assignable roles for the given building.
     * Includes default template roles and any custom roles the manager created.
     */
    private function getAssignableRoles(int $buildingId)
    {
        return Role::assignableForBuilding($buildingId)->get();
    }

    public function index(Request $request)
    {
        $user = Auth::user();
        $building = $user->getBuilding();

        $assignableRoles = $this->getAssignableRoles($building->id);
        $assignableRoleIds = $assignableRoles->pluck('id')->toArray();

        // Get all users who have a role assigned to this building (excluding the building manager)
        $staffQuery = User::whereHas('roles', function ($q) use ($building, $assignableRoleIds) {
            $q->whereIn('roles.id', $assignableRoleIds)
                ->where('user_roles.building_id', $building->id);
        });

        // Exclude the building's designated manager (they are not "staff")
        if ($building->manager_user_id) {
            $staffQuery->where('id', '!=', $building->manager_user_id);
        }

        if ($search = $request->input('search')) {
            $staffQuery->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('email', 'ilike', "%{$search}%");
            });
        }

        if ($roleFilter = $request->input('role')) {
            $staffQuery->whereHas('roles', function ($q) use ($roleFilter, $building, $assignableRoleIds) {
                $q->where('name', $roleFilter)
                    ->whereIn('roles.id', $assignableRoleIds)
                    ->where('user_roles.building_id', $building->id);
            });
        }

        $staff = $staffQuery->orderBy('name')->paginate(15)->through(function ($member) use ($building, $assignableRoleIds) {
            $buildingRoles = $member->roles()
                ->wherePivot('building_id', $building->id)
                ->whereIn('roles.id', $assignableRoleIds)
                ->get();

            return [
                'id' => $member->id,
                'name' => $member->name,
                'email' => $member->email,
                'roles' => $buildingRoles->map(fn($r) => [
                    'id' => $r->id,
                    'name' => $r->name,
                ])->values()->toArray(),
                'created_at' => $member->created_at->format('M d, Y'),
            ];
        });

        // Available roles for assignment (default + custom)
        $roles = $assignableRoles
            ->map(fn($r) => ['id' => $r->id, 'name' => $r->name]);

        // All permissions grouped
        $permissions = Permission::orderBy('group')->orderBy('name')
            ->get(['id', 'name', 'group', 'description']);

        // Role-permission mapping
        $rolePermissions = [];
        $rolesWithPerms = Role::assignableForBuilding($building->id)
            ->with('permissions:id,name')
            ->get();
        foreach ($rolesWithPerms as $r) {
            $rolePermissions[$r->id] = $r->permissions->pluck('name')->toArray();
        }

        return Inertia::render('Manager/Staff', [
            'user' => ['name' => $user->name, 'email' => $user->email, 'role' => $user->getRoleLabelForBuilding($building->id)],
            'building' => [
                'id' => $building->id,
                'name' => $building->name,
                'address' => $building->address,
            ],
            'staff' => $staff,
            'roles' => $roles,
            'permissions' => $permissions,
            'rolePermissions' => $rolePermissions,
            'filters' => [
                'search' => $request->input('search', ''),
                'role' => $request->input('role', ''),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        $building = $user->getBuilding();

        // Check if a soft-deleted user exists with this email
        $trashedUser = User::onlyTrashed()->where('email', $request->input('email'))->first();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', $trashedUser ? 'unique:users,email,' . $trashedUser->id : 'unique:users,email'],
            'password' => ['required', Password::min(8)],
            'role_id' => ['required', 'exists:roles,id'],
        ]);

        // Verify the role is an assignable building-level role
        $role = Role::assignableForBuilding($building->id)->findOrFail($validated['role_id']);
        $plainPassword = $validated['password'];

        $member = DB::transaction(function () use ($validated, $building, $role, $user, $trashedUser) {
            if ($trashedUser) {
                // Restore and update the soft-deleted user
                $trashedUser->restore();
                $trashedUser->update([
                    'name' => $validated['name'],
                    'password' => Hash::make($validated['password']),
                ]);
                $member = $trashedUser;
            } else {
                $member = User::create([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'password' => Hash::make($validated['password']),
                ]);
            }

            // Assign role scoped to this building
            $member->roles()->attach($role->id, [
                'building_id' => $building->id,
                'assigned_by' => $user->id,
            ]);

            return $member;
        });

        // Send credentials email
        Mail::to($validated['email'])->send(
            new StaffCredentialsMail(
                $validated['name'],
                $validated['email'],
                $plainPassword,
                $role->name,
                $building->name
            )
        );

        return redirect()->route('manager.staff.index')
            ->with('success', "{$member->name} has been added as {$role->name}. Credentials sent to {$validated['email']}.");
    }

    public function update(Request $request, User $staff)
    {
        $user = Auth::user();
        $building = $user->getBuilding();

        $assignableRoleIds = $this->getAssignableRoles($building->id)->pluck('id')->toArray();

        // Verify this staff member belongs to this building
        $hasRole = $staff->roles()
            ->whereIn('roles.id', $assignableRoleIds)
            ->wherePivot('building_id', $building->id)
            ->exists();

        if (!$hasRole) {
            abort(403, 'This user is not a staff member of your building.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,' . $staff->id],
            'password' => ['nullable', Password::min(8)],
            'role_id' => ['required', 'exists:roles,id'],
        ]);

        // Verify the role is an assignable building-level role
        $role = Role::assignableForBuilding($building->id)->findOrFail($validated['role_id']);

        DB::transaction(function () use ($staff, $validated, $building, $role, $user) {
            $updateData = [
                'name' => $validated['name'],
                'email' => $validated['email'],
            ];
            if (!empty($validated['password'])) {
                $updateData['password'] = Hash::make($validated['password']);
            }
            $staff->update($updateData);

            // Remove old building-scoped roles and assign new one
            DB::table('user_roles')
                ->where('user_id', $staff->id)
                ->where('building_id', $building->id)
                ->delete();

            $staff->roles()->attach($role->id, [
                'building_id' => $building->id,
                'assigned_by' => $user->id,
            ]);
        });

        return redirect()->route('manager.staff.index')
            ->with('success', "{$staff->name} has been updated.");
    }

    public function destroy(User $staff)
    {
        $user = Auth::user();
        $building = $user->getBuilding();

        $assignableRoleIds = $this->getAssignableRoles($building->id)->pluck('id')->toArray();

        // Verify this staff member belongs to this building
        $hasRole = $staff->roles()
            ->whereIn('roles.id', $assignableRoleIds)
            ->wherePivot('building_id', $building->id)
            ->exists();

        if (!$hasRole) {
            abort(403, 'This user is not a staff member of your building.');
        }

        // Remove building-scoped role assignment (don't delete the user account)
        DB::table('user_roles')
            ->where('user_id', $staff->id)
            ->where('building_id', $building->id)
            ->delete();

        // If the user has no other role assignments, soft-delete
        $otherRoles = DB::table('user_roles')
            ->where('user_id', $staff->id)
            ->exists();

        if (!$otherRoles) {
            $staff->delete();
        }

        return redirect()->route('manager.staff.index')
            ->with('success', "{$staff->name} has been removed from {$building->name}.");
    }
}
