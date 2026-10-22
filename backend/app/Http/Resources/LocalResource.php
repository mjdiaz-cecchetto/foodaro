<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Local completo (misma forma que `Local` en Angular). Las relaciones solo se
 * incluyen si fueron cargadas, así el mismo resource sirve para la carta pública
 * (sin plantillas) y para el panel admin.
 */
class LocalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'perfil' => new PerfilLocalResource($this->resource),
            'configuracion' => [
                'moneda' => $this->moneda,
                'cargoServicio' => (float) $this->cargo_servicio,
                'etiquetaCargoServicio' => $this->etiqueta_cargo_servicio,
            ],
            'categorias' => CategoriaResource::collection($this->whenLoaded('categorias')),
            'productos' => ProductoResource::collection($this->whenLoaded('productos')),
            'promociones' => PromocionResource::collection($this->whenLoaded('promociones')),
            'plantillasOpciones' => GrupoOpcionesResource::collection($this->whenLoaded('plantillasOpciones')),
        ];
    }
}
