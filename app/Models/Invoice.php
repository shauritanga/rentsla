<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    use HasFactory;

    /* Type constants */
    const TYPE_PROFORMA = 'proforma';
    const TYPE_INVOICE  = 'invoice';

    /* Status constants */
    const STATUS_DRAFT     = 'draft';
    const STATUS_SENT      = 'sent';
    const STATUS_PAID      = 'paid';
    const STATUS_PARTIAL   = 'partial';
    const STATUS_OVERDUE   = 'overdue';
    const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'invoice_number',
        'proforma_number',
        'building_id',
        'lease_id',
        'tenant_id',
        'type',
        'status',
        'billing_months',
        'issue_date',
        'due_date',
        'period_start',
        'period_end',
        'rent_amount',
        'service_charge_rate',
        'service_charge_amount',
        'subtotal',
        'withholding_tax_rate',
        'withholding_tax_amount',
        'total_amount',
        'amount_paid',
        'currency',
        'notes',
        'converted_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'issue_date'               => 'date',
            'due_date'                 => 'date',
            'period_start'             => 'date',
            'period_end'               => 'date',
            'rent_amount'              => 'decimal:2',
            'service_charge_rate'      => 'decimal:2',
            'service_charge_amount'    => 'decimal:2',
            'subtotal'                 => 'decimal:2',
            'withholding_tax_rate'     => 'decimal:2',
            'withholding_tax_amount'   => 'decimal:2',
            'total_amount'             => 'decimal:2',
            'amount_paid'              => 'decimal:2',
            'billing_months'           => 'integer',
            'converted_at'             => 'datetime',
        ];
    }

    /* ── Helpers ──────────────────────────────────────────────── */

    public function isProforma(): bool
    {
        return $this->type === self::TYPE_PROFORMA;
    }

    public function isInvoice(): bool
    {
        return $this->type === self::TYPE_INVOICE;
    }

    public function balance(): float
    {
        return (float) $this->total_amount - (float) $this->amount_paid;
    }

    /**
     * Recalculate amounts from rent and rates.
     */
    public function recalculate(): static
    {
        $rent   = (float) $this->rent_amount;
        $scRate = (float) $this->service_charge_rate;
        $whRate = (float) $this->withholding_tax_rate;

        $serviceCharge   = round($rent * $scRate / 100, 2);
        $itemsTotal      = $this->items()->whereNotIn('item_type', ['rent', 'service_charge'])->sum('amount');

        $subtotal        = $rent + $serviceCharge + (float) $itemsTotal;
        $withholdingTax  = round($rent * $whRate / 100, 2);
        $total           = $subtotal - $withholdingTax;

        $this->service_charge_amount  = $serviceCharge;
        $this->subtotal               = $subtotal;
        $this->withholding_tax_amount = $withholdingTax;
        $this->total_amount           = $total;

        return $this;
    }

    /**
     * Generate the next invoice/proforma number for a building.
     */
    public static function nextNumber(int $buildingId, string $type): string
    {
        $prefix = $type === self::TYPE_PROFORMA ? 'PF' : 'INV';
        $year   = now()->year;
        $column = $type === self::TYPE_PROFORMA ? 'proforma_number' : 'invoice_number';

        // Numbering must be globally unique because both columns are globally unique in DB.
        // Building scope is intentionally ignored here to avoid cross-building collisions.
        $candidates = static::query()
            ->where($column, 'like', "{$prefix}-{$year}-%")
            ->pluck($column);

        $maxSeq = 0;
        $pattern = '/^' . preg_quote($prefix, '/') . '-' . $year . '-(\d+)$/';

        foreach ($candidates as $value) {
            if (is_string($value) && preg_match($pattern, $value, $matches)) {
                $maxSeq = max($maxSeq, (int) $matches[1]);
            }
        }

        return sprintf('%s-%d-%04d', $prefix, $year, $maxSeq + 1);
    }

    /* ── Relationships ────────────────────────────────────────── */

    public function building(): BelongsTo
    {
        return $this->belongsTo(Building::class);
    }

    public function lease(): BelongsTo
    {
        return $this->belongsTo(Lease::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
