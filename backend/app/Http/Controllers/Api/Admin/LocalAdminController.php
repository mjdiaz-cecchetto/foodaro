<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ActualizarLocalRequest;
use App\Http\Resources\LocalResource;
use App\Models\Local;
use Illuminate\Http\Request;

/** Datos del local del usuario autenticado. */
class LocalAdminController extends Controller
{
    /** GET /api/admin/local — local completo (incluye plantillas de opciones y productos no disponibles). */
    public function show(Request $request): LocalResource
    {
        $local = $this->localDe($request)->load([
            'categorias',
            'productos.gruposOpciones.opciones',
            'promociones',
            'plantillasOpciones.opciones',
        ]);

        return new LocalResource($local);
    }

    /** PUT /api/admin/local — perfil y configuración. */
    public function update(ActualizarLocalRequest $request): LocalResource
    {
        $local = $this->localDe($request);
        $p = $request->validated('perfil');
        $c = $request->validated('configuracion') ?? [];

        $local->fill([
            'nombre' => $p['nombre'],
            'eslogan' => $p['eslogan'] ?? null,
            'rubro' => $p['rubro'] ?? null,
            'logo_url' => $p['logoUrl'] ?? $local->logo_url,
            'portada_url' => $p['portadaUrl'] ?? $local->portada_url,
            'direccion' => $p['direccion'] ?? null,
            'referencia_direccion' => $p['referenciaDireccion'] ?? null,
            'maps_url' => $p['mapsUrl'] ?? null,
            'estado' => $p['estado'] ?? $local->estado,
            'horario_lunes_a_jueves' => $p['horarios']['lunesAJueves'] ?? null,
            'horario_viernes_y_sabado' => $p['horarios']['viernesYSabado'] ?? null,
            'horario_domingo' => $p['horarios']['domingo'] ?? null,
            'whatsapp' => $p['contacto']['whatsapp'],
            'instagram' => $p['contacto']['instagram'] ?? null,
            'tiktok' => $p['contacto']['tiktok'] ?? null,
            'telefono' => $p['contacto']['telefono'] ?? null,
        ]);

        if (isset($c['moneda'])) {
            $local->moneda = strtoupper($c['moneda']);
        }
        if (array_key_exists('cargoServicio', $c)) {
            $local->cargo_servicio = $c['cargoServicio'];
        }
        if (isset($c['etiquetaCargoServicio'])) {
            $local->etiqueta_cargo_servicio = $c['etiquetaCargoServicio'];
        }
        $local->save();

        return new LocalResource($local);
    }

    private function localDe(Request $request): Local
    {
        return $request->user()->local ?? abort(403, 'El usuario no tiene un local asignado.');
    }
}
