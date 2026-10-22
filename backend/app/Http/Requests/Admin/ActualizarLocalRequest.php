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
            'perfil.estado' => ['nullable', 'string', 'max:80'],
            'perfil.horarios.lunesAJueves' => ['nullable', 'string', 'max:80'],
            'perfil.horarios.viernesYSabado' => ['nullable', 'string', 'max:80'],
            'perfil.horarios.domingo' => ['nullable', 'string', 'max:80'],
            'perfil.contacto.whatsapp' => ['required', 'string', 'min:6', 'max:40'],
            'perfil.contacto.instagram' => ['nullable', 'string', 'max:80'],
            'perfil.contacto.tiktok' => ['nullable', 'string', 'max:80'],
            'perfil.contacto.telefono' => ['nullable', 'string', 'max:40'],
            'configuracion.moneda' => ['sometimes', 'string', 'size:3'],
            'configuracion.cargoServicio' => ['sometimes', 'numeric', 'min:0', 'max:99999999'],
            'configuracion.etiquetaCargoServicio' => ['sometimes', 'string', 'max:80'],
        ];
    }
}
