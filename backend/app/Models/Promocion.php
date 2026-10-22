<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Promocion extends Model
{
    protected $table = 'promociones';

    protected $fillable = ['local_id', 'titulo', 'descuento', 'codigo', 'imagen_url', 'activa'];

    protected function casts(): array
    {
        return ['activa' => 'boolean'];
    }

    public function local(): BelongsTo
    {
        return $this->belongsTo(Local::class);
    }
}
