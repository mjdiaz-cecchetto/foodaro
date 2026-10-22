<?php

namespace App\Http\Requests\Admin;

use App\Enums\TipoSeleccion;
use Illuminate\Validation\Rule;

/** Reglas reutilizables para un grupo de opciones (solo o anidado en un producto). */
class GrupoOpcionesReglas
{
    /** Reglas para `gruposOpciones[]` dentro de un producto. */
    public static function anidadas(string $campo): array
    {
        return [
            $campo => ['sometimes', 'array', 'max:20'],
            "{$campo}.*.nombre" => ['required', 'string', 'min:1', 'max:100'],
            "{$campo}.*.tipo" => ['required', Rule::enum(TipoSeleccion::class)],
            "{$campo}.*.obligatorio" => ['sometimes', 'boolean'],
            "{$campo}.*.maximo" => ['nullable', 'integer', 'min:1', 'max:50'],
            "{$campo}.*.opciones" => ['required', 'array', 'min:1', 'max:50'],
            "{$campo}.*.opciones.*.etiqueta" => ['required', 'string', 'min:1', 'max:100'],
            "{$campo}.*.opciones.*.precioAdicional" => ['nullable', 'numeric', 'min:0', 'max:99999999'],
            "{$campo}.*.opciones.*.porDefecto" => ['sometimes', 'boolean'],
        ];
    }

    /** Reglas para un grupo suelto (plantilla). */
    public static function simples(): array
    {
        return [
            'nombre' => ['required', 'string', 'min:1', 'max:100'],
            'tipo' => ['required', Rule::enum(TipoSeleccion::class)],
            'obligatorio' => ['sometimes', 'boolean'],
            'maximo' => ['nullable', 'integer', 'min:1', 'max:50'],
            'opciones' => ['required', 'array', 'min:1', 'max:50'],
            'opciones.*.etiqueta' => ['required', 'string', 'min:1', 'max:100'],
            'opciones.*.precioAdicional' => ['nullable', 'numeric', 'min:0', 'max:99999999'],
            'opciones.*.porDefecto' => ['sometimes', 'boolean'],
        ];
    }
}
