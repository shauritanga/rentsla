<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaseAmendment extends Model
{
    use HasFactory;

    const STATUS_PENDING  = 'pending_manager';
    const STATUS_APPROVED = 'approved';
    const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'lease_id',
        'requested_by',
        'amendment_type',
        'current_area_sqm',
        'proposed_area_sqm',
        'current_monthly_rent',
        'proposed_monthly_rent',
        'reason',
        'status',
        'reviewed_by',
        'review_comment',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'current_area_sqm' => 'decimal:2',
            'proposed_area_sqm' => 'decimal:2',
            'current_monthly_rent' => 'decimal:2',
            'proposed_monthly_rent' => 'decimal:2',
            'reviewed_at' => 'datetime',
        ];
    }

    public function lease(): BelongsTo
    {
        return $this->belongsTo(Lease::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
