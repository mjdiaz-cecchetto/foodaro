<?php

namespace App\Http\Resources;

use App\Services\HorariosServicio;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Perfil público del local (misma forma que `PerfilLocal` en Angular). Requiere `horarios` y `excepcionesHorario` cargados. */
class PerfilLocalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $horarios = app(HorariosServicio::class);
        $estado = $horarios->estadoActual($this->resource);

        return [
            'nombre' => $this->nombre,
            'eslogan' => $this->eslogan ?? '',
            'rubro' => $this->rubro ?? '',
            'logoUrl' => $this->logo_url,
            'portadaUrl' => $this->portada_url,
            'direccion' => $this->direccion ?? '',
            'referenciaDireccion' => $this->referencia_direccion ?? '',
            'mapsUrl' => $this->maps_url ?? '',
            'estado' => $estado['texto'],
            'abiertoAhora' => $estado['abierto'],
            'horarios' => [
                'semana' => $horarios->semana($this->resource),
                'excepciones' => $horarios->excepciones($this->resource),
            ],
            'contacto' => [
                'whatsapp' => $this->whatsapp,
                'whatsappPedidos' => $this->whatsapp_pedidos ?: $this->whatsapp,
                'instagram' => $this->instagram ?? '',
                'tiktok' => $this->tiktok ?? '',
                'telefono' => $this->telefono ?? '',
            ],
        ];
    }
}
