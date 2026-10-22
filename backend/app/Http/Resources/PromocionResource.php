<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PromocionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'titulo' => $this->titulo,
            'descuento' => $this->descuento,
            'codigo' => $this->codigo,
            'imagen' => $this->imagen_url,
            'activa' => $this->activa,
        ];
    }
}
