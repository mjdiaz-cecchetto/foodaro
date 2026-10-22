<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Horarios por día de la semana con varias franjas, y excepciones por fecha
 * (cerrado o con horario especial). Reemplaza los tres textos libres de `locales`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('horarios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('local_id')->constrained('locales')->cascadeOnDelete();
            $table->unsignedTinyInteger('dia_semana'); // 1 = lunes … 7 = domingo (ISO-8601)
            $table->time('desde');
            $table->time('hasta'); // si hasta <= desde, la franja termina al día siguiente (ej. 20:00-01:30)
            $table->unsignedTinyInteger('orden')->default(0);
            $table->timestamps();

            $table->index(['local_id', 'dia_semana']);
        });

        Schema::create('excepciones_horario', function (Blueprint $table) {
            $table->id();
            $table->foreignId('local_id')->constrained('locales')->cascadeOnDelete();
            $table->date('fecha');
            $table->boolean('cerrado')->default(true);
            // Franja especial para ese día (solo si cerrado = false). Varias filas = varias franjas.
            $table->time('desde')->nullable();
            $table->time('hasta')->nullable();
            $table->string('motivo', 120)->nullable();
            $table->timestamps();

            $table->index(['local_id', 'fecha']);
        });

        Schema::table('locales', function (Blueprint $table) {
            $table->dropColumn(['horario_lunes_a_jueves', 'horario_viernes_y_sabado', 'horario_domingo', 'estado']);
        });
    }

    public function down(): void
    {
        Schema::table('locales', function (Blueprint $table) {
            $table->string('estado', 80)->default('Abierto');
            $table->string('horario_lunes_a_jueves', 80)->nullable();
            $table->string('horario_viernes_y_sabado', 80)->nullable();
            $table->string('horario_domingo', 80)->nullable();
        });
        Schema::dropIfExists('excepciones_horario');
        Schema::dropIfExists('horarios');
    }
};
