<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Separación estricta de paneles:
 *  - Ningún superadmin (Root) queda vinculado a un local.
 *  - Se revocan los tokens antiguos con habilidad "*" (servían para ambos paneles);
 *    a partir de ahora cada login emite un token "admin" o "root" exclusivo.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('usuarios')->where('rol', 'superadmin')->update(['local_id' => null]);

        DB::table('personal_access_tokens')
            ->where('tokenable_type', 'App\\Models\\Usuario')
            ->where('abilities', 'like', '%"*"%')
            ->delete();
    }

    public function down(): void
    {
        // Sin reversión: no se re-vincula al Root con un local.
    }
};
