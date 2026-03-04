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
        Schema::table('buildings', function (Blueprint $table) {
            // Drop unique constraint so multiple buildings can have no manager
            $table->dropUnique(['manager_user_id']);
        });

        // Make manager_user_id nullable
        DB::statement('ALTER TABLE buildings ALTER COLUMN manager_user_id DROP NOT NULL');

        // Change foreign key ON DELETE action from CASCADE to SET NULL
        DB::statement('ALTER TABLE buildings DROP CONSTRAINT buildings_manager_user_id_foreign');
        DB::statement('ALTER TABLE buildings ADD CONSTRAINT buildings_manager_user_id_foreign FOREIGN KEY (manager_user_id) REFERENCES users(id) ON DELETE SET NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Set null values to avoid NOT NULL violation
        DB::statement('ALTER TABLE buildings DROP CONSTRAINT buildings_manager_user_id_foreign');
        DB::statement('ALTER TABLE buildings ALTER COLUMN manager_user_id SET NOT NULL');
        DB::statement('ALTER TABLE buildings ADD CONSTRAINT buildings_manager_user_id_foreign FOREIGN KEY (manager_user_id) REFERENCES users(id) ON DELETE CASCADE');

        Schema::table('buildings', function (Blueprint $table) {
            $table->unique('manager_user_id');
        });
    }
};
