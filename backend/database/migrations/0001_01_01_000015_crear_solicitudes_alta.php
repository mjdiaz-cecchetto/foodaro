<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('solicitudes_alta', function (Blueprint $table) {
            $table->id();
            $table->string('nombre_comercio', 160);
            $table->string('ciudad', 120)->nullable();
            $table->string('whatsapp', 60);
            $table->string('plan_nombre', 120)->nullable();
            $table->foreignId('plan_id')->nullable()->constrained('planes')->nullOnDelete();
            $table->string('estado', 30)->default('nuevo'); // nuevo | contactado | alta | descartado
            $table->foreignId('local_id')->nullable()->constrained('locales')->nullOnDelete();
            $table->string('notas', 500)->nullable();
            $table->timestamps();
        });

        // Actualizar el texto de prueba gratuita de 14 a 30 días en los planes existentes
        DB::table('planes')
            ->where('cta', 'LIKE', '%14%')
            ->orWhere('cta', 'LIKE', '%15%')
            ->update(['cta' => 'Probar 30 Días Gratis']);
    }

    public function down(): void
    {
        Schema::dropIfExists('solicitudes_alta');
    }
};
