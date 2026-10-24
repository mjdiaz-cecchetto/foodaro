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
            'montoMinimo' => ['nullable', 'numeric', 'min:0', 'max:99999999'],
            'maxUsos' => ['nullable', 'integer', 'min:1', 'max:1000000'],
            'fechaVencimiento' => ['nullable', 'date_format:Y-m-d'],
            'activo' => ['sometimes', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $merge = [];
        if ($this->has('codigo') && is_string($this->codigo)) {
            $merge['codigo'] = strtoupper(trim($this->codigo));
        }
        if ($this->has('maxUsos') && ($this->maxUsos === '' || $this->maxUsos === 0 || $this->maxUsos === '0')) {
            $merge['maxUsos'] = null;
        }
        if ($this->has('fechaVencimiento') && $this->fechaVencimiento === '') {
            $merge['fechaVencimiento'] = null;
        }
        if ($merge) {
            $this->merge($merge);
        }
    }
}
