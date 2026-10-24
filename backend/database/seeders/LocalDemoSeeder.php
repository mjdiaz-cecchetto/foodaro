<?php

namespace Database\Seeders;

use App\Enums\RolUsuario;
use App\Models\Local;
use App\Models\Usuario;
use App\Services\GruposOpcionesServicio;
use App\Services\HorariosServicio;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Carga el local de demostración "demolocal" (mismo contenido que el mock del
 * frontend) con su usuario administrador. Es idempotente: si el local existe,
 * lo vuelve a crear desde cero.
 *
 * Datos: database/seeders/datos/demolocal.json
 */
class LocalDemoSeeder extends Seeder
{
    public function run(): void
    {
        $datos = json_decode(file_get_contents(__DIR__.'/datos/demolocal.json'), true, 512, JSON_THROW_ON_ERROR);
        $grupos = app(GruposOpcionesServicio::class);

        DB::transaction(function () use ($datos, $grupos) {
            Local::query()->where('slug', $datos['slug'])->delete();

            $p = $datos['perfil'];
            $c = $datos['configuracion'];

            $local = Local::create([
                'slug' => $datos['slug'],
                'nombre' => $p['nombre'],
                'eslogan' => $p['eslogan'],
                'rubro' => $p['rubro'],
                'logo_url' => $p['logoUrl'],
                'portada_url' => $p['portadaUrl'],
                'direccion' => $p['direccion'],
                'referencia_direccion' => $p['referenciaDireccion'],
                'maps_url' => $p['mapsUrl'],
                'whatsapp' => $p['contacto']['whatsapp'],
                'whatsapp_pedidos' => $p['contacto']['whatsappPedidos'] ?? $p['contacto']['whatsapp'],
                'instagram' => $p['contacto']['instagram'],
                'tiktok' => $p['contacto']['tiktok'],
                'telefono' => $p['contacto']['telefono'],
                'moneda' => $c['moneda'],
                'cargo_servicio' => $c['cargoServicio'],
                'etiqueta_cargo_servicio' => $c['etiquetaCargoServicio'],
                'activo' => true,
            ]);

            app(HorariosServicio::class)->guardar($local, $p['horarios']['semana'], $p['horarios']['excepciones']);

            Usuario::create([
                'local_id' => $local->id,
                'nombre' => 'Administrador Demo',
                'email' => env('DEMO_ADMIN_EMAIL', 'admin@demolocal.com'),
                'password' => env('DEMO_ADMIN_PASSWORD', 'demo1234'),
                'rol' => RolUsuario::Administrador,
                'activo' => true,
            ]);

            // Categorías: el id textual del mock pasa a ser el slug
            $categoriasPorSlug = [];
            foreach ($datos['categorias'] as $orden => $cat) {
                $categoriasPorSlug[$cat['id']] = $local->categorias()->create([
                    'nombre' => $cat['nombre'],
                    'slug' => $cat['id'],
                    'imagen_url' => $cat['imagen'],
                    'orden' => $orden,
                    'activa' => $cat['activa'] ?? true,
                ]);
            }

            foreach ($datos['productos'] as $orden => $prod) {
                $producto = $local->productos()->create([
                    'categoria_id' => $categoriasPorSlug[$prod['categoriaId']]->id,
                    'nombre' => $prod['nombre'],
                    'descripcion' => $prod['descripcion'],
                    'precio' => $prod['precio'],
                    'imagen_url' => $prod['imagen'],
                    'etiqueta' => $prod['etiqueta'] ?: null,
                    'tiempo_preparacion' => $prod['tiempoPreparacion'],
                    'calificacion' => $prod['calificacion'],
                    'disponible' => $prod['disponible'] ?? true,
                    'orden' => $orden,
                ]);
                $grupos->sincronizarDeProducto($producto, $prod['gruposOpciones'] ?? []);
            }

            foreach ($datos['promociones'] as $promo) {
                $local->promociones()->create([
                    'titulo' => $promo['titulo'],
                    'precio' => $promo['precio'] ?? 14500,
                    'descuento' => $promo['descuento'] ?? null,
                    'codigo' => null,
                    'imagen_url' => $promo['imagen'],
                    'activa' => $promo['activa'] ?? true,
                ]);
                if (! empty($promo['codigo']) && ! empty($promo['descuento'])) {
                    $local->cupones()->create([
                        'codigo' => strtoupper(trim($promo['codigo'])),
                        'descuento' => (int) $promo['descuento'],
                        'descripcion' => $promo['titulo'],
                        'activo' => $promo['activa'] ?? true,
                    ]);
                }
            }

            foreach ($datos['plantillasOpciones'] as $plantilla) {
                $grupos->crearPlantilla($local, $plantilla);
            }
        });

        $this->command?->info('Local demo cargado: /demolocal — admin '.env('DEMO_ADMIN_EMAIL', 'admin@demolocal.com'));
    }
}
