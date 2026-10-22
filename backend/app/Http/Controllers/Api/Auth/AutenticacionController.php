<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\IngresoRequest;
use App\Http\Resources\UsuarioResource;
use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/** Autenticación del panel admin con tokens de Sanctum. */
class AutenticacionController extends Controller
{
    /** POST /api/auth/ingreso */
    public function ingresar(IngresoRequest $request): JsonResponse
    {
        $usuario = Usuario::query()->where('email', strtolower($request->input('email')))->first();

        if (! $usuario || ! $usuario->activo || ! Hash::check($request->input('contrasenia'), $usuario->password)) {
            throw ValidationException::withMessages(['email' => 'Las credenciales no son válidas.']);
        }

        $token = $usuario->createToken('panel-admin')->plainTextToken;

        return response()->json([
            'data' => [
                'token' => $token,
                'usuario' => new UsuarioResource($usuario->load('local')),
            ],
        ]);
    }

    /** GET /api/auth/yo */
    public function yo(Request $request): UsuarioResource
    {
        return new UsuarioResource($request->user()->load('local'));
    }

    /** POST /api/auth/salir */
    public function salir(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(null, 204);
    }
}
