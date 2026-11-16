<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CajaDiaria extends Model
{
    protected $table = 'cajas_diarias';

    protected $fillable = [
        'local_id',
        'fecha',
        'monto_inicial',
        'observaciones',
    ];

    protected function casts(): array
    {
        return [
            'fecha' => 'date:Y-m-d',
            'monto_inicial' => 'decimal:2',
        ];
    }

    public function local(): BelongsTo
    {
        return $this->belongsTo(Local::class, 'local_id');
    }
}
