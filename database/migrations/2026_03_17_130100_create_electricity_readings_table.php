<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('electricity_readings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('electricity_batch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('unit_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('opening_kwh', 14, 2);
            $table->decimal('closing_kwh', 14, 2);
            $table->decimal('usage_kwh', 14, 2)->default(0);
            $table->date('reading_date');
            $table->foreignId('reader_user_id')->constrained('users');
            $table->string('photo_path')->nullable();
            $table->boolean('is_estimated')->default(false);
            $table->string('estimation_reason')->nullable();
            $table->boolean('exception_flag')->default(false);
            $table->string('exception_note')->nullable();
            $table->timestamps();

            $table->unique(['electricity_batch_id', 'unit_id']);
            $table->index(['electricity_batch_id', 'exception_flag']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('electricity_readings');
    }
};
