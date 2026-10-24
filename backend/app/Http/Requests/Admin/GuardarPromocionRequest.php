<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GuardarPromocionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $codigo = trim((string) $this->input('codigo', ''));
        $this->merge([
            'codigo' => $codigo !== '' ? strtoupper($codigo) : null,
            'descuento' => $this->filled('descuento') && (int) $this->input('descuento') > 0
                ? (int) $this->input('descuento')
                : null,
        ]);
    }

    public function rules(): array
    {
        $localId = $this->user()->local_id;
        $promocionId = $this->route('promocion')?->id;

        return [
            'titulo' => ['required', 'string', 'min:3', 'max:150'],
            'precio' => ['required', 'numeric', 'min:0', 'max:99999999'],
            'descuento' => ['nullable', 'integer', 'min:1', 'max:100'],
            'codigo' => [
                'nullable', 'string', 'min:2', 'max:30', 'alpha_num:ascii',
                Rule::unique('promociones', 'codigo')->where('local_id', $localId)->ignore($promocionId),
            ],
            'imagen' => ['nullable', 'url', 'max:500'],
            'activa' => ['sometimes', 'boolean'],
        ];
    }
}
