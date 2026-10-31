<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\EstadoPedido;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CambiarEstadoPedidoRequest;
use App\Http\Resources\PedidoResource;
use App\Models\Pedido;
use App\Models\PedidoItem;
use App\Models\Producto;
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
        $queryPeriodo = Pedido::query()
            ->where('local_id', $localId)
            ->with('items.producto.categoria');
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

        // Ranking de productos vendidos en el período (sobre pedidos válidos)
        $todosLosItems = $validos->flatMap(fn (Pedido $p) => $p->items);
        $totalUnidadesPeriodo = (int) $todosLosItems->sum('cantidad');

        $productosVendidos = $todosLosItems
            ->groupBy(fn ($item) => $item->producto_id ? 'id_'.$item->producto_id : 'nom_'.mb_strtolower(trim($item->nombre)))
            ->map(function ($grupo) use ($totalUnidadesPeriodo) {
                $primero = $grupo->first();
                $unidades = (int) $grupo->sum('cantidad');
                $recaudado = (float) $grupo->sum('total');
                $pedidosUnicos = $grupo->pluck('pedido_id')->unique()->count();

                return [
                    'productoId' => $primero->producto_id,
                    'nombre' => $primero->nombre,
                    'categoria' => $primero->producto?->categoria?->nombre ?? 'General',
                    'imagen' => $primero->producto?->imagen ?? null,
                    'unidades' => $unidades,
                    'pedidos' => $pedidosUnicos,
                    'precioUnitario' => (float) $primero->precio_unitario,
                    'totalRecaudado' => $recaudado,
                    'porcentajeUnidades' => $totalUnidadesPeriodo > 0 ? round(($unidades / $totalUnidadesPeriodo) * 100, 1) : 0.0,
                ];
            })
            ->sortByDesc('unidades')
            ->values();

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
                    'productosVendidos' => $productosVendidos,
                    'totalUnidadesVendidas' => $totalUnidadesPeriodo,
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

    /** PATCH /api/admin/pedidos/{pedido}/prioridad — Marca o desmarca un pedido como Prioritario para cocina. */
    public function alternarPrioridad(Request $request, Pedido $pedido): PedidoResource
    {
        $this->authorize('update', $pedido);

        $nuevoPrioritario = $request->has('prioritario')
            ? (bool) $request->boolean('prioritario')
            : ! $pedido->prioritario;

        $pedido->update([
            'prioritario' => $nuevoPrioritario,
        ]);

        return new PedidoResource($pedido->load('items.opciones'));
    }

    /** POST /api/admin/pedidos/{pedido}/items — Agrega un producto del catálogo (o ítem manual) a un pedido existente. */
    public function agregarItem(Request $request, Pedido $pedido): PedidoResource
    {
        $this->authorize('update', $pedido);

        $datos = $request->validate([
            'productoId' => ['nullable', 'integer'],
            'nombre' => ['nullable', 'string', 'max:150'],
            'precioUnitario' => ['nullable', 'numeric', 'min:0'],
            'cantidad' => ['required', 'integer', 'min:1'],
            'notas' => ['nullable', 'string', 'max:255'],
            'opciones' => ['nullable', 'array'],
            'opciones.*.grupoNombre' => ['required_with:opciones', 'string', 'max:100'],
            'opciones.*.etiqueta' => ['required_with:opciones', 'string', 'max:120'],
            'opciones.*.precioAdicional' => ['nullable', 'numeric', 'min:0'],
        ]);

        $local = $request->user()->local;
        $producto = null;

        if (! empty($datos['productoId'])) {
            $producto = Producto::where('local_id', $local->id)->findOrFail($datos['productoId']);
        }

        $nombre = $producto ? $producto->nombre : trim($datos['nombre'] ?? 'Producto');
        $precioBase = isset($datos['precioUnitario'])
            ? (float) $datos['precioUnitario']
            : (float) ($producto?->precio ?? 0);

        $opciones = $datos['opciones'] ?? [];
        $extraOpciones = collect($opciones)->sum(fn ($op) => (float) ($op['precioAdicional'] ?? 0));
        $precioUnitarioFinal = $precioBase + $extraOpciones;
        $cantidad = (int) $datos['cantidad'];
        $totalLinea = round($precioUnitarioFinal * $cantidad, 2);

        $item = $pedido->items()->create([
            'producto_id' => $producto?->id,
            'nombre' => $nombre,
            'precio_unitario' => $precioUnitarioFinal,
            'cantidad' => $cantidad,
            'total' => $totalLinea,
            'notas' => ! empty($datos['notas']) ? trim($datos['notas']) : null,
        ]);

        if (! empty($opciones)) {
            $item->opciones()->createMany(
                collect($opciones)->map(fn ($op) => [
                    'grupo_nombre' => $op['grupoNombre'],
                    'etiqueta' => $op['etiqueta'],
                    'precio_adicional' => (float) ($op['precioAdicional'] ?? 0),
                ])->all()
            );
        }

        $this->recalcularTotalesPedido($pedido);

        return new PedidoResource($pedido->fresh()->load('items.opciones'));
    }

    /** PATCH /api/admin/pedidos/{pedido}/items/{item} — Modifica la cantidad o notas de un ítem del pedido. */
    public function actualizarItem(Request $request, Pedido $pedido, PedidoItem $item): PedidoResource
    {
        $this->authorize('update', $pedido);
        abort_if($item->pedido_id !== $pedido->id, 404);

        $datos = $request->validate([
            'cantidad' => ['sometimes', 'integer', 'min:0'],
            'notas' => ['nullable', 'string', 'max:255'],
        ]);

        if (isset($datos['cantidad']) && (int) $datos['cantidad'] <= 0) {
            $item->delete();
        } else {
            $nuevaCant = isset($datos['cantidad']) ? (int) $datos['cantidad'] : (int) $item->cantidad;
            $item->update([
                'cantidad' => $nuevaCant,
                'total' => round(((float) $item->precio_unitario) * $nuevaCant, 2),
                'notas' => array_key_exists('notas', $datos) ? ($datos['notas'] ? trim($datos['notas']) : null) : $item->notas,
            ]);
        }

        $this->recalcularTotalesPedido($pedido);

        return new PedidoResource($pedido->fresh()->load('items.opciones'));
    }

    /** DELETE /api/admin/pedidos/{pedido}/items/{item} — Quita un ítem del pedido y recalcula el total. */
    public function eliminarItem(Pedido $pedido, PedidoItem $item): PedidoResource
    {
        $this->authorize('update', $pedido);
        abort_if($item->pedido_id !== $pedido->id, 404);

        $item->delete();
        $this->recalcularTotalesPedido($pedido);

        return new PedidoResource($pedido->fresh()->load('items.opciones'));
    }

    private function recalcularTotalesPedido(Pedido $pedido): void
    {
        $subtotal = (float) $pedido->items()->sum('total');
        $descuento = (float) ($pedido->descuento ?? 0);
        $cargoServicio = (float) ($pedido->cargo_servicio ?? 0);
        $costoEnvio = (float) ($pedido->costo_envio ?? 0);
        $total = max(0, $subtotal - $descuento + $cargoServicio + $costoEnvio);

        $pedido->update([
            'subtotal' => $subtotal,
            'total' => $total,
        ]);
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
