<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();        // e.g. 'units.view'
            $table->string('group');                   // e.g. 'units'
            $table->string('description')->nullable();
            $table->timestamps();
        });

        Schema::create('role_permission', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained('roles')->cascadeOnDelete();
            $table->foreignId('permission_id')->constrained('permissions')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['role_id', 'permission_id']);
        });

        // Seed the building-level roles
        $now = now();
        $roles = ['accountant', 'lease_manager', 'maintenance_staff', 'viewer'];
        foreach ($roles as $role) {
            DB::table('roles')->insertOrIgnore([
                'name' => $role,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // Seed permissions
        $permissions = [
            ['name' => 'dashboard.view',     'group' => 'dashboard',    'description' => 'View dashboard'],
            ['name' => 'floors.view',        'group' => 'floors',       'description' => 'View floors'],
            ['name' => 'floors.manage',      'group' => 'floors',       'description' => 'Create, edit, delete floors'],
            ['name' => 'units.view',         'group' => 'units',        'description' => 'View units'],
            ['name' => 'units.manage',       'group' => 'units',        'description' => 'Create, edit, delete units'],
            ['name' => 'tenants.view',       'group' => 'tenants',      'description' => 'View tenants'],
            ['name' => 'tenants.manage',     'group' => 'tenants',      'description' => 'Create, edit tenants'],
            ['name' => 'leases.view',        'group' => 'leases',       'description' => 'View leases'],
            ['name' => 'leases.manage',      'group' => 'leases',       'description' => 'Create, edit leases'],
            ['name' => 'payments.view',      'group' => 'payments',     'description' => 'View payments'],
            ['name' => 'payments.manage',    'group' => 'payments',     'description' => 'Record payments'],
            ['name' => 'staff.view',         'group' => 'staff',        'description' => 'View staff members'],
            ['name' => 'staff.manage',       'group' => 'staff',        'description' => 'Create, edit, remove staff'],
            ['name' => 'maintenance.view',   'group' => 'maintenance',  'description' => 'View maintenance tasks'],
            ['name' => 'maintenance.manage', 'group' => 'maintenance',  'description' => 'Create, edit maintenance tasks'],
        ];

        foreach ($permissions as $p) {
            DB::table('permissions')->insertOrIgnore(array_merge($p, [
                'created_at' => $now,
                'updated_at' => $now,
            ]));
        }

        // Assign default permissions to roles
        $rolePermissions = [
            'accountant' => [
                'dashboard.view',
                'units.view',
                'tenants.view',
                'leases.view',
                'payments.view',
                'payments.manage',
            ],
            'lease_manager' => [
                'dashboard.view',
                'floors.view',
                'units.view',
                'units.manage',
                'tenants.view',
                'tenants.manage',
                'leases.view',
                'leases.manage',
                'payments.view',
                'payments.manage',
            ],
            'maintenance_staff' => [
                'dashboard.view',
                'floors.view',
                'units.view',
                'maintenance.view',
                'maintenance.manage',
            ],
            'viewer' => [
                'dashboard.view',
                'floors.view',
                'units.view',
                'tenants.view',
                'leases.view',
                'payments.view',
            ],
        ];

        foreach ($rolePermissions as $roleName => $permNames) {
            $roleId = DB::table('roles')->where('name', $roleName)->value('id');
            if (!$roleId) continue;

            foreach ($permNames as $permName) {
                $permId = DB::table('permissions')->where('name', $permName)->value('id');
                if (!$permId) continue;

                DB::table('role_permission')->insertOrIgnore([
                    'role_id' => $roleId,
                    'permission_id' => $permId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('role_permission');
        Schema::dropIfExists('permissions');

        // Remove seeded roles (keep super_admin and manager)
        DB::table('roles')->whereIn('name', [
            'accountant',
            'lease_manager',
            'maintenance_staff',
            'viewer',
        ])->delete();
    }
};
