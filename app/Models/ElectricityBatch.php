<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ElectricityBatch extends Model
{
    use HasFactory;

    public const STATUS_OK = 'ok';
    public const STATUS_WARNING = 'warning';
    public const STATUS_BLOCKED = 'blocked';

    protected $fillable = [
        'building_id',
        'period_month',
        'issue_date',
        'due_date',
        'grid_kwh',
        'grid_cost',
        'generator_kwh',
        'generator_cost',
        'blend_rate',
        'loss_threshold_percent',
        'reconciliation_status',
        'notes',
        'created_by',
        'approved_by',
        'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'issue_date' => 'date',
            'due_date' => 'date',
            'grid_kwh' => 'decimal:2',
            'grid_cost' => 'decimal:2',
            'generator_kwh' => 'decimal:2',
            'generator_cost' => 'decimal:2',
            'blend_rate' => 'decimal:4',
            'loss_threshold_percent' => 'decimal:2',
            'approved_at' => 'datetime',
        ];
    }

    public function building(): BelongsTo
    {
        return $this->belongsTo(Building::class);
    }

    public function readings(): HasMany
    {
        return $this->hasMany(ElectricityReading::class);
    }

    public function generatorCostEntries(): HasMany
    {
        return $this->hasMany(GeneratorCostEntry::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
