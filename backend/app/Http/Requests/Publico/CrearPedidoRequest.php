<?php

namespace App\Http\Requests\Publico;

use App\Enums\MedioPago;
use App\Enums\ModoEntrega;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Pedido enviado desde la carta pública (misma forma que `BorradorPedido` en Angular). */
class CrearPedidoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1', 'max:60'],
            'items.*.productoId' => ['nullable', 'required_without:items.*.promocionId', 'integer'],
            'items.*.promocionId' => ['nullable', 'required_without:items.*.productoId', 'integer'],
            'items.*.cantidad' => ['required', 'integer', 'min:1', 'max:99'],
            'items.*.notas' => ['nullable', 'string', 'max:255'],
            'items.*.opciones' => ['nullable', 'array', 'max:30'],
            'items.*.opciones.*.opcionId' => ['required', 'integer'],

            'codigoPromo' => ['nullable', 'string', 'max:30'],
            'modoEntrega' => ['required', Rule::enum(ModoEntrega::class)],
            'cliente.nombre' => ['required', 'string', 'min:2', 'max:120'],
            'cliente.telefono' => ['required', 'string', 'min:6', 'max:40'],

            'direccion' => ['exclude_unless:modoEntrega,envio', 'required', 'array'],
            'direccion.calle' => ['exclude_unless:modoEntrega,envio', 'required', 'string', 'min:4', 'max:150'],
            'direccion.pisoDepto' => ['nullable', 'string', 'max:60'],
            'direccion.referencia' => ['nullable', 'string', 'max:150'],

            'medioPago' => ['required', Rule::enum(MedioPago::class)],
            'montoEfectivo' => ['nullable', 'numeric', 'min:0', 'max:99999999'],
            'comentarios' => ['nullable', 'string', 'max:500'],
        ];
    }
}
