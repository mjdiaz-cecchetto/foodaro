<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\GuardarPlantillaOpcionesRequest;
use App\Http\Resources\GrupoOpcionesResource;
use App\Models\GrupoOpciones;
use App\Services\GruposOpcionesServicio;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** Plantillas de grupos de opciones reutilizables del local. */
class PlantillaOpcionesController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private readonly GruposOpcionesServicio $grupos) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        return GrupoOpcionesResource::collection($request->user()->local->plantillasOpciones()->with('opciones')->get());
    }

    public function store(GuardarPlantillaOpcionesRequest $request): JsonResponse
    {
        $plantilla = $this->grupos->crearPlantilla($request->user()->local, $request->validated())->load('opciones');

        return (new GrupoOpcionesResource($plantilla))->response()->setStatusCode(201);
    }

    public function update(GuardarPlantillaOpcionesRequest $request, GrupoOpciones $plantilla): GrupoOpcionesResource
    {
        $this->authorize('update', $plantilla);
        abort_unless($plantilla->esPlantilla(), 404);

        return new GrupoOpcionesResource($this->grupos->actualizarGrupo($plantilla, $request->validated()));
    }

    public function destroy(GrupoOpciones $plantilla): JsonResponse
    {
        $this->authorize('delete', $plantilla);
        abort_unless($plantilla->esPlantilla(), 404);
        $plantilla->delete();

        return response()->json(null, 204);
    }
}
