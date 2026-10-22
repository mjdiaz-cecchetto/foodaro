<?php

namespace App\Policies;

use App\Models\Pedido;
use App\Models\Usuario;

/** Un usuario solo administra registros de su propio local. */
class PedidoPolicy
{
    public function view(Usuario $usuario, Pedido $pedido): bool
    {
        return $usuario->administra($pedido->local_id);
    }

    public function update(Usuario $usuario, Pedido $pedido): bool
    {
        return $usuario->administra($pedido->local_id);
    }

    public function delete(Usuario $usuario, Pedido $pedido): bool
    {
        return $usuario->administra($pedido->local_id);
    }
}
