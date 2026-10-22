<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GrupoOpcionesResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'tipo' => $this->tipo->value,
            'obligatorio' => $this->obligatorio,
            'maximo' => $this->maximo,
            'opciones' => OpcionResource::collection($this->whenLoaded('opciones')),
        ];
    }
}
