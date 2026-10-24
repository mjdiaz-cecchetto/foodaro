<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\GuardarCuponRequest;
use App\Http\Resources\CuponResource;
use App\Models\Cupon;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class CuponController extends Controller
{
    public function store(GuardarCuponRequest $request): CuponResource
    {
        $cupon = $request->user()->local->cupones()->create([
            'codigo' => $request->validated('codigo'),
            'descuento' => (int) $request->validated('descuento'),
            'descripcion' => $request->validated('descripcion') ?: null,
            'activo' => $request->boolean('activo', true),
        ]);

        return new CuponResource($cupon);
    }

    public function update(GuardarCuponRequest $request, Cupon $cupon): CuponResource
    {
        $this->autorizar($request, $cupon);

        $cupon->update([
            'codigo' => $request->validated('codigo'),
            'descuento' => (int) $request->validated('descuento'),
            'descripcion' => $request->validated('descripcion') ?: null,
            'activo' => $request->has('activo') ? $request->boolean('activo') : $cupon->activo,
        ]);

        return new CuponResource($cupon);
    }

    /** PATCH /api/admin/cupones/{cupon}/estado */
    public function alternarEstado(Request $request, Cupon $cupon): CuponResource
    {
        $this->autorizar($request, $cupon);
        $cupon->update(['activo' => ! $cupon->activo]);

        return new CuponResource($cupon);
    }

    public function destroy(Request $request, Cupon $cupon): Response
    {
        $this->autorizar($request, $cupon);
        $cupon->delete();

        return response()->noContent();
    }

    private function autorizar(Request $request, Cupon $cupon): void
    {
        abort_unless($cupon->local_id === $request->user()->local_id, 403);
    }
}
