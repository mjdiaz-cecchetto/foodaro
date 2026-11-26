<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\EstadoPedido;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CambiarEstadoPedidoRequest;
use App\Http\Resources\PedidoResource;
use App\Models\CajaDiaria;
use App\Models\MovimientoCaja;
use App\Models\Pedido;
use App\Models\PedidoItem;
use App\Models\Producto;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Pedidos recibidos, arqueo/métricas de ventas y movimientos de caja del local.
 *
 * IMPORTANTE — Jornada Comercial Gastronómica:
 * El día comercial corta a las 06:00 AM (HORA_CORTE_JORNADA = 6).
 * Ejemplo: la jornada del 16/11 abarca desde el 16/11 a las 06:00:00 hasta el 17/11 a las 05:59:59.
 * De esta forma, si el local abre el 16/11 a las 21:00 y cierra el 17/11 a las 02:00,
 * toda esa noche pertenece íntegramente al cierre del 16/11.
 */
class PedidoAdminController extends Controller
{
    use AuthorizesRequests;

    public const HORA_CORTE_JORNADA = 6;

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
     * POST /api/admin/pedidos — Toma rápida de pedido desde el mostrador / teléfono / WhatsApp por el encargado.
     * No bloquea por horario público del local ni exige teléfono/dirección obligatoria en mostrador.
     */
    public function store(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'modoEntrega' => ['required', 'string', Rule::in(['retiro', 'envio'])],
            'nombreCliente' => ['nullable', 'string', 'max:120'],
            'telefonoCliente' => ['nullable', 'string', 'max:40'],
            'calle' => ['nullable', 'string', 'max:180'],
            'referencia' => ['nullable', 'string', 'max:180'],
            'medioPago' => ['required', 'string', Rule::in(['efectivo', 'transferencia', 'debito'])],
            'pagado' => ['sometimes', 'boolean'],
            'prioritario' => ['sometimes', 'boolean'],
            'estado' => ['sometimes', 'string', Rule::in(['pendiente', 'confirmado', 'en_preparacion', 'listo', 'entregado'])],
            'incluirCostoEnvio' => ['sometimes', 'boolean'],
            'comentarios' => ['nullable', 'string', 'max:500'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.productoId' => ['nullable', 'integer'],
            'items.*.nombre' => ['required', 'string', 'max:150'],
            'items.*.precioUnitario' => ['required', 'numeric', 'min:0'],
            'items.*.cantidad' => ['required', 'integer', 'min:1'],
            'items.*.notas' => ['nullable', 'string', 'max:255'],
            'items.*.opciones' => ['nullable', 'array'],
            'items.*.opciones.*.grupoNombre' => ['required_with:items.*.opciones', 'string', 'max:100'],
            'items.*.opciones.*.etiqueta' => ['required_with:items.*.opciones', 'string', 'max:120'],
            'items.*.opciones.*.precioAdicional' => ['nullable', 'numeric', 'min:0'],
        ]);

        $local = $request->user()->local;

