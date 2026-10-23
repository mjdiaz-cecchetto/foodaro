<?php

namespace App\Services;

use App\Models\GrupoOpciones;
use App\Models\Local;
use App\Models\Producto;
use Illuminate\Support\Facades\DB;

/**
 * Persistencia de grupos de opciones (de productos y plantillas del local).
 * Trabaja con el mismo formato anidado que usa el frontend:
 * [{ nombre, tipo, obligatorio, maximo, opciones: [{ etiqueta, precioAdicional, porDefecto }] }]
 */
class GruposOpcionesServicio
{
    /** Reemplaza por completo los grupos de un producto. */
    public function sincronizarDeProducto(Producto $producto, array $grupos): void
    {
        DB::transaction(function () use ($producto, $grupos) {
            $producto->gruposOpciones()->delete();
            foreach (array_values($grupos) as $orden => $datos) {
                $this->crearGrupo($producto->local_id, $producto->id, $datos, $orden);
            }
        });
    }

    /** Crea una plantilla del local (producto_id = null). */
    public function crearPlantilla(Local $local, array $datos): GrupoOpciones
    {
        $orden = (int) $local->plantillasOpciones()->max('orden') + 1;

        return DB::transaction(fn () => $this->crearGrupo($local->id, null, $datos, $orden));
    }

    /** Reemplaza nombre, tipo y opciones de un grupo existente (plantilla o de producto). */
    public function actualizarGrupo(GrupoOpciones $grupo, array $datos): GrupoOpciones
    {
        return DB::transaction(function () use ($grupo, $datos) {
            $grupo->update($this->atributosGrupo($datos));
            $grupo->opciones()->delete();
            $this->crearOpciones($grupo, $datos['opciones'] ?? []);

            return $grupo->refresh()->load('opciones');
        });
    }

    private function crearGrupo(int $localId, ?int $productoId, array $datos, int $orden): GrupoOpciones
    {
        $grupo = GrupoOpciones::create([
            'local_id' => $localId,
            'producto_id' => $productoId,
            'orden' => $orden,
            ...$this->atributosGrupo($datos),
        ]);
        $this->crearOpciones($grupo, $datos['opciones'] ?? []);

        return $grupo;
    }

    private function atributosGrupo(array $datos): array
    {
        $tipo = $datos['tipo'] ?? 'unica';

        return [
            'nombre' => trim($datos['nombre']),
            'tipo' => $tipo,
            'modo_precio' => $datos['modoPrecio'] ?? 'adicional',
            'obligatorio' => (bool) ($datos['obligatorio'] ?? false),
            // El máximo solo tiene sentido en selección múltiple
            'maximo' => $tipo === 'multiple' && ! empty($datos['maximo']) ? (int) $datos['maximo'] : null,
        ];
    }

    private function crearOpciones(GrupoOpciones $grupo, array $opciones): void
    {
        $esInformativo = ($grupo->modo_precio?->value ?? 'adicional') === 'informativo';
        foreach (array_values($opciones) as $orden => $opcion) {
            // Si el grupo es obligatorio, el primer ítem queda marcado por defecto en la carta
            $porDefecto = $grupo->obligatorio && $orden === 0;
            $grupo->opciones()->create([
                'etiqueta' => trim($opcion['etiqueta']),
                'precio_adicional' => $esInformativo ? 0 : (float) ($opcion['precioAdicional'] ?? 0),
                'por_defecto' => $porDefecto,
                'orden' => $orden,
            ]);
        }
    }
}
