<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Opcion extends Model
{
    protected $table = 'opciones';

    protected $fillable = ['grupo_opciones_id', 'etiqueta', 'precio_adicional', 'por_defecto', 'orden'];

    protected function casts(): array
    {
        return [
            'precio_adicional' => 'decimal:2',
            'por_defecto' => 'boolean',
        ];
    }

    public function grupo(): BelongsTo
    {
        return $this->belongsTo(GrupoOpciones::class, 'grupo_opciones_id');
    }
}
