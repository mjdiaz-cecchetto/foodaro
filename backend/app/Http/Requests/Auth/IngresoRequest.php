<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class IngresoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'max:190'],
            'contrasenia' => ['required', 'string', 'min:4', 'max:100'],
        ];
    }

    public function attributes(): array
    {
        return ['email' => 'correo electrónico', 'contrasenia' => 'contraseña'];
    }
}
