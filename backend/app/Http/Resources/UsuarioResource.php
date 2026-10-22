<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UsuarioResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'email' => $this->email,
            'rol' => $this->rol->value,
            'local' => $this->whenLoaded('local', fn () => [
                'id' => $this->local->id,
                'slug' => $this->local->slug,
                'nombre' => $this->local->nombre,
            ]),
        ];
    }
}
