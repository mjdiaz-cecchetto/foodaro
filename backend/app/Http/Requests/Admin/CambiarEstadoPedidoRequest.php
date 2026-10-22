<?php

namespace App\Http\Requests\Admin;

use App\Enums\EstadoPedido;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CambiarEstadoPedidoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['estado' => ['required', Rule::enum(EstadoPedido::class)]];
    }
}
