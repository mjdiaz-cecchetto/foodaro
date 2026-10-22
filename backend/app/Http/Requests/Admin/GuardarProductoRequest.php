<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GuardarProductoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $localId = $this->user()->local_id;

        return [
            'nombre' => ['required', 'string', 'min:2', 'max:150'],
            'categoriaId' => ['required', 'integer', Rule::exists('categorias', 'id')->where('local_id', $localId)],
            'descripcion' => ['nullable', 'string', 'max:2000'],
            'precio' => ['required', 'numeric', 'min:0', 'max:99999999'],
            'imagen' => ['nullable', 'url', 'max:500'],
            'etiqueta' => ['nullable', 'string', 'max:40'],
            'tiempoPreparacion' => ['nullable', 'string', 'max:40'],
            'disponible' => ['sometimes', 'boolean'],
            ...GrupoOpcionesReglas::anidadas('gruposOpciones'),
        ];
    }
}
