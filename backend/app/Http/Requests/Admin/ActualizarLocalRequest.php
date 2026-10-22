<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/** Perfil + configuración del local (misma forma que `PerfilLocal`/`ConfiguracionLocal` en Angular). */
class ActualizarLocalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** Un día abierto necesita al menos una franja; una excepción con horario especial también. */
    public function withValidator(\Illuminate\Validation\Validator $validator): void
    {
        $validator->after(function ($v) {
            foreach ($this->input('perfil.horarios.semana', []) as $i => $dia) {
                if (! empty($dia['abierto']) && empty($dia['franjas'])) {
                    $v->errors()->add("perfil.horarios.semana.{$i}.franjas", 'Un día abierto necesita al menos una franja horaria.');
                }
            }
            foreach ($this->input('perfil.horarios.excepciones', []) as $i => $exc) {
                if (isset($exc['cerrado']) && ! $exc['cerrado'] && empty($exc['franjas'])) {
                    $v->errors()->add("perfil.horarios.excepciones.{$i}.franjas", 'Indicá el horario especial de ese día o marcalo como cerrado.');
                }
            }
        });
    }

    public function rules(): array
    {
        return [
            'perfil.nombre' => ['required', 'string', 'min:2', 'max:120'],
            'perfil.eslogan' => ['nullable', 'string', 'max:255'],
            'perfil.rubro' => ['nullable', 'string', 'max:120'],
            'perfil.logoUrl' => ['nullable', 'url', 'max:500'],
            'perfil.portadaUrl' => ['nullable', 'url', 'max:500'],
            'perfil.direccion' => ['nullable', 'string', 'max:255'],
            'perfil.referenciaDireccion' => ['nullable', 'string', 'max:255'],
            'perfil.mapsUrl' => ['nullable', 'url', 'max:500'],
            'perfil.horarios' => ['sometimes', 'array'],
            'perfil.horarios.semana' => ['required_with:perfil.horarios', 'array', 'size:7'],
            'perfil.horarios.semana.*.dia' => ['required', 'integer', 'between:1,7', 'distinct'],
            'perfil.horarios.semana.*.abierto' => ['required', 'boolean'],
            'perfil.horarios.semana.*.franjas' => ['present', 'array', 'max:4'],
            'perfil.horarios.semana.*.franjas.*.desde' => ['required', 'date_format:H:i'],
            'perfil.horarios.semana.*.franjas.*.hasta' => ['required', 'date_format:H:i'],
            'perfil.horarios.excepciones' => ['present', 'array', 'max:120'],
            'perfil.horarios.excepciones.*.fecha' => ['required', 'date_format:Y-m-d', 'distinct'],
            'perfil.horarios.excepciones.*.cerrado' => ['required', 'boolean'],
            'perfil.horarios.excepciones.*.motivo' => ['nullable', 'string', 'max:120'],
            'perfil.horarios.excepciones.*.franjas' => ['present', 'array', 'max:4'],
            'perfil.horarios.excepciones.*.franjas.*.desde' => ['required', 'date_format:H:i'],
            'perfil.horarios.excepciones.*.franjas.*.hasta' => ['required', 'date_format:H:i'],
            'perfil.contacto.whatsapp' => ['required', 'string', 'min:6', 'max:40'],
            'perfil.contacto.whatsappPedidos' => ['required', 'string', 'min:6', 'max:40', 'regex:/^[\d\s()+-]+$/'],
            'perfil.contacto.instagram' => ['nullable', 'string', 'max:80'],
            'perfil.contacto.tiktok' => ['nullable', 'string', 'max:80'],
            'perfil.contacto.telefono' => ['nullable', 'string', 'max:40'],
            'configuracion.moneda' => ['sometimes', 'string', 'size:3'],
            'configuracion.cargoServicio' => ['sometimes', 'numeric', 'min:0', 'max:99999999'],
            'configuracion.etiquetaCargoServicio' => ['sometimes', 'string', 'max:80'],
        ];
    }
}
