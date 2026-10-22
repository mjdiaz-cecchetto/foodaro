<?php

namespace App\Services;

use App\Models\Categoria;
use App\Models\Local;
use App\Models\Producto;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/** Altas y modificaciones del catálogo (categorías y productos) de un local. */
class CatalogoServicio
{
    public function __construct(private readonly GruposOpcionesServicio $gruposOpciones) {}

    /* ------------------------------ Categorías ------------------------------ */

    public function crearCategoria(Local $local, array $datos): Categoria
    {
        return $local->categorias()->create([
            'nombre' => trim($datos['nombre']),
            'slug' => $this->slugUnico($local, $datos['nombre']),
            'imagen_url' => $datos['imagen'] ?? null,
            'orden' => (int) $local->categorias()->max('orden') + 1,
            'activa' => $datos['activa'] ?? true,
        ]);
    }

    public function actualizarCategoria(Categoria $categoria, array $datos): Categoria
    {
        $categoria->fill([
            'nombre' => trim($datos['nombre']),
            'imagen_url' => $datos['imagen'] ?? $categoria->imagen_url,
            'activa' => $datos['activa'] ?? $categoria->activa,
        ]);
        if (array_key_exists('orden', $datos)) {
            $categoria->orden = (int) $datos['orden'];
        }
        $categoria->save();

        return $categoria;
    }

    /* ------------------------------- Productos ------------------------------ */

    public function crearProducto(Local $local, array $datos): Producto
    {
        return DB::transaction(function () use ($local, $datos) {
            $producto = $local->productos()->create([
                ...$this->atributosProducto($datos),
                'orden' => (int) $local->productos()->max('orden') + 1,
                'disponible' => $datos['disponible'] ?? true,
                'calificacion' => $datos['calificacion'] ?? 5.0,
            ]);
            $this->gruposOpciones->sincronizarDeProducto($producto, $datos['gruposOpciones'] ?? []);

            return $producto->load('gruposOpciones.opciones');
        });
    }

    public function actualizarProducto(Producto $producto, array $datos): Producto
    {
        return DB::transaction(function () use ($producto, $datos) {
            $producto->update($this->atributosProducto($datos));
            if (array_key_exists('gruposOpciones', $datos)) {
                $this->gruposOpciones->sincronizarDeProducto($producto, $datos['gruposOpciones'] ?? []);
            }

            return $producto->refresh()->load('gruposOpciones.opciones');
        });
    }

    private function atributosProducto(array $datos): array
    {
        return [
            'categoria_id' => $datos['categoriaId'],
            'nombre' => trim($datos['nombre']),
            'descripcion' => $datos['descripcion'] ?? null,
            'precio' => $datos['precio'],
            'imagen_url' => $datos['imagen'] ?? null,
            'etiqueta' => isset($datos['etiqueta']) && $datos['etiqueta'] !== '' ? trim($datos['etiqueta']) : null,
            'tiempo_preparacion' => $datos['tiempoPreparacion'] ?? null,
        ];
    }

    private function slugUnico(Local $local, string $nombre): string
    {
        $base = Str::slug($nombre) ?: 'categoria';
        $slug = $base;
        $i = 2;
        while ($local->categorias()->where('slug', $slug)->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }
}
