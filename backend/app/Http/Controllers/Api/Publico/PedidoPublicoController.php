<?php

namespace App\Http\Controllers\Api\Publico;

use App\Http\Controllers\Controller;
use App\Http\Requests\Publico\CrearPedidoRequest;
use App\Http\Resources\PedidoResource;
use App\Models\Local;
use App\Services\PedidoServicio;
use Illuminate\Http\JsonResponse;

/** Registro de pedidos desde la carta: POST /api/locales/{slug}/pedidos */
class PedidoPublicoController extends Controller
{
    public function __construct(private readonly PedidoServicio $pedidos) {}

    public function store(CrearPedidoRequest $request, string $slug): JsonResponse
    {
        $local = Local::query()->where('slug', strtolower($slug))->where('activo', true)->firstOrFail();
        if ($local->resumenSuscripcion()['cartaSuspendida']) {
            abort(423, 'La carta digital de este comercio no se encuentra disponible temporalmente.');
        }

        $pedido = $this->pedidos->crear($local, $request->validated());

        return (new PedidoResource($pedido))->response()->setStatusCode(201);
    }
}
