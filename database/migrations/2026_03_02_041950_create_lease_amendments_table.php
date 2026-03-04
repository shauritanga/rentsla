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
        Schema::create('lease_amendments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lease_id')->constrained()->cascadeOnDelete();
            $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
            $table->string('amendment_type', 50)->default('area_change');
            $table->decimal('current_area_sqm', 10, 2);
            $table->decimal('proposed_area_sqm', 10, 2);
            $table->decimal('current_monthly_rent', 12, 2);
            $table->decimal('proposed_monthly_rent', 12, 2);
            $table->text('reason')->nullable();
            $table->string('status', 30)->default('pending_manager'); // pending_manager, approved, rejected
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('review_comment')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->index(['lease_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lease_amendments');
    }
};
