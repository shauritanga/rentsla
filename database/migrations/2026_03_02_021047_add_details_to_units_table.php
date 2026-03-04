<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('units', function (Blueprint $table) {
            $table->decimal('area_sqm', 10, 2)->nullable()->after('unit_number');
            $table->string('unit_type', 30)->default('office')->after('area_sqm');
            $table->decimal('rent_amount', 12, 2)->nullable()->after('unit_type');
            $table->string('rent_currency', 3)->default('TZS')->after('rent_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('units', function (Blueprint $table) {
            $table->dropColumn(['area_sqm', 'unit_type', 'rent_amount', 'rent_currency']);
        });
    }
};
