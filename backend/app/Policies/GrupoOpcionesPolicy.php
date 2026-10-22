<?php

namespace App\Policies;

use App\Models\GrupoOpciones;
use App\Models\Usuario;

/** Un usuario solo administra registros de su propio local. */
class GrupoOpcionesPolicy
{
    public function view(Usuario $usuario, GrupoOpciones $grupo): bool
    {
        return $usuario->administra($grupo->local_id);
    }

    public function update(Usuario $usuario, GrupoOpciones $grupo): bool
    {
        return $usuario->administra($grupo->local_id);
    }

    public function delete(Usuario $usuario, GrupoOpciones $grupo): bool
    {
        return $usuario->administra($grupo->local_id);
    }
}
