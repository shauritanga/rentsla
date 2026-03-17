<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('generator_cost_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('electricity_batch_id')->constrained()->cascadeOnDelete();
            $table->string('cost_type', 20); // fuel | maintenance | operator | reserve | other
            $table->decimal('amount', 14, 2);
            $table->string('note')->nullable();
            $table->timestamps();

            $table->index(['electricity_batch_id', 'cost_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('generator_cost_entries');
    }
};
