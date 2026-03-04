<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class UnitController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $building = $user->getBuilding();

        $query = $building->units()
            ->with(['floor:id,name,sequence', 'activeLease.tenant:id,full_name']);

        if ($search = $request->input('search')) {
            $query->where('unit_number', 'ilike', "%{$search}%");
        }

        if ($floorId = $request->input('floor_id')) {
            $query->where('floor_id', $floorId);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $units = $query->orderBy('unit_number')->paginate(15)->through(fn($u) => [
            'id' => $u->id,
            'unit_number' => $u->unit_number,
            'area_sqm' => $u->area_sqm,
            'unit_type' => $u->unit_type,
            'rent_amount' => $u->rent_amount,
            'rent_currency' => $u->rent_currency,
            'status' => $u->status,
            'floor' => $u->floor ? ['id' => $u->floor->id, 'name' => $u->floor->name] : null,
            'tenant' => $u->activeLease?->tenant ? [
                'id' => $u->activeLease->tenant->id,
                'name' => $u->activeLease->tenant->full_name,
            ] : null,
            'monthly_rent' => $u->activeLease?->monthly_rent,
        ]);

        $floors = $building->floors()->orderBy('sequence')->get(['id', 'name', 'sequence']);

        return Inertia::render('Manager/Units', [
            'user' => ['name' => $user->name, 'email' => $user->email, 'role' => $user->getRoleLabelForBuilding($building->id)],
            'building' => [
                'id' => $building->id,
                'name' => $building->name,
                'address' => $building->address,
            ],
            'units' => $units,
            'floors' => $floors,
            'filters' => [
                'search' => $request->input('search', ''),
                'floor_id' => $request->input('floor_id', ''),
                'status' => $request->input('status', ''),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $building = Auth::user()->getBuilding();

        $validated = $request->validate([
            'unit_number' => ['required', 'string', 'max:50'],
            'floor_id' => ['required', 'exists:floors,id'],
            'area_sqm' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'unit_type' => ['required', 'string', 'in:office,store,parking,warehouse,residential,commercial,workshop,restaurant,clinic,other'],
            'rent_amount' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'rent_currency' => ['required', 'string', 'in:TZS,USD'],
        ]);

        // Verify floor belongs to building
        $floor = $building->floors()->findOrFail($validated['floor_id']);

        $exists = Unit::where('building_id', $building->id)
            ->where('unit_number', $validated['unit_number'])
            ->exists();

        if ($exists) {
            return back()->withErrors(['unit_number' => 'This unit number already exists in this building.']);
        }

        Unit::create([
            'building_id' => $building->id,
            'floor_id' => $validated['floor_id'],
            'unit_number' => $validated['unit_number'],
            'area_sqm' => $validated['area_sqm'] ?? null,
            'unit_type' => $validated['unit_type'],
            'rent_amount' => $validated['rent_amount'] ?? null,
            'rent_currency' => $validated['rent_currency'],
            'status' => 'vacant',
        ]);

        return redirect()->route('manager.units.index')
            ->with('success', 'Unit created successfully.');
    }

    public function update(Request $request, Unit $unit)
    {
        $building = Auth::user()->getBuilding();

        if ($unit->building_id !== $building->id) {
            abort(403);
        }

        $validated = $request->validate([
            'unit_number' => ['required', 'string', 'max:50'],
            'floor_id' => ['required', 'exists:floors,id'],
            'area_sqm' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'unit_type' => ['required', 'string', 'in:office,store,parking,warehouse,residential,commercial,workshop,restaurant,clinic,other'],
            'rent_amount' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'rent_currency' => ['required', 'string', 'in:TZS,USD'],
        ]);

        $building->floors()->findOrFail($validated['floor_id']);

        $exists = Unit::where('building_id', $building->id)
            ->where('unit_number', $validated['unit_number'])
            ->where('id', '!=', $unit->id)
            ->exists();

        if ($exists) {
            return back()->withErrors(['unit_number' => 'This unit number already exists in this building.']);
        }

        $unit->update([
            'floor_id' => $validated['floor_id'],
            'unit_number' => $validated['unit_number'],
            'area_sqm' => $validated['area_sqm'] ?? null,
            'unit_type' => $validated['unit_type'],
            'rent_amount' => $validated['rent_amount'] ?? null,
            'rent_currency' => $validated['rent_currency'],
        ]);

        return redirect()->route('manager.units.index')
            ->with('success', 'Unit updated successfully.');
    }

    public function destroy(Unit $unit)
    {
        $building = Auth::user()->getBuilding();

        if ($unit->building_id !== $building->id) {
            abort(403);
        }

        if ($unit->status === 'occupied') {
            return back()->withErrors(['unit' => 'Cannot delete an occupied unit. End the lease first.']);
        }

        $unit->delete();

        return redirect()->route('manager.units.index')
            ->with('success', 'Unit deleted successfully.');
    }
}
