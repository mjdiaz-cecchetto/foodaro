<?php

namespace App\Providers;

use App\Models\Categoria;
use App\Models\GrupoOpciones;
use App\Models\Pedido;
use App\Models\Producto;
use App\Models\Promocion;
use App\Policies\CategoriaPolicy;
use App\Policies\GrupoOpcionesPolicy;
use App\Policies\PedidoPolicy;
use App\Policies\ProductoPolicy;
use App\Policies\PromocionPolicy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // En desarrollo: falla ante asignaciones masivas descartadas o atributos inexistentes.
        Model::preventSilentlyDiscardingAttributes(! $this->app->isProduction());
        Model::preventAccessingMissingAttributes(! $this->app->isProduction());

        Gate::policy(Categoria::class, CategoriaPolicy::class);
        Gate::policy(Producto::class, ProductoPolicy::class);
        Gate::policy(Promocion::class, PromocionPolicy::class);
        Gate::policy(GrupoOpciones::class, GrupoOpcionesPolicy::class);
        Gate::policy(Pedido::class, PedidoPolicy::class);
    }
}
