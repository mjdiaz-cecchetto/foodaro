<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\GuardarCategoriaRequest;
use App\Http\Resources\CategoriaResource;
use App\Models\Categoria;
use App\Services\CatalogoServicio;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CategoriaController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private readonly CatalogoServicio $catalogo) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        return CategoriaResource::collection($request->user()->local->categorias()->withCount('productos')->get());
    }

    public function store(GuardarCategoriaRequest $request): JsonResponse
    {
        $categoria = $this->catalogo->crearCategoria($request->user()->local, $request->validated());

        return (new CategoriaResource($categoria))->response()->setStatusCode(201);
    }

    public function update(GuardarCategoriaRequest $request, Categoria $categoria): CategoriaResource
    {
        $this->authorize('update', $categoria);

        return new CategoriaResource($this->catalogo->actualizarCategoria($categoria, $request->validated()));
    }

    /** PATCH /api/admin/categorias/reordenar — actualiza el orden de las categorías del local. */
    public function reordenar(Request $request): AnonymousResourceCollection
    {
        $datos = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer'],
        ]);

        $local = $request->user()->local;
        \Illuminate\Support\Facades\DB::transaction(function () use ($local, $datos) {
            foreach (array_values($datos['ids']) as $indice => $id) {
                $local->categorias()->where('id', (int) $id)->update(['orden' => $indice]);
            }
        });

        return CategoriaResource::collection($local->categorias()->withCount('productos')->get());
    }

    public function destroy(Categoria $categoria): JsonResponse
    {
        $this->authorize('delete', $categoria);

        if ($categoria->productos()->exists()) {
            return response()->json([
                'message' => 'La categoría tiene productos asociados. Movelos o eliminalos antes de borrarla.',
            ], 409);
        }
        $categoria->delete();

        return response()->json(null, 204);
    }
}
