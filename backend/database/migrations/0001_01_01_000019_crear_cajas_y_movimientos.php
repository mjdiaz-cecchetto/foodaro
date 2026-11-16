<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cajas_diarias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('local_id')->constrained('locales')->cascadeOnDelete();
            $table->date('fecha');
            $table->decimal('monto_inicial', 12, 2)->default(0);
            $table->string('observaciones', 255)->nullable();
            $table->timestamps();

            $table->unique(['local_id', 'fecha']);
        });

        Schema::create('movimientos_caja', function (Blueprint $table) {
            $table->id();
            $table->foreignId('local_id')->constrained('locales')->cascadeOnDelete();
            $table->date('fecha_jornada')->index();
            $table->string('tipo', 20)->default('egreso'); // egreso | ingreso
            $table->decimal('monto', 12, 2);
            $table->string('medio_pago', 30)->default('efectivo'); // efectivo | transferencia
            $table->string('concepto', 200);
            $table->timestamps();

            $table->index(['local_id', 'fecha_jornada']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('movimientos_caja');
        Schema::dropIfExists('cajas_diarias');
    }
};