        $pedido = DB::transaction(function () use ($local, $datos) {
            $ultimoNumero = (int) $local->pedidos()->lockForUpdate()->max('numero');
            $esEnvio = $datos['modoEntrega'] === 'envio';
            $incluirEnvio = $esEnvio && ($datos['incluirCostoEnvio'] ?? true);

            $subtotal = 0.0;
            $lineasPreparadas = [];

            foreach ($datos['items'] as $it) {
                $cant = (int) $it['cantidad'];
                $precioUnit = round((float) $it['precioUnitario'], 2);
                $totalLinea = round($precioUnit * $cant, 2);
                $subtotal += $totalLinea;

                $lineasPreparadas[] = [
                    'item' => [
                        'producto_id' => ! empty($it['productoId']) ? (int) $it['productoId'] : null,
                        'nombre' => trim($it['nombre']),
                        'precio_unitario' => $precioUnit,
                        'cantidad' => $cant,
                        'total' => $totalLinea,
                        'notas' => ! empty($it['notas']) ? trim($it['notas']) : null,
                    ],
                    'opciones' => collect($it['opciones'] ?? [])->map(fn ($op) => [
                        'grupo_nombre' => trim($op['grupoNombre']),
                        'etiqueta' => trim($op['etiqueta']),
                        'precio_adicional' => round((float) ($op['precioAdicional'] ?? 0), 2),
                    ])->all(),
                ];
            }

            $costoEnvio = $incluirEnvio ? (float) ($local->costo_envio ?? 0) : 0.0;
            $cargoServicio = (float) ($local->cargo_servicio ?? 0);
            $total = max(0, round($subtotal + $costoEnvio + $cargoServicio, 2));
            $estaPagado = (bool) ($datos['pagado'] ?? false);

            $nombreCliente = ! empty(trim($datos['nombreCliente'] ?? ''))
                ? trim($datos['nombreCliente'])
                : ($esEnvio ? 'Cliente Delivery' : 'Mostrador');
            $telefonoCliente = ! empty(trim($datos['telefonoCliente'] ?? ''))
                ? trim($datos['telefonoCliente'])
                : '-';

            $nuevoPedido = $local->pedidos()->create([
                'numero' => $ultimoNumero + 1,
                'estado' => $datos['estado'] ?? 'en_preparacion',
                'prioritario' => (bool) ($datos['prioritario'] ?? false),
                'modo_entrega' => $datos['modoEntrega'],
                'nombre_cliente' => $nombreCliente,
                'telefono_cliente' => $telefonoCliente,
                'calle' => $esEnvio ? (trim($datos['calle'] ?? '') ?: 'Sin dirección especificada') : null,
                'piso_depto' => null,
                'referencia' => $esEnvio && ! empty($datos['referencia']) ? trim($datos['referencia']) : null,
                'medio_pago' => $datos['medioPago'],
                'pagado' => $estaPagado,
                'pagado_en' => $estaPagado ? now() : null,
                'comentarios' => ! empty($datos['comentarios']) ? trim($datos['comentarios']) : null,
                'subtotal' => $subtotal,
                'descuento' => 0,
                'cargo_servicio' => $cargoServicio,
                'costo_envio' => $costoEnvio,
                'total' => $total,
            ]);

            foreach ($lineasPreparadas as $linea) {
                $itemCreado = $nuevoPedido->items()->create($linea['item']);
                if (! empty($linea['opciones'])) {
                    $itemCreado->opciones()->createMany($linea['opciones']);
                }
            }

            return $nuevoPedido->load('items.opciones');
        });

