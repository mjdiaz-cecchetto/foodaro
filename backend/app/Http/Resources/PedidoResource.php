<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PedidoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'numero' => $this->numero,
            'estado' => $this->estado->value,
            'modoEntrega' => $this->modo_entrega->value,
            'cliente' => [
                'nombre' => $this->nombre_cliente,
                'telefono' => $this->telefono_cliente,
            ],
            'direccion' => $this->modo_entrega->value === 'envio' ? [
                'calle' => $this->calle ?? '',
                'pisoDepto' => $this->piso_depto ?? '',
                'referencia' => $this->referencia ?? '',
            ] : null,
            'medioPago' => $this->medio_pago->value,
            'montoEfectivo' => $this->monto_efectivo !== null ? (float) $this->monto_efectivo : null,
            'comentarios' => $this->comentarios ?? '',
            'codigoPromo' => $this->codigo_promo,
            'totales' => [
                'cantidadTotal' => $this->whenLoaded('items', fn () => (int) $this->items->sum('cantidad'), 0),
                'subtotal' => (float) $this->subtotal,
                'descuento' => (float) $this->descuento,
                'cargoServicio' => (float) $this->cargo_servicio,
                'costoEnvio' => (float) ($this->costo_envio ?? 0),
                'total' => (float) $this->total,
            ],
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($item) => [
                'id' => $item->id,
                'productoId' => $item->producto_id,
                'nombre' => $item->nombre,
                'precioUnitario' => (float) $item->precio_unitario,
                'cantidad' => $item->cantidad,
                'total' => (float) $item->total,
                'notas' => $item->notas ?? '',
                'opciones' => $item->opciones->map(fn ($o) => [
                    'grupoNombre' => $o->grupo_nombre,
                    'etiqueta' => $o->etiqueta,
                    'precioAdicional' => (float) $o->precio_adicional,
                ]),
            ])),
            'creadoEn' => $this->created_at?->toIso8601String(),
        ];
    }
}
