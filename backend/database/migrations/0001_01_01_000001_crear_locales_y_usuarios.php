<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /** Cada local (tenant) de la plataforma: foodaro.net/<slug> */
        Schema::create('locales', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 60)->unique();
            $table->string('nombre', 120);
            $table->string('eslogan', 255)->nullable();
            $table->string('rubro', 120)->nullable();
            $table->string('logo_url', 500)->nullable();
            $table->string('portada_url', 500)->nullable();
            $table->string('direccion', 255)->nullable();
            $table->string('referencia_direccion', 255)->nullable();
            $table->string('maps_url', 500)->nullable();
            $table->string('estado', 80)->default('Abierto');
            $table->string('horario_lunes_a_jueves', 80)->nullable();
            $table->string('horario_viernes_y_sabado', 80)->nullable();
            $table->string('horario_domingo', 80)->nullable();
            $table->string('whatsapp', 40);
            $table->string('instagram', 80)->nullable();
            $table->string('tiktok', 80)->nullable();
            $table->string('telefono', 40)->nullable();
            $table->char('moneda', 3)->default('ARS');
            // Cargo fijo por pedido (0 = sin cargos). Costos de envío: a definir.
            $table->decimal('cargo_servicio', 12, 2)->default(0);
            $table->string('etiqueta_cargo_servicio', 80)->default('Servicio / empaque');
            $table->boolean('activo')->default(true)->index();
            $table->timestamps();
        });

        /** Usuarios del panel admin. Cada uno pertenece a un local (salvo superadmin). */
        Schema::create('usuarios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('local_id')->nullable()->constrained('locales')->cascadeOnDelete();
            $table->string('nombre', 120);
            $table->string('email', 190)->unique();
            $table->string('password');
            $table->enum('rol', ['administrador', 'superadmin'])->default('administrador');
            $table->boolean('activo')->default(true);
            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('usuarios');
        Schema::dropIfExists('locales');
    }
};
