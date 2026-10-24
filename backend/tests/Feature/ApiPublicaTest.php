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
            ->assertJsonPath('data.configuracion.cargoServicio', fn ($v) => (float) $v === 0.0)
            ->assertJsonPath('data.perfil.contacto.whatsappPedidos', '+54 9 385 311-5268')
            ->assertJsonCount(7, 'data.perfil.horarios.semana')
            ->assertJsonPath('data.perfil.horarios.semana.4.franjas.1.hasta', '01:30')
            ->assertJsonPath('data.perfil.horarios.excepciones.0.cerrado', true)
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
            ->assertJsonPath('data.totales.subtotal', fn ($v) => (float) $v === 40000.0)
            ->assertJsonPath('data.totales.descuento', fn ($v) => (float) $v === 8000.0)
            ->assertJsonPath('data.totales.cargoServicio', fn ($v) => (float) $v === 0.0)
            ->assertJsonPath('data.totales.total', fn ($v) => (float) $v === 32000.0)
            ->assertJsonPath('data.items.0.opciones.0.etiqueta', '12 porciones')
            ->assertJsonPath('data.direccion.calle', 'Av. Corrientes 1234');

        $this->assertDatabaseCount('pedidos', 1);
        $this->assertDatabaseCount('pedido_item_opciones', 2);
    }

    public function test_variante_reemplaza_el_precio_base_al_pedir(): void
    {
        $local = Local::where('slug', 'demolocal')->firstOrFail();
        $pizza = $local->productos()->where('nombre', 'Muzzarella')->with('gruposOpciones.opciones')->firstOrFail();
        $tamanio = $pizza->gruposOpciones->firstWhere('nombre', 'Tamaño');
        $tamanio->update(['modo_precio' => 'variante']);
        $mediaPizza = $tamanio->opciones->firstWhere('etiqueta', '6 porciones');
        $mediaPizza->update(['etiqueta' => '4 porciones (Media pizza)', 'precio_adicional' => 7000]);

        $extras = $pizza->gruposOpciones->firstWhere('nombre', 'Extras');
        $borde = $extras->opciones->firstWhere('etiqueta', 'Borde relleno'); // +$3.000

        $respuesta = $this->postJson('/api/locales/demolocal/pedidos', [
            'items' => [[
                'productoId' => $pizza->id,
                'cantidad' => 1,
                'notas' => '',
                'opciones' => [['opcionId' => $mediaPizza->id], ['opcionId' => $borde->id]],
            ]],
            'modoEntrega' => 'retiro',
            'cliente' => ['nombre' => 'Ana', 'telefono' => '11 4444 5555'],
            'medioPago' => 'transferencia',
        ]);

        // Media pizza ($7.000 reemplaza $12.500) + Borde relleno (+$3.000) = $10.000
        $respuesta->assertCreated()
            ->assertJsonPath('data.totales.subtotal', fn ($v) => (float) $v === 10000.0)
            ->assertJsonPath('data.totales.total', fn ($v) => (float) $v === 10000.0);
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

        // La carta pública incluye el producto marcado como no disponible (disponible = false), pero no permite pedirlo
        $carta = $this->getJson('/api/locales/demolocal')->assertOk()->json('data.productos');
        $cesarEnCarta = collect($carta)->firstWhere('id', $producto['id']);
        $this->assertNotNull($cesarEnCarta);
        $this->assertFalse($cesarEnCarta['disponible']);

        $this->postJson('/api/locales/demolocal/pedidos', [
            'items' => [['productoId' => $producto['id'], 'cantidad' => 1, 'opciones' => []]],
            'modoEntrega' => 'retiro',
            'cliente' => ['nombre' => 'Ana', 'telefono' => '11 4444 5555'],
            'medioPago' => 'transferencia',
        ])->assertUnprocessable();

        $this->withToken($token)->deleteJson("/api/admin/categorias/{$categoria['id']}")->assertStatus(409);
        $this->withToken($token)->deleteJson("/api/admin/productos/{$producto['id']}")->assertNoContent();
        $this->withToken($token)->deleteJson("/api/admin/categorias/{$categoria['id']}")->assertNoContent();
    }

    public function test_actualiza_horarios_con_dias_cerrados_y_excepciones(): void
    {
        $token = $this->postJson('/api/auth/ingreso', ['email' => 'admin@demolocal.com', 'contrasenia' => 'demo1234'])->json('data.token');
        $perfil = $this->withToken($token)->getJson('/api/admin/local')->json('data.perfil');

        $perfil['horarios']['semana'][0] = ['dia' => 1, 'abierto' => false, 'franjas' => []]; // lunes cerrado
        $perfil['horarios']['excepciones'] = [
            ['fecha' => now()->addDays(3)->toDateString(), 'cerrado' => true, 'motivo' => 'Feriado', 'franjas' => []],
            ['fecha' => now()->addDays(4)->toDateString(), 'cerrado' => false, 'motivo' => null, 'franjas' => [['desde' => '18:00', 'hasta' => '23:00']]],
        ];

        $this->withToken($token)->putJson('/api/admin/local', ['perfil' => $perfil])
            ->assertOk()
            ->assertJsonPath('data.perfil.horarios.semana.0.abierto', false)
            ->assertJsonCount(2, 'data.perfil.horarios.excepciones')
            ->assertJsonPath('data.perfil.horarios.excepciones.1.franjas.0.hasta', '23:00');

        // Un día abierto sin franjas es inválido
        $perfil['horarios']['semana'][1] = ['dia' => 2, 'abierto' => true, 'franjas' => []];
        $this->withToken($token)->putJson('/api/admin/local', ['perfil' => $perfil])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['perfil.horarios.semana.1.franjas']);

        $this->assertDatabaseCount('excepciones_horario', 2);
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

    public function test_promocion_con_precio_sin_cupon_edicion_y_pedido_directo(): void
    {
        $token = $this->postJson('/api/auth/ingreso', ['email' => 'admin@demolocal.com', 'contrasenia' => 'demo1234'])
            ->json('data.token');

        $promo = $this->withToken($token)->postJson('/api/admin/promociones', [
            'titulo' => '2 Burgers Dobles + Papas',
            'precio' => 18500,
            'descuento' => 0,
            'codigo' => '',
            'imagen' => 'https://x.test/promo.png',
            'activa' => true,
        ])->assertCreated()
            ->assertJsonPath('data.precio', fn ($v) => (float) $v === 18500.0)
            ->assertJsonPath('data.codigo', '')
            ->json('data');

        $this->withToken($token)->putJson("/api/admin/promociones/{$promo['id']}", [
            'titulo' => '2 Burgers Dobles + Papas + Gaseosa',
            'precio' => 19900,
            'descuento' => 15,
            'codigo' => '',
            'imagen' => 'https://x.test/promo2.png',
            'activa' => true,
        ])->assertOk()
            ->assertJsonPath('data.titulo', '2 Burgers Dobles + Papas + Gaseosa')
            ->assertJsonPath('data.precio', fn ($v) => (float) $v === 19900.0);

        $this->postJson('/api/locales/demolocal/pedidos', [
            'items' => [[
                'promocionId' => $promo['id'],
                'cantidad' => 2,
                'notas' => 'Sin cebolla',
                'opciones' => [],
            ]],
            'modoEntrega' => 'retiro',
            'cliente' => ['nombre' => 'Carlos', 'telefono' => '11 2222 3333'],
            'medioPago' => 'efectivo',
        ])->assertCreated()
            ->assertJsonPath('data.totales.subtotal', fn ($v) => (float) $v === 39800.0)
            ->assertJsonPath('data.totales.total', fn ($v) => (float) $v === 39800.0)
            ->assertJsonPath('data.items.0.nombre', 'Promo: 2 Burgers Dobles + Papas + Gaseosa');

        // Crear cupón de descuento independiente y aplicarlo al confirmar pedido
        $cupon = $this->withToken($token)->postJson('/api/admin/cupones', [
            'codigo' => 'VIP25',
            'descuento' => 25,
            'descripcion' => '25% para clientes frecuentes',
            'activo' => true,
        ])->assertCreated()
            ->assertJsonPath('data.codigo', 'VIP25')
            ->assertJsonPath('data.descuento', 25)
            ->json('data');

        $this->postJson('/api/locales/demolocal/pedidos', [
            'items' => [[
                'promocionId' => $promo['id'],
                'cantidad' => 1,
                'notas' => '',
                'opciones' => [],
            ]],
            'codigoPromo' => 'VIP25',
            'modoEntrega' => 'retiro',
            'cliente' => ['nombre' => 'Carlos', 'telefono' => '11 2222 3333'],
            'medioPago' => 'efectivo',
        ])->assertCreated()
            ->assertJsonPath('data.totales.subtotal', fn ($v) => (float) $v === 19900.0)
            ->assertJsonPath('data.totales.descuento', fn ($v) => (float) $v === 4975.0)
            ->assertJsonPath('data.totales.total', fn ($v) => (float) $v === 14925.0);

        $this->withToken($token)->patchJson("/api/admin/cupones/{$cupon['id']}/estado")
            ->assertOk()
            ->assertJsonPath('data.activo', false);
    }
}
