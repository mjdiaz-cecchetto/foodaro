<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Franja horaria de un día de la semana (1 = lunes … 7 = domingo). */
class Horario extends Model
{
    protected $table = 'horarios';

    protected $fillable = ['local_id', 'dia_semana', 'desde', 'hasta', 'orden'];

    public function local(): BelongsTo
    {
        return $this->belongsTo(Local::class);
    }
}
