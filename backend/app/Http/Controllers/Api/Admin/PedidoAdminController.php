<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\EstadoPedido;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CambiarEstadoPedidoRequest;
use App\Http\Resources\PedidoResource;
use App\Models\Pedido;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/** Pedidos recibidos por el local (base para la futura consola de pedidos). */
class PedidoAdminController extends Controller
{
    use AuthorizesRequests;

    /** GET /api/admin/pedidos?estado=pendiente&pagina=1 */
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate(['estado' => ['nullable', Rule::enum(EstadoPedido::class)]]);

        $pedidos = $request->user()->local->pedidos()
            ->with('items.opciones')
            ->when($request->filled('estado'), fn ($q) => $q->where('estado', $request->input('estado')))
            ->latest('id')
            ->paginate(20);

        return PedidoResource::collection($pedidos);
    }

    public function show(Pedido $pedido): PedidoResource
    {
        $this->authorize('view', $pedido);

        return new PedidoResource($pedido->load('items.opciones'));
    }

    /** PATCH /api/admin/pedidos/{pedido}/estado */
    public function cambiarEstado(CambiarEstadoPedidoRequest $request, Pedido $pedido): PedidoResource
    {
        $this->authorize('update', $pedido);
        $pedido->update(['estado' => $request->validated('estado')]);

        return new PedidoResource($pedido->load('items.opciones'));
    }
}
