<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->string('bill_category', 20)
                ->default('lease')
                ->after('reference_id');
            $table->index(['date', 'bill_category']);
        });

        Schema::table('transaction_entries', function (Blueprint $table) {
            $table->string('bill_category', 20)
                ->default('lease')
                ->after('account_id');
            $table->index(['transaction_id', 'bill_category']);
        });
    }

    public function down(): void
    {
        Schema::table('transaction_entries', function (Blueprint $table) {
            $table->dropIndex(['transaction_id', 'bill_category']);
            $table->dropColumn('bill_category');
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex(['date', 'bill_category']);
            $table->dropColumn('bill_category');
        });
    }
};
