<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Mail\InvoiceDocumentMail;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Lease;
use App\Models\Payment;
use App\Models\Transaction;
use App\Models\TransactionEntry;
use App\Models\Account;
use Carbon\Carbon;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;

class InvoiceController extends Controller
{
    /* ================================================================
     *  INDEX — list invoices
     * ================================================================ */
    public function index(Request $request)
    {
        $user     = Auth::user();
        $building = $user->getBuilding();

        $query = Invoice::where('building_id', $building->id)
            ->with(['lease.unit:id,unit_number', 'tenant:id,full_name,tin_number', 'creator:id,name']);

        // Filters
        if ($type = $request->input('type')) {
            $query->where('type', $type);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'ilike', "%{$search}%")
                    ->orWhere('proforma_number', 'ilike', "%{$search}%")
                    ->orWhereHas('tenant', fn($tq) => $tq->where('full_name', 'ilike', "%{$search}%"))
                    ->orWhereHas('lease.unit', fn($uq) => $uq->where('unit_number', 'ilike', "%{$search}%"));
            });
        }

        $invoices = $query->latest()->paginate(15)->through(fn(Invoice $inv) => [
            'id'               => $inv->id,
            'invoice_number'   => $inv->invoice_number,
            'proforma_number'  => $inv->proforma_number,
            'type'             => $inv->type,
            'status'           => $inv->status,
            'tenant'           => $inv->tenant->full_name ?? 'N/A',
            'unit'             => $inv->lease->unit->unit_number ?? 'N/A',
            'period_start_raw' => $inv->period_start->format('Y-m-d'),
            'period_end_raw'   => $inv->period_end->format('Y-m-d'),
            'period_start'     => $inv->period_start->format('M d, Y'),
            'period_end'       => $inv->period_end->format('M d, Y'),
            'billing_months'   => $inv->billing_months,
            'rent_amount'      => (float) $inv->rent_amount,
            'total_amount'     => (float) $inv->total_amount,
            'amount_paid'      => (float) $inv->amount_paid,
            'balance'          => $inv->balance(),
            'currency'         => $inv->currency,
            'issue_date'       => $inv->issue_date->format('M d, Y'),
            'due_date'         => $inv->due_date->format('M d, Y'),
            'created_by'       => $inv->creator->name ?? 'N/A',
        ]);

        // Active leases for selecting when creating
        $activeLeases = $building->leases()
            ->where('status', 'active')
            ->with(['tenant:id,full_name', 'unit:id,unit_number'])
            ->get()
            ->map(fn(Lease $l) => [
                'id'                   => $l->id,
                'tenant_id'            => $l->tenant_id,
                'tenant'               => $l->tenant->full_name,
                'unit'                 => $l->unit->unit_number,
                'monthly_rent'         => (float) $l->monthly_rent,
                'deposit_amount'       => (float) $l->deposit_amount,
                'rent_currency'        => $l->rent_currency ?? 'TZS',
                'billing_cycle_months' => $l->billing_cycle_months ?? 3,
                'start_date'           => $l->start_date?->format('Y-m-d'),
                'fitout_applicable'    => $l->fitout_applicable,
                'fitout_start_date'    => $l->fitout_start_date ? $l->fitout_start_date->format('Y-m-d') : null,
                'fitout_end_date'      => $l->fitout_end_date ? $l->fitout_end_date->format('Y-m-d') : null,
            ]);

        // Stats
        $buildingInvoices = Invoice::where('building_id', $building->id);
        $totalInvoiced    = (clone $buildingInvoices)->where('type', 'invoice')->whereNotIn('status', ['cancelled'])->sum('total_amount');
        $totalPaid        = (clone $buildingInvoices)->where('type', 'invoice')->sum('amount_paid');
        $outstanding      = $totalInvoiced - $totalPaid;
        $overdueCount     = (clone $buildingInvoices)->where('type', 'invoice')->where('status', 'overdue')->count();

        return Inertia::render('Manager/Invoices', [
            'user'     => ['name' => $user->name, 'email' => $user->email, 'role' => $user->getRoleLabelForBuilding($building->id)],
            'building' => ['id' => $building->id, 'name' => $building->name, 'address' => $building->address],
            'invoices' => $invoices,
            'activeLeases' => $activeLeases,
            'stats' => [
                'total_invoiced' => (float) $totalInvoiced,
                'total_paid'     => (float) $totalPaid,
                'outstanding'    => (float) $outstanding,
                'overdue_count'  => $overdueCount,
            ],
            'filters' => [
                'search' => $request->input('search', ''),
                'type'   => $request->input('type', ''),
                'status' => $request->input('status', ''),
            ],
        ]);
    }

    /* ================================================================
     *  SHOW — single invoice detail
     * ================================================================ */
    public function show(Invoice $invoice)
    {
        $user     = Auth::user();
        $building = $user->getBuilding();

        abort_unless($invoice->building_id === $building->id, 403);

        $invoice->load([
            'lease.unit:id,unit_number,area_sqm',
            'tenant:id,full_name,email,phone,tin_number,billing_address',
            'items',
            'payments.receiver:id,name',
            'creator:id,name',
        ]);

        return Inertia::render('Manager/InvoiceShow', [
            'user'     => ['name' => $user->name, 'email' => $user->email, 'role' => $user->getRoleLabelForBuilding($building->id)],
            'building' => ['id' => $building->id, 'name' => $building->name, 'address' => $building->address],
            'invoice'  => [
                'id'                     => $invoice->id,
                'invoice_number'         => $invoice->invoice_number,
                'proforma_number'        => $invoice->proforma_number,
                'type'                   => $invoice->type,
                'status'                 => $invoice->status,
                'billing_months'         => $invoice->billing_months,
                'issue_date'             => $invoice->issue_date->format('Y-m-d'),
                'due_date'               => $invoice->due_date->format('Y-m-d'),
                'period_start'           => $invoice->period_start->format('Y-m-d'),
                'period_end'             => $invoice->period_end->format('Y-m-d'),
                'rent_amount'            => (float) $invoice->rent_amount,
                'service_charge_rate'    => (float) $invoice->service_charge_rate,
                'service_charge_amount'  => (float) $invoice->service_charge_amount,
                'subtotal'               => (float) $invoice->subtotal,
                'withholding_tax_rate'   => (float) $invoice->withholding_tax_rate,
                'withholding_tax_amount' => (float) $invoice->withholding_tax_amount,
                'total_amount'           => (float) $invoice->total_amount,
                'amount_paid'            => (float) $invoice->amount_paid,
                'balance'                => $invoice->balance(),
                'currency'               => $invoice->currency,
                'notes'                  => $invoice->notes,
                'converted_at'           => $invoice->converted_at?->format('Y-m-d H:i'),
                'created_by'             => $invoice->creator->name ?? 'N/A',
                'created_at'             => $invoice->created_at->format('Y-m-d H:i'),
                'tenant' => [
                    'full_name'       => $invoice->tenant->full_name,
                    'email'           => $invoice->tenant->email,
                    'phone'           => $invoice->tenant->phone,
                    'tin_number'      => $invoice->tenant->tin_number,
                    'billing_address' => $invoice->tenant->billing_address,
                ],
                'unit' => [
                    'unit_number' => $invoice->lease->unit->unit_number ?? null,
                    'area_sqm'    => $invoice->lease->unit->area_sqm ?? null,
                ],
                'lease_id' => $invoice->lease_id,
                'items' => $invoice->items->map(fn(InvoiceItem $it) => [
                    'id'          => $it->id,
                    'description' => $it->description,
                    'quantity'    => (float) $it->quantity,
                    'unit_price'  => (float) $it->unit_price,
                    'amount'      => (float) $it->amount,
                    'item_type'   => $it->item_type,
                ]),
                'payments' => $invoice->payments->map(fn(Payment $p) => [
                    'id'             => $p->id,
                    'amount'         => (float) $p->amount,
                    'payment_date'   => $p->payment_date->format('M d, Y'),
                    'payment_method' => $p->payment_method,
                    'reference'      => $p->reference,
                    'received_by'    => $p->receiver->name ?? 'N/A',
                ]),
            ],
        ]);
    }

    /* ================================================================
     *  STORE — create invoice or proforma
     * ================================================================ */
    public function store(Request $request)
    {
        $user     = Auth::user();
        $building = $user->getBuilding();

        $validated = $request->validate([
            'lease_id'               => ['required', 'exists:leases,id'],
            'type'                   => ['required', 'in:proforma,invoice'],
            'billing_months'         => ['required', 'integer', 'in:3,4,6,12'],
            'issue_date'             => ['required', 'date'],
            'due_date'               => ['required', 'date', 'after_or_equal:issue_date'],
            'period_start'           => ['required', 'date'],
            'service_charge_rate'    => ['required', 'numeric', 'min:0', 'max:100'],
            'withholding_tax_rate'   => ['required', 'numeric', 'min:0', 'max:100'],
            'notes'                  => ['nullable', 'string', 'max:2000'],
            'additional_items'       => ['nullable', 'array'],
            'additional_items.*.description' => ['required_with:additional_items', 'string', 'max:255'],
            'additional_items.*.amount'      => ['required_with:additional_items', 'numeric', 'min:0'],
            'additional_items.*.item_type'   => ['nullable', 'string', 'in:deposit,penalty,other'],
        ]);

        // Verify lease belongs to building and is active
        $lease = $building->leases()->where('status', 'active')->findOrFail($validated['lease_id']);

        $billingMonths = (int) $validated['billing_months'];
        $periodStart   = Carbon::parse($validated['period_start']);
        $periodEnd     = $periodStart->copy()->addMonths($billingMonths)->subDay();


        // --- Fit-out and rental period split logic ---
        $fitoutApplicable = $lease->fitout_applicable;
        $fitoutStart = $lease->fitout_start_date;
        $fitoutEnd = $lease->fitout_end_date;

        $invoice = DB::transaction(function () use ($validated, $building, $lease, $user, $billingMonths, $periodStart, $periodEnd, $fitoutApplicable, $fitoutStart, $fitoutEnd) {
            $type = $validated['type'];

            $invoice = $this->createWithUniqueNumbers($building->id, $type, [
                'building_id'         => $building->id,
                'lease_id'            => $lease->id,
                'tenant_id'           => $lease->tenant_id,
                'type'                => $type,
                'status'              => Invoice::STATUS_DRAFT,
                'billing_months'      => $billingMonths,
                'issue_date'          => $validated['issue_date'],
                'due_date'            => $validated['due_date'],
                'period_start'        => $periodStart,
                'period_end'          => $periodEnd,
                // rent_amount and service_charge_amount will be recalculated
                'rent_amount'         => 0,
                'service_charge_rate' => $validated['service_charge_rate'],
                'withholding_tax_rate' => $validated['withholding_tax_rate'],
                'currency'            => $lease->rent_currency ?? 'TZS',
                'notes'               => $validated['notes'] ?? null,
                'created_by'          => $user->id,
            ]);

            $serviceChargeRate = $validated['service_charge_rate'];
            $monthlyRent = (float) $lease->monthly_rent;
            $daysInMonth = $periodStart->daysInMonth;

            $fitoutStartDate = $fitoutApplicable && $fitoutStart ? Carbon::parse($fitoutStart) : null;
            $fitoutEndDate = $fitoutApplicable && $fitoutEnd ? Carbon::parse($fitoutEnd) : null;

            // Calculate fit-out and rental periods within the invoice period
            $fitoutPeriodStart = $fitoutStartDate && $fitoutStartDate->greaterThan($periodStart) ? $fitoutStartDate : $periodStart;
            $fitoutPeriodEnd = $fitoutEndDate && $fitoutEndDate->lessThan($periodEnd) ? $fitoutEndDate : null;

            $lineItems = [];
            $totalRent = 0;
            $totalServiceCharge = 0;

            if ($fitoutApplicable && $fitoutStartDate && $fitoutEndDate && $fitoutEndDate->gte($periodStart) && $fitoutStartDate->lte($periodEnd)) {
                // 1. Fit-out period (service charge only)
                $fitoutStartInPeriod = $fitoutStartDate->greaterThan($periodStart) ? $fitoutStartDate : $periodStart;
                $fitoutEndInPeriod = $fitoutEndDate->lessThan($periodEnd) ? $fitoutEndDate : $periodEnd;
                $fitoutDays = $fitoutEndInPeriod->diffInDaysFiltered(function ($date) {
                    return $date->isWeekday();
                }, $fitoutStartInPeriod) + 1;
                if ($fitoutDays > 0) {
                    $serviceCharge = round(($monthlyRent * $serviceChargeRate / 100) / $daysInMonth * $fitoutDays, 2);
                    $lineItems[] = [
                        'description' => "Service Charges (Fit-Out Period: {$fitoutStartInPeriod->format('M d, Y')} - {$fitoutEndInPeriod->format('M d, Y')})",
                        'quantity'    => $fitoutDays,
                        'unit_price'  => round(($monthlyRent * $serviceChargeRate / 100) / $daysInMonth, 2),
                        'amount'      => $serviceCharge,
                        'item_type'   => 'service_charge',
                    ];
                    $totalServiceCharge += $serviceCharge;
                }

                // 2. Rental period (rent + service charge)
                $rentalStart = $fitoutEndInPeriod->copy()->addDay();
                if ($rentalStart->lte($periodEnd)) {
                    $rentalEnd = $periodEnd;
                    $rentalDays = $rentalEnd->diffInDaysFiltered(function ($date) {
                        return $date->isWeekday();
                    }, $rentalStart) + 1;
                    if ($rentalDays > 0) {
                        $rent = round($monthlyRent / $daysInMonth * $rentalDays, 2);
                        $serviceCharge = round(($monthlyRent * $serviceChargeRate / 100) / $daysInMonth * $rentalDays, 2);
                        $lineItems[] = [
                            'description' => "Rent (Rental Period: {$rentalStart->format('M d, Y')} - {$rentalEnd->format('M d, Y')})",
                            'quantity'    => $rentalDays,
                            'unit_price'  => round($monthlyRent / $daysInMonth, 2),
                            'amount'      => $rent,
                            'item_type'   => 'rent',
                        ];
                        $lineItems[] = [
                            'description' => "Service Charges (Rental Period: {$rentalStart->format('M d, Y')} - {$rentalEnd->format('M d, Y')})",
                            'quantity'    => $rentalDays,
                            'unit_price'  => round(($monthlyRent * $serviceChargeRate / 100) / $daysInMonth, 2),
                            'amount'      => $serviceCharge,
                            'item_type'   => 'service_charge',
                        ];
                        $totalRent += $rent;
                        $totalServiceCharge += $serviceCharge;
                    }
                }
            } else {
                // No fit-out, or period is entirely after fit-out: charge both rent and service charge for the whole period
                $days = $periodEnd->diffInDaysFiltered(function ($date) {
                    return $date->isWeekday();
                }, $periodStart) + 1;
                $rent = round($monthlyRent / $daysInMonth * $days, 2);
                $serviceCharge = round(($monthlyRent * $serviceChargeRate / 100) / $daysInMonth * $days, 2);
                $lineItems[] = [
                    'description' => "Rent (Period: {$periodStart->format('M d, Y')} - {$periodEnd->format('M d, Y')})",
                    'quantity'    => $days,
                    'unit_price'  => round($monthlyRent / $daysInMonth, 2),
                    'amount'      => $rent,
                    'item_type'   => 'rent',
                ];
                $lineItems[] = [
                    'description' => "Service Charges (Period: {$periodStart->format('M d, Y')} - {$periodEnd->format('M d, Y')})",
                    'quantity'    => $days,
                    'unit_price'  => round(($monthlyRent * $serviceChargeRate / 100) / $daysInMonth, 2),
                    'amount'      => $serviceCharge,
                    'item_type'   => 'service_charge',
                ];
                $totalRent += $rent;
                $totalServiceCharge += $serviceCharge;
            }

            // Create line items
            foreach ($lineItems as $item) {
                InvoiceItem::create([
                    'invoice_id'  => $invoice->id,
                    'description' => $item['description'],
                    'quantity'    => $item['quantity'],
                    'unit_price'  => $item['unit_price'],
                    'amount'      => $item['amount'],
                    'item_type'   => $item['item_type'],
                ]);
            }

            // Create additional items
            if (!empty($validated['additional_items'])) {
                foreach ($validated['additional_items'] as $item) {
                    InvoiceItem::create([
                        'invoice_id'  => $invoice->id,
                        'description' => $item['description'],
                        'quantity'    => 1,
                        'unit_price'  => $item['amount'],
                        'amount'      => $item['amount'],
                        'item_type'   => $item['item_type'] ?? 'other',
                    ]);
                }
            }

            // Update invoice rent_amount and service_charge_amount
            $invoice->rent_amount = $totalRent;
            $invoice->service_charge_amount = $totalServiceCharge;
            $invoice->recalculate();
            $invoice->save();

            // Record accounting transaction for the invoice (accounts receivable vs revenue)
            $totalAmount = (float) $invoice->total_amount;
            if ($totalAmount > 0) {
                // Find accounts, fallback to creating minimal accounts if missing
                $ar = Account::firstWhere('code', '1020') ?? Account::firstWhere('name', 'Accounts Receivable');
                $cash = Account::firstWhere('code', '1010') ?? Account::firstWhere('name', 'Cash');
                $rentIncome = Account::firstWhere('code', '4010') ?? Account::firstWhere('name', 'Rental Income');
                $serviceIncome = Account::firstWhere('code', '4020') ?? Account::firstWhere('name', 'Service Charges');

                // Ensure service income exists; if not, create it
                if (!$serviceIncome) {
                    $serviceIncome = Account::create(['code' => '4020', 'name' => 'Service Charges', 'type' => 'revenue']);
                }

                // Ensure AR exists
                if (!$ar) {
                    $ar = Account::create(['code' => '1020', 'name' => 'Accounts Receivable', 'type' => 'asset']);
                }

                if (!$rentIncome) {
                    $rentIncome = Account::create(['code' => '4010', 'name' => 'Rental Income', 'type' => 'revenue']);
                }

                // Create transaction
                $txn = Transaction::create([
                    'date' => $invoice->issue_date->format('Y-m-d'),
                    'description' => "Invoice #{$invoice->invoice_number}",
                    'reference_type' => 'invoice',
                    'reference_id' => $invoice->id,
                    'created_by' => $invoice->created_by,
                ]);

                // Debit Accounts Receivable
                TransactionEntry::create([
                    'transaction_id' => $txn->id,
                    'account_id' => $ar->id,
                    'debit' => $totalAmount,
                    'credit' => 0,
                    'description' => 'Invoice receivable',
                ]);

                // Credit Rental Income (if any)
                if ((float) $invoice->rent_amount > 0) {
                    TransactionEntry::create([
                        'transaction_id' => $txn->id,
                        'account_id' => $rentIncome->id,
                        'debit' => 0,
                        'credit' => (float) $invoice->rent_amount,
                        'description' => 'Rental income',
                    ]);
                }

                // Credit Service Charges
                if ((float) $invoice->service_charge_amount > 0) {
                    TransactionEntry::create([
                        'transaction_id' => $txn->id,
                        'account_id' => $serviceIncome->id,
                        'debit' => 0,
                        'credit' => (float) $invoice->service_charge_amount,
                        'description' => 'Service charges',
                    ]);
                }
            }

            return $invoice;
        });

        $invoice->loadMissing(['tenant', 'lease.unit', 'building']);
        $emailOutcome = $this->sendDocumentEmailToTenant($invoice);

        $message = ($validated['type'] === 'proforma' ? 'Proforma' : 'Invoice') . ' created successfully.';
        if ($emailOutcome === 'sent') {
            $message .= ' Email sent to tenant.';
            return redirect()->route('manager.invoices.index')->with('success', $message);
        }

        if ($emailOutcome === 'no-email') {
            return redirect()->route('manager.invoices.index')
                ->with('success', $message)
                ->with('warning', 'Tenant has no email address. Document was created but not emailed.');
        }

        return redirect()->route('manager.invoices.index')
            ->with('success', $message)
            ->with('warning', 'Document was created but email delivery failed. Please retry from your mail setup.');
    }

    /**
     * Create invoice/proforma records with collision-safe numbering.
     */
    private function createWithUniqueNumbers(int $buildingId, string $type, array $attributes): Invoice
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            if ($type === Invoice::TYPE_PROFORMA) {
                $attributes['proforma_number'] = Invoice::nextNumber($buildingId, Invoice::TYPE_PROFORMA);
                $attributes['invoice_number'] = 'PF-TEMP-' . Str::uuid();
            } else {
                $attributes['invoice_number'] = Invoice::nextNumber($buildingId, Invoice::TYPE_INVOICE);
                $attributes['proforma_number'] = null;
            }

            try {
                return Invoice::create($attributes);
            } catch (UniqueConstraintViolationException $e) {
                if ($attempt === 4) {
                    throw $e;
                }
            }
        }

        throw new \RuntimeException('Failed to generate a unique invoice number.');
    }

    /**
     * Send invoice/proforma email to tenant.
     *
     * @return 'sent'|'no-email'|'failed'
     */
    private function sendDocumentEmailToTenant(Invoice $invoice): string
    {
        $email = $invoice->tenant?->email;
        $documentNumber = $invoice->type === Invoice::TYPE_PROFORMA
            ? ($invoice->proforma_number ?: $invoice->invoice_number)
            : $invoice->invoice_number;

        if (empty($email)) {
            Log::info('Invoice email skipped: tenant has no email', [
                'invoice_id' => $invoice->id,
                'document_type' => $invoice->type,
                'document_number' => $documentNumber,
                'building_id' => $invoice->building_id,
                'tenant_id' => $invoice->tenant_id,
                'status' => 'no-email',
            ]);

            return 'no-email';
        }

        try {
            Mail::to($email)->send(new InvoiceDocumentMail($invoice));

            Log::info('Invoice email sent', [
                'invoice_id' => $invoice->id,
                'document_type' => $invoice->type,
                'document_number' => $documentNumber,
                'building_id' => $invoice->building_id,
                'tenant_id' => $invoice->tenant_id,
                'tenant_email' => $email,
                'status' => 'sent',
            ]);

            return 'sent';
        } catch (\Throwable $e) {
            Log::warning('Invoice email delivery failed', [
                'invoice_id' => $invoice->id,
                'document_type' => $invoice->type,
                'document_number' => $documentNumber,
                'building_id' => $invoice->building_id,
                'tenant_id' => $invoice->tenant_id,
                'tenant_email' => $email,
                'status' => 'failed',
                'error' => $e->getMessage(),
            ]);

            return 'failed';
        }
    }

    /* ================================================================
     *  CONVERT — proforma → invoice
     * ================================================================ */
    public function convert(Invoice $invoice)
    {
        $building = Auth::user()->getBuilding();
        abort_unless($invoice->building_id === $building->id, 403);
        abort_unless($invoice->isProforma(), 422, 'Only proformas can be converted.');

        $invoiceNumber = Invoice::nextNumber($building->id, Invoice::TYPE_INVOICE);

        $invoice->update([
            'type'           => Invoice::TYPE_INVOICE,
            'invoice_number' => $invoiceNumber,
            'converted_at'   => now(),
        ]);

        $invoice->loadMissing(['tenant', 'lease.unit', 'building']);
        $emailOutcome = $this->sendDocumentEmailToTenant($invoice);

        if ($emailOutcome === 'sent') {
            return redirect()->route('manager.invoices.show', $invoice)
                ->with('success', "Converted to Invoice {$invoiceNumber} and emailed to tenant.");
        }

        if ($emailOutcome === 'no-email') {
            return redirect()->route('manager.invoices.show', $invoice)
                ->with('success', "Converted to Invoice {$invoiceNumber}.")
                ->with('warning', 'Tenant has no email address. Invoice was converted but not emailed.');
        }

        return redirect()->route('manager.invoices.show', $invoice)
            ->with('success', "Converted to Invoice {$invoiceNumber}.")
            ->with('warning', 'Invoice was converted but email delivery failed.');
    }

    /* ================================================================
     *  SEND — mark as sent
     * ================================================================ */
    public function send(Invoice $invoice)
    {
        $building = Auth::user()->getBuilding();
        abort_unless($invoice->building_id === $building->id, 403);
        abort_unless($invoice->isInvoice(), 422, 'Only invoices can be sent.');
        abort_unless(!in_array($invoice->status, ['cancelled']), 422, 'Cancelled invoices cannot be sent.');

        $invoice->loadMissing(['tenant', 'lease.unit', 'building']);
        $emailOutcome = $this->sendDocumentEmailToTenant($invoice);

        if ($invoice->status === Invoice::STATUS_DRAFT) {
            $invoice->update(['status' => Invoice::STATUS_SENT]);
        }

        if ($emailOutcome === 'sent') {
            return back()->with('success', 'Invoice emailed to tenant successfully.');
        }

        if ($emailOutcome === 'no-email') {
            return back()->with('warning', 'Tenant has no email address. Invoice status was updated but no email was sent.');
        }

        return back()->with('warning', 'Invoice status was updated, but email delivery failed. Please try again.');
    }

    /* ================================================================
     *  CANCEL
     * ================================================================ */
    public function cancel(Invoice $invoice)
    {
        $building = Auth::user()->getBuilding();
        abort_unless($invoice->building_id === $building->id, 403);
        abort_unless(!in_array($invoice->status, ['paid', 'cancelled']), 422, 'Cannot cancel this invoice.');

        $invoice->update(['status' => Invoice::STATUS_CANCELLED]);

        return back()->with('success', 'Invoice cancelled.');
    }

    /* ================================================================
     *  RECORD PAYMENT against invoice
     * ================================================================ */
    public function recordPayment(Request $request, Invoice $invoice)
    {
        $user     = Auth::user();
        $building = $user->getBuilding();

        abort_unless($invoice->building_id === $building->id, 403);
        abort_unless($invoice->isInvoice(), 422, 'Payments can only be recorded against invoices.');
        abort_unless(!in_array($invoice->status, ['paid', 'cancelled']), 422, 'Cannot record payments on this invoice.');

        $validated = $request->validate([
            'amount'         => ['required', 'numeric', 'min:0.01'],
            'payment_date'   => ['required', 'date'],
            'payment_method' => ['required', 'in:cash,bank_transfer,mobile_money'],
            'reference'      => ['nullable', 'string', 'max:255'],
            'notes'          => ['nullable', 'string', 'max:1000'],
        ]);

        DB::transaction(function () use ($validated, $invoice, $building, $user) {
            // Create the payment
            Payment::create([
                'lease_id'       => $invoice->lease_id,
                'invoice_id'     => $invoice->id,
                'building_id'    => $building->id,
                'amount'         => $validated['amount'],
                'payment_date'   => $validated['payment_date'],
                'payment_method' => $validated['payment_method'],
                'reference'      => $validated['reference'] ?? null,
                'month_covered'  => $invoice->period_start->format('Y-m'),
                'notes'          => $validated['notes'] ?? null,
                'received_by'    => $user->id,
            ]);

            // Create accounting transaction for the payment
            $paymentAmount = (float) $validated['amount'];
            if ($paymentAmount > 0) {
                $ar = Account::firstWhere('code', '1020') ?? Account::firstWhere('name', 'Accounts Receivable');
                $cash = Account::firstWhere('code', '1010') ?? Account::firstWhere('name', 'Cash');
                if (!$cash) {
                    $cash = Account::create(['code' => '1010', 'name' => 'Cash', 'type' => 'asset']);
                }
                if (!$ar) {
                    $ar = Account::create(['code' => '1020', 'name' => 'Accounts Receivable', 'type' => 'asset']);
                }

                $txn = Transaction::create([
                    'date' => $validated['payment_date'],
                    'description' => "Payment for Invoice #{$invoice->invoice_number}",
                    'reference_type' => 'payment',
                    'reference_id' => null,
                    'created_by' => $user->id,
                ]);

                // Debit Cash
                TransactionEntry::create([
                    'transaction_id' => $txn->id,
                    'account_id' => $cash->id,
                    'debit' => $paymentAmount,
                    'credit' => 0,
                    'description' => 'Payment received',
                ]);

                // Credit Accounts Receivable
                TransactionEntry::create([
                    'transaction_id' => $txn->id,
                    'account_id' => $ar->id,
                    'debit' => 0,
                    'credit' => $paymentAmount,
                    'description' => "Settled invoice {$invoice->invoice_number}",
                ]);
            }

            // Update invoice paid amount
            $newPaid = (float) $invoice->amount_paid + (float) $validated['amount'];
            $invoice->amount_paid = $newPaid;

            if ($newPaid >= (float) $invoice->total_amount) {
                $invoice->status = Invoice::STATUS_PAID;
            } else {
                $invoice->status = Invoice::STATUS_PARTIAL;
            }

            $invoice->save();
        });

        return back()->with('success', 'Payment recorded successfully.');
    }
}
