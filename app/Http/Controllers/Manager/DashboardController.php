<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Building;
use App\Models\Lease;
use App\Models\Payment;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $building = $user->getBuilding();

        $totalFloors = $building->floors()->count();
        $totalUnits = $building->units()->count();
        $occupiedUnits = $building->units()->where('status', 'occupied')->count();
        $vacantUnits = $totalUnits - $occupiedUnits;
        $occupancyRate = $totalUnits > 0 ? round(($occupiedUnits / $totalUnits) * 100) : 0;

        $activeLeases = $building->leases()->where('status', 'active')->count();
        $totalTenants = $building->leases()->where('status', 'active')
            ->distinct('tenant_id')->count('tenant_id');

        $monthlyRevenue = $building->leases()
            ->where('status', 'active')
            ->sum('monthly_rent');

        $currentMonth = now()->format('Y-m');
        $collectedThisMonth = Payment::where('building_id', $building->id)
            ->where('month_covered', $currentMonth)
            ->sum('amount');

        // Recent payments
        $recentPayments = Payment::where('building_id', $building->id)
            ->with(['lease.tenant:id,full_name', 'lease.unit:id,unit_number'])
            ->latest('payment_date')
            ->take(5)
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'tenant' => $p->lease->tenant->full_name ?? 'N/A',
                'unit' => $p->lease->unit->unit_number ?? 'N/A',
                'amount' => $p->amount,
                'date' => $p->payment_date->format('M d, Y'),
                'method' => $p->payment_method,
            ]);

        // Floor breakdown
        $floors = $building->floors()->withCount([
            'units',
            'units as occupied_units_count' => fn($q) => $q->where('status', 'occupied'),
        ])->orderBy('sequence')->get()->map(fn($f) => [
            'id' => $f->id,
            'name' => $f->name,
            'total_units' => $f->units_count,
            'occupied' => $f->occupied_units_count,
            'vacant' => $f->units_count - $f->occupied_units_count,
        ]);

        return Inertia::render('Manager/Dashboard', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->getRoleLabelForBuilding($building->id),
            ],
            'building' => [
                'id' => $building->id,
                'name' => $building->name,
                'address' => $building->address,
            ],
            'stats' => [
                'total_floors' => $totalFloors,
                'total_units' => $totalUnits,
                'occupied_units' => $occupiedUnits,
                'vacant_units' => $vacantUnits,
                'occupancy_rate' => $occupancyRate,
                'active_leases' => $activeLeases,
                'total_tenants' => $totalTenants,
                'monthly_revenue' => $monthlyRevenue,
                'collected_this_month' => $collectedThisMonth,
            ],
            'recentPayments' => $recentPayments,
            'floors' => $floors,
        ]);
    }
}
