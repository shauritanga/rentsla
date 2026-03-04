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
        Schema::table('roles', function (Blueprint $table) {
            $table->foreignId('building_id')->nullable()->constrained('buildings')->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('description')->nullable();
            $table->boolean('is_system')->default(false);

            // Drop the old unique on name alone
            $table->dropUnique(['name']);

            // Allow same name in different buildings; NULLs treated as distinct in PostgreSQL
            $table->unique(['name', 'building_id']);
        });

        // Mark existing roles as system roles
        DB::table('roles')
            ->whereIn('name', ['super_admin', 'manager', 'accountant', 'lease_manager', 'maintenance_staff', 'viewer'])
            ->update(['is_system' => true]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove custom roles first
        DB::table('roles')->where('is_system', false)->delete();

        Schema::table('roles', function (Blueprint $table) {
            $table->dropUnique(['name', 'building_id']);
            $table->dropForeign(['building_id']);
            $table->dropForeign(['created_by']);
            $table->dropColumn(['building_id', 'created_by', 'description', 'is_system']);
            $table->string('name')->unique()->change();
        });
    }
};
