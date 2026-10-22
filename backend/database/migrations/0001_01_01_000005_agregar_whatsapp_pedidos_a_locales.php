<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/** Número de WhatsApp al que llegan los pedidos (puede ser distinto del contacto público). */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('locales', function (Blueprint $table) {
            $table->string('whatsapp_pedidos', 40)->after('whatsapp')->nullable();
        });
        // Locales existentes: arrancan recibiendo pedidos en su WhatsApp de contacto
        DB::table('locales')->whereNull('whatsapp_pedidos')->update(['whatsapp_pedidos' => DB::raw('whatsapp')]);
    }

    public function down(): void
    {
        Schema::table('locales', function (Blueprint $table) {
            $table->dropColumn('whatsapp_pedidos');
        });
    }
};
