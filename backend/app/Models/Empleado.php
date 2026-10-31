<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Empleado extends Model
{
    protected $table = 'empleados';

    protected $fillable = [
        'local_id',
        'nombre',
        'rol',
        'telefono',
        'dni',
        'sueldo_hora',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'sueldo_hora' => 'decimal:2',
            'activo' => 'boolean',
        ];
    }

    public function local(): BelongsTo
    {
        return $this->belongsTo(Local::class);
    }

    public function asistencias(): HasMany
    {
        return $this->hasMany(AsistenciaEmpleado::class, 'empleado_id')->orderByDesc('fecha')->orderByDesc('id');
    }
}
