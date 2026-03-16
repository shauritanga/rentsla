<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Floor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class FloorController extends Controller
{
    public function index()
    {
        $user = $this->getUser();
        $building = $this->getBuilding();

        $floors = $building->floors()
            ->withCount([
                'units',
                'units as occupied_units_count' => fn($q) => $q->where('status', 'occupied'),
            ])
            ->orderBy('sequence')
            ->get()
            ->map(fn($f) => [
                'id' => $f->id,
                'name' => $f->name,
                'sequence' => $f->sequence,
                'units_count' => $f->units_count,
                'occupied_units' => $f->occupied_units_count,
                'vacant_units' => $f->units_count - $f->occupied_units_count,
            ]);

        return Inertia::render('Manager/Floors', [
            'user' => ['name' => $user->name, 'email' => $user->email, 'role' => $user->getRoleLabelForBuilding($building->id)],
            'building' => [
                'id' => $building->id,
                'name' => $building->name,
                'address' => $building->address,
            ],
            'floors' => $floors,
        ]);
    }

    public function store(Request $request)
    {
        $building = $this->getBuilding();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'sequence' => ['required', 'integer', 'min:0'],
        ]);

        $validated['building_id'] = $building->id;

        // Check unique sequence
        $exists = Floor::where('building_id', $building->id)
            ->where('sequence', $validated['sequence'])
            ->exists();

        if ($exists) {
            return back()->withErrors(['sequence' => 'This floor number is already taken.']);
        }

        Floor::create($validated);

        return redirect()->route('manager.floors.index')
            ->with('success', 'Floor added successfully.');
    }

    public function update(Request $request, Floor $floor)
    {
        $building = $this->getBuilding();

        if ($floor->building_id !== $building->id) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'sequence' => ['required', 'integer', 'min:0'],
        ]);

        $exists = Floor::where('building_id', $building->id)
            ->where('sequence', $validated['sequence'])
            ->where('id', '!=', $floor->id)
            ->exists();

        if ($exists) {
            return back()->withErrors(['sequence' => 'This floor number is already taken.']);
        }

        $floor->update($validated);

        return redirect()->route('manager.floors.index')
            ->with('success', 'Floor updated successfully.');
    }

    public function destroy(Floor $floor)
    {
        $building = $this->getBuilding();

        if ($floor->building_id !== $building->id) {
            abort(403);
        }

        if ($floor->units()->count() > 0) {
            return back()->withErrors(['floor' => 'Cannot delete a floor that has units.']);
        }

        $floor->delete();

        return redirect()->route('manager.floors.index')
            ->with('success', 'Floor deleted successfully.');
    }
}
