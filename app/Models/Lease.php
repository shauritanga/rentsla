<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lease extends Model
{
    use HasFactory;

    /* Approval-related statuses */
    const STATUS_PENDING_ACCOUNTANT = 'pending_accountant';
    const STATUS_PENDING_MANAGER    = 'pending_manager';
    const STATUS_ACTIVE             = 'active';
    const STATUS_REJECTED           = 'rejected';
    const STATUS_EXPIRED            = 'expired';
    const STATUS_TERMINATED         = 'terminated';

    protected $fillable = [
        'building_id',
        'unit_id',
        'tenant_id',
        'start_date',
        'end_date',
        'monthly_rent',
        'deposit_amount',
        'rent_currency',
        'billing_cycle_months',
        'rental_period_years',
        'fitout_applicable',
        'fitout_start_date',
        'fitout_end_date',
        'status',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'monthly_rent' => 'decimal:2',
            'deposit_amount' => 'decimal:2',
            'billing_cycle_months' => 'integer',
            'rental_period_years' => 'integer',
            'fitout_applicable' => 'boolean',
            'fitout_start_date' => 'date',
            'fitout_end_date' => 'date',
        ];
    }

    /* ── Helpers ─────────────────────────────────────────────── */

    public function isPending(): bool
    {
        return in_array($this->status, [
            self::STATUS_PENDING_ACCOUNTANT,
            self::STATUS_PENDING_MANAGER,
        ]);
    }

    /* ── Relationships ──────────────────────────────────────── */

    public function building(): BelongsTo
    {
        return $this->belongsTo(Building::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(LeaseApproval::class);
    }

    public function amendments(): HasMany
    {
        return $this->hasMany(LeaseAmendment::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }
}
