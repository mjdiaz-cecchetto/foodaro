<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Categoria extends Model
{
    protected $table = 'categorias';

    protected $fillable = ['local_id', 'nombre', 'slug', 'imagen_url', 'orden', 'activa'];

    protected function casts(): array
    {
        return ['activa' => 'boolean'];
    }

    public function local(): BelongsTo
    {
        return $this->belongsTo(Local::class);
    }

    public function productos(): HasMany
    {
        return $this->hasMany(Producto::class);
    }
}
