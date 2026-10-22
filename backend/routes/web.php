<?php

use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json([
    'nombre' => config('app.name'),
    'descripcion' => 'API de Foodaro. Los endpoints viven bajo /api.',
]));
