<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Producto extends Model
{
    protected $table = 'productos';

    protected $fillable = [
        'local_id', 'categoria_id', 'nombre', 'descripcion', 'precio', 'imagen_url',
        'etiqueta', 'tiempo_preparacion', 'calificacion', 'disponible', 'orden',
    ];

    protected function casts(): array
    {
        return [
            'precio' => 'decimal:2',
            'calificacion' => 'decimal:1',
            'disponible' => 'boolean',
        ];
    }

    public function local(): BelongsTo
    {
        return $this->belongsTo(Local::class);
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class);
    }

    /** Grupos de opciones propios del producto (con sus opciones). */
    public function gruposOpciones(): HasMany
    {
        return $this->hasMany(GrupoOpciones::class)->orderBy('orden')->orderBy('id');
    }
}
