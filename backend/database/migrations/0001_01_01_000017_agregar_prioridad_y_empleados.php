<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('pedidos', 'prioritario')) {
            Schema::table('pedidos', function (Blueprint $table) {
                $table->boolean('prioritario')->default(false)->after('estado');
            });
        }

        if (! Schema::hasTable('empleados')) {
            Schema::create('empleados', function (Blueprint $table) {
                $table->id();
                $table->foreignId('local_id')->constrained('locales')->cascadeOnDelete();
                $table->string('nombre', 120);
                $table->string('rol', 80)->default('Cocinero');
                $table->string('telefono', 40)->nullable();
                $table->string('dni', 30)->nullable();
                $table->decimal('sueldo_hora', 10, 2)->default(0);
                $table->boolean('activo')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('asistencias_empleados')) {
            Schema::create('asistencias_empleados', function (Blueprint $table) {
                $table->id();
                $table->foreignId('local_id')->constrained('locales')->cascadeOnDelete();
                $table->foreignId('empleado_id')->constrained('empleados')->cascadeOnDelete();
                $table->date('fecha');
                $table->string('hora_entrada', 5);
                $table->string('hora_salida', 5)->nullable();
                $table->decimal('horas_trabajadas', 6, 2)->default(0);
                $table->decimal('valor_hora', 10, 2)->default(0);
                $table->decimal('total_paga', 12, 2)->default(0);
                $table->boolean('pagado')->default(false);
                $table->string('notas', 255)->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('asistencias_empleados');
        Schema::dropIfExists('empleados');

        if (Schema::hasColumn('pedidos', 'prioritario')) {
            Schema::table('pedidos', function (Blueprint $table) {
                $table->dropColumn('prioritario');
            });
        }
    }
};
