<?php

namespace App\Http\Controllers;

use App\Models\Building;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class BuildingController extends Controller
{
    /**
     * Display a listing of buildings.
     */
    public function index(Request $request)
    {
        $query = Building::with(['manager:id,name,email', 'floors', 'units'])
            ->withCount(['floors', 'units']);

        // Search
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('address', 'ilike', "%{$search}%");
            });
        }

        $buildings = $query->latest()->paginate(10)->through(function ($building) {
            $totalUnits = $building->units_count;
            $occupiedUnits = $building->units->where('status', 'occupied')->count();
            $occupancyRate = $totalUnits > 0 ? round(($occupiedUnits / $totalUnits) * 100) : 0;

            return [
                'id' => $building->id,
                'name' => $building->name,
                'address' => $building->address,
                'manager' => $building->manager ? [
                    'id' => $building->manager->id,
                    'name' => $building->manager->name,
                    'email' => $building->manager->email,
                ] : null,
                'floors_count' => $building->floors_count,
                'units_count' => $totalUnits,
                'occupied_units' => $occupiedUnits,
                'vacant_units' => $totalUnits - $occupiedUnits,
                'occupancy_rate' => $occupancyRate,
                'created_at' => $building->created_at->format('M d, Y'),
            ];
        });

        // Get all users with the manager role
        $managerRole = Role::firstOrCreate(['name' => 'manager']);
        $availableManagers = User::whereHas('roles', function ($q) use ($managerRole) {
            $q->where('roles.id', $managerRole->id);
        })
            ->select('id', 'name', 'email')
            ->orderBy('name')
            ->get();

        return Inertia::render('Buildings/Index', [
            'buildings' => $buildings,
            'availableManagers' => $availableManagers,
            'filters' => [
                'search' => $request->input('search', ''),
            ],
            'user' => Auth::user(),
        ]);
    }

    /**
     * Store a newly created building.
     */
    public function store(Request $request)
    {
        // Sanitize empty string to null
        $request->merge([
            'manager_user_id' => $request->input('manager_user_id') ?: null,
        ]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'manager_user_id' => ['nullable', 'exists:users,id'],
        ]);

        $validated['created_by'] = Auth::id();

        Building::create($validated);

        return redirect()->route('buildings.index')
            ->with('success', 'Building created successfully.');
    }

    /**
     * Update the specified building.
     */
    public function update(Request $request, Building $building)
    {
        // Sanitize empty string to null
        $request->merge([
            'manager_user_id' => $request->input('manager_user_id') ?: null,
        ]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'manager_user_id' => ['nullable', 'exists:users,id'],
        ]);

        $building->update($validated);

        return redirect()->route('buildings.index')
            ->with('success', 'Building updated successfully.');
    }

    /**
     * Remove the specified building.
     */
    public function destroy(Building $building)
    {
        $building->delete();

        return redirect()->route('buildings.index')
            ->with('success', 'Building deleted successfully.');
    }
}
