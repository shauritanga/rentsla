<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('electricity_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('building_id')->constrained()->cascadeOnDelete();
            $table->string('period_month', 7); // YYYY-MM
            $table->date('issue_date');
            $table->date('due_date');
            $table->decimal('grid_kwh', 14, 2)->default(0);
            $table->decimal('grid_cost', 14, 2)->default(0);
            $table->decimal('generator_kwh', 14, 2)->default(0);
            $table->decimal('generator_cost', 14, 2)->default(0);
            $table->decimal('blend_rate', 14, 4)->default(0);
            $table->decimal('loss_threshold_percent', 5, 2)->default(5);
            $table->string('reconciliation_status', 20)->default('ok'); // ok | warning | blocked
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();

            $table->unique(['building_id', 'period_month']);
            $table->index(['building_id', 'reconciliation_status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('electricity_batches');
    }
};
