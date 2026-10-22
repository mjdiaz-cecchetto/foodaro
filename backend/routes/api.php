<?php

use App\Http\Controllers\Api\Admin\CategoriaController;
use App\Http\Controllers\Api\Admin\LocalAdminController;
use App\Http\Controllers\Api\Admin\PedidoAdminController;
use App\Http\Controllers\Api\Admin\PlantillaOpcionesController;
use App\Http\Controllers\Api\Admin\ProductoController;
use App\Http\Controllers\Api\Admin\PromocionController;
use App\Http\Controllers\Api\Auth\AutenticacionController;
use App\Http\Controllers\Api\Publico\LocalPublicoController;
use App\Http\Controllers\Api\Publico\PedidoPublicoController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API pública (carta digital)
|--------------------------------------------------------------------------
*/
Route::prefix('locales/{slug}')->group(function () {
    Route::get('/', [LocalPublicoController::class, 'show']);
    Route::post('pedidos', [PedidoPublicoController::class, 'store'])->middleware('throttle:20,1');
});

/*
|--------------------------------------------------------------------------
| Autenticación (panel admin)
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('ingreso', [AutenticacionController::class, 'ingresar'])->middleware('throttle:10,1');
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('yo', [AutenticacionController::class, 'yo']);
        Route::post('salir', [AutenticacionController::class, 'salir']);
    });
});

/*
|--------------------------------------------------------------------------
| Panel admin del local (requiere token)
|--------------------------------------------------------------------------
*/
Route::prefix('admin')->middleware('auth:sanctum')->group(function () {
    Route::get('local', [LocalAdminController::class, 'show']);
    Route::put('local', [LocalAdminController::class, 'update']);

    Route::apiResource('categorias', CategoriaController::class)->except('show')->parameters(['categorias' => 'categoria']);

    Route::patch('productos/{producto}/disponibilidad', [ProductoController::class, 'alternarDisponibilidad']);
    Route::apiResource('productos', ProductoController::class);

    Route::patch('promociones/{promocion}/estado', [PromocionController::class, 'alternarEstado']);
    Route::apiResource('promociones', PromocionController::class)->except('show')->parameters(['promociones' => 'promocion']);

    Route::apiResource('plantillas-opciones', PlantillaOpcionesController::class)
        ->except('show')
        ->parameters(['plantillas-opciones' => 'plantilla']);

    Route::get('pedidos', [PedidoAdminController::class, 'index']);
    Route::get('pedidos/{pedido}', [PedidoAdminController::class, 'show']);
    Route::patch('pedidos/{pedido}/estado', [PedidoAdminController::class, 'cambiarEstado']);
});
