<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RoleController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $building = $user->getBuilding();

        // Get default system roles and custom building roles
        $roles = Role::assignableForBuilding($building->id)
            ->with('permissions:id,name,group,description')
            ->withCount(['users' => function ($q) use ($building) {
                $q->where('user_roles.building_id', $building->id);
            }])
            ->orderByRaw("CASE WHEN building_id IS NULL THEN 0 ELSE 1 END")
            ->orderBy('name')
            ->get()
            ->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'description' => $role->description,
                    'is_system' => $role->is_system,
                    'building_id' => $role->building_id,
                    'users_count' => $role->users_count,
                    'permissions' => $role->permissions->map(fn($p) => [
                        'id' => $p->id,
                        'name' => $p->name,
                        'group' => $p->group,
                        'description' => $p->description,
                    ])->values()->toArray(),
                ];
            });

        // All available permissions grouped
        $permissions = Permission::orderBy('group')->orderBy('name')
            ->get(['id', 'name', 'group', 'description'])
            ->groupBy('group')
            ->map(fn($perms) => $perms->values()->toArray())
            ->toArray();

        return Inertia::render('Manager/Roles', [
            'user' => ['name' => $user->name, 'email' => $user->email, 'role' => $user->getRoleLabelForBuilding($building->id)],
            'building' => [
                'id' => $building->id,
                'name' => $building->name,
                'address' => $building->address,
            ],
            'roles' => $roles,
            'permissionGroups' => $permissions,
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        $building = $user->getBuilding();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:255'],
            'permissions' => ['required', 'array', 'min:1'],
            'permissions.*' => ['exists:permissions,id'],
        ]);

        // Check for duplicate name within this building
        $exists = Role::where('name', $validated['name'])
            ->where('building_id', $building->id)
            ->exists();

        if ($exists) {
            return back()->withErrors(['name' => 'A role with this name already exists for your building.']);
        }

        DB::transaction(function () use ($validated, $building, $user) {
            $role = Role::create([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'building_id' => $building->id,
                'created_by' => $user->id,
                'is_system' => false,
            ]);

            $role->permissions()->sync($validated['permissions']);
        });

        return redirect()->route('manager.roles.index')
            ->with('success', "Role \"{$validated['name']}\" created successfully.");
    }

    public function update(Request $request, Role $role)
    {
        $user = Auth::user();
        $building = $user->getBuilding();

        // System default roles: only allow permission edits (for building-scoped copies)
        // Custom building roles: allow name, description & permission edits
        if ($role->is_system && $role->building_id === null) {
            // For system roles, we don't allow editing directly
            // Instead, we could create a building-scoped override — but for now, deny
            abort(403, 'System roles cannot be modified. Create a custom role instead.');
        }

        // Ensure this custom role belongs to the manager's building
        if ($role->building_id !== $building->id) {
            abort(403, 'You can only modify roles belonging to your building.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:255'],
            'permissions' => ['required', 'array', 'min:1'],
            'permissions.*' => ['exists:permissions,id'],
        ]);

        // Check for duplicate name within this building (excluding current role)
        $exists = Role::where('name', $validated['name'])
            ->where('building_id', $building->id)
            ->where('id', '!=', $role->id)
            ->exists();

        if ($exists) {
            return back()->withErrors(['name' => 'A role with this name already exists for your building.']);
        }

        DB::transaction(function () use ($role, $validated) {
            $role->update([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
            ]);

            $role->permissions()->sync($validated['permissions']);
        });

        return redirect()->route('manager.roles.index')
            ->with('success', "Role \"{$role->name}\" updated successfully.");
    }

    public function destroy(Role $role)
    {
        $user = Auth::user();
        $building = $user->getBuilding();

        if ($role->is_system) {
            abort(403, 'System roles cannot be deleted.');
        }

        if ($role->building_id !== $building->id) {
            abort(403, 'You can only delete roles belonging to your building.');
        }

        // Check if any staff members are assigned this role in this building
        $usersCount = DB::table('user_roles')
            ->where('role_id', $role->id)
            ->where('building_id', $building->id)
            ->count();

        if ($usersCount > 0) {
            return back()->with('error', "Cannot delete \"{$role->name}\" — {$usersCount} staff member(s) are still assigned to this role. Reassign them first.");
        }

        $roleName = $role->name;
        $role->permissions()->detach();
        $role->delete();

        return redirect()->route('manager.roles.index')
            ->with('success', "Role \"{$roleName}\" deleted successfully.");
    }
}
