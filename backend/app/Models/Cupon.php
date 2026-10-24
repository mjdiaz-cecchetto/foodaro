<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Cupon extends Model
{
    protected $table = 'cupones';

    protected $fillable = [
        'local_id',
        'codigo',
        'descuento',
        'descripcion',
        'monto_minimo',
        'max_usos',
        'usos',
        'fecha_vencimiento',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'descuento' => 'integer',
            'monto_minimo' => 'float',
            'max_usos' => 'integer',
            'usos' => 'integer',
            'fecha_vencimiento' => 'date:Y-m-d',
            'activo' => 'boolean',
        ];
    }

    public function local(): BelongsTo
    {
        return $this->belongsTo(Local::class);
    }
}
