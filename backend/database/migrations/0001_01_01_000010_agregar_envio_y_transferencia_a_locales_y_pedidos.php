<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('locales', function (Blueprint $table) {
            $table->decimal('costo_envio', 12, 2)->default(0)->after('etiqueta_cargo_servicio');
            $table->decimal('monto_minimo_envio', 12, 2)->default(0)->after('costo_envio');
            $table->string('alias_transferencia', 120)->nullable()->after('monto_minimo_envio');
            $table->string('titular_transferencia', 120)->nullable()->after('alias_transferencia');
        });

        Schema::table('pedidos', function (Blueprint $table) {
            $table->decimal('costo_envio', 12, 2)->default(0)->after('cargo_servicio');
        });
    }

    public function down(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            $table->dropColumn('costo_envio');
        });

        Schema::table('locales', function (Blueprint $table) {
            $table->dropColumn([
                'costo_envio',
                'monto_minimo_envio',
                'alias_transferencia',
                'titular_transferencia',
            ]);
        });
    }
};
