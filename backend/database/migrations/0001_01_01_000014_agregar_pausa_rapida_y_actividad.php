<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('locales', function (Blueprint $table) {
            if (! Schema::hasColumn('locales', 'cerrado_temporalmente')) {
                $table->boolean('cerrado_temporalmente')->default(false)->after('activo');
            }
            if (! Schema::hasColumn('locales', 'envios_pausados')) {
                $table->boolean('envios_pausados')->default(false)->after('cerrado_temporalmente');
            }
        });

        Schema::table('usuarios', function (Blueprint $table) {
            if (! Schema::hasColumn('usuarios', 'ultimo_acceso_en')) {
                $table->timestamp('ultimo_acceso_en')->nullable()->after('activo');
            }
        });

        // Inicializar ultimo_acceso_en para usuarios que ya tienen tokens emitidos
        $tokensRecientes = DB::table('personal_access_tokens')
            ->select('tokenable_id', DB::raw('MAX( COALESCE(last_used_at, created_at) ) as ultimo'))
            ->where('tokenable_type', 'App\\Models\\Usuario')
            ->groupBy('tokenable_id')
            ->get();

        foreach ($tokensRecientes as $t) {
            DB::table('usuarios')
                ->where('id', $t->tokenable_id)
                ->whereNull('ultimo_acceso_en')
                ->update(['ultimo_acceso_en' => $t->ultimo]);
        }
    }

    public function down(): void
    {
        Schema::table('locales', function (Blueprint $table) {
            $table->dropColumn(['cerrado_temporalmente', 'envios_pausados']);
        });

        Schema::table('usuarios', function (Blueprint $table) {
            $table->dropColumn('ultimo_acceso_en');
        });
    }
};
