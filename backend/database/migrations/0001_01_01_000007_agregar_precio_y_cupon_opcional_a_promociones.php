<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Agrega precio a las promociones y vuelve opcionales el código de cupón y el porcentaje de descuento.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('promociones', function (Blueprint $table) {
            $table->decimal('precio', 12, 2)->default(0)->after('titulo');
            $table->unsignedTinyInteger('descuento')->nullable()->change();
            $table->string('codigo', 30)->nullable()->change();
        });

        // Asignar un precio base de ejemplo a las promociones actuales que tengan precio 0
        DB::table('promociones')->where('precio', 0)->update(['precio' => 14500]);
    }

    public function down(): void
    {
        Schema::table('promociones', function (Blueprint $table) {
            $table->dropColumn('precio');
        });
    }
};
