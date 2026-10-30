<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ActualizarLocalRequest;
use App\Http\Resources\LocalResource;
use App\Http\Resources\UsuarioResource;
use App\Models\Local;
use App\Models\PagoSuscripcion;
use App\Models\Usuario;
use App\Services\HorariosServicio;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/** Datos del local del usuario autenticado. */
class LocalAdminController extends Controller
{
    public function __construct(private readonly HorariosServicio $horarios) {}

    /** GET /api/admin/local — local completo (incluye plantillas de opciones y productos no disponibles). */
    public function show(Request $request): LocalResource
    {
        $local = $this->localDe($request)->load([
            'plan',
            'horarios',
            'excepcionesHorario',
            'categorias',
            'productos.gruposOpciones.opciones',
            'promociones',
            'cupones',
            'plantillasOpciones.opciones',
        ]);

        return new LocalResource($local);
    }

    /** PUT /api/admin/local — perfil y configuración. */
    public function update(ActualizarLocalRequest $request): LocalResource
    {
        $local = $this->localDe($request);
        $p = $request->validated('perfil');
        $c = $request->validated('configuracion') ?? [];

        $local->fill([
            'nombre' => $p['nombre'],
            'eslogan' => $p['eslogan'] ?? null,
            'rubro' => $p['rubro'] ?? null,
            'logo_url' => $p['logoUrl'] ?? $local->logo_url,
            'portada_url' => $p['portadaUrl'] ?? $local->portada_url,
            'direccion' => $p['direccion'] ?? null,
            'referencia_direccion' => $p['referenciaDireccion'] ?? null,
            'maps_url' => $p['mapsUrl'] ?? null,
            'whatsapp' => $p['contacto']['whatsapp'],
            'whatsapp_pedidos' => $p['contacto']['whatsappPedidos'],
            'instagram' => $p['contacto']['instagram'] ?? null,
            'tiktok' => $p['contacto']['tiktok'] ?? null,
            'telefono' => $p['contacto']['telefono'] ?? null,
        ]);

        if (isset($c['moneda'])) {
            $local->moneda = strtoupper($c['moneda']);
        }
        if (array_key_exists('cargoServicio', $c)) {
            $local->cargo_servicio = $c['cargoServicio'];
        }
        if (isset($c['etiquetaCargoServicio'])) {
            $local->etiqueta_cargo_servicio = $c['etiquetaCargoServicio'];
        }
        if (array_key_exists('costoEnvio', $c)) {
            $local->costo_envio = (float) $c['costoEnvio'];
        }
        if (array_key_exists('montoMinimoEnvio', $c)) {
            $local->monto_minimo_envio = (float) $c['montoMinimoEnvio'];
        }
        if (array_key_exists('aliasTransferencia', $c)) {
            $local->alias_transferencia = $c['aliasTransferencia'] ? trim($c['aliasTransferencia']) : null;
        }
        if (array_key_exists('titularTransferencia', $c)) {
            $local->titular_transferencia = $c['titularTransferencia'] ? trim($c['titularTransferencia']) : null;
        }
        if (array_key_exists('cerradoTemporalmente', $c)) {
            $local->cerrado_temporalmente = (bool) $c['cerradoTemporalmente'];
        }
        if (array_key_exists('enviosPausados', $c)) {
            $local->envios_pausados = (bool) $c['enviosPausados'];
        }
        $local->save();

        if (isset($p['horarios'])) {
            $this->horarios->guardar($local, $p['horarios']['semana'] ?? [], $p['horarios']['excepciones'] ?? []);
        }

        return new LocalResource($local->load(['plan', 'horarios', 'excepcionesHorario']));
    }

    /** PATCH /api/admin/local/pausa-rapida — Cierra/reabre el local por hoy o pausa/reactiva los envíos en 1 clic. */
    public function alternarPausaRapida(Request $request): LocalResource
    {
        $local = $this->localDe($request);

        $datos = $request->validate([
            'cerradoTemporalmente' => ['nullable', 'boolean'],
            'enviosPausados' => ['nullable', 'boolean'],
        ]);

        if (array_key_exists('cerradoTemporalmente', $datos) && $datos['cerradoTemporalmente'] !== null) {
            $local->cerrado_temporalmente = (bool) $datos['cerradoTemporalmente'];
        }
        if (array_key_exists('enviosPausados', $datos) && $datos['enviosPausados'] !== null) {
            $local->envios_pausados = (bool) $datos['enviosPausados'];
        }

        $local->save();

        return new LocalResource($local->load(['plan', 'horarios', 'excepcionesHorario']));
    }

    /** GET /api/admin/mi-cuenta — Datos del usuario administrador, estado de su suscripción e historial de pagos. */
    public function miCuenta(Request $request): JsonResponse
    {
        $local = $this->localDe($request)->load(['plan', 'pagosSuscripcion.plan']);
        /** @var Usuario $usuario */
        $usuario = $request->user();

        $pagos = $local->pagosSuscripcion->map(fn (PagoSuscripcion $pg) => [
            'id' => $pg->id,
            'planNombre' => $pg->plan?->nombre ?? $local->plan?->nombre ?? 'Plan Foodaro',
            'monto' => (float) $pg->monto,
            'periodoMeses' => (int) $pg->periodo_meses,
            'medioPago' => $pg->medio_pago,
            'fechaPago' => $pg->fecha_pago?->format('Y-m-d'),
            'vencimientoNuevo' => $pg->vencimiento_nuevo?->format('Y-m-d'),
            'referencia' => $pg->referencia ?? '',
        ])->values();

        return response()->json([
            'data' => [
                'usuario' => new UsuarioResource($usuario),
                'suscripcion' => $local->resumenSuscripcion(),
                'pagos' => $pagos,
            ],
        ]);
    }

    /** PUT /api/admin/mi-cuenta — Permite al dueño del local actualizar su nombre, email y/o cambiar su contraseña. */
    public function actualizarMiCuenta(Request $request): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $request->user();

        $datos = $request->validate([
            'nombre' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190', Rule::unique('usuarios', 'email')->ignore($usuario->id)],
            'contraseniaActual' => ['nullable', 'string'],
            'nuevaContrasenia' => ['nullable', 'string', 'min:4', 'max:100'],
        ]);

        if (! empty($datos['nuevaContrasenia'])) {
            if (empty($datos['contraseniaActual']) || ! Hash::check($datos['contraseniaActual'], $usuario->password)) {
                throw ValidationException::withMessages([
                    'contraseniaActual' => 'La contraseña actual ingresada no es correcta.',
                ]);
            }
            $usuario->password = $datos['nuevaContrasenia'];
        }

        $usuario->nombre = trim($datos['nombre']);
        $usuario->email = strtolower(trim($datos['email']));
        $usuario->save();

        return response()->json([
            'data' => new UsuarioResource($usuario),
        ]);
    }

    private function localDe(Request $request): Local
    {
        return $request->user()->local ?? abort(403, 'El usuario no tiene un local asignado.');
    }
}
