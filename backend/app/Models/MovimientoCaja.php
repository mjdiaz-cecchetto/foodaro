<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MovimientoCaja extends Model
{
    protected $table = 'movimientos_caja';

    protected $fillable = [
        'local_id',
        'fecha_jornada',
        'tipo',
        'monto',
        'medio_pago',
        'concepto',
    ];

    protected function casts(): array
    {
        return [
            'fecha_jornada' => 'date:Y-m-d',
            'monto' => 'decimal:2',
        ];
    }

    public function local(): BelongsTo
    {
        return $this->belongsTo(Local::class, 'local_id');
    }
}
