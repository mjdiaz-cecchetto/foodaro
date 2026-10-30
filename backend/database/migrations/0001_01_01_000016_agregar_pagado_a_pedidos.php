<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            $table->boolean('pagado')->default(false)->after('medio_pago');
            $table->timestamp('pagado_en')->nullable()->after('pagado');
        });

        // Marcar como pagados los pedidos que ya estaban entregados previamente
        DB::table('pedidos')
            ->where('estado', 'entregado')
            ->update([
                'pagado' => true,
                'pagado_en' => now(),
            ]);
    }

    public function down(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            $table->dropColumn(['pagado', 'pagado_en']);
        });
    }
};
