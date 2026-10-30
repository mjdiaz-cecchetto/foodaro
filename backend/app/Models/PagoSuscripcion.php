<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Registro de cobro de suscripción de un local en Foodaro. */
class PagoSuscripcion extends Model
{
    protected $table = 'pagos_suscripcion';

    protected $fillable = [
        'local_id',
        'plan_id',
        'monto',
        'periodo_meses',
        'medio_pago',
        'fecha_pago',
        'vencimiento_anterior',
        'vencimiento_nuevo',
        'referencia',
    ];

    protected function casts(): array
    {
        return [
            'monto' => 'decimal:2',
            'periodo_meses' => 'integer',
            'fecha_pago' => 'date:Y-m-d',
            'vencimiento_anterior' => 'date:Y-m-d',
            'vencimiento_nuevo' => 'date:Y-m-d',
        ];
    }

    public function local(): BelongsTo
    {
        return $this->belongsTo(Local::class, 'local_id');
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class, 'plan_id');
    }
}
