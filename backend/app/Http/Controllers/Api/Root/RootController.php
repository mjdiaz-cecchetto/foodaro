<?php

namespace App\Http\Controllers\Api\Root;

use App\Enums\RolUsuario;
use App\Http\Controllers\Controller;
use App\Http\Resources\UsuarioResource;
use App\Models\Local;
use App\Models\PagoSuscripcion;
use App\Models\Pedido;
use App\Models\Plan;
use App\Models\Producto;
use App\Models\SolicitudAlta;
use App\Models\Usuario;
use App\Services\HorariosServicio;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Controlador maestro del usuario Root (Superadmin) de Foodaro:
 * métricas globales, alta/gestión de locales y suscripciones, gestión de usuarios/contraseñas y planes.
 */
class RootController extends Controller
{
    private function verificarSuperadmin(Request $request): void
    {
        if (! $request->user() || ! $request->user()->esSuperadmin()) {
            abort(403, 'Acceso exclusivo para el administrador general (Root) de Foodaro.');
        }
    }

    /** Un administrador siempre pertenece a un local; un Root nunca pertenece a ninguno. */
    private function validarRolYLocal(array $datos): void
    {
        if ($datos['rol'] === RolUsuario::Administrador->value && empty($datos['localId'])) {
            abort(422, 'Un administrador de local debe estar asignado a un local.');
        }
    }

    /** GET /api/planes — Planes activos para la landing pública. */
    public function planesPublicos(): JsonResponse
    {
        $planes = Plan::query()
            ->where('activo', true)
            ->orderBy('orden')
            ->orderBy('id')
            ->get()
            ->map(fn (Plan $p) => $this->formatearPlan($p));

        return response()->json(['data' => $planes]);
    }

