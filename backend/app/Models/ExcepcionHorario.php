<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Excepción para una fecha puntual: cerrado, o franja especial (cerrado = false). */
class ExcepcionHorario extends Model
{
    protected $table = 'excepciones_horario';

    protected $fillable = ['local_id', 'fecha', 'cerrado', 'desde', 'hasta', 'motivo'];

    protected function casts(): array
    {
        return [
            'fecha' => 'date:Y-m-d',
            'cerrado' => 'boolean',
        ];
    }

    public function local(): BelongsTo
    {
        return $this->belongsTo(Local::class);
    }
}
