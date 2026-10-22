<?php

namespace App\Policies;

use App\Models\Producto;
use App\Models\Usuario;

/** Un usuario solo administra registros de su propio local. */
class ProductoPolicy
{
    public function view(Usuario $usuario, Producto $producto): bool
    {
        return $usuario->administra($producto->local_id);
    }

    public function update(Usuario $usuario, Producto $producto): bool
    {
        return $usuario->administra($producto->local_id);
    }

    public function delete(Usuario $usuario, Producto $producto): bool
    {
        return $usuario->administra($producto->local_id);
    }
}
