<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('bill_category', 20)
                ->default('lease')
                ->after('tenant_id');
            $table->string('billing_cycle', 20)
                ->default('lease_cycle')
                ->after('bill_category');
            $table->string('source_mix_mode', 20)
                ->nullable()
                ->after('billing_cycle');

            $table->index(['building_id', 'bill_category']);
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex(['building_id', 'bill_category']);
            $table->dropColumn(['bill_category', 'billing_cycle', 'source_mix_mode']);
        });
    }
};
