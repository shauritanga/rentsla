<?php

namespace App\Http\Controllers;

use App\Mail\ManagerCredentialsMail;
use App\Models\Building;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class ManagerController extends Controller
{
    /**
     * Display a listing of managers.
     */
    public function index(Request $request)
    {
        $managerRole = Role::firstOrCreate(['name' => 'manager']);

        $query = User::whereHas('roles', function ($q) use ($managerRole) {
            $q->where('roles.id', $managerRole->id);
        })->with(['managedBuilding:id,name,address,manager_user_id']);

        // Search
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('email', 'ilike', "%{$search}%");
            });
        }

        $managers = $query->latest()->paginate(10)->through(function ($manager) {
            return [
                'id' => $manager->id,
                'name' => $manager->name,
                'email' => $manager->email,
                'building' => $manager->managedBuilding ? [
                    'id' => $manager->managedBuilding->id,
                    'name' => $manager->managedBuilding->name,
                    'address' => $manager->managedBuilding->address,
                ] : null,
                'created_at' => $manager->created_at->format('M d, Y'),
            ];
        });

        // Buildings available for assignment (not already assigned to a manager)
        $availableBuildings = Building::whereNull('manager_user_id')
            ->select('id', 'name', 'address')
            ->orderBy('name')
            ->get();

        // Summary stats
        $totalManagers = User::whereHas('roles', function ($q) use ($managerRole) {
            $q->where('roles.id', $managerRole->id);
        })->count();

        $assignedManagers = User::whereHas('roles', function ($q) use ($managerRole) {
            $q->where('roles.id', $managerRole->id);
        })->whereHas('managedBuilding')->count();

        return Inertia::render('Managers/Index', [
            'managers' => $managers,
            'availableBuildings' => $availableBuildings,
            'stats' => [
                'total' => $totalManagers,
                'assigned' => $assignedManagers,
                'unassigned' => $totalManagers - $assignedManagers,
            ],
            'filters' => [
                'search' => $request->input('search', ''),
            ],
            'user' => Auth::user(),
        ]);
    }

    /**
     * Store a newly created manager.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'building_id' => ['nullable', 'exists:buildings,id'],
        ]);

        $managerRole = Role::firstOrCreate(['name' => 'manager']);
        $plainPassword = $validated['password'];

        $buildingName = null;
        if (!empty($validated['building_id'])) {
            $buildingName = Building::where('id', $validated['building_id'])->value('name');
        }

        DB::transaction(function () use ($validated, $managerRole) {
            // Create user
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
            ]);

            // Assign manager role
            DB::table('user_roles')->insert([
                'user_id' => $user->id,
                'role_id' => $managerRole->id,
                'building_id' => $validated['building_id'] ?? null,
                'assigned_by' => Auth::id(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Assign to building if provided
            if (!empty($validated['building_id'])) {
                Building::where('id', $validated['building_id'])
                    ->update(['manager_user_id' => $user->id]);
            }
        });

        // Send credentials email
        Mail::to($validated['email'])->send(
            new ManagerCredentialsMail(
                $validated['name'],
                $validated['email'],
                $plainPassword,
                $buildingName
            )
        );

        return redirect()->route('managers.index')
            ->with('success', 'Manager created successfully. Credentials sent to ' . $validated['email'] . '.');
    }

    /**
     * Update the specified manager.
     */
    public function update(Request $request, User $manager)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,' . $manager->id],
            'password' => ['nullable', 'string', 'min:8'],
            'building_id' => ['nullable', 'exists:buildings,id'],
        ]);

        DB::transaction(function () use ($validated, $manager) {
            // Update user info
            $manager->name = $validated['name'];
            $manager->email = $validated['email'];
            if (!empty($validated['password'])) {
                $manager->password = Hash::make($validated['password']);
            }
            $manager->save();

            // Unassign from current building (if any)
            Building::where('manager_user_id', $manager->id)
                ->update(['manager_user_id' => null]);

            // Assign to new building (if provided)
            if (!empty($validated['building_id'])) {
                Building::where('id', $validated['building_id'])
                    ->update(['manager_user_id' => $manager->id]);
            }
        });

        return redirect()->route('managers.index')
            ->with('success', 'Manager updated successfully.');
    }

    /**
     * Remove the specified manager.
     */
    public function destroy(User $manager)
    {
        DB::transaction(function () use ($manager) {
            // Unassign from building
            Building::where('manager_user_id', $manager->id)
                ->update(['manager_user_id' => null]);

            // Soft-delete the user (keeps role assignments for potential restore)
            $manager->delete();
        });

        return redirect()->route('managers.index')
            ->with('success', 'Manager removed successfully.');
    }
}
