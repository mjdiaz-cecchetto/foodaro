<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Cupon extends Model
{
    protected $table = 'cupones';

    protected $fillable = ['local_id', 'codigo', 'descuento', 'descripcion', 'activo'];

    protected function casts(): array
    {
        return [
            'descuento' => 'integer',
            'activo' => 'boolean',
        ];
    }

    public function local(): BelongsTo
    {
        return $this->belongsTo(Local::class);
    }
}
