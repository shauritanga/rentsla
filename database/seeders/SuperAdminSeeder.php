<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Seed the application's database with the initial super admin.
     */
    public function run(): void
    {
        $roleId = DB::table('roles')->where('name', 'super_admin')->value('id');

        if (!$roleId) {
            $roleId = DB::table('roles')->insertGetId([
                'name' => 'super_admin',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $userId = DB::table('users')->where('email', 'admin@rentals.co.tz')->value('id');

        if (!$userId) {
            $userId = DB::table('users')->insertGetId([
                'name' => 'Super Admin',
                'email' => 'admin@rentals.co.tz',
                'password' => Hash::make('Admin@2026'),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        DB::table('user_roles')->updateOrInsert(
            [
                'user_id' => $userId,
                'role_id' => $roleId,
                'building_id' => null,
            ],
            [
                'assigned_by' => $userId,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }
}
