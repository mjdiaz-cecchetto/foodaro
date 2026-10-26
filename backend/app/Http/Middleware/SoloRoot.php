<?php

namespace App\Http\Middleware;

use App\Enums\RolUsuario;
use App\Http\Controllers\Api\Auth\AutenticacionController;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Solo deja pasar al Root (superadmin) de Foodaro, con un token emitido por el login Root.
 * Un token de administrador de local recibe 403 en todo /api/root.
 */
class SoloRoot
{
    public function handle(Request $request, Closure $next): Response
    {
        $usuario = $request->user();
        $token = $usuario?->currentAccessToken();
        $habilidades = $token?->abilities ?? [];

        if (
            ! $usuario
            || $usuario->rol !== RolUsuario::Superadmin
            || ! in_array(AutenticacionController::HABILIDAD_ROOT, $habilidades, true)
        ) {
            abort(403, 'Acceso exclusivo para el administrador general (Root) de Foodaro.');
        }

        return $next($request);
    }
}
