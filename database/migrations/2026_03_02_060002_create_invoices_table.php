<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();

            /* Numbering */
            $table->string('invoice_number')->unique();
            $table->string('proforma_number')->unique()->nullable();

            /* Relations */
            $table->foreignId('building_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lease_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();

            /* Type & status */
            $table->string('type', 20)->default('invoice');       // proforma | invoice
            $table->string('status', 20)->default('draft');       // draft | sent | paid | partial | overdue | cancelled

            /* Billing period */
            $table->unsignedSmallInteger('billing_months')->default(3);
            $table->date('issue_date');
            $table->date('due_date');
            $table->date('period_start');
            $table->date('period_end');

            /* Amounts */
            $table->decimal('rent_amount', 14, 2)->default(0);         // monthly_rent × billing_months
            $table->decimal('service_charge_rate', 5, 2)->default(5);  // %
            $table->decimal('service_charge_amount', 14, 2)->default(0);
            $table->decimal('subtotal', 14, 2)->default(0);            // rent + service_charge + items
            $table->decimal('withholding_tax_rate', 5, 2)->default(10); // %
            $table->decimal('withholding_tax_amount', 14, 2)->default(0);
            $table->decimal('total_amount', 14, 2)->default(0);        // subtotal − withholding
            $table->decimal('amount_paid', 14, 2)->default(0);
            $table->string('currency', 3)->default('TZS');

            /* Meta */
            $table->text('notes')->nullable();
            $table->timestamp('converted_at')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
