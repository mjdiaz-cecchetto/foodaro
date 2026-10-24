<?php

namespace App\Services;

use App\Models\Local;
use App\Models\Pedido;
use App\Models\Producto;
use App\Models\Promocion;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Registra pedidos recalculando TODOS los importes en el servidor a partir del
 * catálogo actual (no se confía en los precios que manda el cliente).
 */
class PedidoServicio
{
    public function crear(Local $local, array $datos): Pedido
    {
        return DB::transaction(function () use ($local, $datos) {
            $descuentoAplicado = $this->resolverDescuento($local, $datos['codigoPromo'] ?? null);

            $lineas = [];
            $subtotal = 0.0;
            foreach ($datos['items'] as $indice => $item) {
                $linea = $this->armarLinea($local, $item, $indice);
                $lineas[] = $linea;
                $subtotal += $linea['total'];
            }

            $descuento = $descuentoAplicado ? round($subtotal * $descuentoAplicado['porcentaje'] / 100, 2) : 0.0;
            $cargoServicio = (float) $local->cargo_servicio;
            $total = max(0, $subtotal - $descuento + $cargoServicio);

            $esEnvio = $datos['modoEntrega'] === 'envio';
            $direccion = $esEnvio ? ($datos['direccion'] ?? []) : [];

            $pedido = $local->pedidos()->create([
                'numero' => $this->proximoNumero($local),
                'modo_entrega' => $datos['modoEntrega'],
                'nombre_cliente' => trim($datos['cliente']['nombre']),
                'telefono_cliente' => trim($datos['cliente']['telefono']),
                'calle' => $esEnvio ? trim($direccion['calle'] ?? '') : null,
                'piso_depto' => $esEnvio ? ($direccion['pisoDepto'] ?? null) : null,
                'referencia' => $esEnvio ? ($direccion['referencia'] ?? null) : null,
                'medio_pago' => $datos['medioPago'],
                'monto_efectivo' => $datos['medioPago'] === 'efectivo' ? ($datos['montoEfectivo'] ?? null) : null,
                'comentarios' => $datos['comentarios'] ?? null,
                'promocion_id' => $descuentoAplicado['promocion_id'] ?? null,
                'codigo_promo' => $descuentoAplicado['codigo'] ?? null,
                'subtotal' => $subtotal,
                'descuento' => $descuento,
                'cargo_servicio' => $cargoServicio,
                'total' => $total,
            ]);

            foreach ($lineas as $linea) {
                $item = $pedido->items()->create($linea['item']);
                $item->opciones()->createMany($linea['opciones']);
            }

            return $pedido->load('items.opciones');
        });
    }

