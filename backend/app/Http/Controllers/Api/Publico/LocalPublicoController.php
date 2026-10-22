<?php

namespace App\Http\Controllers\Api\Publico;

use App\Http\Controllers\Controller;
use App\Http\Resources\LocalResource;
use App\Models\Local;

/** Carta pública de un local: GET /api/locales/{slug} */
class LocalPublicoController extends Controller
{
    public function show(string $slug): LocalResource
    {
        $local = Local::query()
            ->where('slug', strtolower($slug))
            ->where('activo', true)
            ->with([
                'horarios',
                'excepcionesHorario',
                'categorias' => fn ($q) => $q->where('activa', true),
                'productos' => fn ($q) => $q->where('disponible', true)->with('gruposOpciones.opciones'),
                'promociones' => fn ($q) => $q->where('activa', true),
            ])
            ->firstOrFail();

        return new LocalResource($local);
    }
}
