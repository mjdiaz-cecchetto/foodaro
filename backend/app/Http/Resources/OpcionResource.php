<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OpcionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'etiqueta' => $this->etiqueta,
            'precioAdicional' => (float) $this->precio_adicional,
            'porDefecto' => $this->por_defecto,
        ];
    }
}
