<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Define cómo impactan las opciones de un grupo en el precio del producto:
 * - 'adicional'   => suma (+$) al precio base (extras, adicionales).
 * - 'variante'    => define/reemplaza ($) el precio base según la porción/cantidad.
 * - 'informativo' => sin impacto en precio (cocción, punto de carne, gustos).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('grupos_opciones', function (Blueprint $table) {
            $table->string('modo_precio', 20)->default('adicional')->after('tipo');
        });

        // 1. Marcar grupos de tamaño/porciones/cantidad como 'variante'
        DB::table('grupos_opciones')
            ->whereIn(DB::raw('LOWER(nombre)'), ['tamaño', 'tamano', 'cantidad', 'porción / formato', 'cantidad / presentación', 'presentación', 'porciones'])
            ->update(['modo_precio' => 'variante']);

        // 2. Marcar grupos donde todas las opciones tienen precio 0 como 'informativo'
        $gruposConPrecio = DB::table('opciones')
            ->where('precio_adicional', '>', 0)
            ->pluck('grupo_opciones_id')
            ->unique();

        DB::table('grupos_opciones')
            ->where('modo_precio', 'adicional')
            ->whereNotIn('id', $gruposConPrecio)
            ->update(['modo_precio' => 'informativo']);

        // 3. Ajustar las opciones de Tamaño en Pizzas (8 porciones por defecto + 4 porciones mitad)
        $gruposTamanio = DB::table('grupos_opciones')
            ->whereIn(DB::raw('LOWER(nombre)'), ['tamaño', 'tamano'])
            ->get();

        foreach ($gruposTamanio as $grupo) {
            $producto = $grupo->producto_id
                ? DB::table('productos')->where('id', $grupo->producto_id)->first()
                : null;
            $precioEntera = $producto ? (float) $producto->precio : 12500;
            $precioMitad = $precioEntera == 12500 ? 7000 : round(($precioEntera * 0.56) / 100) * 100;

            DB::table('opciones')->where('grupo_opciones_id', $grupo->id)->delete();
            DB::table('opciones')->insert([
                [
                    'grupo_opciones_id' => $grupo->id,
                    'etiqueta' => '8 porciones (Entera)',
                    'precio_adicional' => 0,
                    'por_defecto' => true,
                    'orden' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'grupo_opciones_id' => $grupo->id,
                    'etiqueta' => '4 porciones (Media pizza)',
                    'precio_adicional' => $precioMitad,
                    'por_defecto' => false,
                    'orden' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }

        // 4. Ajustar las opciones de Cantidad en Empanadas (Docena 12 por defecto, Media docena 6 y Por unidad)
        $gruposCantidad = DB::table('grupos_opciones')
            ->where(DB::raw('LOWER(nombre)'), 'cantidad')
            ->get();

        foreach ($gruposCantidad as $grupo) {
            $producto = $grupo->producto_id
                ? DB::table('productos')->where('id', $grupo->producto_id)->first()
                : null;

            $precioActual = $producto ? (float) $producto->precio : 9500;
            // Si el producto tenía el precio de media docena (~9500), llevamos el precio base a la Docena (12)
            $precioDocena = $precioActual < 14000 ? ($precioActual * 2 - 1000) : $precioActual;
            $precioMedia = $precioActual < 14000 ? $precioActual : round(($precioDocena * 0.53) / 100) * 100;
            $precioUnidad = round(($precioDocena / 10) / 100) * 100;

            if ($producto && $precioActual < 14000) {
                DB::table('productos')->where('id', $producto->id)->update(['precio' => $precioDocena]);
            }

            DB::table('opciones')->where('grupo_opciones_id', $grupo->id)->delete();
            DB::table('opciones')->insert([
                [
                    'grupo_opciones_id' => $grupo->id,
                    'etiqueta' => 'Docena (12)',
                    'precio_adicional' => 0,
                    'por_defecto' => true,
                    'orden' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'grupo_opciones_id' => $grupo->id,
                    'etiqueta' => 'Media docena (6)',
                    'precio_adicional' => $precioMedia,
                    'por_defecto' => false,
                    'orden' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'grupo_opciones_id' => $grupo->id,
                    'etiqueta' => 'Por unidad',
                    'precio_adicional' => $precioUnidad,
                    'por_defecto' => false,
                    'orden' => 2,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('grupos_opciones', function (Blueprint $table) {
            $table->dropColumn('modo_precio');
        });
    }
};
