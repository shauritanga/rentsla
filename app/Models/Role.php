<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'building_id',
        'created_by',
        'is_system',
    ];

    protected $casts = [
        'is_system' => 'boolean',
    ];

    /**
     * System-level role names that cannot be deleted or modified by managers.
     */
    public const SYSTEM_ROLES = [
        'super_admin',
        'manager',
    ];

    /**
     * Default template roles available to all buildings.
     */
    public const DEFAULT_BUILDING_ROLES = [
        'accountant',
        'lease_manager',
        'maintenance_staff',
        'viewer',
    ];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_roles')
            ->withPivot('building_id', 'assigned_by')
            ->withTimestamps();
    }

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'role_permission')
            ->withTimestamps();
    }

    public function building(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Building::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope to roles assignable within a building (default templates + custom building roles).
     */
    public function scopeAssignableForBuilding($query, int $buildingId)
    {
        return $query->where(function ($q) use ($buildingId) {
            $q->whereIn('name', self::DEFAULT_BUILDING_ROLES)
                ->whereNull('building_id');
        })->orWhere('building_id', $buildingId);
    }
}
