<?php

namespace App\Models;

use App\Enums\ModoPrecio;
use App\Enums\TipoSeleccion;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Grupo de opciones de un producto o plantilla del local (producto_id null). */
class GrupoOpciones extends Model
{
    protected $table = 'grupos_opciones';

    protected $fillable = ['local_id', 'producto_id', 'nombre', 'tipo', 'modo_precio', 'obligatorio', 'maximo', 'orden'];

    protected function casts(): array
    {
        return [
            'tipo' => TipoSeleccion::class,
            'modo_precio' => ModoPrecio::class,
            'obligatorio' => 'boolean',
        ];
    }

    public function local(): BelongsTo
    {
        return $this->belongsTo(Local::class);
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class);
    }

    public function opciones(): HasMany
    {
        return $this->hasMany(Opcion::class, 'grupo_opciones_id')->orderBy('orden')->orderBy('id');
    }

    public function esPlantilla(): bool
    {
        return $this->producto_id === null;
    }
}
