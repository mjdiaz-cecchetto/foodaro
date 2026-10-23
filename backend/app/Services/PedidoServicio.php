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
            $promo = $this->resolverPromocion($local, $datos['codigoPromo'] ?? null);

            $lineas = [];
            $subtotal = 0.0;
            foreach ($datos['items'] as $indice => $item) {
                $linea = $this->armarLinea($local, $item, $indice);
                $lineas[] = $linea;
                $subtotal += $linea['total'];
            }

            $descuento = $promo ? round($subtotal * $promo->descuento / 100, 2) : 0.0;
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
                'promocion_id' => $promo?->id,
                'codigo_promo' => $promo?->codigo,
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

    private function resolverPromocion(Local $local, ?string $codigo): ?Promocion
    {
        if (! $codigo) {
            return null;
        }
        $promo = $local->promociones()->where('codigo', strtoupper(trim($codigo)))->where('activa', true)->first();
        if (! $promo) {
            throw ValidationException::withMessages(['codigoPromo' => 'El cupón no existe o ya no está vigente.']);
        }

        return $promo;
    }

    private function proximoNumero(Local $local): int
    {
        // lockForUpdate evita duplicar el correlativo con pedidos simultáneos
        $ultimo = $local->pedidos()->lockForUpdate()->max('numero');

        return ((int) $ultimo) + 1;
    }
}
