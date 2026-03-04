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
        Schema::table('leases', function (Blueprint $table) {
            $table->integer('rental_period_years')->nullable()->after('monthly_rent');
            $table->string('rent_currency', 3)->default('TZS')->after('monthly_rent');
            $table->boolean('fitout_applicable')->default(false)->after('rental_period_years');
            $table->date('fitout_start_date')->nullable()->after('fitout_applicable');
            $table->date('fitout_end_date')->nullable()->after('fitout_start_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leases', function (Blueprint $table) {
            $table->dropColumn([
                'rental_period_years',
                'rent_currency',
                'fitout_applicable',
                'fitout_start_date',
                'fitout_end_date',
            ]);
        });
    }
};
