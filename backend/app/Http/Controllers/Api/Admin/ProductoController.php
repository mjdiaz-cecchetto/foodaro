<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\GuardarProductoRequest;
use App\Http\Resources\ProductoResource;
use App\Models\Producto;
use App\Services\CatalogoServicio;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductoController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private readonly CatalogoServicio $catalogo) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $productos = $request->user()->local->productos()->with('gruposOpciones.opciones')->get();

        return ProductoResource::collection($productos);
    }

    public function store(GuardarProductoRequest $request): JsonResponse
    {
        $producto = $this->catalogo->crearProducto($request->user()->local, $request->validated());

        return (new ProductoResource($producto))->response()->setStatusCode(201);
    }

    public function show(Producto $producto): ProductoResource
    {
        $this->authorize('view', $producto);

        return new ProductoResource($producto->load('gruposOpciones.opciones'));
    }

    public function update(GuardarProductoRequest $request, Producto $producto): ProductoResource
    {
        $this->authorize('update', $producto);

        return new ProductoResource($this->catalogo->actualizarProducto($producto, $request->validated()));
    }

    /** PATCH /api/admin/productos/{producto}/disponibilidad — alterna disponible/agotado. */
    public function alternarDisponibilidad(Producto $producto): ProductoResource
    {
        $this->authorize('update', $producto);
        $producto->update(['disponible' => ! $producto->disponible]);

        return new ProductoResource($producto->load('gruposOpciones.opciones'));
    }

    /** PATCH /api/admin/productos/reordenar — actualiza el orden de los productos del local. */
    public function reordenar(Request $request): AnonymousResourceCollection
    {
        $datos = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer'],
        ]);

        $local = $request->user()->local;
        \Illuminate\Support\Facades\DB::transaction(function () use ($local, $datos) {
            foreach (array_values($datos['ids']) as $indice => $id) {
                $local->productos()->where('id', (int) $id)->update(['orden' => $indice]);
            }
        });

        return ProductoResource::collection($local->productos()->with('gruposOpciones.opciones')->get());
    }

    public function destroy(Producto $producto): JsonResponse
    {
        $this->authorize('delete', $producto);
        $producto->delete();

        return response()->json(null, 204);
    }
}
