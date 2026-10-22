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
        if ($this->has('codigo')) {
            $this->merge(['codigo' => strtoupper(trim((string) $this->input('codigo')))]);
        }
    }

    public function rules(): array
    {
        $localId = $this->user()->local_id;
        $promocionId = $this->route('promocion')?->id;

        return [
            'titulo' => ['required', 'string', 'min:3', 'max:150'],
            'descuento' => ['required', 'integer', 'min:1', 'max:100'],
            'codigo' => [
                'required', 'string', 'min:2', 'max:30', 'alpha_num:ascii',
                Rule::unique('promociones', 'codigo')->where('local_id', $localId)->ignore($promocionId),
            ],
            'imagen' => ['nullable', 'url', 'max:500'],
            'activa' => ['sometimes', 'boolean'],
        ];
    }
}
