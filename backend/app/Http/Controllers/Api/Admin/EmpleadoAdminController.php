<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AsistenciaEmpleado;
use App\Models\Empleado;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Gestión de empleados del local, control de horarios (entrada/salida) y liquidación proporcional por hora. */
class EmpleadoAdminController extends Controller
{
    /** GET /api/admin/empleados?periodo=hoy&desde=...&hasta=...&empleadoId=... */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'periodo' => ['nullable', 'string', Rule::in(['hoy', 'ayer', 'semana', 'mes', 'personalizado', 'todos'])],
            'desde' => ['nullable', 'date'],
            'hasta' => ['nullable', 'date'],
            'empleadoId' => ['nullable', 'integer'],
        ]);

        $local = $request->user()->local;
        $empleados = $local->empleados()->orderByDesc('activo')->orderBy('nombre')->get();

        $queryAsistencias = AsistenciaEmpleado::query()
            ->where('local_id', $local->id)
            ->with('empleado');

        $periodo = $request->input('periodo', 'hoy');
        $ahora = Carbon::now();

        match ($periodo) {
            'hoy' => $queryAsistencias->whereDate('fecha', $ahora->toDateString()),
            'ayer' => $queryAsistencias->whereDate('fecha', $ahora->copy()->subDay()->toDateString()),
            'semana' => $queryAsistencias->where('fecha', '>=', $ahora->copy()->startOfWeek(Carbon::MONDAY)->toDateString()),
            'mes' => $queryAsistencias->where('fecha', '>=', $ahora->copy()->startOfMonth()->toDateString()),
            'personalizado' => $queryAsistencias
                ->when($request->filled('desde'), fn ($q) => $q->where('fecha', '>=', $request->input('desde')))
                ->when($request->filled('hasta'), fn ($q) => $q->where('fecha', '<=', $request->input('hasta'))),
            default => null,
        };

        if ($request->filled('empleadoId')) {
            $queryAsistencias->where('empleado_id', (int) $request->input('empleadoId'));
        }

        $asistencias = $queryAsistencias
            ->orderByDesc('fecha')
            ->orderByDesc('id')
            ->limit(250)
            ->get();

        $totalHoras = (float) $asistencias->sum('horas_trabajadas');
        $totalPaga = (float) $asistencias->sum('total_paga');
        $totalPagado = (float) $asistencias->where('pagado', true)->sum('total_paga');
        $totalPendiente = (float) $asistencias->where('pagado', false)->sum('total_paga');
        $turnosActivos = $asistencias->filter(fn (AsistenciaEmpleado $a) => empty($a->hora_salida))->count();

        return response()->json([
            'data' => [
                'empleados' => $empleados->map(fn (Empleado $e) => $this->formatearEmpleado($e)),
                'asistencias' => $asistencias->map(fn (AsistenciaEmpleado $a) => $this->formatearAsistencia($a)),
                'resumen' => [
                    'totalHoras' => round($totalHoras, 2),
                    'totalPaga' => round($totalPaga, 2),
                    'totalPagado' => round($totalPagado, 2),
                    'totalPendiente' => round($totalPendiente, 2),
                    'turnosActivos' => $turnosActivos,
                ],
            ],
        ]);
    }

    /** POST /api/admin/empleados */
    public function storeEmpleado(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'nombre' => ['required', 'string', 'max:120'],
            'rol' => ['required', 'string', 'max:80'],
            'telefono' => ['nullable', 'string', 'max:40'],
            'dni' => ['nullable', 'string', 'max:30'],
            'sueldoHora' => ['required', 'numeric', 'min:0'],
            'activo' => ['sometimes', 'boolean'],
        ]);

        $local = $request->user()->local;

        $empleado = Empleado::create([
            'local_id' => $local->id,
            'nombre' => trim($datos['nombre']),
            'rol' => trim($datos['rol']),
            'telefono' => $datos['telefono'] ?? null,
            'dni' => $datos['dni'] ?? null,
            'sueldo_hora' => (float) $datos['sueldoHora'],
            'activo' => $datos['activo'] ?? true,
        ]);

        return response()->json([
            'data' => $this->formatearEmpleado($empleado),
        ], 201);
    }

    /** PUT /api/admin/empleados/{empleado} */
    public function updateEmpleado(Request $request, Empleado $empleado): JsonResponse
    {
        abort_if($empleado->local_id !== $request->user()->local_id, 403);

        $datos = $request->validate([
            'nombre' => ['required', 'string', 'max:120'],
            'rol' => ['required', 'string', 'max:80'],
            'telefono' => ['nullable', 'string', 'max:40'],
            'dni' => ['nullable', 'string', 'max:30'],
            'sueldoHora' => ['required', 'numeric', 'min:0'],
            'activo' => ['sometimes', 'boolean'],
        ]);

        $empleado->update([
            'nombre' => trim($datos['nombre']),
            'rol' => trim($datos['rol']),
            'telefono' => $datos['telefono'] ?? null,
            'dni' => $datos['dni'] ?? null,
            'sueldo_hora' => (float) $datos['sueldoHora'],
            'activo' => $datos['activo'] ?? $empleado->activo,
        ]);

        return response()->json([
            'data' => $this->formatearEmpleado($empleado),
        ]);
    }

    /** DELETE /api/admin/empleados/{empleado} */
    public function destroyEmpleado(Request $request, Empleado $empleado): JsonResponse
    {
        abort_if($empleado->local_id !== $request->user()->local_id, 403);
        $empleado->delete();

        return response()->json(['message' => 'Empleado eliminado']);
    }

    /** POST /api/admin/asistencias — Registra entrada (y opcionalmente salida) de un empleado. */
    public function registrarAsistencia(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'empleadoId' => ['required', 'integer'],
            'fecha' => ['nullable', 'date'],
            'horaEntrada' => ['nullable', 'string', 'regex:/^\d{2}:\d{2}$/'],
            'horaSalida' => ['nullable', 'string', 'regex:/^\d{2}:\d{2}$/'],
            'valorHora' => ['nullable', 'numeric', 'min:0'],
            'pagado' => ['sometimes', 'boolean'],
            'notas' => ['nullable', 'string', 'max:255'],
        ]);

        $local = $request->user()->local;
        $empleado = Empleado::where('local_id', $local->id)->findOrFail($datos['empleadoId']);

        $fecha = $datos['fecha'] ?? Carbon::now()->toDateString();
        $horaEntrada = $datos['horaEntrada'] ?? Carbon::now()->format('H:i');
        $horaSalida = ! empty($datos['horaSalida']) ? $datos['horaSalida'] : null;
        $valorHora = isset($datos['valorHora']) ? (float) $datos['valorHora'] : (float) $empleado->sueldo_hora;

        $horas = AsistenciaEmpleado::calcularHoras($horaEntrada, $horaSalida);
        $totalPaga = round($horas * $valorHora, 2);

        $asistencia = AsistenciaEmpleado::create([
            'local_id' => $local->id,
            'empleado_id' => $empleado->id,
            'fecha' => $fecha,
            'hora_entrada' => $horaEntrada,
            'hora_salida' => $horaSalida,
            'horas_trabajadas' => $horas,
            'valor_hora' => $valorHora,
            'total_paga' => $totalPaga,
            'pagado' => (bool) ($datos['pagado'] ?? false),
            'notas' => $datos['notas'] ?? null,
        ]);

        $asistencia->load('empleado');

        return response()->json([
            'data' => $this->formatearAsistencia($asistencia),
        ], 201);
    }

    /** PUT /api/admin/asistencias/{asistencia} — Registra salida o edita horario y recalcula paga proporcional. */
    public function actualizarAsistencia(Request $request, AsistenciaEmpleado $asistencia): JsonResponse
    {
        abort_if($asistencia->local_id !== $request->user()->local_id, 403);

        $datos = $request->validate([
            'fecha' => ['sometimes', 'date'],
            'horaEntrada' => ['sometimes', 'string', 'regex:/^\d{2}:\d{2}$/'],
            'horaSalida' => ['nullable', 'string', 'regex:/^\d{2}:\d{2}$/'],
            'marcarSalidaAhora' => ['sometimes', 'boolean'],
            'valorHora' => ['sometimes', 'numeric', 'min:0'],
            'pagado' => ['sometimes', 'boolean'],
            'notas' => ['nullable', 'string', 'max:255'],
        ]);

        $horaEntrada = $datos['horaEntrada'] ?? $asistencia->hora_entrada;
        $horaSalida = array_key_exists('horaSalida', $datos)
            ? ($datos['horaSalida'] ?: null)
            : $asistencia->hora_salida;

        if (! empty($datos['marcarSalidaAhora'])) {
            $horaSalida = Carbon::now()->format('H:i');
        }

        $valorHora = isset($datos['valorHora']) ? (float) $datos['valorHora'] : (float) $asistencia->valor_hora;
        $horas = AsistenciaEmpleado::calcularHoras($horaEntrada, $horaSalida);
        $totalPaga = round($horas * $valorHora, 2);

        $asistencia->update([
            'fecha' => $datos['fecha'] ?? $asistencia->fecha->format('Y-m-d'),
            'hora_entrada' => $horaEntrada,
            'hora_salida' => $horaSalida,
            'horas_trabajadas' => $horas,
            'valor_hora' => $valorHora,
            'total_paga' => $totalPaga,
            'pagado' => isset($datos['pagado']) ? (bool) $datos['pagado'] : $asistencia->pagado,
            'notas' => array_key_exists('notas', $datos) ? $datos['notas'] : $asistencia->notas,
        ]);

        $asistencia->load('empleado');

        return response()->json([
            'data' => $this->formatearAsistencia($asistencia),
        ]);
    }

    /** PATCH /api/admin/asistencias/{asistencia}/pago */
    public function alternarPagoAsistencia(Request $request, AsistenciaEmpleado $asistencia): JsonResponse
    {
        abort_if($asistencia->local_id !== $request->user()->local_id, 403);

        $asistencia->update([
            'pagado' => ! $asistencia->pagado,
        ]);

        $asistencia->load('empleado');

        return response()->json([
            'data' => $this->formatearAsistencia($asistencia),
        ]);
    }

    /** DELETE /api/admin/asistencias/{asistencia} */
    public function eliminarAsistencia(Request $request, AsistenciaEmpleado $asistencia): JsonResponse
    {
        abort_if($asistencia->local_id !== $request->user()->local_id, 403);
        $asistencia->delete();

        return response()->json(['message' => 'Registro de horario eliminado']);
    }

    private function formatearEmpleado(Empleado $e): array
    {
        return [
            'id' => $e->id,
            'nombre' => $e->nombre,
            'rol' => $e->rol,
            'telefono' => $e->telefono ?? '',
            'dni' => $e->dni ?? '',
            'sueldoHora' => (float) $e->sueldo_hora,
            'activo' => (bool) $e->activo,
        ];
    }

    private function formatearAsistencia(AsistenciaEmpleado $a): array
    {
        return [
            'id' => $a->id,
            'empleadoId' => $a->empleado_id,
            'empleadoNombre' => $a->empleado?->nombre ?? 'Empleado',
            'empleadoRol' => $a->empleado?->rol ?? '',
            'fecha' => $a->fecha ? $a->fecha->format('Y-m-d') : '',
            'horaEntrada' => $a->hora_entrada,
            'horaSalida' => $a->hora_salida,
            'horasTrabajadas' => (float) $a->horas_trabajadas,
            'valorHora' => (float) $a->valor_hora,
            'totalPaga' => (float) $a->total_paga,
            'pagado' => (bool) $a->pagado,
            'notas' => $a->notas ?? '',
        ];
    }
}
