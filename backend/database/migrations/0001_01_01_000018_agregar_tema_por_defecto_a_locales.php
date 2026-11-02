<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('locales', function (Blueprint $table) {
            if (! Schema::hasColumn('locales', 'tema_por_defecto')) {
                $table->string('tema_por_defecto', 10)->default('light')->after('moneda');
            }
        });
    }

    public function down(): void
    {
        Schema::table('locales', function (Blueprint $table) {
            if (Schema::hasColumn('locales', 'tema_por_defecto')) {
                $table->dropColumn('tema_por_defecto');
            }
        });
    }
};
