<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\EstadoPedido;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CambiarEstadoPedidoRequest;
use App\Http\Resources\PedidoResource;
use App\Models\Pedido;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/** Pedidos recibidos y arqueo/métricas de ventas por día, semana y mes del local. */
class PedidoAdminController extends Controller
{
    use AuthorizesRequests;

    /** GET /api/admin/pedidos?periodo=hoy&desde=...&hasta=...&estado=pendiente */
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'estado' => ['nullable', Rule::enum(EstadoPedido::class)],
            'periodo' => ['nullable', 'string', Rule::in(['hoy', 'ayer', 'semana', 'mes', 'personalizado', 'todos'])],
            'desde' => ['nullable', 'date'],
            'hasta' => ['nullable', 'date'],
        ]);

        $query = $request->user()->local->pedidos()->with('items.opciones');

        $this->aplicarFiltroPeriodo($query, $request);

        if ($request->filled('estado')) {
            $query->where('estado', $request->input('estado'));
        }

        $pedidos = $query->latest('id')->paginate(50);

        return PedidoResource::collection($pedidos);
    }

    /**
     * GET /api/admin/pedidos/metricas?periodo=hoy&desde=...&hasta=...
     * Devuelve el resumen exacto de ventas (Hoy, Esta Semana, Este Mes) y el arqueo del período seleccionado.
     */
    public function metricas(Request $request): JsonResponse
    {
        $request->validate([
            'periodo' => ['nullable', 'string', Rule::in(['hoy', 'ayer', 'semana', 'mes', 'personalizado', 'todos'])],
            'desde' => ['nullable', 'date'],
            'hasta' => ['nullable', 'date'],
        ]);

        $localId = $request->user()->local->id;
        $ahora = Carbon::now();

        $inicioHoy = $ahora->copy()->startOfDay();
        $inicioSemana = $ahora->copy()->startOfWeek(Carbon::MONDAY);
        $inicioMes = $ahora->copy()->startOfMonth();

        // 1. Comparativa fija: Hoy, Semana actual y Mes actual (excluyendo cancelados)
        $resumenRapido = function (Carbon $desde) use ($localId): array {
            $base = Pedido::query()
                ->where('local_id', $localId)
                ->where('created_at', '>=', $desde);

            $validos = (clone $base)->where('estado', '!=', EstadoPedido::Cancelado->value);
            $cancelados = (clone $base)->where('estado', EstadoPedido::Cancelado->value)->count();

            return [
                'monto' => (float) $validos->sum('total'),
                'pedidos' => (int) $validos->count(),
                'cancelados' => (int) $cancelados,
            ];
        };

        // 2. Desglose prolijo del período seleccionado
        $queryPeriodo = Pedido::query()->where('local_id', $localId);
        $this->aplicarFiltroPeriodo($queryPeriodo, $request);

        $pedidosPeriodo = $queryPeriodo->orderByDesc('created_at')->get();

        $validos = $pedidosPeriodo->filter(fn (Pedido $p) => $p->estado !== EstadoPedido::Cancelado);
        $cancelados = $pedidosPeriodo->filter(fn (Pedido $p) => $p->estado === EstadoPedido::Cancelado);
        $enCurso = $pedidosPeriodo->filter(fn (Pedido $p) => in_array($p->estado, [
            EstadoPedido::Pendiente,
            EstadoPedido::Confirmado,
            EstadoPedido::EnPreparacion,
            EstadoPedido::Listo,
        ], true));

        $totalVendido = (float) $validos->sum('total');
        $cantidadValidos = $validos->count();
        $ticketPromedio = $cantidadValidos > 0 ? round($totalVendido / $cantidadValidos, 2) : 0.0;

        // Control de pedidos Pagados vs Sin Pagar (sobre pedidos válidos, excluyendo cancelados)
        $pagadosValidos = $validos->filter(fn (Pedido $p) => (bool) $p->pagado);
        $sinPagarValidos = $validos->filter(fn (Pedido $p) => ! $p->pagado);

        // Arqueo por medio de pago
        $porMedioPago = [];
        foreach (['efectivo', 'transferencia', 'debito'] as $medio) {
            $grupo = $validos->filter(fn (Pedido $p) => $p->medio_pago->value === $medio);
            $porMedioPago[$medio] = [
                'monto' => (float) $grupo->sum('total'),
                'cantidad' => $grupo->count(),
            ];
        }

        // Arqueo por modalidad de entrega
        $envios = $validos->filter(fn (Pedido $p) => $p->modo_entrega->value === 'envio');
        $retiros = $validos->filter(fn (Pedido $p) => $p->modo_entrega->value === 'retiro');

        // Desglose día por día dentro del período
        $ventasPorDia = $validos
            ->groupBy(fn (Pedido $p) => $p->created_at->format('Y-m-d'))
            ->map(function ($grupoDia, string $fecha) {
                return [
                    'fecha' => $fecha,
                    'pedidos' => $grupoDia->count(),
                    'efectivo' => (float) $grupoDia->filter(fn (Pedido $p) => $p->medio_pago->value === 'efectivo')->sum('total'),
                    'transferencia' => (float) $grupoDia->filter(fn (Pedido $p) => $p->medio_pago->value === 'transferencia')->sum('total'),
                    'debito' => (float) $grupoDia->filter(fn (Pedido $p) => $p->medio_pago->value === 'debito')->sum('total'),
                    'total' => (float) $grupoDia->sum('total'),
                ];
            })
            ->values()
            ->take(31);

        return response()->json([
            'data' => [
                'comparativa' => [
                    'hoy' => $resumenRapido($inicioHoy),
                    'semana' => $resumenRapido($inicioSemana),
                    'mes' => $resumenRapido($inicioMes),
                ],
                'arqueo' => [
                    'totalVendido' => $totalVendido,
                    'pedidosValidos' => $cantidadValidos,
                    'pedidosCancelados' => $cancelados->count(),
                    'pedidosEnCurso' => $enCurso->count(),
                    'ticketPromedio' => $ticketPromedio,
                    'cobrado' => [
                        'monto' => (float) $pagadosValidos->sum('total'),
                        'cantidad' => $pagadosValidos->count(),
                    ],
                    'pendienteCobro' => [
                        'monto' => (float) $sinPagarValidos->sum('total'),
                        'cantidad' => $sinPagarValidos->count(),
                    ],
                    'porMedioPago' => $porMedioPago,
                    'porModoEntrega' => [
                        'envio' => [
                            'monto' => (float) $envios->sum('total'),
                            'cantidad' => $envios->count(),
                            'costoEnviosCobrado' => (float) $envios->sum('costo_envio'),
                        ],
                        'retiro' => [
                            'monto' => (float) $retiros->sum('total'),
                            'cantidad' => $retiros->count(),
                        ],
                    ],
                    'ventasPorDia' => $ventasPorDia,
                ],
            ],
        ]);
    }

    public function show(Pedido $pedido): PedidoResource
    {
        $this->authorize('view', $pedido);

        return new PedidoResource($pedido->load('items.opciones'));
    }

    /** PATCH /api/admin/pedidos/{pedido}/estado */
    public function cambiarEstado(CambiarEstadoPedidoRequest $request, Pedido $pedido): PedidoResource
    {
        $this->authorize('update', $pedido);
        $pedido->update(['estado' => $request->validated('estado')]);

        return new PedidoResource($pedido->load('items.opciones'));
    }

    /** PATCH /api/admin/pedidos/{pedido}/pago — Marca un pedido como Pagado o Sin Pagar en 1 clic. */
    public function alternarPago(Request $request, Pedido $pedido): PedidoResource
    {
        $this->authorize('update', $pedido);

        $nuevoEstadoPago = $request->has('pagado')
            ? (bool) $request->boolean('pagado')
            : ! $pedido->pagado;

        $pedido->update([
            'pagado' => $nuevoEstadoPago,
            'pagado_en' => $nuevoEstadoPago ? now() : null,
        ]);

        return new PedidoResource($pedido->load('items.opciones'));
    }

    private function aplicarFiltroPeriodo(Builder|\Illuminate\Database\Eloquent\Relations\HasMany $query, Request $request): void
    {
        $periodo = $request->input('periodo', 'todos');
        $ahora = Carbon::now();

        match ($periodo) {
            'hoy' => $query->where('created_at', '>=', $ahora->copy()->startOfDay()),
            'ayer' => $query->whereBetween('created_at', [
                $ahora->copy()->subDay()->startOfDay(),
                $ahora->copy()->subDay()->endOfDay(),
            ]),
            'semana' => $query->where('created_at', '>=', $ahora->copy()->startOfWeek(Carbon::MONDAY)),
            'mes' => $query->where('created_at', '>=', $ahora->copy()->startOfMonth()),
            'personalizado' => $query
                ->when($request->filled('desde'), fn ($q) => $q->where('created_at', '>=', Carbon::parse($request->input('desde'))->startOfDay()))
                ->when($request->filled('hasta'), fn ($q) => $q->where('created_at', '<=', Carbon::parse($request->input('hasta'))->endOfDay())),
            default => null,
        };
    }
}
