<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GuardarCuponRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->local_id !== null;
    }

    public function rules(): array
    {
        $localId = $this->user()->local_id;
        $cuponId = $this->route('cupon')?->id;

        return [
            'codigo' => [
                'required',
                'string',
                'max:30',
                'alpha_dash',
                Rule::unique('cupones', 'codigo')->where('local_id', $localId)->ignore($cuponId),
            ],
            'descuento' => ['required', 'integer', 'min:1', 'max:100'],
            'descripcion' => ['nullable', 'string', 'max:160'],
            'activo' => ['sometimes', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('codigo') && is_string($this->codigo)) {
            $this->merge(['codigo' => strtoupper(trim($this->codigo))]);
        }
    }
}
