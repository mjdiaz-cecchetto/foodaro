<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pedido_items', function (Blueprint $table) {
            $table->unsignedSmallInteger('ronda')->default(1)->after('pedido_id');
            $table->boolean('entregado')->default(false)->after('notas');
            $table->timestamp('entregado_en')->nullable()->after('entregado');
            $table->timestamp('comandado_en')->nullable()->after('entregado_en');

            $table->index(['pedido_id', 'ronda']);
        });

        // Marcar como entregados los ítems de pedidos históricos que ya figuran como 'entregado'.
        $idsEntregados = DB::table('pedidos')
            ->where('estado', 'entregado')
            ->pluck('id');

        if ($idsEntregados->isNotEmpty()) {
            DB::table('pedido_items')
                ->whereIn('pedido_id', $idsEntregados)
                ->update([
                    'entregado' => true,
                    'entregado_en' => now(),
                ]);
        }
    }

    public function down(): void
    {
        Schema::table('pedido_items', function (Blueprint $table) {
            $table->dropIndex(['pedido_id', 'ronda']);
            $table->dropColumn(['ronda', 'entregado', 'entregado_en', 'comandado_en']);
        });
    }
};
