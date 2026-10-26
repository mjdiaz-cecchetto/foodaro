<?php

namespace App\Http\Controllers\Api\Root;

use App\Enums\RolUsuario;
use App\Http\Controllers\Controller;
use App\Http\Resources\UsuarioResource;
use App\Models\Local;
use App\Models\Pedido;
use App\Models\Plan;
use App\Models\Producto;
use App\Models\Usuario;
use App\Services\HorariosServicio;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

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

    /** GET /api/root/resumen — Métricas globales, locales, usuarios y planes. */
    public function resumen(Request $request): JsonResponse
    {
        $this->verificarSuperadmin($request);

        $locales = Local::query()
            ->with(['plan', 'usuarios'])
            ->withCount(['productos', 'categorias', 'usuarios', 'pedidos'])
            ->orderByDesc('id')
            ->get();

        $planes = Plan::query()
            ->withCount('locales')
            ->orderBy('orden')
            ->orderBy('id')
            ->get();

        $usuarios = Usuario::query()
            ->with('local:id,slug,nombre')
            ->orderByDesc('id')
            ->get();

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
                    'totalProductos' => Producto::query()->count(),
                    'totalPedidos' => Pedido::query()->count(),
                    'totalUsuarios' => $usuarios->count(),
                ],
                'locales' => $locales->map(fn (Local $l) => $this->formatearLocal($l))->values(),
                'planes' => $planes->map(fn (Plan $p) => $this->formatearPlan($p))->values(),
                'usuarios' => $usuarios->map(fn (Usuario $u) => $this->formatearUsuario($u))->values(),
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
                'vencimiento_suscripcion' => $datos['vencimientoSuscripcion'] ?? now()->addMonth()->toDateString(),
            ]);

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

    /** DELETE /api/root/planes/{plan} */
    public function eliminarPlan(Request $request, Plan $plan): JsonResponse
    {
        $this->verificarSuperadmin($request);
        $plan->delete();

        return response()->json(null, 204);
    }

    /* =========================================================================
     | FORMATEADORES JSON
     * ========================================================================= */

    private function formatearLocal(Local $l): array
    {
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
            'planId' => $l->plan_id,
            'planNombre' => $l->plan?->nombre ?? 'Sin plan',
            'planMensual' => (float) ($l->plan?->mensual ?? 0),
            'estadoSuscripcion' => $l->estado_suscripcion ?? 'al_dia',
            'vencimientoSuscripcion' => $l->vencimiento_suscripcion ? $l->vencimiento_suscripcion->format('Y-m-d') : null,
            'productosCount' => (int) ($l->productos_count ?? 0),
            'categoriasCount' => (int) ($l->categorias_count ?? 0),
            'usuariosCount' => (int) ($l->usuarios_count ?? 0),
            'pedidosCount' => (int) ($l->pedidos_count ?? 0),
            'creadoEn' => $l->created_at?->format('Y-m-d'),
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
}