    private function armarLinea(Local $local, array $item, int $indice): array
    {
        if (! empty($item['promocionId'])) {
            $promocion = $local->promociones()
                ->where('activa', true)
                ->find($item['promocionId']);

            if (! $promocion || (float) $promocion->precio <= 0) {
                throw ValidationException::withMessages([
                    "items.{$indice}.promocionId" => 'La promoción no existe o no está disponible.',
                ]);
            }

            $cantidad = (int) $item['cantidad'];
            $precioUnitario = (float) $promocion->precio;
            $totalLinea = round($precioUnitario * $cantidad, 2);

            return [
                'total' => $totalLinea,
                'item' => [
                    'producto_id' => null,
                    'nombre' => "Promo: {$promocion->titulo}",
                    'precio_unitario' => $precioUnitario,
                    'cantidad' => $cantidad,
                    'total' => $totalLinea,
                    'notas' => isset($item['notas']) && $item['notas'] !== '' ? trim($item['notas']) : null,
                ],
                'opciones' => [],
            ];
        }

        $producto = Producto::query()
            ->where('local_id', $local->id)
            ->where('disponible', true)
            ->with('gruposOpciones.opciones')
            ->find($item['productoId']);

        if (! $producto) {
            throw ValidationException::withMessages([
                "items.{$indice}.productoId" => 'El producto no existe o no está disponible.',
            ]);
        }

        $opcionesElegidas = [];
        $precioBase = (float) $producto->precio;
        $adicionales = 0.0;
        $idsElegidos = collect($item['opciones'] ?? [])->pluck('opcionId')->map(fn ($id) => (int) $id);

        foreach ($producto->gruposOpciones as $grupo) {
            $delGrupo = $grupo->opciones->whereIn('id', $idsElegidos);
            if ($grupo->obligatorio && $delGrupo->isEmpty()) {
                throw ValidationException::withMessages([
                    "items.{$indice}.opciones" => "Falta elegir «{$grupo->nombre}» en {$producto->nombre}.",
                ]);
            }
            if ($grupo->tipo->value === 'unica' && $delGrupo->count() > 1) {
                throw ValidationException::withMessages([
                    "items.{$indice}.opciones" => "«{$grupo->nombre}» admite una sola opción.",
                ]);
            }
            if ($grupo->maximo && $delGrupo->count() > $grupo->maximo) {
                throw ValidationException::withMessages([
                    "items.{$indice}.opciones" => "«{$grupo->nombre}» admite hasta {$grupo->maximo} opciones.",
                ]);
            }
            $modoPrecio = $grupo->modo_precio?->value ?? 'adicional';
            foreach ($delGrupo as $opcion) {
                $importeOpcion = (float) $opcion->precio_adicional;
                if ($modoPrecio === 'variante') {
                    $precioBase = $importeOpcion > 0 ? $importeOpcion : (float) $producto->precio;
                } elseif ($modoPrecio === 'adicional') {
                    $adicionales += $importeOpcion;
                }
                $opcionesElegidas[] = [
                    'grupo_nombre' => $grupo->nombre,
                    'etiqueta' => $opcion->etiqueta,
                    'precio_adicional' => $modoPrecio === 'informativo' ? 0.0 : $importeOpcion,
                ];
            }
        }

        $cantidad = (int) $item['cantidad'];
        $precioUnitario = $precioBase + $adicionales;

        return [
            'total' => round($precioUnitario * $cantidad, 2),
            'item' => [
                'producto_id' => $producto->id,
                'nombre' => $producto->nombre,
                'precio_unitario' => $precioUnitario,
                'cantidad' => $cantidad,
                'total' => round($precioUnitario * $cantidad, 2),
                'notas' => isset($item['notas']) && $item['notas'] !== '' ? trim($item['notas']) : null,
            ],
            'opciones' => $opcionesElegidas,
        ];
    }

    /**
     * Resuelve un cupón de descuento por su código (busca en `cupones` y como
     * respaldo en `promociones`).
     *
     * @return array{codigo: string, porcentaje: int, promocion_id: int|null}|null
     */
    private function resolverDescuento(Local $local, ?string $codigo): ?array
    {
        if (! $codigo) {
            return null;
        }
        $normalizado = strtoupper(trim($codigo));

        $cupon = $local->cupones()->where('codigo', $normalizado)->where('activo', true)->first();
        if ($cupon) {
            return [
                'codigo' => $cupon->codigo,
                'porcentaje' => (int) $cupon->descuento,
                'promocion_id' => null,
            ];
        }

        $promo = $local->promociones()->where('codigo', $normalizado)->where('activa', true)->first();
        if ($promo && (int) $promo->descuento > 0) {
            return [
                'codigo' => $promo->codigo,
                'porcentaje' => (int) $promo->descuento,
                'promocion_id' => $promo->id,
            ];
        }

        throw ValidationException::withMessages(['codigoPromo' => 'El cupón no existe o ya no está vigente.']);
    }

    private function proximoNumero(Local $local): int
    {
        // lockForUpdate evita duplicar el correlativo con pedidos simultáneos
        $ultimo = $local->pedidos()->lockForUpdate()->max('numero');

        return ((int) $ultimo) + 1;
    }
}
