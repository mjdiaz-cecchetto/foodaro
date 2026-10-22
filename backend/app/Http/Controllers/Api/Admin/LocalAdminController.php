<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ActualizarLocalRequest;
use App\Http\Resources\LocalResource;
use App\Models\Local;
use App\Services\HorariosServicio;
use Illuminate\Http\Request;

/** Datos del local del usuario autenticado. */
class LocalAdminController extends Controller
{
    public function __construct(private readonly HorariosServicio $horarios) {}

    /** GET /api/admin/local — local completo (incluye plantillas de opciones y productos no disponibles). */
    public function show(Request $request): LocalResource
    {
        $local = $this->localDe($request)->load([
            'horarios',
            'excepcionesHorario',
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
            'whatsapp' => $p['contacto']['whatsapp'],
            'whatsapp_pedidos' => $p['contacto']['whatsappPedidos'],
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

        if (isset($p['horarios'])) {
            $this->horarios->guardar($local, $p['horarios']['semana'] ?? [], $p['horarios']['excepciones'] ?? []);
        }

        return new LocalResource($local->load(['horarios', 'excepcionesHorario']));
    }

    private function localDe(Request $request): Local
    {
        return $request->user()->local ?? abort(403, 'El usuario no tiene un local asignado.');
    }
}
