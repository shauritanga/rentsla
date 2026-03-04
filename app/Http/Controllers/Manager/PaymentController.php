<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Lease;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $building = $user->getBuilding();

        $query = Payment::where('building_id', $building->id)
            ->with([
                'lease.tenant:id,full_name',
                'lease.unit:id,unit_number',
                'receiver:id,name',
            ]);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'ilike', "%{$search}%")
                    ->orWhereHas('lease.tenant', fn($tq) => $tq->where('full_name', 'ilike', "%{$search}%"))
                    ->orWhereHas('lease.unit', fn($uq) => $uq->where('unit_number', 'ilike', "%{$search}%"));
            });
        }

        if ($month = $request->input('month')) {
            $query->where('month_covered', $month);
        }

        $payments = $query->latest('payment_date')->paginate(15)->through(fn($p) => [
            'id' => $p->id,
            'tenant' => $p->lease->tenant->full_name ?? 'N/A',
            'unit' => $p->lease->unit->unit_number ?? 'N/A',
            'amount' => $p->amount,
            'payment_date' => $p->payment_date->format('M d, Y'),
            'payment_method' => $p->payment_method,
            'reference' => $p->reference,
            'month_covered' => $p->month_covered,
            'notes' => $p->notes,
            'received_by' => $p->receiver->name ?? 'N/A',
        ]);

        // Active leases for recording payments
        $activeLeases = $building->leases()
            ->where('status', 'active')
            ->with(['tenant:id,full_name', 'unit:id,unit_number'])
            ->get()
            ->map(fn($l) => [
                'id' => $l->id,
                'tenant' => $l->tenant->full_name,
                'unit' => $l->unit->unit_number,
                'monthly_rent' => $l->monthly_rent,
            ]);

        // Stats
        $currentMonth = now()->format('Y-m');
        $totalCollected = Payment::where('building_id', $building->id)
            ->where('month_covered', $currentMonth)->sum('amount');
        $expectedRevenue = $building->leases()->where('status', 'active')->sum('monthly_rent');
        $totalPayments = Payment::where('building_id', $building->id)->count();

        return Inertia::render('Manager/Payments', [
            'user' => ['name' => $user->name, 'email' => $user->email, 'role' => $user->getRoleLabelForBuilding($building->id)],
            'building' => [
                'id' => $building->id,
                'name' => $building->name,
                'address' => $building->address,
            ],
            'payments' => $payments,
            'activeLeases' => $activeLeases,
            'stats' => [
                'collected_this_month' => $totalCollected,
                'expected_revenue' => $expectedRevenue,
                'collection_rate' => $expectedRevenue > 0 ? round(($totalCollected / $expectedRevenue) * 100) : 0,
                'total_payments' => $totalPayments,
            ],
            'filters' => [
                'search' => $request->input('search', ''),
                'month' => $request->input('month', $currentMonth),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $building = Auth::user()->getBuilding();

        $validated = $request->validate([
            'lease_id' => ['required', 'exists:leases,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_date' => ['required', 'date'],
            'payment_method' => ['required', 'in:cash,bank_transfer,mobile_money'],
            'reference' => ['nullable', 'string', 'max:255'],
            'month_covered' => ['required', 'string', 'regex:/^\d{4}-\d{2}$/'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        // Verify lease belongs to building
        $lease = $building->leases()->findOrFail($validated['lease_id']);

        Payment::create([
            ...$validated,
            'building_id' => $building->id,
            'received_by' => Auth::id(),
        ]);

        return redirect()->route('manager.payments.index')
            ->with('success', 'Payment recorded successfully.');
    }
}
