<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pagos_suscripcion', function (Blueprint $table) {
            $table->id();
            $table->foreignId('local_id')->constrained('locales')->cascadeOnDelete();
            $table->foreignId('plan_id')->nullable()->constrained('planes')->nullOnDelete();
            $table->decimal('monto', 12, 2)->default(0);
            $table->unsignedSmallInteger('periodo_meses')->default(1);
            $table->string('medio_pago', 40)->default('transferencia');
            $table->date('fecha_pago');
            $table->date('vencimiento_anterior')->nullable();
            $table->date('vencimiento_nuevo');
            $table->string('referencia', 255)->nullable();
            $table->timestamps();

            $table->index(['local_id', 'fecha_pago']);
            $table->index('fecha_pago');
        });

        // Sembrar un pago inicial para los locales existentes con plan asignado
        $locales = DB::table('locales')->whereNotNull('plan_id')->get();
        foreach ($locales as $local) {
            $plan = DB::table('planes')->where('id', $local->plan_id)->first();
            if ($plan && ! DB::table('pagos_suscripcion')->where('local_id', $local->id)->exists()) {
                DB::table('pagos_suscripcion')->insert([
                    'local_id' => $local->id,
                    'plan_id' => $plan->id,
                    'monto' => $plan->mensual,
                    'periodo_meses' => 1,
                    'medio_pago' => 'transferencia',
                    'fecha_pago' => now()->startOfMonth()->toDateString(),
                    'vencimiento_anterior' => now()->startOfMonth()->toDateString(),
                    'vencimiento_nuevo' => $local->vencimiento_suscripcion ?? now()->addMonth()->toDateString(),
                    'referencia' => 'Alta inicial de suscripción (' . $plan->nombre . ')',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('pagos_suscripcion');
    }
};
