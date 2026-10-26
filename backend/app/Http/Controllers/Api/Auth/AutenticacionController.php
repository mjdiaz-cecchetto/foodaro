<?php

namespace App\Http\Controllers\Api\Auth;

use App\Enums\RolUsuario;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\IngresoRequest;
use App\Http\Resources\UsuarioResource;
use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Autenticación con tokens de Sanctum. Hay DOS accesos totalmente independientes:
 *  - Panel del local  (POST /api/auth/ingreso):       solo administradores de un local → token con habilidad "admin".
 *  - Panel Root       (POST /api/root/auth/ingreso):  solo superadmins de Foodaro     → token con habilidad "root".
 * Un token nunca sirve para el otro panel.
 */
class AutenticacionController extends Controller
{
    public const HABILIDAD_ADMIN = 'admin';

    public const HABILIDAD_ROOT = 'root';

    /** POST /api/auth/ingreso — Login exclusivo del administrador del local. */
    public function ingresar(IngresoRequest $request): JsonResponse
    {
        $usuario = $this->validarCredenciales($request);

        if ($usuario->rol !== RolUsuario::Administrador || ! $usuario->local_id) {
            throw ValidationException::withMessages(['email' => 'Las credenciales no son válidas.']);
        }

        $token = $usuario->createToken('panel-local', [self::HABILIDAD_ADMIN])->plainTextToken;

        return response()->json([
            'data' => [
                'token' => $token,
                'usuario' => new UsuarioResource($usuario->load('local')),
            ],
        ]);
    }

    /** POST /api/root/auth/ingreso — Login exclusivo del Root de Foodaro. */
    public function ingresarRoot(IngresoRequest $request): JsonResponse
    {
        $usuario = $this->validarCredenciales($request);

        if ($usuario->rol !== RolUsuario::Superadmin) {
            throw ValidationException::withMessages(['email' => 'Las credenciales no son válidas.']);
        }

        $token = $usuario->createToken('panel-root', [self::HABILIDAD_ROOT])->plainTextToken;

        return response()->json([
            'data' => [
                'token' => $token,
                'usuario' => new UsuarioResource($usuario),
            ],
        ]);
    }

    /** GET /api/auth/yo y /api/root/auth/yo */
    public function yo(Request $request): UsuarioResource
    {
        $usuario = $request->user();

        return new UsuarioResource($usuario->esSuperadmin() ? $usuario : $usuario->load('local'));
    }

    /** POST /api/auth/salir y /api/root/auth/salir */
    public function salir(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(null, 204);
    }

    private function validarCredenciales(IngresoRequest $request): Usuario
    {
        $usuario = Usuario::query()->where('email', strtolower($request->input('email')))->first();

        if (! $usuario || ! $usuario->activo || ! Hash::check($request->input('contrasenia'), $usuario->password)) {
            throw ValidationException::withMessages(['email' => 'Las credenciales no son válidas.']);
        }

        return $usuario;
    }
}
