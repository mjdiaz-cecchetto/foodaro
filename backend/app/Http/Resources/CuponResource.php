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
            'activo' => (bool) $this->activo,
        ];
    }
}
