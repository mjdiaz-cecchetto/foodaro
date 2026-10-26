<?php

use App\Http\Middleware\ForzarRespuestaJson;
use App\Http\Middleware\SoloAdministradorLocal;
use App\Http\Middleware\SoloRoot;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Toda la API responde JSON aunque el cliente no mande Accept.
        $middleware->api(prepend: [ForzarRespuestaJson::class]);

        // Separación estricta de paneles: el Root no entra al panel del local y viceversa.
        $middleware->alias([
            'solo.admin' => SoloAdministradorLocal::class,
            'solo.root' => SoloRoot::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
