<?php

namespace Tests\Feature;

use App\Enums\RolUsuario;
use App\Models\Local;
use App\Models\Plan;
use App\Models\Producto;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BloqueoPlanesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_plan_inicial_tiene_bloqueado_pedidos_promociones_y_empleados(): void
    {
        $planInicial = Plan::where('codigo', Plan::CODIGO_CATALOGO)->firstOrFail();
        $local = Local::firstOrFail();
        $local->update(['plan_id' => $planInicial->id]);

        $admin = Usuario::where('local_id', $local->id)->where('rol', RolUsuario::Administrador)->firstOrFail();
        $token = $admin->createToken('test', [\App\Http\Controllers\Api\Auth\AutenticacionController::HABILIDAD_ADMIN])->plainTextToken;

        // Pedidos debe responder 403 plan_insuficiente
        $respPedidos = $this->withHeader('Authorization', "Bearer {$token}")->getJson('/api/admin/pedidos');
        $respPedidos->assertStatus(403);
        $respPedidos->assertJsonFragment(['codigo' => 'plan_insuficiente']);

        // Promociones debe responder 403 plan_insuficiente
        $respPromos = $this->withHeader('Authorization', "Bearer {$token}")->getJson('/api/admin/promociones');
        $respPromos->assertStatus(403);
        $respPromos->assertJsonFragment(['codigo' => 'plan_insuficiente']);

        // Empleados debe responder 403 plan_insuficiente
        $respEmpleados = $this->withHeader('Authorization', "Bearer {$token}")->getJson('/api/admin/empleados');
        $respEmpleados->assertStatus(403);
        $respEmpleados->assertJsonFragment(['codigo' => 'plan_insuficiente']);
    }

    public function test_plan_inicial_bloquea_creacion_al_alcanzar_limite_de_50_productos(): void
    {
        $planInicial = Plan::where('codigo', Plan::CODIGO_CATALOGO)->firstOrFail();
        $local = Local::firstOrFail();
        $local->update(['plan_id' => $planInicial->id]);

        // Aseguramos que tenga 50 productos
        $categoria = $local->categorias()->firstOrFail();
        $totalActual = $local->productos()->count();
        for ($i = $totalActual; $i < 50; $i++) {
            $local->productos()->create([
                'categoria_id' => $categoria->id,
                'nombre' => "Producto Test {$i}",
                'descripcion' => 'Desc',
                'precio' => 1000,
                'orden' => $i,
            ]);
        }

        $this->assertEquals(50, $local->productos()->count());

        $admin = Usuario::where('local_id', $local->id)->where('rol', RolUsuario::Administrador)->firstOrFail();
        $token = $admin->createToken('test', [\App\Http\Controllers\Api\Auth\AutenticacionController::HABILIDAD_ADMIN])->plainTextToken;

        // Intentar crear el producto #51 debe fallar con 422
        $respCrear = $this->withHeader('Authorization', "Bearer {$token}")->postJson('/api/admin/productos', [
            'categoriaId' => $categoria->id,
            'nombre' => 'Producto 51',
            'descripcion' => 'No debe permitirse',
            'precio' => 2500,
        ]);

        $respCrear->assertStatus(422);
        $respCrear->assertJsonFragment(['codigo' => 'limite_productos_alcanzado']);
    }

    public function test_plan_control_desbloquea_pedidos_promociones_y_permite_mas_de_50_productos(): void
    {
        $planControl = Plan::where('codigo', Plan::CODIGO_CONTROL)->firstOrFail();
        $local = Local::firstOrFail();
        $local->update(['plan_id' => $planControl->id]);

        $admin = Usuario::where('local_id', $local->id)->where('rol', RolUsuario::Administrador)->firstOrFail();
        $token = $admin->createToken('test', [\App\Http\Controllers\Api\Auth\AutenticacionController::HABILIDAD_ADMIN])->plainTextToken;

        // Pedidos habilitado (200)
        $respPedidos = $this->withHeader('Authorization', "Bearer {$token}")->getJson('/api/admin/pedidos');
        $respPedidos->assertStatus(200);

        // Promociones habilitado (200)
        $respPromos = $this->withHeader('Authorization', "Bearer {$token}")->getJson('/api/admin/promociones');
        $respPromos->assertStatus(200);

        // Empleados aún bloqueado para Plan Control (403)
        $respEmpleados = $this->withHeader('Authorization', "Bearer {$token}")->getJson('/api/admin/empleados');
        $respEmpleados->assertStatus(403);
    }

    public function test_plan_full_desbloquea_personal_y_asistencia(): void
    {
        $planFull = Plan::where('codigo', Plan::CODIGO_FULL)->firstOrFail();
        $local = Local::firstOrFail();
        $local->update(['plan_id' => $planFull->id]);

        $admin = Usuario::where('local_id', $local->id)->where('rol', RolUsuario::Administrador)->firstOrFail();
        $token = $admin->createToken('test', [\App\Http\Controllers\Api\Auth\AutenticacionController::HABILIDAD_ADMIN])->plainTextToken;

        // Empleados habilitado (200)
        $respEmpleados = $this->withHeader('Authorization', "Bearer {$token}")->getJson('/api/admin/empleados');
        $respEmpleados->assertStatus(200);
    }
}
