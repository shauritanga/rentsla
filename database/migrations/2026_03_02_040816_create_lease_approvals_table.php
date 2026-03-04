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
        Schema::create('lease_approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lease_id')->constrained()->cascadeOnDelete();
            $table->foreignId('approver_id')->constrained('users')->cascadeOnDelete();
            $table->string('role', 50);          // accountant, manager
            $table->string('action', 20);         // approved, rejected
            $table->text('comment')->nullable();
            $table->timestamp('acted_at');
            $table->timestamps();

            $table->index(['lease_id', 'role']);
        });

        // Add created_by to leases so we know who initiated
        Schema::table('leases', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable()->after('status')->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leases', function (Blueprint $table) {
            $table->dropConstrainedForeignId('created_by');
        });
        Schema::dropIfExists('lease_approvals');
    }
};
