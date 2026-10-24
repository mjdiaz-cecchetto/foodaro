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
                'costoEnvio' => (float) ($this->costo_envio ?? 0),
                'montoMinimoEnvio' => (float) ($this->monto_minimo_envio ?? 0),
                'aliasTransferencia' => $this->alias_transferencia ?? '',
                'titularTransferencia' => $this->titular_transferencia ?? '',
            ],
            'categorias' => CategoriaResource::collection($this->whenLoaded('categorias')),
            'productos' => ProductoResource::collection($this->whenLoaded('productos')),
            'promociones' => PromocionResource::collection($this->whenLoaded('promociones')),
            'cupones' => CuponResource::collection($this->whenLoaded('cupones')),
            'plantillasOpciones' => GrupoOpcionesResource::collection($this->whenLoaded('plantillasOpciones')),
        ];
    }
}
