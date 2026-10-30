<?php

namespace App\Http\Middleware;

use App\Enums\RolUsuario;
use App\Http\Controllers\Api\Auth\AutenticacionController;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Solo deja pasar al administrador de un local, con un token emitido por el login del local.
 * Un token del Root (o un usuario superadmin) recibe 403 en todo /api/admin.
 */
class SoloAdministradorLocal
{
    public function handle(Request $request, Closure $next): Response
    {
        $usuario = $request->user();
        $token = $usuario?->currentAccessToken();
        $habilidades = $token?->abilities ?? [];

        if (
            ! $usuario
            || $usuario->rol !== RolUsuario::Administrador
            || ! $usuario->local_id
            || ! in_array(AutenticacionController::HABILIDAD_ADMIN, $habilidades, true)
        ) {
            abort(403, 'Acceso exclusivo para el administrador del local.');
        }

        if (! $usuario->ultimo_acceso_en || $usuario->ultimo_acceso_en->lt(now()->subMinutes(5))) {
            $usuario->forceFill(['ultimo_acceso_en' => now()])->saveQuietly();
        }

        return $next($request);
    }
}
