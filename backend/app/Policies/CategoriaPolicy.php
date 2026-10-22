<?php

namespace App\Policies;

use App\Models\Categoria;
use App\Models\Usuario;

/** Un usuario solo administra registros de su propio local. */
class CategoriaPolicy
{
    public function view(Usuario $usuario, Categoria $categoria): bool
    {
        return $usuario->administra($categoria->local_id);
    }

    public function update(Usuario $usuario, Categoria $categoria): bool
    {
        return $usuario->administra($categoria->local_id);
    }

    public function delete(Usuario $usuario, Categoria $categoria): bool
    {
        return $usuario->administra($categoria->local_id);
    }
}
