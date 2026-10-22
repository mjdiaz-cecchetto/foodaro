<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\GuardarPromocionRequest;
use App\Http\Resources\PromocionResource;
use App\Models\Promocion;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PromocionController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request): AnonymousResourceCollection
    {
        return PromocionResource::collection($request->user()->local->promociones);
    }

    public function store(GuardarPromocionRequest $request): JsonResponse
    {
        $promo = $request->user()->local->promociones()->create($this->atributos($request->validated()));

        return (new PromocionResource($promo))->response()->setStatusCode(201);
    }

    public function update(GuardarPromocionRequest $request, Promocion $promocion): PromocionResource
    {
        $this->authorize('update', $promocion);
        $promocion->update($this->atributos($request->validated()));

        return new PromocionResource($promocion);
    }

    /** PATCH /api/admin/promociones/{promocion}/estado — activa/pausa. */
    public function alternarEstado(Promocion $promocion): PromocionResource
    {
        $this->authorize('update', $promocion);
        $promocion->update(['activa' => ! $promocion->activa]);

        return new PromocionResource($promocion);
    }

    public function destroy(Promocion $promocion): JsonResponse
    {
        $this->authorize('delete', $promocion);
        $promocion->delete();

        return response()->json(null, 204);
    }

    private function atributos(array $datos): array
    {
        return [
            'titulo' => trim($datos['titulo']),
            'descuento' => $datos['descuento'],
            'codigo' => $datos['codigo'],
            'imagen_url' => $datos['imagen'] ?? null,
            'activa' => $datos['activa'] ?? true,
        ];
    }
}
