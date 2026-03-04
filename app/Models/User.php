<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * The building this user manages (one-to-one via manager_user_id).
     */
    public function managedBuilding(): HasOne
    {
        return $this->hasOne(Building::class, 'manager_user_id');
    }

    /**
     * Roles assigned to this user.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_roles')
            ->withPivot('building_id', 'assigned_by')
            ->withTimestamps();
    }

    /**
     * Get roles scoped to a specific building.
     */
    public function buildingRoles(int $buildingId): BelongsToMany
    {
        return $this->roles()->wherePivot('building_id', $buildingId);
    }

    /**
     * Check if user has a specific role for a building.
     */
    public function hasRoleForBuilding(string $roleName, int $buildingId): bool
    {
        return $this->roles()
            ->where('name', $roleName)
            ->wherePivot('building_id', $buildingId)
            ->exists();
    }

    /**
     * Check if user is a super admin or manager.
     */
    public function isSuperAdmin(): bool
    {
        return $this->roles()->where('name', 'super_admin')->exists();
    }

    public function isManager(): bool
    {
        // Check if the user is assigned as a manager to any building
        return Building::where('manager_user_id', $this->id)->exists();
    }

    /**
     * Get the building this user operates on — either as the building manager
     * or as staff with a role scoped to a building.
     */
    public function getBuilding(): ?Building
    {
        // First check if they are the building manager
        if ($this->managedBuilding) {
            return $this->managedBuilding;
        }

        // Otherwise check if they have a role scoped to a building
        $assignment = DB::table('user_roles')
            ->where('user_id', $this->id)
            ->whereNotNull('building_id')
            ->first();

        if ($assignment) {
            return Building::find($assignment->building_id);
        }

        return null;
    }

    /**
     * Get a human-readable role label for the given building.
     * e.g. "Building Manager", "Lease Manager", "Accountant"
     */
    public function getRoleLabelForBuilding(int $buildingId): string
    {
        // If this user is the building's designated manager
        if ($this->managedBuilding && $this->managedBuilding->id === $buildingId) {
            return 'Building Manager';
        }

        // Otherwise look up their role(s) in user_roles for this building
        $role = $this->roles()
            ->wherePivot('building_id', $buildingId)
            ->first();

        if ($role) {
            return ucwords(str_replace('_', ' ', $role->name));
        }

        return 'Staff';
    }

    /**
     * Check if this user has access to the manager portal
     * (either as building manager or as building staff).
     */
    public function hasManagerPortalAccess(): bool
    {
        return $this->getBuilding() !== null;
    }
}
