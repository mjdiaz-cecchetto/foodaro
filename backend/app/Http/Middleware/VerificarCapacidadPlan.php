<?php

namespace App\Http\Middleware;

use App\Models\Plan;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerificarCapacidadPlan
{
    /**
     * Valida que el local del administrador autenticado tenga la capacidad requerida por el plan.
     */
    public function handle(Request $request, Closure $next, string $capacidad): Response
    {
        $local = $request->user()?->local;

        if (! $local) {
            abort(403, 'No perteneces a ningún local.');
        }

        if (! $local->tieneCapacidad($capacidad)) {
            $planRequerido = Plan::planRequeridoPara($capacidad);

            return response()->json([
                'error' => "Esta funcionalidad requiere el plan {$planRequerido} o superior.",
                'codigo' => 'plan_insuficiente',
                'capacidad' => $capacidad,
                'planActual' => $local->plan?->codigo,
                'planRequerido' => $planRequerido,
            ], 403);
        }

        return $next($request);
    }
}
