<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cupones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('local_id')->constrained('locales')->cascadeOnDelete();
            $table->string('codigo', 30);
            $table->unsignedTinyInteger('descuento');
            $table->string('descripcion', 160)->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->unique(['local_id', 'codigo']);
        });

        // Migrar códigos de descuento existentes desde promociones hacia cupones
        $promosConCodigo = DB::table('promociones')
            ->whereNotNull('codigo')
            ->where('codigo', '!=', '')
            ->where('descuento', '>', 0)
            ->get();

        foreach ($promosConCodigo as $p) {
            DB::table('cupones')->insertOrIgnore([
                'local_id' => $p->local_id,
                'codigo' => strtoupper(trim($p->codigo)),
                'descuento' => (int) $p->descuento,
                'descripcion' => $p->titulo,
                'activo' => (bool) $p->activa,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Limpiar código de la tabla promociones (las promos ahora son combos directos con precio)
        DB::table('promociones')->update(['codigo' => null]);
    }

    public function down(): void
    {
        Schema::dropIfExists('cupones');
    }
};
