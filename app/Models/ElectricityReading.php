<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ElectricityReading extends Model
{
    use HasFactory;

    protected $fillable = [
        'electricity_batch_id',
        'unit_id',
        'tenant_id',
        'opening_kwh',
        'closing_kwh',
        'usage_kwh',
        'reading_date',
        'reader_user_id',
        'photo_path',
        'is_estimated',
        'estimation_reason',
        'exception_flag',
        'exception_note',
    ];

    protected function casts(): array
    {
        return [
            'opening_kwh' => 'decimal:2',
            'closing_kwh' => 'decimal:2',
            'usage_kwh' => 'decimal:2',
            'reading_date' => 'date',
            'is_estimated' => 'boolean',
            'exception_flag' => 'boolean',
        ];
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(ElectricityBatch::class, 'electricity_batch_id');
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function reader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reader_user_id');
    }
}
