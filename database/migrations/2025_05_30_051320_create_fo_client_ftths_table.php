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

            // Foreign key to fo_lokasis.id
            $table->foreignId('lokasi_id')
                ->constrained('fo_lokasis')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();

            // Foreign key to fo_odps.id
            $table->foreignId('odp_id')
                ->constrained('fo_odps')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();

            $table->string('nama_client');
            $table->string('alamat');

            // NEW: add "status" column (active or archived)
            $table->enum('status', ['active', 'archived'])->default('active');

            // NEW: soft deletes (adds deleted_at)
            $table->softDeletes();

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
