<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'categoriaId' => $this->categoria_id,
            'nombre' => $this->nombre,
            'descripcion' => $this->descripcion ?? '',
            'precio' => (float) $this->precio,
            'imagen' => $this->imagen_url,
            'etiqueta' => $this->etiqueta ?? '',
            'tiempoPreparacion' => $this->tiempo_preparacion ?? '',
            'calificacion' => (float) $this->calificacion,
            'disponible' => $this->disponible,
            'orden' => $this->orden,
            'gruposOpciones' => GrupoOpcionesResource::collection($this->whenLoaded('gruposOpciones')),
        ];
    }
}
