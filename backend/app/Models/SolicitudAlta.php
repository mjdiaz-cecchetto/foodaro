<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Solicitud de prueba gratuita (30 días) enviada por un comercio desde la Landing de Foodaro.
 */
class SolicitudAlta extends Model
{
    protected $table = 'solicitudes_alta';

    protected $fillable = [
        'nombre_comercio',
        'ciudad',
        'whatsapp',
        'plan_nombre',
        'plan_id',
        'estado',
        'local_id',
        'notas',
    ];

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class, 'plan_id');
    }

    public function local(): BelongsTo
    {
        return $this->belongsTo(Local::class, 'local_id');
    }
}
