<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Perfil público del local (misma forma que `PerfilLocal` en Angular). */
class PerfilLocalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'nombre' => $this->nombre,
            'eslogan' => $this->eslogan ?? '',
            'rubro' => $this->rubro ?? '',
            'logoUrl' => $this->logo_url,
            'portadaUrl' => $this->portada_url,
            'direccion' => $this->direccion ?? '',
            'referenciaDireccion' => $this->referencia_direccion ?? '',
            'mapsUrl' => $this->maps_url ?? '',
            'estado' => $this->estado,
            'horarios' => [
                'lunesAJueves' => $this->horario_lunes_a_jueves ?? '',
                'viernesYSabado' => $this->horario_viernes_y_sabado ?? '',
                'domingo' => $this->horario_domingo ?? '',
            ],
            'contacto' => [
                'whatsapp' => $this->whatsapp,
                'instagram' => $this->instagram ?? '',
                'tiktok' => $this->tiktok ?? '',
                'telefono' => $this->telefono ?? '',
            ],
        ];
    }
}
