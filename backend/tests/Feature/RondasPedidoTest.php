<?php

namespace Tests\Feature;

use App\Enums\EstadoPedido;
use App\Enums\MedioPago;
use App\Enums\ModoEntrega;
use App\Enums\RolUsuario;
use App\Http\Controllers\Api\Auth\AutenticacionController;
use App\Models\Local;
use App\Models\Pedido;
use App\Models\Plan;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RondasPedidoTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_agregar_rondas_y_controlar_entrega_por_ronda_e_item(): void
    {
        $planControl = Plan::where('codigo', Plan::CODIGO_CONTROL)->firstOrFail();
        $local = Local::firstOrFail();
        $local->update(['plan_id' => $planControl->id]);

        $admin = Usuario::where('local_id', $local->id)->where('rol', RolUsuario::Administrador)->firstOrFail();
        $token = $admin->createToken('test', [AutenticacionController::HABILIDAD_ADMIN])->plainTextToken;

        $pedido = Pedido::create([
            'local_id' => $local->id,
            'numero' => 101,
            'estado' => EstadoPedido::Entregado,
            'modo_entrega' => ModoEntrega::Retiro,
            'nombre_cliente' => 'Mesa 4 - Familia Perez',
            'telefono_cliente' => '',
            'medio_pago' => MedioPago::Efectivo,
            'pagado' => false,
            'subtotal' => 28000,
            'descuento' => 0,
            'cargo_servicio' => 0,
            'costo_envio' => 0,
            'total' => 28000,
        ]);

        $pedido->items()->create([
            'ronda' => 1,
            'nombre' => 'Pizza Muzzarella',
            'precio_unitario' => 12000,
            'cantidad' => 2,
            'total' => 24000,
            'entregado' => true,
            'entregado_en' => now(),
        ]);

        $pedido->items()->create([
            'ronda' => 1,
            'nombre' => 'Coca-Cola 1.5L',
            'precio_unitario' => 4000,
            'cantidad' => 1,
            'total' => 4000,
            'entregado' => true,
            'entregado_en' => now(),
        ]);

        // Ronda #2: 1 pizza más + 1 gaseosa más (pedido ya entregado debe volver a en_preparacion)
        $respRonda2 = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/admin/pedidos/{$pedido->id}/rondas", [
                'marcarComandado' => true,
                'items' => [
                    ['nombre' => 'Pizza Muzzarella', 'precioUnitario' => 12000, 'cantidad' => 1],
                    ['nombre' => 'Coca-Cola 1.5L', 'precioUnitario' => 4000, 'cantidad' => 1],
                ],
            ]);

        $respRonda2->assertStatus(200);
        $respRonda2->assertJsonPath('meta.rondaCreada', 2);
        $respRonda2->assertJsonPath('data.estado', EstadoPedido::EnPreparacion->value);
        $respRonda2->assertJsonPath('data.totales.total', 44000);
        $respRonda2->assertJsonPath('data.totales.cantidadTotal', 5);

        $itemsR2 = collect($respRonda2->json('data.items'))->where('ronda', 2)->values();
        $this->assertCount(2, $itemsR2);
        $this->assertFalse($itemsR2[0]['entregado']);
        $this->assertNotNull($itemsR2[0]['comandadoEn']);

        // Marcar solo la gaseosa de Ronda #2 como entregada
        $respItemEntrega = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/admin/pedidos/{$pedido->id}/items/{$itemsR2[1]['id']}/entrega");

        $respItemEntrega->assertStatus(200);
        $gaseosaActualizada = collect($respItemEntrega->json('data.items'))->firstWhere('id', $itemsR2[1]['id']);
        $this->assertTrue($gaseosaActualizada['entregado']);

        // Ronda #3: 1 cerveza ya entregada directo de heladera
        $respRonda3 = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/admin/pedidos/{$pedido->id}/rondas", [
                'marcarEntregado' => true,
                'items' => [
                    ['nombre' => 'Cerveza IPA', 'precioUnitario' => 5500, 'cantidad' => 1],
                ],
            ]);

        $respRonda3->assertStatus(200);
        $respRonda3->assertJsonPath('meta.rondaCreada', 3);
        $respRonda3->assertJsonPath('data.totales.total', 49500);
        $cervezaR3 = collect($respRonda3->json('data.items'))->firstWhere('ronda', 3);
        $this->assertTrue($cervezaR3['entregado']);

        // Marcar toda la Ronda #2 como entregada en 1 clic
        $respEntregaR2 = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/admin/pedidos/{$pedido->id}/rondas/2/entrega");

        $respEntregaR2->assertStatus(200);
        $todosR2Entregados = collect($respEntregaR2->json('data.items'))
            ->where('ronda', 2)
            ->every(fn ($it) => $it['entregado'] === true);
        $this->assertTrue($todosR2Entregados);
    }
}