        return (new PedidoResource($pedido))->response()->setStatusCode(201);
    }

    /**
     * GET /api/admin/pedidos/metricas?periodo=hoy&desde=...&hasta=...
     * Devuelve el resumen exacto de ventas (Hoy, Esta Semana, Este Mes), el arqueo del período seleccionado
     * y el estado de la caja física (fondo inicial + efectivo de ventas - retiros/gastos urgentes).
     */
    public function metricas(Request $request): JsonResponse
    {
        $request->validate([
            'periodo' => ['nullable', 'string', Rule::in(['hoy', 'ayer', 'semana', 'mes', 'personalizado', 'todos'])],
            'desde' => ['nullable', 'date'],
            'hasta' => ['nullable', 'date'],
        ]);

        $localId = $request->user()->local->id;

        $hoyJornada = $this->fechaJornadaActual();
        $lunesJornada = Carbon::parse($hoyJornada)->startOfWeek(Carbon::MONDAY)->toDateString();
        $domingoJornada = Carbon::parse($hoyJornada)->endOfWeek(Carbon::SUNDAY)->toDateString();
        $primeroMesJornada = Carbon::parse($hoyJornada)->startOfMonth()->toDateString();
        $ultimoMesJornada = Carbon::parse($hoyJornada)->endOfMonth()->toDateString();

        $inicioHoy = $this->inicioJornada($hoyJornada);
        $finHoy = $this->finJornada($hoyJornada);
        $inicioSemana = $this->inicioJornada($lunesJornada);
        $finSemana = $this->finJornada($domingoJornada);
        $inicioMes = $this->inicioJornada($primeroMesJornada);
        $finMes = $this->finJornada($ultimoMesJornada);

        // 1. Comparativa fija según calendario presente: Hoy, Semana calendario (Lun-Dom) y Mes calendario
        $resumenRapido = function (Carbon $desde, Carbon $hasta) use ($localId): array {
            $base = Pedido::query()
                ->where('local_id', $localId)
                ->whereBetween('created_at', [$desde, $hasta]);

            $validos = (clone $base)->where('estado', '!=', EstadoPedido::Cancelado->value);
            $cobrados = (clone $validos)->where('pagado', true);
            $cancelados = (clone $base)->where('estado', EstadoPedido::Cancelado->value)->count();

            return [
                'monto' => (float) $cobrados->sum('total'),
                'pedidos' => (int) $cobrados->count(),
                'cancelados' => (int) $cancelados,
            ];
        };

        // 2. Desglose prolijo del período seleccionado
        $rango = $this->resolverRangoJornada($request);

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

        // Control de pedidos Pagados vs Sin Pagar:
        // NINGÚN pedido suma a la caja ni al arqueo de medios de pago hasta que esté marcado como PAGADO.
        $pagadosValidos = $validos->filter(fn (Pedido $p) => (bool) $p->pagado);
        $sinPagarValidos = $validos->filter(fn (Pedido $p) => ! $p->pagado);

        $totalVendido = (float) $pagadosValidos->sum('total');
        $cantidadPagados = $pagadosValidos->count();
        $cantidadValidos = $validos->count();
        $ticketPromedio = $cantidadPagados > 0 ? round($totalVendido / $cantidadPagados, 2) : 0.0;

        // Arqueo por medio de pago (exclusivamente sobre pedidos YA COBRADOS / PAGADOS)
        $porMedioPago = [];
        foreach (['efectivo', 'transferencia', 'debito'] as $medio) {
            $grupo = $pagadosValidos->filter(fn (Pedido $p) => $p->medio_pago->value === $medio);
            $porMedioPago[$medio] = [
                'monto' => (float) $grupo->sum('total'),
                'cantidad' => $grupo->count(),
            ];
        }

        // Arqueo por modalidad de entrega (exclusivamente sobre pedidos YA COBRADOS / PAGADOS)
        $envios = $pagadosValidos->filter(fn (Pedido $p) => $p->modo_entrega->value === 'envio');
        $retiros = $pagadosValidos->filter(fn (Pedido $p) => $p->modo_entrega->value === 'retiro');

        // Desglose día por día comercial (cortando a las 06:00 AM, sumando solo pedidos PAGADOS)
        $ventasPorDia = $pagadosValidos
            ->groupBy(fn (Pedido $p) => $p->created_at->copy()->subHours(self::HORA_CORTE_JORNADA)->format('Y-m-d'))
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

        // 3. Fondo Inicial de Caja y Movimientos (Retiros / Gastos Urgentes / Ingresos extra)
        $fechaObjetivoCaja = $rango['fechaObjetivo'];

        $cajaObjetivo = CajaDiaria::query()
            ->where('local_id', $localId)
            ->whereDate('fecha', $fechaObjetivoCaja)
            ->first();

        $queryCajasPeriodo = CajaDiaria::query()->where('local_id', $localId);
        if ($rango['desdeFecha']) {
            $queryCajasPeriodo->whereDate('fecha', '>=', $rango['desdeFecha']);
        }
        if ($rango['hastaFecha']) {
            $queryCajasPeriodo->whereDate('fecha', '<=', $rango['hastaFecha']);
        }

        $esDiaUnico = $rango['desdeFecha'] !== null && $rango['desdeFecha'] === $rango['hastaFecha'];
        $montoInicial = $esDiaUnico
            ? (float) ($cajaObjetivo?->monto_inicial ?? 0)
            : (float) $queryCajasPeriodo->sum('monto_inicial');

        $queryMovimientos = MovimientoCaja::query()->where('local_id', $localId);
        if ($rango['desdeFecha']) {
            $queryMovimientos->whereDate('fecha_jornada', '>=', $rango['desdeFecha']);
        }
        if ($rango['hastaFecha']) {
            $queryMovimientos->whereDate('fecha_jornada', '<=', $rango['hastaFecha']);
        }

        $movimientos = $queryMovimientos
            ->orderByDesc('fecha_jornada')
            ->orderByDesc('id')
            ->limit(200)
            ->get();

        $egresosEfectivo = (float) $movimientos
            ->filter(fn (MovimientoCaja $m) => $m->tipo === 'egreso' && $m->medio_pago === 'efectivo')
            ->sum('monto');
        $egresosTransferencia = (float) $movimientos
            ->filter(fn (MovimientoCaja $m) => $m->tipo === 'egreso' && $m->medio_pago === 'transferencia')
            ->sum('monto');
        $ingresosExtraEfectivo = (float) $movimientos
            ->filter(fn (MovimientoCaja $m) => $m->tipo === 'ingreso' && $m->medio_pago === 'efectivo')
            ->sum('monto');
        $totalEgresos = round($egresosEfectivo + $egresosTransferencia, 2);

        $efectivoVentasTotal = (float) $porMedioPago['efectivo']['monto'];
        $efectivoVentasCobrado = (float) $pagadosValidos
            ->filter(fn (Pedido $p) => $p->medio_pago->value === 'efectivo')
            ->sum('total');

        $efectivoEnCaja = round($montoInicial + $efectivoVentasTotal + $ingresosExtraEfectivo - $egresosEfectivo, 2);
        $efectivoCobradoEnCaja = round($montoInicial + $efectivoVentasCobrado + $ingresosExtraEfectivo - $egresosEfectivo, 2);
        $transferenciaEnCuenta = round(((float) $porMedioPago['transferencia']['monto']) - $egresosTransferencia, 2);
        $debitoEnCuenta = round((float) $porMedioPago['debito']['monto'], 2);
        $digitalEnCuenta = round($transferenciaEnCuenta + $debitoEnCuenta, 2);
        $saldoNetoTotal = round($montoInicial + $totalVendido + $ingresosExtraEfectivo - $totalEgresos, 2);

        return response()->json([
            'data' => [
                'comparativa' => [
                    'hoy' => $resumenRapido($inicioHoy, $finHoy),
                    'semana' => $resumenRapido($inicioSemana, $finSemana),
                    'mes' => $resumenRapido($inicioMes, $finMes),
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
                    'caja' => [
                        'fechaJornada' => $fechaObjetivoCaja,
                        'horaCorte' => '06:00',
                        'rangoHorarioTexto' => $rango['rangoTexto'],
                        'montoInicial' => $montoInicial,
                        'montoInicialDiaObjetivo' => (float) ($cajaObjetivo?->monto_inicial ?? 0),
                        'efectivoVentas' => $efectivoVentasTotal,
                        'efectivoVentasCobrado' => $efectivoVentasCobrado,
                        'ingresosExtraEfectivo' => $ingresosExtraEfectivo,
                        'egresosEfectivo' => $egresosEfectivo,
                        'egresosTransferencia' => $egresosTransferencia,
                        'totalEgresos' => $totalEgresos,
                        'efectivoEnCaja' => $efectivoEnCaja,
                        'efectivoCobradoEnCaja' => $efectivoCobradoEnCaja,
                        'transferenciaEnCuenta' => $transferenciaEnCuenta,
                        'debitoEnCuenta' => $debitoEnCuenta,
                        'digitalEnCuenta' => $digitalEnCuenta,
                        'saldoNetoTotal' => $saldoNetoTotal,
                        'movimientos' => $movimientos->map(fn (MovimientoCaja $m) => $this->formatearMovimientoCaja($m))->values(),
                    ],
                    'ventasPorDia' => $ventasPorDia,
                    'productosVendidos' => $productosVendidos,
                    'totalUnidadesVendidas' => $totalUnidadesPeriodo,
                ],
            ],
        ]);
    }

    /** PUT /api/admin/pedidos/caja/fondo-inicial — Define el monto con el que arranca la caja de la jornada. */
    public function guardarFondoInicial(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'montoInicial' => ['required', 'numeric', 'min:0'],
            'fecha' => ['nullable', 'date'],
            'observaciones' => ['nullable', 'string', 'max:255'],
        ]);

        $local = $request->user()->local;
        $fecha = ! empty($datos['fecha'])
            ? Carbon::parse($datos['fecha'])->toDateString()
            : $this->fechaJornadaActual();

        $caja = CajaDiaria::updateOrCreate(
            [
                'local_id' => $local->id,
                'fecha' => $fecha,
            ],
            [
                'monto_inicial' => round((float) $datos['montoInicial'], 2),
                'observaciones' => isset($datos['observaciones']) ? trim($datos['observaciones']) : null,
            ]
        );

        return response()->json([
            'data' => [
                'id' => $caja->id,
                'fecha' => $caja->fecha->format('Y-m-d'),
                'montoInicial' => (float) $caja->monto_inicial,
                'observaciones' => $caja->observaciones ?? '',
            ],
        ]);
    }

    /** POST /api/admin/pedidos/caja/movimientos — Registra un retiro/gasto urgente (o ingreso extra) en la caja. */
    public function registrarMovimientoCaja(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'monto' => ['required', 'numeric', 'min:0.01'],
            'concepto' => ['required', 'string', 'max:200'],
            'medioPago' => ['nullable', 'string', Rule::in(['efectivo', 'transferencia'])],
            'tipo' => ['nullable', 'string', Rule::in(['egreso', 'ingreso'])],
            'fechaJornada' => ['nullable', 'date'],
        ]);

        $local = $request->user()->local;
        $fechaJornada = ! empty($datos['fechaJornada'])
            ? Carbon::parse($datos['fechaJornada'])->toDateString()
            : $this->fechaJornadaActual();

        $movimiento = MovimientoCaja::create([
            'local_id' => $local->id,
            'fecha_jornada' => $fechaJornada,
            'tipo' => $datos['tipo'] ?? 'egreso',
            'monto' => round((float) $datos['monto'], 2),
            'medio_pago' => $datos['medioPago'] ?? 'efectivo',
            'concepto' => trim($datos['concepto']),
        ]);

        return response()->json([
            'data' => $this->formatearMovimientoCaja($movimiento),
        ], 201);
    }

    /** DELETE /api/admin/pedidos/caja/movimientos/{movimiento} — Elimina un movimiento de caja mal cargado. */
    public function eliminarMovimientoCaja(Request $request, MovimientoCaja $movimiento): JsonResponse
    {
        abort_if($movimiento->local_id !== $request->user()->local_id, 403);
        $movimiento->delete();

        return response()->json(['message' => 'Movimiento de caja eliminado']);
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
        $nuevoEstado = $request->validated('estado');
        $pedido->update(['estado' => $nuevoEstado]);

        // Si el pedido completo se marca como entregado, marcar también como entregados los ítems pendientes.
        if ($nuevoEstado === EstadoPedido::Entregado->value) {
            $pedido->items()
                ->where('entregado', false)
                ->update([
                    'entregado' => true,
                    'entregado_en' => now(),
                ]);
        }

        return new PedidoResource($pedido->fresh()->load('items.opciones'));
    }

    /** PATCH /api/admin/pedidos/{pedido}/pago — Marca un pedido como Pagado/Sin Pagar o cambia su medio de pago en 1 clic. */
    public function alternarPago(Request $request, Pedido $pedido): PedidoResource
    {
        $this->authorize('update', $pedido);

        $datos = $request->validate([
            'pagado' => ['sometimes', 'boolean'],
            'medioPago' => ['sometimes', 'string', Rule::in(['efectivo', 'transferencia', 'debito'])],
        ]);

        $atributos = [];

        if (array_key_exists('medioPago', $datos)) {
            $atributos['medio_pago'] = $datos['medioPago'];
        }

        if (array_key_exists('pagado', $datos)) {
            $nuevoEstadoPago = (bool) $datos['pagado'];
            $atributos['pagado'] = $nuevoEstadoPago;
            $atributos['pagado_en'] = $nuevoEstadoPago ? now() : null;
        } elseif (! array_key_exists('medioPago', $datos)) {
            $nuevoEstadoPago = ! $pedido->pagado;
            $atributos['pagado'] = $nuevoEstadoPago;
            $atributos['pagado_en'] = $nuevoEstadoPago ? now() : null;
        }

        if (! empty($atributos)) {
            $pedido->update($atributos);
        }

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
            'ronda' => ['nullable', 'integer', 'min:1'],
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
        $opciones = $datos['opciones'] ?? [];

        if (isset($datos['precioUnitario'])) {
            $precioUnitarioFinal = (float) $datos['precioUnitario'];
        } else {
            $precioBase = (float) ($producto?->precio ?? 0);
            $extraOpciones = collect($opciones)->sum(fn ($op) => (float) ($op['precioAdicional'] ?? 0));
            $precioUnitarioFinal = $precioBase + $extraOpciones;
        }
        $cantidad = (int) $datos['cantidad'];
        $totalLinea = round($precioUnitarioFinal * $cantidad, 2);

        $rondaAsignada = isset($datos['ronda'])
            ? max(1, (int) $datos['ronda'])
            : (((int) ($pedido->items()->max('ronda') ?? 0)) + 1);

        $item = $pedido->items()->create([
            'ronda' => $rondaAsignada,
            'producto_id' => $producto?->id,
            'nombre' => $nombre,
            'precio_unitario' => $precioUnitarioFinal,
            'cantidad' => $cantidad,
            'total' => $totalLinea,
            'notas' => ! empty($datos['notas']) ? trim($datos['notas']) : null,
            'entregado' => false,
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

        if (in_array($pedido->estado->value, [EstadoPedido::Entregado->value, EstadoPedido::Listo->value], true)) {
            $pedido->update(['estado' => EstadoPedido::EnPreparacion->value]);
        }

        $this->recalcularTotalesPedido($pedido);

        return new PedidoResource($pedido->fresh()->load('items.opciones'));
    }

    /**
     * POST /api/admin/pedidos/{pedido}/rondas
     * Agrega un lote de productos como una nueva Ronda/Marcha (Ronda #2, #3...) en 1 sola operación.
     */
    public function agregarRonda(Request $request, Pedido $pedido): PedidoResource
    {
        $this->authorize('update', $pedido);

        $datos = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.productoId' => ['nullable', 'integer'],
            'items.*.nombre' => ['nullable', 'string', 'max:150'],
            'items.*.precioUnitario' => ['nullable', 'numeric', 'min:0'],
            'items.*.cantidad' => ['required', 'integer', 'min:1'],
            'items.*.notas' => ['nullable', 'string', 'max:255'],
            'items.*.opciones' => ['nullable', 'array'],
            'items.*.opciones.*.grupoNombre' => ['required_with:items.*.opciones', 'string', 'max:100'],
            'items.*.opciones.*.etiqueta' => ['required_with:items.*.opciones', 'string', 'max:120'],
            'items.*.opciones.*.precioAdicional' => ['nullable', 'numeric', 'min:0'],
            'marcarComandado' => ['sometimes', 'boolean'],
            'marcarEntregado' => ['sometimes', 'boolean'],
        ]);

        $local = $request->user()->local;
        $marcarComandado = (bool) ($datos['marcarComandado'] ?? false);
        $marcarEntregado = (bool) ($datos['marcarEntregado'] ?? false);
        $ahora = now();

        $nuevaRonda = DB::transaction(function () use ($pedido, $local, $datos, $marcarComandado, $marcarEntregado, $ahora) {
            $ronda = ((int) ($pedido->items()->max('ronda') ?? 0)) + 1;

            foreach ($datos['items'] as $fila) {
                $producto = null;
                if (! empty($fila['productoId'])) {
                    $producto = Producto::where('local_id', $local->id)->findOrFail($fila['productoId']);
                }

                $nombre = $producto ? $producto->nombre : trim($fila['nombre'] ?? 'Producto');
                $opciones = $fila['opciones'] ?? [];

                if (isset($fila['precioUnitario'])) {
                    $precioUnitarioFinal = (float) $fila['precioUnitario'];
                } else {
                    $precioBase = (float) ($producto?->precio ?? 0);
                    $extraOpciones = collect($opciones)->sum(fn ($op) => (float) ($op['precioAdicional'] ?? 0));
                    $precioUnitarioFinal = $precioBase + $extraOpciones;
                }

                $cantidad = (int) $fila['cantidad'];
                $totalLinea = round($precioUnitarioFinal * $cantidad, 2);

                $item = $pedido->items()->create([
                    'ronda' => $ronda,
                    'producto_id' => $producto?->id,
                    'nombre' => $nombre,
                    'precio_unitario' => $precioUnitarioFinal,
                    'cantidad' => $cantidad,
                    'total' => $totalLinea,
                    'notas' => ! empty($fila['notas']) ? trim($fila['notas']) : null,
                    'entregado' => $marcarEntregado,
                    'entregado_en' => $marcarEntregado ? $ahora : null,
                    'comandado_en' => $marcarComandado ? $ahora : null,
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
            }

            // Si la cuenta ya estaba "entregado" o "listo" y llega una ronda nueva sin entregar, vuelve a "en_preparacion".
            if (! $marcarEntregado && in_array($pedido->estado->value, [EstadoPedido::Entregado->value, EstadoPedido::Listo->value], true)) {
                $pedido->update(['estado' => EstadoPedido::EnPreparacion->value]);
            }

            $this->recalcularTotalesPedido($pedido);

            return $ronda;
        });

        return (new PedidoResource($pedido->fresh()->load('items.opciones')))
            ->additional(['meta' => ['rondaCreada' => $nuevaRonda]]);
    }

    /** PATCH /api/admin/pedidos/{pedido}/rondas/{ronda}/entrega — Marca/desmarca toda una ronda como entregada. */
    public function alternarEntregaRonda(Request $request, Pedido $pedido, int $ronda): PedidoResource
    {
        $this->authorize('update', $pedido);

        $itemsRonda = $pedido->items()->where('ronda', $ronda)->get();
        abort_if($itemsRonda->isEmpty(), 404, 'Ronda no encontrada en este pedido.');

        $nuevoEntregado = $request->has('entregado')
            ? (bool) $request->boolean('entregado')
            : ! $itemsRonda->every(fn (PedidoItem $it) => (bool) $it->entregado);

        $pedido->items()->where('ronda', $ronda)->update([
            'entregado' => $nuevoEntregado,
            'entregado_en' => $nuevoEntregado ? now() : null,
        ]);

        if (! $nuevoEntregado && $pedido->estado->value === EstadoPedido::Entregado->value) {
            $pedido->update(['estado' => EstadoPedido::EnPreparacion->value]);
        }

        return new PedidoResource($pedido->fresh()->load('items.opciones'));
    }

    /** PATCH /api/admin/pedidos/{pedido}/items/{item}/entrega — Marca/desmarca un ítem individual como entregado. */
    public function alternarEntregaItem(Request $request, Pedido $pedido, PedidoItem $item): PedidoResource
    {
        $this->authorize('update', $pedido);
        abort_if($item->pedido_id !== $pedido->id, 404);

        $nuevoEntregado = $request->has('entregado')
            ? (bool) $request->boolean('entregado')
            : ! (bool) $item->entregado;

        $item->update([
            'entregado' => $nuevoEntregado,
            'entregado_en' => $nuevoEntregado ? now() : null,
        ]);

        if (! $nuevoEntregado && $pedido->estado->value === EstadoPedido::Entregado->value) {
            $pedido->update(['estado' => EstadoPedido::EnPreparacion->value]);
        }

        return new PedidoResource($pedido->fresh()->load('items.opciones'));
    }

    /** PATCH /api/admin/pedidos/{pedido}/comandar — Registra cuándo fueron comandados a cocina los ítems (ronda o pendientes). */
    public function marcarComandado(Request $request, Pedido $pedido): PedidoResource
    {
        $this->authorize('update', $pedido);

        $datos = $request->validate([
            'ronda' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = $pedido->items();
        if (! empty($datos['ronda'])) {
            $query->where('ronda', (int) $datos['ronda']);
        } else {
            $query->whereNull('comandado_en');
        }
        $query->update(['comandado_en' => now()]);

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

    /**
     * Devuelve la fecha comercial actual (YYYY-MM-DD) restando las 6 horas de corte nocturno.
     * Si son las 02:00 AM del 17/11, sigue siendo la jornada comercial del 16/11.
     */
    private function fechaJornadaActual(?Carbon $instante = null): string
    {
        return ($instante ?? Carbon::now())->copy()->subHours(self::HORA_CORTE_JORNADA)->toDateString();
    }

    /** Inicio de una jornada comercial: YYYY-MM-DD a las 06:00:00. */
    private function inicioJornada(string $fechaYmd): Carbon
    {
        return Carbon::parse($fechaYmd)->startOfDay()->addHours(self::HORA_CORTE_JORNADA);
    }

    /** Fin de una jornada comercial: (YYYY-MM-DD + 1 día) a las 05:59:59. */
    private function finJornada(string $fechaYmd): Carbon
    {
        return Carbon::parse($fechaYmd)->addDay()->startOfDay()->addHours(self::HORA_CORTE_JORNADA)->subSecond();
    }

    /**
     * Resuelve el rango de fechas comerciales y timestamps reales (con corte a las 06:00 AM).
     *
     * @return array{desdeFecha: ?string, hastaFecha: ?string, inicio: ?Carbon, fin: ?Carbon, fechaObjetivo: string, rangoTexto: string}
     */
    private function resolverRangoJornada(Request $request): array
    {
        $periodo = $request->input('periodo', 'todos');
        $hoyJornada = $this->fechaJornadaActual();
        $ayerJornada = Carbon::parse($hoyJornada)->subDay()->toDateString();
        $lunesJornada = Carbon::parse($hoyJornada)->startOfWeek(Carbon::MONDAY)->toDateString();
        $domingoJornada = Carbon::parse($hoyJornada)->endOfWeek(Carbon::SUNDAY)->toDateString();
        $primeroMesJornada = Carbon::parse($hoyJornada)->startOfMonth()->toDateString();
        $ultimoMesJornada = Carbon::parse($hoyJornada)->endOfMonth()->toDateString();

        $desdeFecha = null;
        $hastaFecha = null;
        $fechaObjetivo = $hoyJornada;

        switch ($periodo) {
            case 'hoy':
                $desdeFecha = $hoyJornada;
                $hastaFecha = $hoyJornada;
                $fechaObjetivo = $hoyJornada;
                break;
            case 'ayer':
                $desdeFecha = $ayerJornada;
                $hastaFecha = $ayerJornada;
                $fechaObjetivo = $ayerJornada;
                break;
            case 'semana':
                $desdeFecha = $lunesJornada;
                $hastaFecha = $domingoJornada;
                $fechaObjetivo = $hoyJornada;
                break;
            case 'mes':
                $desdeFecha = $primeroMesJornada;
                $hastaFecha = $ultimoMesJornada;
                $fechaObjetivo = $hoyJornada;
                break;
            case 'personalizado':
                $desdeFecha = $request->filled('desde') ? Carbon::parse($request->input('desde'))->toDateString() : null;
                $hastaFecha = $request->filled('hasta') ? Carbon::parse($request->input('hasta'))->toDateString() : null;
                if ($desdeFecha && ! $hastaFecha) {
                    $hastaFecha = $desdeFecha;
                }
                if ($desdeFecha && $desdeFecha === $hastaFecha) {
                    $fechaObjetivo = $desdeFecha;
                }
                break;
            default:
                break;
        }

        $inicio = $desdeFecha ? $this->inicioJornada($desdeFecha) : null;
        $fin = $hastaFecha ? $this->finJornada($hastaFecha) : null;

        $rangoTexto = ($inicio && $fin)
            ? $inicio->format('d/m H:i').' hs → '.$fin->format('d/m H:i').' hs'
            : 'Historial completo';

        return [
            'desdeFecha' => $desdeFecha,
            'hastaFecha' => $hastaFecha,
            'inicio' => $inicio,
            'fin' => $fin,
            'fechaObjetivo' => $fechaObjetivo,
            'rangoTexto' => $rangoTexto,
        ];
    }

    private function aplicarFiltroPeriodo(Builder|\Illuminate\Database\Eloquent\Relations\HasMany $query, Request $request): void
    {
        $rango = $this->resolverRangoJornada($request);

        if ($rango['inicio']) {
            $query->where('created_at', '>=', $rango['inicio']);
        }
        if ($rango['fin']) {
            $query->where('created_at', '<=', $rango['fin']);
        }
    }

    private function formatearMovimientoCaja(MovimientoCaja $m): array
    {
        return [
            'id' => $m->id,
            'fechaJornada' => $m->fecha_jornada ? $m->fecha_jornada->format('Y-m-d') : '',
            'tipo' => $m->tipo,
            'monto' => (float) $m->monto,
            'medioPago' => $m->medio_pago,
            'concepto' => $m->concepto,
            'creadoEn' => $m->created_at?->toIso8601String() ?? '',
        ];
    }
}
