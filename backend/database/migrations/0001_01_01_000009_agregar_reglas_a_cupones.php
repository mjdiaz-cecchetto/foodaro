<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cupones', function (Blueprint $table) {
            $table->decimal('monto_minimo', 12, 2)->default(0)->after('descripcion');
            $table->unsignedInteger('max_usos')->nullable()->after('monto_minimo');
            $table->unsignedInteger('usos')->default(0)->after('max_usos');
            $table->date('fecha_vencimiento')->nullable()->after('usos');
        });
    }

    public function down(): void
    {
        Schema::table('cupones', function (Blueprint $table) {
            $table->dropColumn(['monto_minimo', 'max_usos', 'usos', 'fecha_vencimiento']);
        });
    }
};
