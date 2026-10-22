<?php

namespace Tests\Feature;

use App\Models\Local;
use App\Models\Usuario;
use Database\Seeders\LocalDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ApiPublicaTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(LocalDemoSeeder::class);
    }

    public function test_devuelve_la_carta_del_local_demo(): void
    {
        $this->getJson('/api/locales/demolocal')
            ->assertOk()
            ->assertJsonPath('data.slug', 'demolocal')
            ->assertJsonPath('data.perfil.nombre', 'Demo Local')
            ->assertJsonPath('data.configuracion.cargoServicio', 0.0)
            ->assertJsonCount(10, 'data.categorias')
            ->assertJsonCount(50, 'data.productos')
            ->assertJsonCount(3, 'data.promociones')
            ->assertJsonMissingPath('data.plantillasOpciones');
    }

    public function test_un_local_inexistente_da_404(): void
    {
        $this->getJson('/api/locales/noexiste')->assertNotFound();
    }

    public function test_registra_un_pedido_recalculando_precios_en_el_servidor(): void
    {
        $local = Local::where('slug', 'demolocal')->firstOrFail();
        $pizza = $local->productos()->where('nombre', 'Muzzarella')->with('gruposOpciones.opciones')->firstOrFail();
        $tamanio = $pizza->gruposOpciones->firstWhere('nombre', 'Tamaño');
        $doce = $tamanio->opciones->firstWhere('etiqueta', '12 porciones');
        $extras = $pizza->gruposOpciones->firstWhere('nombre', 'Extras');
        $borde = $extras->opciones->firstWhere('etiqueta', 'Borde relleno');

        $respuesta = $this->postJson('/api/locales/demolocal/pedidos', [
            'items' => [[
                'productoId' => $pizza->id,
                'cantidad' => 2,
                'notas' => 'Bien cocida',
                'opciones' => [['opcionId' => $doce->id], ['opcionId' => $borde->id]],
            ]],
            'codigoPromo' => 'DEMO20',
            'modoEntrega' => 'envio',
            'cliente' => ['nombre' => 'Juan Pérez', 'telefono' => '11 5555 1234'],
            'direccion' => ['calle' => 'Av. Corrientes 1234', 'pisoDepto' => '3° B', 'referencia' => ''],
            'medioPago' => 'efectivo',
            'montoEfectivo' => 60000,
            'comentarios' => '',
        ]);

        // (12.500 + 4.500 + 3.000) x 2 = 40.000 ; -20% = 32.000 ; sin cargo de servicio
        $respuesta->assertCreated()
            ->assertJsonPath('data.numero', 1)
            ->assertJsonPath('data.estado', 'pendiente')
            ->assertJsonPath('data.totales.subtotal', 40000.0)
            ->assertJsonPath('data.totales.descuento', 8000.0)
            ->assertJsonPath('data.totales.cargoServicio', 0.0)
            ->assertJsonPath('data.totales.total', 32000.0)
            ->assertJsonPath('data.items.0.opciones.0.etiqueta', '12 porciones')
            ->assertJsonPath('data.direccion.calle', 'Av. Corrientes 1234');

        $this->assertDatabaseCount('pedidos', 1);
        $this->assertDatabaseCount('pedido_item_opciones', 2);
    }

    public function test_rechaza_un_pedido_sin_la_opcion_obligatoria(): void
    {
        $local = Local::where('slug', 'demolocal')->firstOrFail();
        $pizza = $local->productos()->where('nombre', 'Muzzarella')->firstOrFail();

        $this->postJson('/api/locales/demolocal/pedidos', [
            'items' => [['productoId' => $pizza->id, 'cantidad' => 1, 'opciones' => []]],
            'modoEntrega' => 'retiro',
            'cliente' => ['nombre' => 'Ana', 'telefono' => '11 4444 5555'],
            'medioPago' => 'transferencia',
        ])->assertUnprocessable()->assertJsonValidationErrors(['items.0.opciones']);
    }

    public function test_el_envio_requiere_direccion(): void
    {
        $local = Local::where('slug', 'demolocal')->firstOrFail();
        $flan = $local->productos()->where('nombre', 'like', 'Flan%')->firstOrFail();

        $this->postJson('/api/locales/demolocal/pedidos', [
            'items' => [['productoId' => $flan->id, 'cantidad' => 1]],
            'modoEntrega' => 'envio',
            'cliente' => ['nombre' => 'Ana', 'telefono' => '11 4444 5555'],
            'medioPago' => 'debito',
        ])->assertUnprocessable()->assertJsonValidationErrors(['direccion.calle']);
    }

    public function test_login_y_panel_admin(): void
    {
        $ingreso = $this->postJson('/api/auth/ingreso', ['email' => 'admin@demolocal.com', 'contrasenia' => 'demo1234'])
            ->assertOk()
            ->assertJsonPath('data.usuario.local.slug', 'demolocal');
        $token = $ingreso->json('data.token');

        $this->postJson('/api/auth/ingreso', ['email' => 'admin@demolocal.com', 'contrasenia' => 'mala'])
            ->assertUnprocessable();

        $this->getJson('/api/admin/local')->assertUnauthorized();

        $this->withToken($token)->getJson('/api/admin/local')
            ->assertOk()
            ->assertJsonCount(10, 'data.plantillasOpciones');

        $categoria = $this->withToken($token)->postJson('/api/admin/categorias', ['nombre' => 'Ensaladas', 'imagen' => 'https://x.test/e.png'])
            ->assertCreated()->json('data');

        $producto = $this->withToken($token)->postJson('/api/admin/productos', [
            'nombre' => 'César',
            'categoriaId' => $categoria['id'],
            'descripcion' => 'Lechuga, pollo, parmesano',
            'precio' => 9800,
            'imagen' => 'https://x.test/c.png',
            'gruposOpciones' => [[
                'nombre' => 'Tamaño', 'tipo' => 'unica', 'obligatorio' => true,
                'opciones' => [
                    ['etiqueta' => 'Individual', 'precioAdicional' => 0, 'porDefecto' => true],
                    ['etiqueta' => 'Para compartir', 'precioAdicional' => 4000],
                ],
            ]],
        ])->assertCreated()->assertJsonCount(1, 'data.gruposOpciones')->json('data');

        $this->withToken($token)->patchJson("/api/admin/productos/{$producto['id']}/disponibilidad")
            ->assertOk()->assertJsonPath('data.disponible', false);

        // La carta pública no muestra el producto agotado
        $this->getJson('/api/locales/demolocal')->assertJsonMissing(['nombre' => 'César']);

        $this->withToken($token)->deleteJson("/api/admin/categorias/{$categoria['id']}")->assertStatus(409);
        $this->withToken($token)->deleteJson("/api/admin/productos/{$producto['id']}")->assertNoContent();
        $this->withToken($token)->deleteJson("/api/admin/categorias/{$categoria['id']}")->assertNoContent();
    }

    public function test_un_admin_no_puede_tocar_recursos_de_otro_local(): void
    {
        $otro = Local::create(['slug' => 'otro', 'nombre' => 'Otro', 'whatsapp' => '123456']);
        $usuario = Usuario::create(['local_id' => $otro->id, 'nombre' => 'X', 'email' => 'x@otro.com', 'password' => 'secreto1']);
        $demo = Local::where('slug', 'demolocal')->firstOrFail();
        $producto = $demo->productos()->firstOrFail();

        Sanctum::actingAs($usuario);
        $this
            ->patchJson("/api/admin/productos/{$producto->id}/disponibilidad")
            ->assertForbidden();
    }
}
