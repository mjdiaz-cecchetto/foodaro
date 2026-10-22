<?php

namespace App\Policies;

use App\Models\Promocion;
use App\Models\Usuario;

/** Un usuario solo administra registros de su propio local. */
class PromocionPolicy
{
    public function view(Usuario $usuario, Promocion $promocion): bool
    {
        return $usuario->administra($promocion->local_id);
    }

    public function update(Usuario $usuario, Promocion $promocion): bool
    {
        return $usuario->administra($promocion->local_id);
    }

    public function delete(Usuario $usuario, Promocion $promocion): bool
    {
        return $usuario->administra($promocion->local_id);
    }
}
