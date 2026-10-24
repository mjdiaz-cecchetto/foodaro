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
            'precio' => (float) ($this->precio ?? 0),
            'descuento' => (int) ($this->descuento ?? 0),
            'codigo' => $this->codigo ?? '',
            'imagen' => $this->imagen_url ?? '',
            'activa' => (bool) $this->activa,
        ];
    }
}
