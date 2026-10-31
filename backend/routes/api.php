<?php

use App\Http\Controllers\Api\Admin\CategoriaController;
use App\Http\Controllers\Api\Admin\CuponController;
use App\Http\Controllers\Api\Admin\EmpleadoAdminController;
use App\Http\Controllers\Api\Admin\LocalAdminController;
use App\Http\Controllers\Api\Admin\PedidoAdminController;
use App\Http\Controllers\Api\Admin\PlantillaOpcionesController;
use App\Http\Controllers\Api\Admin\ProductoController;
use App\Http\Controllers\Api\Admin\PromocionController;
use App\Http\Controllers\Api\Auth\AutenticacionController;
use App\Http\Controllers\Api\Publico\LocalPublicoController;
use App\Http\Controllers\Api\Publico\PedidoPublicoController;
use App\Http\Controllers\Api\Root\RootController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API pública (carta digital y planes de la landing)
|--------------------------------------------------------------------------
*/
Route::get('planes', [RootController::class, 'planesPublicos']);
Route::post('solicitudes', [RootController::class, 'crearSolicitudPublica'])->middleware('throttle:15,1');

Route::prefix('locales/{slug}')->group(function () {
    Route::get('/', [LocalPublicoController::class, 'show']);
    Route::post('pedidos', [PedidoPublicoController::class, 'store'])->middleware('throttle:20,1');
});

/*
|--------------------------------------------------------------------------
| Autenticación del panel del LOCAL (solo administradores de locales)
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('ingreso', [AutenticacionController::class, 'ingresar'])->middleware('throttle:10,1');
    Route::middleware(['auth:sanctum', 'solo.admin'])->group(function () {
        Route::get('yo', [AutenticacionController::class, 'yo']);
        Route::post('salir', [AutenticacionController::class, 'salir']);
    });
});

/*
|--------------------------------------------------------------------------
| Panel admin del local (requiere token del login del local)
|--------------------------------------------------------------------------
*/
Route::prefix('admin')->middleware(['auth:sanctum', 'solo.admin'])->group(function () {
    Route::get('local', [LocalAdminController::class, 'show']);
    Route::put('local', [LocalAdminController::class, 'update']);
    Route::patch('local/pausa-rapida', [LocalAdminController::class, 'alternarPausaRapida']);
    Route::get('mi-cuenta', [LocalAdminController::class, 'miCuenta']);
    Route::put('mi-cuenta', [LocalAdminController::class, 'actualizarMiCuenta']);

    Route::patch('categorias/reordenar', [CategoriaController::class, 'reordenar']);
    Route::apiResource('categorias', CategoriaController::class)->except('show')->parameters(['categorias' => 'categoria']);

    Route::patch('productos/reordenar', [ProductoController::class, 'reordenar']);
    Route::patch('productos/{producto}/disponibilidad', [ProductoController::class, 'alternarDisponibilidad']);
    Route::apiResource('productos', ProductoController::class);

    Route::patch('promociones/{promocion}/estado', [PromocionController::class, 'alternarEstado']);
    Route::apiResource('promociones', PromocionController::class)->except('show')->parameters(['promociones' => 'promocion']);

    Route::patch('cupones/{cupon}/estado', [CuponController::class, 'alternarEstado']);
    Route::apiResource('cupones', CuponController::class)->except('show')->parameters(['cupones' => 'cupon']);

    Route::apiResource('plantillas-opciones', PlantillaOpcionesController::class)
        ->except('show')
        ->parameters(['plantillas-opciones' => 'plantilla']);

    Route::get('pedidos/metricas', [PedidoAdminController::class, 'metricas']);
    Route::get('pedidos', [PedidoAdminController::class, 'index']);
    Route::get('pedidos/{pedido}', [PedidoAdminController::class, 'show']);
    Route::patch('pedidos/{pedido}/estado', [PedidoAdminController::class, 'cambiarEstado']);
    Route::patch('pedidos/{pedido}/pago', [PedidoAdminController::class, 'alternarPago']);
    Route::patch('pedidos/{pedido}/prioridad', [PedidoAdminController::class, 'alternarPrioridad']);
    Route::post('pedidos/{pedido}/items', [PedidoAdminController::class, 'agregarItem']);
    Route::patch('pedidos/{pedido}/items/{item}', [PedidoAdminController::class, 'actualizarItem']);
    Route::delete('pedidos/{pedido}/items/{item}', [PedidoAdminController::class, 'eliminarItem']);

    Route::get('empleados', [EmpleadoAdminController::class, 'index']);
    Route::post('empleados', [EmpleadoAdminController::class, 'storeEmpleado']);
    Route::put('empleados/{empleado}', [EmpleadoAdminController::class, 'updateEmpleado']);
    Route::delete('empleados/{empleado}', [EmpleadoAdminController::class, 'destroyEmpleado']);

    Route::post('asistencias', [EmpleadoAdminController::class, 'registrarAsistencia']);
    Route::put('asistencias/{asistencia}', [EmpleadoAdminController::class, 'actualizarAsistencia']);
    Route::patch('asistencias/{asistencia}/pago', [EmpleadoAdminController::class, 'alternarPagoAsistencia']);
    Route::delete('asistencias/{asistencia}', [EmpleadoAdminController::class, 'eliminarAsistencia']);
});

/*
|--------------------------------------------------------------------------
| Panel Root de Foodaro (Superadmin) — login y token independientes
|--------------------------------------------------------------------------
*/
Route::post('root/auth/ingreso', [AutenticacionController::class, 'ingresarRoot'])->middleware('throttle:10,1');

Route::prefix('root')->middleware(['auth:sanctum', 'solo.root'])->group(function () {
    Route::get('auth/yo', [AutenticacionController::class, 'yo']);
    Route::post('auth/salir', [AutenticacionController::class, 'salir']);

    Route::get('resumen', [RootController::class, 'resumen']);

    Route::post('locales', [RootController::class, 'crearLocal']);
    Route::put('locales/{local}', [RootController::class, 'actualizarLocal']);
    Route::patch('locales/{local}/estado', [RootController::class, 'alternarEstadoLocal']);
    Route::delete('locales/{local}', [RootController::class, 'eliminarLocal']);

    Route::post('usuarios', [RootController::class, 'crearUsuario']);
    Route::put('usuarios/{usuario}', [RootController::class, 'actualizarUsuario']);
    Route::patch('usuarios/{usuario}/contrasenia', [RootController::class, 'cambiarContraseniaUsuario']);
    Route::patch('usuarios/{usuario}/estado', [RootController::class, 'alternarEstadoUsuario']);
    Route::delete('usuarios/{usuario}', [RootController::class, 'eliminarUsuario']);

    Route::post('planes', [RootController::class, 'crearPlan']);
    Route::put('planes/{plan}', [RootController::class, 'actualizarPlan']);
    Route::patch('planes/{plan}/estado', [RootController::class, 'alternarEstadoPlan']);
    Route::delete('planes/{plan}', [RootController::class, 'eliminarPlan']);

    Route::post('pagos', [RootController::class, 'registrarPago']);
    Route::delete('pagos/{pago}', [RootController::class, 'eliminarPago']);

    Route::patch('solicitudes/{solicitud}', [RootController::class, 'actualizarSolicitud']);
    Route::delete('solicitudes/{solicitud}', [RootController::class, 'eliminarSolicitud']);

    Route::put('mi-cuenta', [RootController::class, 'actualizarMiCuenta']);
});
