<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TenantController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $building = $user->getBuilding();

        // Get tenants linked to this building via leases, or tenants with no lease yet
        $query = Tenant::where(function ($q) use ($building) {
            $q->whereHas('leases', fn($lq) => $lq->where('building_id', $building->id))
                ->orWhereDoesntHave('leases');
        });

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'ilike', "%{$search}%")
                    ->orWhere('email', 'ilike', "%{$search}%")
                    ->orWhere('phone', 'ilike', "%{$search}%");
            });
        }

        $tenants = $query->with(['leases' => function ($q) use ($building) {
            $q->where('building_id', $building->id)
                ->with('unit:id,unit_number')
                ->latest('start_date');
        }])->latest()->paginate(15)->through(fn($t) => [
            'id' => $t->id,
            'full_name' => $t->full_name,
            'email' => $t->email,
            'phone' => $t->phone,
            'tin_number' => $t->tin_number,
            'billing_address' => $t->billing_address,
            'active_lease' => $t->leases->firstWhere('status', 'active') ? [
                'id' => $t->leases->firstWhere('status', 'active')->id,
                'unit' => $t->leases->firstWhere('status', 'active')->unit->unit_number ?? null,
                'monthly_rent' => $t->leases->firstWhere('status', 'active')->monthly_rent,
                'start_date' => $t->leases->firstWhere('status', 'active')->start_date->format('M d, Y'),
            ] : null,
            'created_at' => $t->created_at->format('M d, Y'),
        ]);

        return Inertia::render('Manager/Tenants', [
            'user' => ['name' => $user->name, 'email' => $user->email, 'role' => $user->getRoleLabelForBuilding($building->id)],
            'building' => [
                'id' => $building->id,
                'name' => $building->name,
                'address' => $building->address,
            ],
            'tenants' => $tenants,
            'filters' => [
                'search' => $request->input('search', ''),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'tin_number' => ['nullable', 'string', 'max:50'],
            'billing_address' => ['nullable', 'string', 'max:1000'],
        ]);

        Tenant::create($validated);

        return redirect()->route('manager.tenants.index')
            ->with('success', 'Tenant added successfully.');
    }

    public function update(Request $request, Tenant $tenant)
    {
        $building = Auth::user()->getBuilding();

        // Verify tenant belongs to this building
        $belongsToBuilding = $tenant->leases()
            ->where('building_id', $building->id)->exists();

        if (!$belongsToBuilding) {
            abort(403);
        }

        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'tin_number' => ['nullable', 'string', 'max:50'],
            'billing_address' => ['nullable', 'string', 'max:1000'],
        ]);

        $tenant->update($validated);

        return redirect()->route('manager.tenants.index')
            ->with('success', 'Tenant updated successfully.');
    }
}
