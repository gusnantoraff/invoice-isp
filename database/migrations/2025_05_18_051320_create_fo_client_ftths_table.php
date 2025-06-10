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
        Schema::create('fo_client_ftths', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lokasi_id')->constrained('fo_lokasis')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignId('kabel_odp_id')->constrained('fo_kabel_odps')->cascadeOnDelete()->cascadeOnUpdate();
            $table->string('nama_client');
            $table->string('alamat');
            // $table->decimal('latitude');
            // $table->decimal('longitude');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fo_client_ftths');
    }
};
