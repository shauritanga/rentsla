<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Lease;
use App\Models\LeaseAmendment;
use App\Models\LeaseApproval;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\User;
use App\Notifications\LeaseApprovalRequired;
use App\Notifications\LeaseStatusChanged;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class LeaseController extends Controller
{
    public function index(Request $request)
    {
        $user = $this->getUser();
        $building = $this->getBuilding();

        $query = $building->leases()
            ->with([
                'unit:id,unit_number,floor_id,area_sqm,rent_amount,rent_currency',
                'unit.floor:id,name',
                'tenant:id,full_name,email,phone',
                'approvals.approver:id,name',
                'creator:id,name',
                'amendments' => fn($q) => $q->latest()->with(['requester:id,name', 'reviewer:id,name']),
            ]);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('tenant', fn($tq) => $tq->where('full_name', 'ilike', "%{$search}%"))
                    ->orWhereHas('unit', fn($uq) => $uq->where('unit_number', 'ilike', "%{$search}%"));
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $leases = $query->latest('start_date')->paginate(15)->through(fn($l) => [
            'id' => $l->id,
            'unit' => [
                'id' => $l->unit->id,
                'unit_number' => $l->unit->unit_number,
                'floor' => $l->unit->floor?->name,
                'area_sqm' => (float) $l->unit->area_sqm,
                'rent_amount' => (float) $l->unit->rent_amount,
                'rent_currency' => $l->unit->rent_currency ?? 'TZS',
            ],
            'tenant' => [
                'id' => $l->tenant->id,
                'full_name' => $l->tenant->full_name,
                'email' => $l->tenant->email,
                'phone' => $l->tenant->phone,
            ],
            'start_date' => $l->start_date->format('Y-m-d'),
            'end_date' => $l->end_date?->format('Y-m-d'),
            'monthly_rent' => $l->monthly_rent,
            'deposit_amount' => (float) $l->deposit_amount,
            'rent_currency' => $l->rent_currency ?? 'TZS',
            'billing_cycle_months' => $l->billing_cycle_months ?? 3,
            'rental_period_years' => $l->rental_period_years,
            'fitout_applicable' => $l->fitout_applicable,
            'fitout_start_date' => $l->fitout_start_date?->format('Y-m-d'),
            'fitout_end_date' => $l->fitout_end_date?->format('Y-m-d'),
            'status' => $l->status,
            'created_by_name' => $l->creator?->name,
            'approvals' => $l->approvals->map(fn($a) => [
                'id' => $a->id,
                'role' => $a->role,
                'action' => $a->action,
                'comment' => $a->comment,
                'approver_name' => $a->approver?->name,
                'acted_at' => $a->acted_at?->format('Y-m-d H:i'),
            ]),
            'amendments' => $l->amendments->map(fn($am) => [
                'id' => $am->id,
                'current_area_sqm' => (float) $am->current_area_sqm,
                'proposed_area_sqm' => (float) $am->proposed_area_sqm,
                'current_monthly_rent' => (float) $am->current_monthly_rent,
                'proposed_monthly_rent' => (float) $am->proposed_monthly_rent,
                'reason' => $am->reason,
                'status' => $am->status,
                'requester_name' => $am->requester?->name,
                'reviewer_name' => $am->reviewer?->name,
                'review_comment' => $am->review_comment,
                'reviewed_at' => $am->reviewed_at?->format('Y-m-d H:i'),
                'created_at' => $am->created_at->format('Y-m-d H:i'),
            ]),
        ]);

        // Vacant units for new leases (include pricing data for auto-calculation)
        $vacantUnits = $building->units()
            ->where('status', 'vacant')
            ->with('floor:id,name')
            ->orderBy('unit_number')
            ->get()
            ->map(fn($u) => [
                'id' => $u->id,
                'unit_number' => $u->unit_number,
                'floor' => $u->floor?->name,
                'area_sqm' => (float) $u->area_sqm,
                'rent_amount' => (float) $u->rent_amount,
                'rent_currency' => $u->rent_currency ?? 'TZS',
                'unit_type' => $u->unit_type,
            ]);

        // Existing tenants for autocomplete
        $existingTenants = Tenant::whereHas('leases', fn($q) => $q->where('building_id', $building->id))
            ->orWhereDoesntHave('leases')
            ->select('id', 'full_name', 'email', 'phone')
            ->orderBy('full_name')
            ->get();

        // Stats
        $activeCount = $building->leases()->where('status', 'active')->count();
        $expiredCount = $building->leases()->where('status', 'expired')->count();
        $terminatedCount = $building->leases()->where('status', 'terminated')->count();
        $pendingCount = $building->leases()->whereIn('status', [
            Lease::STATUS_PENDING_ACCOUNTANT,
            Lease::STATUS_PENDING_MANAGER,
        ])->count();
        $rejectedCount = $building->leases()->where('status', 'rejected')->count();

        // Determine the current user's role for this building
        $userRole = 'viewer';
        if ($user->isManager()) {
            $userRole = 'manager';
        } elseif ($user->hasRoleForBuilding('accountant', $building->id)) {
            $userRole = 'accountant';
        } elseif ($user->hasRoleForBuilding('lease_manager', $building->id)) {
            $userRole = 'lease_manager';
        }

        return Inertia::render('Manager/Leases', [
            'user' => ['name' => $user->name, 'email' => $user->email, 'role' => $user->getRoleLabelForBuilding($building->id)],
            'building' => [
                'id' => $building->id,
                'name' => $building->name,
                'address' => $building->address,
            ],
            'leases' => $leases,
            'vacantUnits' => $vacantUnits,
            'existingTenants' => $existingTenants,
            'stats' => [
                'active' => $activeCount,
                'expired' => $expiredCount,
                'terminated' => $terminatedCount,
                'pending' => $pendingCount,
                'rejected' => $rejectedCount,
            ],
            'filters' => [
                'search' => $request->input('search', ''),
                'status' => $request->input('status', ''),
            ],
            'userRole' => $userRole,
        ]);
    }

    public function show(Lease $lease)
    {
        $user = $this->getUser();
        $building = $this->getBuilding();

        if ($lease->building_id !== $building->id) {
            abort(403);
        }

        $lease->load([
            'unit:id,unit_number,floor_id,area_sqm,rent_amount,rent_currency,unit_type,status',
            'unit.floor:id,name',
            'tenant:id,full_name,email,phone',
            'building:id,name,address',
            'creator:id,name',
            'approvals' => fn($q) => $q->latest('acted_at')->with('approver:id,name'),
            'amendments' => fn($q) => $q->latest()->with(['requester:id,name', 'reviewer:id,name']),
            'payments' => fn($q) => $q->latest('payment_date'),
        ]);

        // Determine user role
        $userRole = 'viewer';
        if ($user->isManager()) {
            $userRole = 'manager';
        } elseif ($user->hasRoleForBuilding('accountant', $building->id)) {
            $userRole = 'accountant';
        } elseif ($user->hasRoleForBuilding('lease_manager', $building->id)) {
            $userRole = 'lease_manager';
        }

        return Inertia::render('Manager/LeaseShow', [
            'user' => ['name' => $user->name, 'email' => $user->email, 'role' => $user->getRoleLabelForBuilding($building->id)],
            'building' => [
                'id' => $building->id,
                'name' => $building->name,
                'address' => $building->address,
            ],
            'lease' => [
                'id' => $lease->id,
                'unit' => [
                    'id' => $lease->unit->id,
                    'unit_number' => $lease->unit->unit_number,
                    'floor' => $lease->unit->floor?->name,
                    'area_sqm' => (float) $lease->unit->area_sqm,
                    'rent_amount' => (float) $lease->unit->rent_amount,
                    'rent_currency' => $lease->unit->rent_currency ?? 'TZS',
                    'unit_type' => $lease->unit->unit_type,
                    'status' => $lease->unit->status,
                ],
                'tenant' => [
                    'id' => $lease->tenant->id,
                    'full_name' => $lease->tenant->full_name,
                    'email' => $lease->tenant->email,
                    'phone' => $lease->tenant->phone,
                ],
                'start_date' => $lease->start_date->format('Y-m-d'),
                'end_date' => $lease->end_date?->format('Y-m-d'),
                'monthly_rent' => (float) $lease->monthly_rent,
                'deposit_amount' => (float) $lease->deposit_amount,
                'rent_currency' => $lease->rent_currency ?? 'TZS',
                'billing_cycle_months' => $lease->billing_cycle_months ?? 3,
                'rental_period_years' => $lease->rental_period_years,
                'fitout_applicable' => $lease->fitout_applicable,
                'fitout_start_date' => $lease->fitout_start_date?->format('Y-m-d'),
                'fitout_end_date' => $lease->fitout_end_date?->format('Y-m-d'),
                'status' => $lease->status,
                'created_by_name' => $lease->creator?->name,
                'created_at' => $lease->created_at->format('Y-m-d H:i'),
                'updated_at' => $lease->updated_at->format('Y-m-d H:i'),
                'approvals' => $lease->approvals->map(fn($a) => [
                    'id' => $a->id,
                    'role' => $a->role,
                    'action' => $a->action,
                    'comment' => $a->comment,
                    'approver_name' => $a->approver?->name,
                    'acted_at' => $a->acted_at?->format('Y-m-d H:i'),
                ]),
                'amendments' => $lease->amendments->map(fn($am) => [
                    'id' => $am->id,
                    'current_area_sqm' => (float) $am->current_area_sqm,
                    'proposed_area_sqm' => (float) $am->proposed_area_sqm,
                    'current_monthly_rent' => (float) $am->current_monthly_rent,
                    'proposed_monthly_rent' => (float) $am->proposed_monthly_rent,
                    'reason' => $am->reason,
                    'status' => $am->status,
                    'requester_name' => $am->requester?->name,
                    'reviewer_name' => $am->reviewer?->name,
                    'review_comment' => $am->review_comment,
                    'reviewed_at' => $am->reviewed_at?->format('Y-m-d H:i'),
                    'created_at' => $am->created_at->format('Y-m-d H:i'),
                ]),
                'payments' => $lease->payments->map(fn($p) => [
                    'id' => $p->id,
                    'amount' => (float) $p->amount,
                    'payment_date' => $p->payment_date,
                    'payment_method' => $p->payment_method,
                    'reference' => $p->reference,
                    'month_covered' => $p->month_covered,
                ]),
            ],
            'userRole' => $userRole,
        ]);
    }

    public function store(Request $request)
    {
        $user = $this->getUser();
        $building = $this->getBuilding();

        $validated = $request->validate([
            'unit_id' => ['required', 'exists:units,id'],
            'tenant_id' => ['nullable', 'exists:tenants,id'],
            'tenant_name' => ['required_without:tenant_id', 'nullable', 'string', 'max:255'],
            'tenant_email' => ['nullable', 'email', 'max:255'],
            'tenant_phone' => ['nullable', 'string', 'max:20'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after:start_date'],
            'rental_period_years' => ['required', 'integer', 'min:1', 'max:15'],
            'billing_cycle_months' => ['nullable', 'integer', 'in:3,4,6,12'],
            'fitout_applicable' => ['required', 'boolean'],
            'fitout_start_date' => ['nullable', 'required_if:fitout_applicable,true', 'date'],
            'fitout_end_date' => ['nullable', 'required_if:fitout_applicable,true', 'date', 'after_or_equal:fitout_start_date'],
            'deposit_amount' => ['nullable', 'numeric', 'min:0'],
        ]);

        // Verify unit belongs to building and is vacant
        $unit = $building->units()->where('id', $validated['unit_id'])->firstOrFail();

        if ($unit->status === 'occupied') {
            return back()->withErrors(['unit_id' => 'This unit is already occupied.']);
        }

        // Auto-calculate monthly rent from unit pricing
        $monthlyRent = ($unit->area_sqm ?? 0) * ($unit->rent_amount ?? 0);

        // Determine initial status based on creator's role
        $isManager = $user->isManager();
        $isAccountant = $user->hasRoleForBuilding('accountant', $building->id);

        if ($isManager) {
            // Manager creates → auto-approved, straight to active
            $initialStatus = Lease::STATUS_ACTIVE;
        } elseif ($isAccountant) {
            // Accountant creates → needs manager approval only
            $initialStatus = Lease::STATUS_PENDING_MANAGER;
        } else {
            // Lease manager or others → needs accountant then manager
            $initialStatus = Lease::STATUS_PENDING_ACCOUNTANT;
        }

        $lease = DB::transaction(function () use ($validated, $building, $unit, $monthlyRent, $user, $initialStatus, $isManager) {
            // Create or use existing tenant
            if (!empty($validated['tenant_id'])) {
                $tenant = Tenant::findOrFail($validated['tenant_id']);
            } else {
                $tenant = Tenant::create([
                    'full_name' => $validated['tenant_name'],
                    'email' => $validated['tenant_email'] ?? null,
                    'phone' => $validated['tenant_phone'] ?? null,
                ]);
            }

            $lease = Lease::create([
                'building_id' => $building->id,
                'unit_id' => $unit->id,
                'tenant_id' => $tenant->id,
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'] ?? null,
                'monthly_rent' => $monthlyRent,
                'deposit_amount' => $validated['deposit_amount'] ?? 0,
                'rent_currency' => $unit->rent_currency ?? 'TZS',
                'billing_cycle_months' => $validated['billing_cycle_months'] ?? 3,
                'rental_period_years' => $validated['rental_period_years'],
                'fitout_applicable' => $validated['fitout_applicable'],
                'fitout_start_date' => $validated['fitout_applicable'] ? ($validated['fitout_start_date'] ?? null) : null,
                'fitout_end_date' => $validated['fitout_applicable'] ? ($validated['fitout_end_date'] ?? null) : null,
                'status' => $initialStatus,
                'created_by' => $user->id,
            ]);

            // Only mark unit as occupied if directly active (manager-created)
            if ($isManager) {
                $unit->update(['status' => 'occupied']);
            }

            return $lease;
        });

        // Send notification to the first approver in the chain
        $lease->load(['unit', 'tenant']);
        $this->notifyNextApprover($lease, $building);

        $message = $initialStatus === Lease::STATUS_ACTIVE
            ? 'Lease created successfully.'
            : 'Lease created and submitted for approval.';

        return redirect()->route('manager.leases.index')
            ->with('success', $message);
    }

    public function approve(Request $request, Lease $lease)
    {
        $user = $this->getUser();
        $building = $this->getBuilding();

        if ($lease->building_id !== $building->id) {
            abort(403);
        }

        // Determine if current user can approve at this stage
        $canApprove = false;
        $approverRole = '';

        // Strict approval chain: accountant must approve first, then manager
        if (
            $lease->status === Lease::STATUS_PENDING_ACCOUNTANT
            && $user->hasRoleForBuilding('accountant', $building->id)
        ) {
            $canApprove = true;
            $approverRole = 'accountant';
        } elseif (
            $lease->status === Lease::STATUS_PENDING_MANAGER
            && $user->isManager()
        ) {
            $canApprove = true;
            $approverRole = 'manager';
        }

        if (!$canApprove) {
            if ($lease->status === Lease::STATUS_PENDING_ACCOUNTANT && $user->isManager()) {
                return back()->withErrors(['approval' => 'This lease must be approved by the accountant first before it reaches you.']);
            }
            return back()->withErrors(['approval' => 'You are not authorised to approve this lease at its current stage.']);
        }

        DB::transaction(function () use ($lease, $user, $approverRole) {
            // Record the approval
            LeaseApproval::create([
                'lease_id' => $lease->id,
                'approver_id' => $user->id,
                'role' => $approverRole,
                'action' => 'approved',
                'acted_at' => now(),
            ]);

            // Advance the status
            if ($approverRole === 'manager') {
                $lease->update(['status' => Lease::STATUS_ACTIVE]);
                $lease->unit->update(['status' => 'occupied']);
            } elseif ($approverRole === 'accountant') {
                $lease->update(['status' => Lease::STATUS_PENDING_MANAGER]);
            }
        });

        // Reload and notify
        $lease->refresh();
        $lease->load(['unit', 'tenant']);
        $this->notifyAfterApproval($lease, $building, $user, $approverRole);

        return redirect()->route('manager.leases.index')
            ->with('success', 'Lease approved successfully.');
    }

    public function reject(Request $request, Lease $lease)
    {
        $user = $this->getUser();
        $building = $this->getBuilding();

        if ($lease->building_id !== $building->id) {
            abort(403);
        }

        $request->validate([
            'comment' => ['required', 'string', 'max:1000'],
        ]);

        // Determine if current user can reject at this stage
        $canReject = false;
        $rejecterRole = '';

        // Strict rejection chain: only the current stage approver can reject
        if (
            $lease->status === Lease::STATUS_PENDING_ACCOUNTANT
            && $user->hasRoleForBuilding('accountant', $building->id)
        ) {
            $canReject = true;
            $rejecterRole = 'accountant';
        } elseif (
            $lease->status === Lease::STATUS_PENDING_MANAGER
            && $user->isManager()
        ) {
            $canReject = true;
            $rejecterRole = 'manager';
        }

        if (!$canReject) {
            if ($lease->status === Lease::STATUS_PENDING_ACCOUNTANT && $user->isManager()) {
                return back()->withErrors(['rejection' => 'This lease must pass through the accountant first before it reaches you.']);
            }
            return back()->withErrors(['rejection' => 'You are not authorised to reject this lease at its current stage.']);
        }

        $comment = $request->input('comment');

        DB::transaction(function () use ($lease, $user, $comment, $rejecterRole) {
            LeaseApproval::create([
                'lease_id' => $lease->id,
                'approver_id' => $user->id,
                'role' => $rejecterRole,
                'action' => 'rejected',
                'comment' => $comment,
                'acted_at' => now(),
            ]);

            $lease->update(['status' => Lease::STATUS_REJECTED]);
        });

        // Notify the lease creator about rejection
        $lease->refresh();
        $lease->load(['unit', 'tenant']);
        $this->notifyAfterRejection($lease, $building, $user, $rejecterRole, $comment);

        return redirect()->route('manager.leases.index')
            ->with('success', 'Lease has been rejected.');
    }

    public function requestAmendment(Request $request, Lease $lease)
    {
        $user = $this->getUser();
        $building = $this->getBuilding();

        if ($lease->building_id !== $building->id) {
            abort(403);
        }

        if ($lease->status !== Lease::STATUS_ACTIVE) {
            return back()->withErrors(['amendment' => 'Only active leases can be amended.']);
        }

        // Check for already pending amendment
        if ($lease->amendments()->where('status', LeaseAmendment::STATUS_PENDING)->exists()) {
            return back()->withErrors(['amendment' => 'This lease already has a pending area change request.']);
        }

        $validated = $request->validate([
            'proposed_area_sqm' => ['required', 'numeric', 'min:0.01'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $unit = $lease->unit;
        $currentArea  = (float) $unit->area_sqm;
        $proposedArea = (float) $validated['proposed_area_sqm'];
        $rentPerSqm   = (float) $unit->rent_amount;

        $currentRent  = $currentArea * $rentPerSqm;
        $proposedRent = $proposedArea * $rentPerSqm;

        LeaseAmendment::create([
            'lease_id' => $lease->id,
            'requested_by' => $user->id,
            'amendment_type' => 'area_change',
            'current_area_sqm' => $currentArea,
            'proposed_area_sqm' => $proposedArea,
            'current_monthly_rent' => $currentRent,
            'proposed_monthly_rent' => $proposedRent,
            'reason' => $validated['reason'] ?? null,
            'status' => LeaseAmendment::STATUS_PENDING,
        ]);

        return redirect()->route('manager.leases.index')
            ->with('success', 'Area change request submitted for manager approval.');
    }

    public function approveAmendment(Request $request, LeaseAmendment $amendment)
    {
        $user = $this->getUser();
        $building = $this->getBuilding();

        if ($amendment->lease->building_id !== $building->id) {
            abort(403);
        }

        if (!$user->isManager()) {
            return back()->withErrors(['amendment' => 'Only the manager can approve area change requests.']);
        }

        if ($amendment->status !== LeaseAmendment::STATUS_PENDING) {
            return back()->withErrors(['amendment' => 'This amendment has already been reviewed.']);
        }

        DB::transaction(function () use ($amendment, $user) {
            $amendment->update([
                'status' => LeaseAmendment::STATUS_APPROVED,
                'reviewed_by' => $user->id,
                'reviewed_at' => now(),
            ]);

            // Update unit area
            $amendment->lease->unit->update([
                'area_sqm' => $amendment->proposed_area_sqm,
            ]);

            // Recalculate and update lease monthly rent
            $amendment->lease->update([
                'monthly_rent' => $amendment->proposed_monthly_rent,
            ]);
        });

        return redirect()->route('manager.leases.index')
            ->with('success', 'Area change approved. Unit and rent updated.');
    }

    public function rejectAmendment(Request $request, LeaseAmendment $amendment)
    {
        $user = $this->getUser();
        $building = $this->getBuilding();

        if ($amendment->lease->building_id !== $building->id) {
            abort(403);
        }

        if (!$user->isManager()) {
            return back()->withErrors(['amendment' => 'Only the manager can reject area change requests.']);
        }

        if ($amendment->status !== LeaseAmendment::STATUS_PENDING) {
            return back()->withErrors(['amendment' => 'This amendment has already been reviewed.']);
        }

        $request->validate([
            'comment' => ['required', 'string', 'max:1000'],
        ]);

        $amendment->update([
            'status' => LeaseAmendment::STATUS_REJECTED,
            'reviewed_by' => $user->id,
            'review_comment' => $request->input('comment'),
            'reviewed_at' => now(),
        ]);

        return redirect()->route('manager.leases.index')
            ->with('success', 'Area change request has been rejected.');
    }

    public function update(Request $request, Lease $lease)
    {
        $building = $this->getBuilding();

        if ($lease->building_id !== $building->id) {
            abort(403);
        }

        $validated = $request->validate([
            'end_date' => ['nullable', 'date'],
            'monthly_rent' => ['required', 'numeric', 'min:0'],
            'status' => ['required', 'in:active,expired,terminated'],
        ]);

        DB::transaction(function () use ($lease, $validated) {
            $oldStatus = $lease->status;
            $lease->update($validated);

            // If lease is terminated/expired, free the unit
            if (in_array($validated['status'], ['expired', 'terminated']) && $oldStatus === 'active') {
                $lease->unit->update(['status' => 'vacant']);
            }

            // If reactivating, mark unit as occupied
            if ($validated['status'] === 'active' && $oldStatus !== 'active') {
                $lease->unit->update(['status' => 'occupied']);
            }
        });

        return redirect()->route('manager.leases.index')
            ->with('success', 'Lease updated successfully.');
    }

    /* ------------------------------------------------------------------ */
    /*  Polling endpoint — returns current lease statuses as JSON          */
    /* ------------------------------------------------------------------ */
    public function statuses(Request $request)
    {
        $user = $this->getUser();
        $building = $this->getBuilding();

        $leases = $building->leases()
            ->select('id', 'status', 'updated_at')
            ->get()
            ->map(fn($l) => [
                'id' => $l->id,
                'status' => $l->status,
                'updated_at' => $l->updated_at->toISOString(),
            ]);

        return response()->json(['leases' => $leases]);
    }

    /* ------------------------------------------------------------------ */
    /*  Notifications endpoint — returns unread notifications as JSON      */
    /* ------------------------------------------------------------------ */
    public function notifications(Request $request)
    {
        $user = $this->getUser();

        $notifications = $user->unreadNotifications()
            ->whereIn('type', [
                LeaseApprovalRequired::class,
                LeaseStatusChanged::class,
            ])
            ->latest()
            ->take(20)
            ->get()
            ->map(fn($n) => [
                'id' => $n->id,
                'data' => $n->data,
                'read_at' => $n->read_at,
                'created_at' => $n->created_at->toISOString(),
            ]);

        return response()->json(['notifications' => $notifications]);
    }

    public function markNotificationRead(Request $request, string $notificationId)
    {
        $user = $this->getUser();
        $notification = $user->notifications()->find($notificationId);
        if ($notification) {
            $notification->markAsRead();
        }
        return response()->json(['ok' => true]);
    }

    public function markAllNotificationsRead(Request $request)
    {
        $user = $this->getUser();
        $user->unreadNotifications()->update(['read_at' => now()]);
        return response()->json(['ok' => true]);
    }

    /* ------------------------------------------------------------------ */
    /*  Private helpers — notification dispatch                            */
    /* ------------------------------------------------------------------ */

    /**
     * Notify the next approver in the chain based on the lease's current status.
     */
    private function notifyNextApprover(Lease $lease, $building): void
    {
        if ($lease->status === Lease::STATUS_PENDING_ACCOUNTANT) {
            // Find users with accountant role for this building
            $accountants = $this->getUsersByRoleForBuilding('accountant', $building->id);
            foreach ($accountants as $accountant) {
                $accountant->notify(new LeaseApprovalRequired($lease, 'accountant', $building->name));
            }
        } elseif ($lease->status === Lease::STATUS_PENDING_MANAGER) {
            // Notify the building manager
            if ($building->manager) {
                $building->manager->notify(new LeaseApprovalRequired($lease, 'manager', $building->name));
            }
        }
    }

    /**
     * After approval: notify next approver (if chain continues) and notify the creator.
     */
    private function notifyAfterApproval(Lease $lease, $building, User $approver, string $approverRole): void
    {
        $roleLabel = ucfirst($approverRole);

        // If accountant approved → now pending manager, notify the manager
        if ($lease->status === Lease::STATUS_PENDING_MANAGER) {
            $this->notifyNextApprover($lease, $building);
        }

        // Notify the lease creator about the approval
        if ($lease->created_by) {
            $creator = User::find($lease->created_by);
            if ($creator && $creator->id !== $approver->id) {
                $creator->notify(new LeaseStatusChanged(
                    $lease,
                    'approved',
                    $approver->name,
                    $roleLabel,
                    $building->name,
                ));
            }
        }

        // If fully activated, also notify the accountants
        if ($lease->status === Lease::STATUS_ACTIVE) {
            $accountants = $this->getUsersByRoleForBuilding('accountant', $building->id);
            foreach ($accountants as $accountant) {
                if ($accountant->id !== $approver->id) {
                    $accountant->notify(new LeaseStatusChanged(
                        $lease,
                        'activated',
                        $approver->name,
                        $roleLabel,
                        $building->name,
                    ));
                }
            }
        }
    }

    /**
     * After rejection: notify the lease creator.
     */
    private function notifyAfterRejection(Lease $lease, $building, User $rejecter, string $rejecterRole, ?string $comment): void
    {
        $roleLabel = ucfirst($rejecterRole);

        if ($lease->created_by) {
            $creator = User::find($lease->created_by);
            if ($creator && $creator->id !== $rejecter->id) {
                $creator->notify(new LeaseStatusChanged(
                    $lease,
                    'rejected',
                    $rejecter->name,
                    $roleLabel,
                    $building->name,
                    $comment,
                ));
            }
        }
    }

    /**
     * Get all users that have a specific role for a building.
     */
    private function getUsersByRoleForBuilding(string $roleName, int $buildingId): \Illuminate\Support\Collection
    {
        return User::whereHas('roles', function ($q) use ($roleName, $buildingId) {
            $q->where('name', $roleName)
                ->where('user_roles.building_id', $buildingId);
        })->get();
    }
}
