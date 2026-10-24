<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CuponResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'codigo' => $this->codigo,
            'descuento' => (int) $this->descuento,
            'descripcion' => $this->descripcion ?? '',
            'montoMinimo' => (float) ($this->monto_minimo ?? 0),
            'maxUsos' => $this->max_usos !== null ? (int) $this->max_usos : null,
            'usos' => (int) ($this->usos ?? 0),
            'fechaVencimiento' => $this->fecha_vencimiento ? $this->fecha_vencimiento->format('Y-m-d') : null,
            'activo' => (bool) $this->activo,
        ];
    }
}
