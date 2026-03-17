<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\ElectricityBatch;
use App\Models\ElectricityReading;
use App\Models\GeneratorCostEntry;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Transaction;
use App\Models\TransactionEntry;
use App\Models\Account;
use Carbon\Carbon;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ElectricityController extends Controller
{
    public function index()
    {
        $this->ensureBuildingManager();

        $user = $this->getUser();
        $building = $this->getBuilding();

        $batches = ElectricityBatch::query()
            ->where('building_id', $building->id)
            ->with([
                'creator:id,name',
                'approver:id,name',
                'readings:id,electricity_batch_id,unit_id,tenant_id,opening_kwh,closing_kwh,usage_kwh,reading_date,is_estimated,estimation_reason,exception_flag,exception_note',
            ])
            ->withSum('readings as tenant_usage_kwh', 'usage_kwh')
            ->orderByDesc('period_month')
            ->paginate(12)
            ->through(fn(ElectricityBatch $batch) => $this->mapBatch($batch));

        return Inertia::render('Manager/ElectricityBatches', [
            'title' => 'Electricity Billing',
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
            'batches' => $batches,
            'activeLeases' => $this->mapActiveLeases($building->id),
        ]);
    }

    public function createBatch(Request $request)
    {
        $this->ensureBuildingManager();

        $user = $this->getUser();
        $building = $this->getBuilding();

        $validated = $request->validate([
            'period_month' => ['required', 'regex:/^\d{4}-(0[1-9]|1[0-2])$/'],
            'issue_date' => ['required', 'date'],
            'due_date' => ['required', 'date', 'after_or_equal:issue_date'],
            'grid_kwh' => ['required', 'numeric', 'min:0'],
            'grid_cost' => ['required', 'numeric', 'min:0'],
            'generator_kwh' => ['nullable', 'numeric', 'min:0'],
            'generator_cost' => ['nullable', 'numeric', 'min:0'],
            'loss_threshold_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'generator_cost_entries' => ['nullable', 'array'],
            'generator_cost_entries.*.cost_type' => ['required_with:generator_cost_entries', 'in:fuel,maintenance,operator,reserve,other'],
            'generator_cost_entries.*.amount' => ['required_with:generator_cost_entries', 'numeric', 'min:0.01'],
            'generator_cost_entries.*.note' => ['nullable', 'string', 'max:255'],
        ]);

        $exists = ElectricityBatch::where('building_id', $building->id)
            ->where('period_month', $validated['period_month'])
            ->exists();

        if ($exists) {
            return back()->withErrors([
                'period_month' => 'A batch already exists for this month.',
            ]);
        }

        DB::transaction(function () use ($validated, $building, $user) {
            $gridKwh = (float) $validated['grid_kwh'];
            $generatorKwh = (float) ($validated['generator_kwh'] ?? 0);
            $gridCost = (float) $validated['grid_cost'];
            $generatorCost = (float) ($validated['generator_cost'] ?? 0);

            $sourceKwh = $gridKwh + $generatorKwh;
            $sourceCost = $gridCost + $generatorCost;
            $blendRate = $sourceKwh > 0 ? round($sourceCost / $sourceKwh, 4) : 0;

            $batch = ElectricityBatch::create([
                'building_id' => $building->id,
                'period_month' => $validated['period_month'],
                'issue_date' => $validated['issue_date'],
                'due_date' => $validated['due_date'],
                'grid_kwh' => $gridKwh,
                'grid_cost' => $gridCost,
                'generator_kwh' => $generatorKwh,
                'generator_cost' => $generatorCost,
                'blend_rate' => $blendRate,
                'loss_threshold_percent' => (float) ($validated['loss_threshold_percent'] ?? 5),
                'reconciliation_status' => ElectricityBatch::STATUS_OK,
                'notes' => $validated['notes'] ?? null,
                'created_by' => $user->id,
            ]);

            if (!empty($validated['generator_cost_entries'])) {
                foreach ($validated['generator_cost_entries'] as $entry) {
                    GeneratorCostEntry::create([
                        'electricity_batch_id' => $batch->id,
                        'cost_type' => $entry['cost_type'],
                        'amount' => $entry['amount'],
                        'note' => $entry['note'] ?? null,
                    ]);
                }
            }
        });

        return back()->with('success', 'Electricity batch created successfully.');
    }

    public function saveReadings(Request $request, ElectricityBatch $batch)
    {
        $this->ensureBuildingManager();

        $user = $this->getUser();
        $building = $this->getBuilding();

        abort_unless($batch->building_id === $building->id, 403);

        if ($batch->approved_at) {
            return back()->withErrors([
                'readings' => 'Approved batch cannot be edited.',
            ]);
        }

        $validated = $request->validate([
            'readings' => ['required', 'array', 'min:1'],
            'readings.*.lease_id' => ['required', 'integer', 'exists:leases,id'],
            'readings.*.opening_kwh' => ['required', 'numeric', 'min:0'],
            'readings.*.closing_kwh' => ['required', 'numeric', 'min:0'],
            'readings.*.reading_date' => ['required', 'date'],
            'readings.*.is_estimated' => ['nullable', 'boolean'],
            'readings.*.estimation_reason' => ['nullable', 'string', 'max:255'],
            'readings.*.exception_note' => ['nullable', 'string', 'max:255'],
        ]);

        $leaseIds = collect($validated['readings'])
            ->pluck('lease_id')
            ->unique()
            ->values();

        $leasesById = $building->leases()
            ->whereIn('id', $leaseIds)
            ->get()
            ->keyBy('id');

        if ($leasesById->count() !== $leaseIds->count()) {
            return back()->withErrors([
                'readings' => 'One or more readings reference an invalid lease for this building.',
            ]);
        }

        DB::transaction(function () use ($validated, $batch, $leasesById, $user) {
            foreach ($validated['readings'] as $payload) {
                $lease = $leasesById->get((int) $payload['lease_id']);

                $opening = round((float) $payload['opening_kwh'], 2);
                $closing = round((float) $payload['closing_kwh'], 2);
                $usage = round($closing - $opening, 2);
                $hasException = $usage < 0;

                if ($hasException) {
                    $usage = 0;
                }

                $exceptionNotes = [];
                if ($hasException) {
                    $exceptionNotes[] = 'Closing kWh cannot be below opening kWh.';
                }
                if (!empty($payload['exception_note'])) {
                    $exceptionNotes[] = trim((string) $payload['exception_note']);
                }

                ElectricityReading::updateOrCreate(
                    [
                        'electricity_batch_id' => $batch->id,
                        'unit_id' => $lease->unit_id,
                    ],
                    [
                        'tenant_id' => $lease->tenant_id,
                        'opening_kwh' => $opening,
                        'closing_kwh' => $closing,
                        'usage_kwh' => $usage,
                        'reading_date' => $payload['reading_date'],
                        'reader_user_id' => $user->id,
                        'is_estimated' => (bool) ($payload['is_estimated'] ?? false),
                        'estimation_reason' => $payload['estimation_reason'] ?? null,
                        'exception_flag' => $hasException,
                        'exception_note' => empty($exceptionNotes) ? null : implode(' ', $exceptionNotes),
                    ]
                );
            }
        });

        return back()->with('success', 'Meter readings saved successfully.');
    }

    public function calculate(ElectricityBatch $batch)
    {
        $this->ensureBuildingManager();

        $building = $this->getBuilding();
        abort_unless($batch->building_id === $building->id, 403);

        $metrics = $this->calculateAndPersistMetrics($batch);

        if (!$metrics['has_readings']) {
            return back()->withErrors([
                'readings' => 'Please save at least one meter reading before calculation.',
            ]);
        }

        return back()->with('success', sprintf(
            'Calculation updated. Blend rate: %.4f, loss: %.2f%%, status: %s.',
            $metrics['blend_rate'],
            $metrics['loss_percent'],
            strtoupper($metrics['reconciliation_status'])
        ));
    }

    public function approveAndPost(Request $request, ElectricityBatch $batch)
    {
        $this->ensureBuildingManager();

        $user = $this->getUser();
        $building = $this->getBuilding();

        abort_unless($batch->building_id === $building->id, 403);

        if ($batch->approved_at) {
            return back()->withErrors([
                'approval' => 'This batch has already been approved and posted.',
            ]);
        }

        $validated = $request->validate([
            'document_type' => ['nullable', 'in:proforma,invoice'],
            'review_note' => ['nullable', 'string', 'max:1000'],
        ]);

        $metrics = $this->calculateAndPersistMetrics($batch);

        if (!$metrics['has_readings']) {
            return back()->withErrors([
                'readings' => 'Please save at least one meter reading before posting.',
            ]);
        }

        if ($metrics['reconciliation_status'] === ElectricityBatch::STATUS_BLOCKED) {
            return back()->withErrors([
                'reconciliation' => 'Reconciliation is blocked. Review source and meter data before posting.',
            ]);
        }

        $reviewNote = trim((string) ($validated['review_note'] ?? ''));
        if ($metrics['reconciliation_status'] === ElectricityBatch::STATUS_WARNING && $reviewNote === '') {
            return back()->withErrors([
                'review_note' => 'A review note is required when posting a warning batch.',
            ]);
        }

        $documentType = $validated['document_type'] ?? Invoice::TYPE_INVOICE;
        $periodStart = Carbon::createFromFormat('Y-m', $batch->period_month)->startOfMonth();
        $periodEnd = $periodStart->copy()->endOfMonth();

        $batch->loadMissing(['readings', 'readings.unit.activeLease']);

        $createdCount = 0;
        $skippedCount = 0;

        DB::transaction(function () use (
            $batch,
            $building,
            $user,
            $documentType,
            $periodStart,
            $periodEnd,
            $reviewNote,
            &$createdCount,
            &$skippedCount
        ) {
            foreach ($batch->readings as $reading) {
                $usageKwh = (float) $reading->usage_kwh;
                if ($usageKwh <= 0 || !$reading->tenant_id) {
                    $skippedCount++;
                    continue;
                }

                $lease = $reading->unit?->activeLease;
                if (!$lease || (int) $lease->tenant_id !== (int) $reading->tenant_id) {
                    $skippedCount++;
                    continue;
                }

                $alreadyExists = Invoice::query()
                    ->where('building_id', $building->id)
                    ->where('lease_id', $lease->id)
                    ->where('bill_category', Invoice::CATEGORY_ELECTRICITY)
                    ->whereDate('period_start', $periodStart->format('Y-m-d'))
                    ->exists();

                if ($alreadyExists) {
                    $skippedCount++;
                    continue;
                }

                $chargeAmount = round($usageKwh * (float) $batch->blend_rate, 2);
                if ($chargeAmount <= 0) {
                    $skippedCount++;
                    continue;
                }

                $invoice = $this->createWithUniqueNumbers($building->id, $documentType, [
                    'building_id' => $building->id,
                    'lease_id' => $lease->id,
                    'tenant_id' => $lease->tenant_id,
                    'bill_category' => Invoice::CATEGORY_ELECTRICITY,
                    'billing_cycle' => 'monthly_electricity',
                    'source_mix_mode' => 'blended',
                    'type' => $documentType,
                    'status' => Invoice::STATUS_DRAFT,
                    'billing_months' => 1,
                    'issue_date' => $batch->issue_date,
                    'due_date' => $batch->due_date,
                    'period_start' => $periodStart,
                    'period_end' => $periodEnd,
                    'rent_amount' => $chargeAmount,
                    'service_charge_rate' => 0,
                    'service_charge_amount' => 0,
                    'withholding_tax_rate' => 0,
                    'withholding_tax_amount' => 0,
                    'currency' => $lease->rent_currency ?? 'TZS',
                    'notes' => trim(implode("\n", array_filter([
                        "Auto-generated from electricity batch {$batch->period_month}.",
                        "Usage: {$usageKwh} kWh.",
                        $reviewNote !== '' ? "Review note: {$reviewNote}" : null,
                    ]))),
                    'created_by' => $user->id,
                ], Invoice::CATEGORY_ELECTRICITY);

                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'description' => "Electricity charge ({$batch->period_month})",
                    'quantity' => $usageKwh,
                    'unit_price' => (float) $batch->blend_rate,
                    'amount' => $chargeAmount,
                    'item_type' => 'rent',
                ]);

                $invoice->recalculate();
                $invoice->save();

                $this->recordElectricityAccountingEntries($invoice);

                $createdCount++;
            }

            $updatedNotes = $batch->notes;
            if ($reviewNote !== '') {
                $reviewLine = '[Manager review] ' . $reviewNote;
                $updatedNotes = trim((string) $updatedNotes);
                $updatedNotes = $updatedNotes === '' ? $reviewLine : $updatedNotes . "\n" . $reviewLine;
            }

            $batch->update([
                'approved_by' => $user->id,
                'approved_at' => now(),
                'notes' => $updatedNotes,
            ]);
        });

        return back()->with('success', "Posting complete. Created {$createdCount} documents, skipped {$skippedCount}.");
    }

    private function calculateAndPersistMetrics(ElectricityBatch $batch): array
    {
        $batch->loadMissing('readings');

        $hasReadings = $batch->readings->isNotEmpty();
        $sourceKwh = (float) $batch->grid_kwh + (float) $batch->generator_kwh;
        $sourceCost = (float) $batch->grid_cost + (float) $batch->generator_cost;
        $tenantUsageKwh = (float) $batch->readings->sum('usage_kwh');

        $blendRate = $sourceKwh > 0 ? round($sourceCost / $sourceKwh, 4) : 0;
        $lossPercent = $sourceKwh > 0
            ? round((abs($sourceKwh - $tenantUsageKwh) / $sourceKwh) * 100, 2)
            : ($tenantUsageKwh > 0 ? 100.0 : 0.0);

        $threshold = (float) $batch->loss_threshold_percent;
        $reconciliationStatus = ElectricityBatch::STATUS_OK;

        if ($lossPercent > $threshold) {
            $reconciliationStatus = $lossPercent <= ($threshold + 5)
                ? ElectricityBatch::STATUS_WARNING
                : ElectricityBatch::STATUS_BLOCKED;
        }

        $batch->update([
            'blend_rate' => $blendRate,
            'reconciliation_status' => $reconciliationStatus,
        ]);

        return [
            'has_readings' => $hasReadings,
            'blend_rate' => $blendRate,
            'loss_percent' => $lossPercent,
            'reconciliation_status' => $reconciliationStatus,
            'source_kwh' => $sourceKwh,
            'tenant_usage_kwh' => $tenantUsageKwh,
        ];
    }

    private function mapBatch(ElectricityBatch $batch): array
    {
        $sourceKwh = (float) $batch->grid_kwh + (float) $batch->generator_kwh;
        $sourceCost = (float) $batch->grid_cost + (float) $batch->generator_cost;
        $tenantUsage = (float) ($batch->tenant_usage_kwh ?? 0);
        $lossPercent = $sourceKwh > 0
            ? round((abs($sourceKwh - $tenantUsage) / $sourceKwh) * 100, 2)
            : ($tenantUsage > 0 ? 100.0 : 0.0);

        return [
            'id' => $batch->id,
            'period_month' => $batch->period_month,
            'issue_date' => $batch->issue_date->format('Y-m-d'),
            'due_date' => $batch->due_date->format('Y-m-d'),
            'grid_kwh' => (float) $batch->grid_kwh,
            'grid_cost' => (float) $batch->grid_cost,
            'generator_kwh' => (float) $batch->generator_kwh,
            'generator_cost' => (float) $batch->generator_cost,
            'source_kwh' => $sourceKwh,
            'source_cost' => $sourceCost,
            'blend_rate' => (float) $batch->blend_rate,
            'loss_threshold_percent' => (float) $batch->loss_threshold_percent,
            'reconciliation_status' => $batch->reconciliation_status,
            'tenant_usage_kwh' => $tenantUsage,
            'loss_percent' => $lossPercent,
            'readings_count' => $batch->readings->count(),
            'approved_at' => $batch->approved_at?->format('Y-m-d H:i'),
            'approved_by' => $batch->approver?->name,
            'created_by' => $batch->creator?->name,
            'notes' => $batch->notes,
            'readings' => $batch->readings->map(fn(ElectricityReading $reading) => [
                'id' => $reading->id,
                'unit_id' => $reading->unit_id,
                'tenant_id' => $reading->tenant_id,
                'opening_kwh' => (float) $reading->opening_kwh,
                'closing_kwh' => (float) $reading->closing_kwh,
                'usage_kwh' => (float) $reading->usage_kwh,
                'reading_date' => $reading->reading_date->format('Y-m-d'),
                'is_estimated' => (bool) $reading->is_estimated,
                'estimation_reason' => $reading->estimation_reason,
                'exception_flag' => (bool) $reading->exception_flag,
                'exception_note' => $reading->exception_note,
            ])->values(),
        ];
    }

    private function mapActiveLeases(int $buildingId)
    {
        return $this->getBuilding()->leases()
            ->where('building_id', $buildingId)
            ->where('status', 'active')
            ->with(['tenant:id,full_name', 'unit:id,unit_number'])
            ->get()
            ->map(fn($lease) => [
                'id' => $lease->id,
                'tenant_id' => $lease->tenant_id,
                'unit_id' => $lease->unit_id,
                'tenant' => $lease->tenant?->full_name ?? 'N/A',
                'unit' => $lease->unit?->unit_number ?? 'N/A',
                'currency' => $lease->rent_currency ?? 'TZS',
            ]);
    }

    private function recordElectricityAccountingEntries(Invoice $invoice): void
    {
        $totalAmount = (float) $invoice->total_amount;
        if ($totalAmount <= 0) {
            return;
        }

        $ar = Account::firstWhere('code', '1020') ?? Account::firstWhere('name', 'Accounts Receivable');
        $electricityIncome = Account::firstWhere('code', '4030') ?? Account::firstWhere('name', 'Electricity Income');

        if (!$ar) {
            $ar = Account::create(['code' => '1020', 'name' => 'Accounts Receivable', 'type' => 'asset']);
        }

        if (!$electricityIncome) {
            $electricityIncome = Account::create(['code' => '4030', 'name' => 'Electricity Income', 'type' => 'revenue']);
        }

        $documentNumber = $invoice->isProforma()
            ? ($invoice->proforma_number ?: $invoice->invoice_number)
            : $invoice->invoice_number;

        $txn = Transaction::create([
            'date' => $invoice->issue_date->format('Y-m-d'),
            'description' => "Electricity {$invoice->type} #{$documentNumber}",
            'reference_type' => 'invoice',
            'reference_id' => $invoice->id,
            'bill_category' => Invoice::CATEGORY_ELECTRICITY,
            'created_by' => $invoice->created_by,
        ]);

        TransactionEntry::create([
            'transaction_id' => $txn->id,
            'account_id' => $ar->id,
            'bill_category' => Invoice::CATEGORY_ELECTRICITY,
            'debit' => $totalAmount,
            'credit' => 0,
            'description' => 'Electricity receivable',
        ]);

        TransactionEntry::create([
            'transaction_id' => $txn->id,
            'account_id' => $electricityIncome->id,
            'bill_category' => Invoice::CATEGORY_ELECTRICITY,
            'debit' => 0,
            'credit' => $totalAmount,
            'description' => 'Electricity income',
        ]);
    }

    /**
     * Create invoice/proforma records with collision-safe numbering.
     */
    private function createWithUniqueNumbers(int $buildingId, string $type, array $attributes, string $billCategory = Invoice::CATEGORY_LEASE): Invoice
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            if ($type === Invoice::TYPE_PROFORMA) {
                $attributes['proforma_number'] = Invoice::nextNumber($buildingId, Invoice::TYPE_PROFORMA, $billCategory);
                $attributes['invoice_number'] = 'PF-TEMP-' . Str::uuid();
            } else {
                $attributes['invoice_number'] = Invoice::nextNumber($buildingId, Invoice::TYPE_INVOICE, $billCategory);
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

    private function ensureBuildingManager(): void
    {
        $user = $this->getUser();
        $building = $this->getBuilding();

        if (!($user->managedBuilding && $user->managedBuilding->id === $building->id)) {
            abort(403, 'Only the building manager can access this section.');
        }
    }
}
