<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('planes', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 80)->unique();
            $table->string('nivel', 80);
            $table->string('nombre', 120);
            $table->decimal('mensual', 12, 2)->default(0);
            $table->decimal('anual', 12, 2)->default(0);
            $table->string('descripcion', 500)->nullable();
            $table->json('caracteristicas');
            $table->string('cta', 120)->default('Elegir Plan');
            $table->boolean('destacado')->default(false);
            $table->boolean('activo')->default(true);
            $table->unsignedSmallInteger('orden')->default(0);
            $table->timestamps();
        });

        Schema::table('locales', function (Blueprint $table) {
            $table->foreignId('plan_id')->nullable()->after('activo')->constrained('planes')->nullOnDelete();
            $table->string('estado_suscripcion', 30)->default('al_dia')->after('plan_id');
            $table->date('vencimiento_suscripcion')->nullable()->after('estado_suscripcion');
        });

        // Cargar por defecto los 3 planes actuales de Foodaro
        $ahora = now();
        $planesPorDefecto = [
            [
                'codigo' => 'catalogo-whatsapp',
                'nivel' => 'Inicial',
                'nombre' => 'Catálogo & WhatsApp',
                'mensual' => 19900,
                'anual' => 15900,
                'descripcion' => 'Ideal para digitalizar tus productos y recibir pedidos directos sin intermediarios.',
                'caracteristicas' => json_encode([
                    'Catálogo digital interactivo con QR y Link',
                    'Pedidos directos a tu WhatsApp',
                    'Panel Administrador del comercio',
                    'Modificación de precios y stock en vivo',
                    'Soporte para Modo Claro y Oscuro',
                ], JSON_UNESCAPED_UNICODE),
                'cta' => 'Elegir Básico',
                'destacado' => false,
                'activo' => true,
                'orden' => 1,
                'created_at' => $ahora,
                'updated_at' => $ahora,
            ],
            [
                'codigo' => 'control-pedidos-stock',
                'nivel' => 'Gestión Activa',
                'nombre' => 'Control de Pedidos & Stock',
                'mensual' => 29900,
                'anual' => 23900,
                'descripcion' => 'Para negocios con volumen diario que necesitan controlar despachos y pedidos.',
                'caracteristicas' => json_encode([
                    'Todo lo del plan Básico',
                    'Consola de pedidos en tiempo real',
                    'Control de pedidos Sin Pagar vs Pagados',
                    'Pausa rápida de ítems agotados',
                    'Banners promocionales y cupones de descuento',
                    'Kit imprimible de mostrador en PDF',
                ], JSON_UNESCAPED_UNICODE),
                'cta' => 'Probar 30 Días Gratis',
                'destacado' => true,
                'activo' => true,
                'orden' => 2,
                'created_at' => $ahora,
                'updated_at' => $ahora,
            ],
            [
                'codigo' => 'terminal-pos-mostrador',
                'nivel' => 'Operación Completa',
                'nombre' => 'Terminal POS & Mostrador',
                'mensual' => 44900,
                'anual' => 35900,
                'descripcion' => 'Operación integral de salón, mozos o cajeros para atención presencial y pedidos.',
                'caracteristicas' => json_encode([
                    'Todo lo del plan Control',
                    'Terminal táctil para mozos o vendedores',
                    'Login por PIN (Vendedor vs Encargado)',
                    'Registro de cliente con nombre en mostrador',
                    'Control de horario comercial y turnos',
                    'Arqueo rápido de caja y cobros del turno',
                ], JSON_UNESCAPED_UNICODE),
                'cta' => 'Comenzar con POS',
                'destacado' => false,
                'activo' => true,
                'orden' => 3,
                'created_at' => $ahora,
                'updated_at' => $ahora,
            ],
        ];

        DB::table('planes')->insert($planesPorDefecto);

        $planDestacadoId = DB::table('planes')->where('codigo', 'control-pedidos-stock')->value('id');
        if ($planDestacadoId) {
            DB::table('locales')->whereNull('plan_id')->update([
                'plan_id' => $planDestacadoId,
                'estado_suscripcion' => 'al_dia',
                'vencimiento_suscripcion' => now()->addMonth()->toDateString(),
            ]);
        }

        // Crear usuario Root por defecto si no existe
        $existeRoot = DB::table('usuarios')->where('email', 'root@foodaro.com')->exists();
        if (! $existeRoot) {
            $primerLocalId = DB::table('locales')->value('id');
            DB::table('usuarios')->insert([
                'local_id' => $primerLocalId,
                'nombre' => 'Root Foodaro',
                'email' => 'root@foodaro.com',
                'password' => Hash::make('root1234'),
                'rol' => 'superadmin',
                'activo' => true,
                'created_at' => $ahora,
                'updated_at' => $ahora,
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('locales', function (Blueprint $table) {
            $table->dropConstrainedForeignId('plan_id');
            $table->dropColumn(['estado_suscripcion', 'vencimiento_suscripcion']);
        });
        Schema::dropIfExists('planes');
    }
};