    /** POST /api/solicitudes — Registra una solicitud de prueba gratuita (30 días) desde la Landing. */
    public function crearSolicitudPublica(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'nombreComercio' => ['required', 'string', 'max:160'],
            'ciudad' => ['nullable', 'string', 'max:120'],
            'whatsapp' => ['required', 'string', 'max:60'],
            'plan' => ['nullable', 'string', 'max:120'],
        ]);

        $planTexto = ! empty($datos['plan']) ? trim($datos['plan']) : null;
        $planModel = $planTexto
            ? Plan::query()
                ->where('nombre', $planTexto)
                ->orWhere('codigo', Str::slug($planTexto))
                ->first()
            : null;

        $solicitud = SolicitudAlta::create([
            'nombre_comercio' => trim($datos['nombreComercio']),
            'ciudad' => ! empty($datos['ciudad']) ? trim($datos['ciudad']) : null,
            'whatsapp' => trim($datos['whatsapp']),
            'plan_nombre' => $planModel?->nombre ?? $planTexto ?? 'Control de Pedidos & Stock',
            'plan_id' => $planModel?->id,
            'estado' => 'nuevo',
        ]);

        return response()->json([
            'data' => $this->formatearSolicitud($solicitud->load(['plan:id,nombre', 'local:id,slug,nombre'])),
        ], 201);
    }

    /** GET /api/root/resumen — Métricas globales, locales, usuarios y planes. */
    public function resumen(Request $request): JsonResponse
    {
        $this->verificarSuperadmin($request);

        $locales = Local::query()
            ->with(['plan', 'usuarios'])
            ->withCount(['productos', 'categorias', 'usuarios', 'pedidos'])
            ->withMax('pedidos', 'created_at')
            ->withMax('productos', 'updated_at')
            ->withMax('usuarios', 'ultimo_acceso_en')
            ->orderByDesc('id')
            ->get();

        // Sincronizar automáticamente el estado de suscripción según fecha de vencimiento
        $locales->each(fn (Local $l) => $l->sincronizarEstadoSuscripcion());

        $planes = Plan::query()
            ->withCount('locales')
            ->orderBy('orden')
            ->orderBy('id')
            ->get();

        $usuarios = Usuario::query()
            ->with('local:id,slug,nombre')
            ->orderByDesc('id')
            ->get();

        $pagos = PagoSuscripcion::query()
            ->with(['local:id,slug,nombre', 'plan:id,nombre'])
            ->orderByDesc('fecha_pago')
            ->orderByDesc('id')
            ->limit(100)
            ->get();

        $solicitudes = SolicitudAlta::query()
            ->with(['plan:id,nombre', 'local:id,slug,nombre'])
            ->orderByRaw("CASE WHEN estado = 'nuevo' THEN 0 WHEN estado = 'contactado' THEN 1 WHEN estado = 'alta' THEN 2 ELSE 3 END")
            ->orderByDesc('id')
            ->limit(200)
            ->get();

        $inicioMes = Carbon::now()->startOfMonth()->toDateString();
        $ingresosCobradosMes = (float) PagoSuscripcion::query()->where('fecha_pago', '>=', $inicioMes)->sum('monto');
        $ingresosCobradosTotal = (float) PagoSuscripcion::query()->sum('monto');
        $cantidadPagosMes = (int) PagoSuscripcion::query()->where('fecha_pago', '>=', $inicioMes)->count();

        $localesActivos = $locales->where('activo', true);
        $mrr = $localesActivos->sum(fn (Local $l) => (float) ($l->plan?->mensual ?? 0));

        return response()->json([
            'data' => [
                'metricas' => [
                    'totalLocales' => $locales->count(),
                    'localesActivos' => $localesActivos->count(),
                    'localesPausados' => $locales->where('activo', false)->count(),
                    'suscripcionesAlDia' => $locales->where('estado_suscripcion', 'al_dia')->count(),
                    'suscripcionesPorVencer' => $locales->whereIn('estado_suscripcion', ['por_vencer', 'prueba'])->count(),
                    'suscripcionesVencidas' => $locales->where('estado_suscripcion', 'vencido')->count(),
                    'ingresosMensualesEstimados' => round($mrr, 2),
                    'ingresosCobradosMes' => round($ingresosCobradosMes, 2),
                    'ingresosCobradosTotal' => round($ingresosCobradosTotal, 2),
                    'cantidadPagosMes' => $cantidadPagosMes,
                    'totalProductos' => Producto::query()->count(),
                    'totalPedidos' => Pedido::query()->count(),
                    'totalUsuarios' => $usuarios->count(),
                    'solicitudesNuevas' => $solicitudes->where('estado', 'nuevo')->count(),
                    'totalSolicitudes' => $solicitudes->count(),
                ],
                'locales' => $locales->map(fn (Local $l) => $this->formatearLocal($l))->values(),
                'planes' => $planes->map(fn (Plan $p) => $this->formatearPlan($p))->values(),
                'usuarios' => $usuarios->map(fn (Usuario $u) => $this->formatearUsuario($u))->values(),
                'pagos' => $pagos->map(fn (PagoSuscripcion $pg) => $this->formatearPago($pg))->values(),
                'solicitudes' => $solicitudes->map(fn (SolicitudAlta $s) => $this->formatearSolicitud($s))->values(),
            ],
        ]);
    }

    /* =========================================================================
     | 1. GESTIÓN DE LOCALES Y SUSCRIPCIONES
     * ========================================================================= */

    /** POST /api/root/locales — Crea un local nuevo + su usuario administrador opcional. */
    public function crearLocal(Request $request, HorariosServicio $horarios): JsonResponse
    {
        $this->verificarSuperadmin($request);

        $datos = $request->validate([
            'nombre' => ['required', 'string', 'max:120'],
            'slug' => ['required', 'string', 'max:60', 'regex:/^[a-z0-9-]+$/', 'unique:locales,slug'],
            'rubro' => ['nullable', 'string', 'max:120'],
            'eslogan' => ['nullable', 'string', 'max:255'],
            'whatsapp' => ['required', 'string', 'max:40'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'planId' => ['nullable', 'integer', 'exists:planes,id'],
            'estadoSuscripcion' => ['required', 'string', Rule::in(['al_dia', 'prueba', 'por_vencer', 'vencido'])],
            'vencimientoSuscripcion' => ['nullable', 'date'],
            'activo' => ['boolean'],
            // Usuario admin inicial (opcional pero recomendado al dar de alta)
            'adminNombre' => ['nullable', 'string', 'max:120'],
            'adminEmail' => ['nullable', 'email', 'max:190', 'unique:usuarios,email'],
            'adminContrasenia' => ['nullable', 'string', 'min:4', 'max:100'],
            'solicitudId' => ['nullable', 'integer', 'exists:solicitudes_alta,id'],
        ]);

        $local = DB::transaction(function () use ($datos, $horarios) {
            $local = Local::create([
                'slug' => strtolower(trim($datos['slug'])),
                'nombre' => trim($datos['nombre']),
                'rubro' => $datos['rubro'] ?? 'Gastronomía & Comercio',
                'eslogan' => $datos['eslogan'] ?? 'Catálogo digital y pedidos por WhatsApp.',
                'logo_url' => 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=240&q=80',
                'portada_url' => 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80',
                'direccion' => $datos['direccion'] ?? null,
                'whatsapp' => trim($datos['whatsapp']),
                'whatsapp_pedidos' => trim($datos['whatsapp']),
                'moneda' => 'ARS',
                'activo' => $datos['activo'] ?? true,
                'plan_id' => $datos['planId'] ?? null,
                'estado_suscripcion' => $datos['estadoSuscripcion'],
                'vencimiento_suscripcion' => $datos['vencimientoSuscripcion'] ?? now()->addDays(30)->toDateString(),
            ]);

            if (! empty($datos['solicitudId'])) {
                SolicitudAlta::query()->where('id', $datos['solicitudId'])->update([
                    'estado' => 'alta',
                    'local_id' => $local->id,
                ]);
            }

            $semanaBase = collect(['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'])->map(fn (string $dia) => [
                'dia' => $dia,
                'abierto' => true,
                'franjas' => [
                    ['desde' => '11:00', 'hasta' => '15:30'],
                    ['desde' => '19:30', 'hasta' => '23:59'],
                ],
            ])->all();

            $horarios->guardar($local, $semanaBase, []);

            if (! empty($datos['adminEmail']) && ! empty($datos['adminContrasenia'])) {
                Usuario::create([
                    'local_id' => $local->id,
                    'nombre' => ! empty($datos['adminNombre']) ? trim($datos['adminNombre']) : 'Admin ' . $local->nombre,
                    'email' => strtolower(trim($datos['adminEmail'])),
                    'password' => $datos['adminContrasenia'],
                    'rol' => RolUsuario::Administrador,
                    'activo' => true,
                ]);
            }

            return $local->load(['plan', 'usuarios'])->loadCount(['productos', 'categorias', 'usuarios', 'pedidos']);
        });

        return response()->json(['data' => $this->formatearLocal($local)], 201);
    }

    /** PUT /api/root/locales/{local} — Actualiza datos comerciales y suscripción de un local. */
    public function actualizarLocal(Request $request, Local $local): JsonResponse
    {
        $this->verificarSuperadmin($request);

        $datos = $request->validate([
            'nombre' => ['required', 'string', 'max:120'],
            'slug' => ['required', 'string', 'max:60', 'regex:/^[a-z0-9-]+$/', Rule::unique('locales', 'slug')->ignore($local->id)],
            'rubro' => ['nullable', 'string', 'max:120'],
            'whatsapp' => ['required', 'string', 'max:40'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'planId' => ['nullable', 'integer', 'exists:planes,id'],
            'estadoSuscripcion' => ['required', 'string', Rule::in(['al_dia', 'prueba', 'por_vencer', 'vencido'])],
            'vencimientoSuscripcion' => ['nullable', 'date'],
            'activo' => ['boolean'],
        ]);

        $local->update([
            'nombre' => trim($datos['nombre']),
            'slug' => strtolower(trim($datos['slug'])),
            'rubro' => $datos['rubro'] ?? null,
            'whatsapp' => trim($datos['whatsapp']),
            'direccion' => $datos['direccion'] ?? null,
            'plan_id' => $datos['planId'] ?? null,
            'estado_suscripcion' => $datos['estadoSuscripcion'],
            'vencimiento_suscripcion' => $datos['vencimientoSuscripcion'] ?? null,
            'activo' => $datos['activo'] ?? $local->activo,
        ]);

        $local->load(['plan', 'usuarios'])->loadCount(['productos', 'categorias', 'usuarios', 'pedidos']);

        return response()->json(['data' => $this->formatearLocal($local)]);
    }

    /** PATCH /api/root/locales/{local}/estado — Activa o pausa un local en 1 clic. */
    public function alternarEstadoLocal(Request $request, Local $local): JsonResponse
    {
        $this->verificarSuperadmin($request);
        $local->update(['activo' => ! $local->activo]);
        $local->load(['plan', 'usuarios'])->loadCount(['productos', 'categorias', 'usuarios', 'pedidos']);

        return response()->json(['data' => $this->formatearLocal($local)]);
    }

    /** DELETE /api/root/locales/{local} */
    public function eliminarLocal(Request $request, Local $local): JsonResponse
    {
        $this->verificarSuperadmin($request);
        $local->delete();

        return response()->json(null, 204);
    }

    /* =========================================================================
     | 2. GESTIÓN DE USUARIOS Y BLANQUEO DE CONTRASEÑAS
     * ========================================================================= */

    /** POST /api/root/usuarios */
    public function crearUsuario(Request $request): JsonResponse
    {
        $this->verificarSuperadmin($request);

        $datos = $request->validate([
            'nombre' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190', 'unique:usuarios,email'],
            'contrasenia' => ['required', 'string', 'min:4', 'max:100'],
            'rol' => ['required', Rule::enum(RolUsuario::class)],
            'localId' => ['nullable', 'integer', 'exists:locales,id'],
            'activo' => ['boolean'],
        ]);

        $this->validarRolYLocal($datos);

        $usuario = Usuario::create([
            'nombre' => trim($datos['nombre']),
            'email' => strtolower(trim($datos['email'])),
            'password' => $datos['contrasenia'],
            'rol' => $datos['rol'],
            'local_id' => $datos['rol'] === RolUsuario::Superadmin->value ? null : $datos['localId'],
            'activo' => $datos['activo'] ?? true,
        ]);

        return response()->json(['data' => $this->formatearUsuario($usuario->load('local:id,slug,nombre'))], 201);
    }

    /** PUT /api/root/usuarios/{usuario} */
    public function actualizarUsuario(Request $request, Usuario $usuario): JsonResponse
    {
        $this->verificarSuperadmin($request);

        $datos = $request->validate([
            'nombre' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190', Rule::unique('usuarios', 'email')->ignore($usuario->id)],
            'rol' => ['required', Rule::enum(RolUsuario::class)],
            'localId' => ['nullable', 'integer', 'exists:locales,id'],
            'activo' => ['boolean'],
            'contrasenia' => ['nullable', 'string', 'min:4', 'max:100'],
        ]);

        $this->validarRolYLocal($datos);

        $campos = [
            'nombre' => trim($datos['nombre']),
            'email' => strtolower(trim($datos['email'])),
            'rol' => $datos['rol'],
            'local_id' => $datos['rol'] === RolUsuario::Superadmin->value ? null : $datos['localId'],
            'activo' => $datos['activo'] ?? $usuario->activo,
        ];

        if (! empty($datos['contrasenia'])) {
            $campos['password'] = $datos['contrasenia'];
        }

        $usuario->update($campos);

        return response()->json(['data' => $this->formatearUsuario($usuario->load('local:id,slug,nombre'))]);
    }

    /** PATCH /api/root/usuarios/{usuario}/contrasenia — Blanqueo rápido de contraseña. */
    public function cambiarContraseniaUsuario(Request $request, Usuario $usuario): JsonResponse
    {
        $this->verificarSuperadmin($request);

        $datos = $request->validate([
            'contrasenia' => ['required', 'string', 'min:4', 'max:100'],
        ]);

        $usuario->update(['password' => $datos['contrasenia']]);

        return response()->json(['data' => $this->formatearUsuario($usuario->load('local:id,slug,nombre'))]);
    }

    /** PATCH /api/root/usuarios/{usuario}/estado */
    public function alternarEstadoUsuario(Request $request, Usuario $usuario): JsonResponse
    {
        $this->verificarSuperadmin($request);

        if ($usuario->id === $request->user()->id) {
            abort(422, 'No podés desactivar tu propio usuario Root.');
        }

        $usuario->update(['activo' => ! $usuario->activo]);

        return response()->json(['data' => $this->formatearUsuario($usuario->load('local:id,slug,nombre'))]);
    }

    /** DELETE /api/root/usuarios/{usuario} */
    public function eliminarUsuario(Request $request, Usuario $usuario): JsonResponse
    {
        $this->verificarSuperadmin($request);

        if ($usuario->id === $request->user()->id) {
            abort(422, 'No podés eliminar tu propio usuario Root.');
        }

        $usuario->delete();

        return response()->json(null, 204);
    }

    /* =========================================================================
     | 3. GESTIÓN DE PLANES COMERCIALES
     * ========================================================================= */

    /** POST /api/root/planes */
    public function crearPlan(Request $request): JsonResponse
    {
        $this->verificarSuperadmin($request);

        $datos = $request->validate([
            'nivel' => ['required', 'string', 'max:80'],
            'nombre' => ['required', 'string', 'max:120'],
            'mensual' => ['required', 'numeric', 'min:0'],
            'anual' => ['required', 'numeric', 'min:0'],
            'descripcion' => ['nullable', 'string', 'max:500'],
            'caracteristicas' => ['required', 'array', 'min:1'],
            'caracteristicas.*' => ['required', 'string', 'max:200'],
            'cta' => ['required', 'string', 'max:120'],
            'destacado' => ['boolean'],
            'activo' => ['boolean'],
        ]);

        if (! empty($datos['destacado'])) {
            Plan::query()->update(['destacado' => false]);
        }

        $codigoBase = Str::slug($datos['nombre']) ?: 'plan';
        $codigo = $codigoBase;
        $i = 2;
        while (Plan::query()->where('codigo', $codigo)->exists()) {
            $codigo = $codigoBase . '-' . $i++;
        }

        $plan = Plan::create([
            'codigo' => $codigo,
            'nivel' => trim($datos['nivel']),
            'nombre' => trim($datos['nombre']),
            'mensual' => (float) $datos['mensual'],
            'anual' => (float) $datos['anual'],
            'descripcion' => $datos['descripcion'] ?? null,
            'caracteristicas' => array_values($datos['caracteristicas']),
            'cta' => trim($datos['cta']),
            'destacado' => (bool) ($datos['destacado'] ?? false),
            'activo' => (bool) ($datos['activo'] ?? true),
            'orden' => (int) Plan::query()->max('orden') + 1,
        ]);

        $plan->loadCount('locales');

        return response()->json(['data' => $this->formatearPlan($plan)], 201);
    }

    /** PUT /api/root/planes/{plan} */
    public function actualizarPlan(Request $request, Plan $plan): JsonResponse
    {
        $this->verificarSuperadmin($request);

        $datos = $request->validate([
            'nivel' => ['required', 'string', 'max:80'],
            'nombre' => ['required', 'string', 'max:120'],
            'mensual' => ['required', 'numeric', 'min:0'],
            'anual' => ['required', 'numeric', 'min:0'],
            'descripcion' => ['nullable', 'string', 'max:500'],
            'caracteristicas' => ['required', 'array', 'min:1'],
            'caracteristicas.*' => ['required', 'string', 'max:200'],
            'cta' => ['required', 'string', 'max:120'],
            'destacado' => ['boolean'],
            'activo' => ['boolean'],
        ]);

        if (! empty($datos['destacado'])) {
            Plan::query()->where('id', '!=', $plan->id)->update(['destacado' => false]);
        }

        $plan->update([
            'nivel' => trim($datos['nivel']),
            'nombre' => trim($datos['nombre']),
            'mensual' => (float) $datos['mensual'],
            'anual' => (float) $datos['anual'],
            'descripcion' => $datos['descripcion'] ?? null,
            'caracteristicas' => array_values($datos['caracteristicas']),
            'cta' => trim($datos['cta']),
            'destacado' => (bool) ($datos['destacado'] ?? false),
            'activo' => (bool) ($datos['activo'] ?? $plan->activo),
        ]);

        $plan->loadCount('locales');

        return response()->json(['data' => $this->formatearPlan($plan)]);
    }

    /** PATCH /api/root/planes/{plan}/estado — Pausa o reactiva un plan comercial (lo oculta/muestra en la landing). */
    public function alternarEstadoPlan(Request $request, Plan $plan): JsonResponse
    {
        $this->verificarSuperadmin($request);

        $plan->update(['activo' => ! $plan->activo]);
        $plan->loadCount('locales');

        return response()->json(['data' => $this->formatearPlan($plan)]);
    }

    /** DELETE /api/root/planes/{plan} */
    public function eliminarPlan(Request $request, Plan $plan): JsonResponse
    {
        $this->verificarSuperadmin($request);
        $plan->delete();

        return response()->json(null, 204);
    }

    /* =========================================================================
     | 4. REGISTRO DE COBROS DE SUSCRIPCIONES
     * ========================================================================= */

    /** POST /api/root/pagos — Registra un cobro y extiende automáticamente la suscripción del local. */
    public function registrarPago(Request $request): JsonResponse
    {
        $this->verificarSuperadmin($request);

        $datos = $request->validate([
            'localId' => ['required', 'integer', 'exists:locales,id'],
            'planId' => ['nullable', 'integer', 'exists:planes,id'],
            'monto' => ['required', 'numeric', 'min:0'],
            'periodoMeses' => ['required', 'integer', 'min:1', 'max:24'],
            'medioPago' => ['required', 'string', Rule::in(['transferencia', 'efectivo', 'tarjeta', 'otro'])],
            'fechaPago' => ['required', 'date'],
            'referencia' => ['nullable', 'string', 'max:255'],
        ]);

        $pago = DB::transaction(function () use ($datos) {
            /** @var Local $local */
            $local = Local::query()->findOrFail($datos['localId']);

            $planId = $datos['planId'] ?? $local->plan_id;
            $meses = (int) $datos['periodoMeses'];
            $fechaPago = Carbon::parse($datos['fechaPago'])->startOfDay();
            $vencimientoAnterior = $local->vencimiento_suscripcion
                ? Carbon::parse($local->vencimiento_suscripcion)->startOfDay()
                : null;

            // Si el local todavía tenía días vigentes a favor, sumamos desde su vencimiento; si ya había vencido, desde la fecha de pago.
            $baseCalculo = ($vencimientoAnterior && $vencimientoAnterior->greaterThan($fechaPago))
                ? $vencimientoAnterior->copy()
                : $fechaPago->copy();

            $vencimientoNuevo = $baseCalculo->addMonths($meses);

            $local->update([
                'plan_id' => $planId,
                'vencimiento_suscripcion' => $vencimientoNuevo->toDateString(),
                'estado_suscripcion' => 'al_dia',
                'activo' => true,
            ]);

            $pago = PagoSuscripcion::create([
                'local_id' => $local->id,
                'plan_id' => $planId,
                'monto' => (float) $datos['monto'],
                'periodo_meses' => $meses,
                'medio_pago' => $datos['medioPago'],
                'fecha_pago' => $fechaPago->toDateString(),
                'vencimiento_anterior' => $vencimientoAnterior?->toDateString(),
                'vencimiento_nuevo' => $vencimientoNuevo->toDateString(),
                'referencia' => ! empty($datos['referencia']) ? trim($datos['referencia']) : null,
            ]);

            return $pago->load(['local:id,slug,nombre', 'plan:id,nombre']);
        });

        return response()->json(['data' => $this->formatearPago($pago)], 201);
    }

    /** DELETE /api/root/pagos/{pago} — Elimina un registro de cobro cargado por error. */
    public function eliminarPago(Request $request, PagoSuscripcion $pago): JsonResponse
    {
        $this->verificarSuperadmin($request);
        $pago->delete();

        return response()->json(null, 204);
    }

    /* =========================================================================
     | 4B. BANDEJA DE SOLICITUDES DESDE LA LANDING ("LEADS")
     * ========================================================================= */

    /** PATCH /api/root/solicitudes/{solicitud} — Cambia el estado (nuevo, contactado, alta, descartado) o notas. */
    public function actualizarSolicitud(Request $request, SolicitudAlta $solicitud): JsonResponse
    {
        $this->verificarSuperadmin($request);

        $datos = $request->validate([
            'estado' => ['sometimes', 'required', 'string', Rule::in(['nuevo', 'contactado', 'alta', 'descartado'])],
            'notas' => ['nullable', 'string', 'max:500'],
            'localId' => ['nullable', 'integer', 'exists:locales,id'],
        ]);

        if (array_key_exists('estado', $datos)) {
            $solicitud->estado = $datos['estado'];
        }
        if (array_key_exists('notas', $datos)) {
            $solicitud->notas = $datos['notas'] !== null ? trim($datos['notas']) : null;
        }
        if (array_key_exists('localId', $datos)) {
            $solicitud->local_id = $datos['localId'];
        }
        $solicitud->save();

        $solicitud->load(['plan:id,nombre', 'local:id,slug,nombre']);

        return response()->json(['data' => $this->formatearSolicitud($solicitud)]);
    }

    /** DELETE /api/root/solicitudes/{solicitud} — Elimina una solicitud de la bandeja. */
    public function eliminarSolicitud(Request $request, SolicitudAlta $solicitud): JsonResponse
    {
        $this->verificarSuperadmin($request);
        $solicitud->delete();

        return response()->json(null, 204);
    }

    /* =========================================================================
     | 5. MI CUENTA ROOT (PERFIL Y CAMBIO DE CONTRASEÑA PROPIA)
     * ========================================================================= */

    /** PUT /api/root/mi-cuenta — Actualiza nombre, email y/o contraseña del propio usuario Root. */
    public function actualizarMiCuenta(Request $request): JsonResponse
    {
        $this->verificarSuperadmin($request);

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

    /* =========================================================================
     | FORMATEADORES JSON
     * ========================================================================= */

    private function formatearLocal(Local $l): array
    {
        $resumen = $l->resumenSuscripcion();

        $fechasActividad = array_filter([
            $l->usuarios_max_ultimo_acceso_en ? Carbon::parse($l->usuarios_max_ultimo_acceso_en) : null,
            $l->pedidos_max_created_at ? Carbon::parse($l->pedidos_max_created_at) : null,
            $l->productos_max_updated_at ? Carbon::parse($l->productos_max_updated_at) : null,
            $l->updated_at,
        ]);

        $ultimaActividad = ! empty($fechasActividad) ? max($fechasActividad) : null;
        $diasSinActividad = $ultimaActividad
            ? (int) max(0, Carbon::now()->startOfDay()->diffInDays($ultimaActividad->copy()->startOfDay(), false) * -1)
            : 0;

        return [
            'id' => $l->id,
            'slug' => $l->slug,
            'nombre' => $l->nombre,
            'rubro' => $l->rubro ?? '',
            'eslogan' => $l->eslogan ?? '',
            'logoUrl' => $l->logo_url ?? '',
            'whatsapp' => $l->whatsapp ?? '',
            'direccion' => $l->direccion ?? '',
            'activo' => (bool) $l->activo,
            'cerradoTemporalmente' => (bool) ($l->cerrado_temporalmente ?? false),
            'enviosPausados' => (bool) ($l->envios_pausados ?? false),
            'planId' => $l->plan_id,
            'planNombre' => $l->plan?->nombre ?? 'Sin plan',
            'planMensual' => (float) ($l->plan?->mensual ?? 0),
            'estadoSuscripcion' => $resumen['estado'],
            'vencimientoSuscripcion' => $resumen['vencimiento'],
            'diasRestantes' => $resumen['diasRestantes'],
            'enPeriodoGracia' => $resumen['enPeriodoGracia'],
            'cartaSuspendida' => $resumen['cartaSuspendida'],
            'productosCount' => (int) ($l->productos_count ?? 0),
            'categoriasCount' => (int) ($l->categorias_count ?? 0),
            'usuariosCount' => (int) ($l->usuarios_count ?? 0),
            'pedidosCount' => (int) ($l->pedidos_count ?? 0),
            'creadoEn' => $l->created_at?->format('Y-m-d'),
            'ultimoAccesoEn' => $l->usuarios_max_ultimo_acceso_en ? Carbon::parse($l->usuarios_max_ultimo_acceso_en)->format('Y-m-d H:i') : null,
            'ultimoPedidoEn' => $l->pedidos_max_created_at ? Carbon::parse($l->pedidos_max_created_at)->format('Y-m-d H:i') : null,
            'ultimaActividadEn' => $ultimaActividad?->format('Y-m-d H:i'),
            'diasSinActividad' => $diasSinActividad,
        ];
    }

    private function formatearPago(PagoSuscripcion $pg): array
    {
        return [
            'id' => $pg->id,
            'localId' => $pg->local_id,
            'localNombre' => $pg->local?->nombre ?? 'Local eliminado',
            'localSlug' => $pg->local?->slug ?? '',
            'planId' => $pg->plan_id,
            'planNombre' => $pg->plan?->nombre ?? 'Sin plan',
            'monto' => (float) $pg->monto,
            'periodoMeses' => (int) $pg->periodo_meses,
            'medioPago' => $pg->medio_pago,
            'fechaPago' => $pg->fecha_pago?->format('Y-m-d'),
            'vencimientoAnterior' => $pg->vencimiento_anterior?->format('Y-m-d'),
            'vencimientoNuevo' => $pg->vencimiento_nuevo?->format('Y-m-d'),
            'referencia' => $pg->referencia ?? '',
        ];
    }

    private function formatearUsuario(Usuario $u): array
    {
        return [
            'id' => $u->id,
            'nombre' => $u->nombre,
            'email' => $u->email,
            'rol' => $u->rol->value,
            'activo' => (bool) $u->activo,
            'localId' => $u->local_id,
            'localNombre' => $u->local?->nombre ?? null,
            'localSlug' => $u->local?->slug ?? null,
            'ultimoAccesoEn' => $u->ultimo_acceso_en?->format('Y-m-d H:i'),
        ];
    }

    private function formatearPlan(Plan $p): array
    {
        return [
            'id' => $p->id,
            'codigo' => $p->codigo,
            'nivel' => $p->nivel,
            'nombre' => $p->nombre,
            'mensual' => (float) $p->mensual,
            'anual' => (float) $p->anual,
            'descripcion' => $p->descripcion ?? '',
            'caracteristicas' => $p->caracteristicas ?? [],
            'cta' => $p->cta,
            'destacado' => (bool) $p->destacado,
            'activo' => (bool) $p->activo,
            'orden' => (int) $p->orden,
            'localesCount' => (int) ($p->locales_count ?? 0),
        ];
    }

    private function formatearSolicitud(SolicitudAlta $s): array
    {
        return [
            'id' => $s->id,
            'nombreComercio' => $s->nombre_comercio,
            'ciudad' => $s->ciudad ?? '',
            'whatsapp' => $s->whatsapp,
            'planNombre' => $s->plan?->nombre ?? $s->plan_nombre ?? 'Control de Pedidos & Stock',
            'planId' => $s->plan_id,
            'estado' => $s->estado,
            'localId' => $s->local_id,
            'localNombre' => $s->local?->nombre ?? null,
            'localSlug' => $s->local?->slug ?? null,
            'notas' => $s->notas ?? '',
            'creadoEn' => $s->created_at?->format('Y-m-d H:i'),
        ];
    }
}
