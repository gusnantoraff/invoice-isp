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
        Schema::create('fo_kabel_odps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('odp_id')->constrained('fo_odps')->cascadeOnDelete()->cascadeOnUpdate();
            $table->string('nama_kabel_odp');
            $table->enum('tipe_kabel', ['singlecore', 'multicore']);
            $table->integer('panjang_kabel');
            $table->integer('jumlah_tube');
            $table->integer('jumlah_core');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fo_kabel_odps');
    }
};
