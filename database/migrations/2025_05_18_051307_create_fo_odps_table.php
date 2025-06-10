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
        Schema::create('fo_odps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lokasi_id')->constrained('fo_lokasis')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignId('kabel_odc_id')->constrained('fo_kabel_odcs')->cascadeOnDelete()->cascadeOnUpdate();
            $table->string('nama_odp');
            $table->enum('tipe_splitter', ['1:8', '1:16', '1:32']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fo_odps');
    }
};
