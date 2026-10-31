<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AsistenciaEmpleado extends Model
{
    protected $table = 'asistencias_empleados';

    protected $fillable = [
        'local_id',
        'empleado_id',
        'fecha',
        'hora_entrada',
        'hora_salida',
        'horas_trabajadas',
        'valor_hora',
        'total_paga',
        'pagado',
        'notas',
    ];

    protected function casts(): array
    {
        return [
            'fecha' => 'date:Y-m-d',
            'horas_trabajadas' => 'decimal:2',
            'valor_hora' => 'decimal:2',
            'total_paga' => 'decimal:2',
            'pagado' => 'boolean',
        ];
    }

    public function local(): BelongsTo
    {
        return $this->belongsTo(Local::class);
    }

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class, 'empleado_id');
    }

    /**
     * Calcula las horas trabajadas entre hora_entrada ('HH:MM') y hora_salida ('HH:MM').
     * Soporta turnos nocturnos (ej. entra 19:00 y sale 01:30 del día siguiente = 6.5 horas).
     */
    public static function calcularHoras(?string $entrada, ?string $salida): float
    {
        if (! $entrada || ! $salida) {
            return 0.0;
        }

        $partesE = explode(':', $entrada);
        $partesS = explode(':', $salida);
        if (count($partesE) < 2 || count($partesS) < 2) {
            return 0.0;
        }

        $minEntrada = ((int) $partesE[0]) * 60 + ((int) $partesE[1]);
        $minSalida = ((int) $partesS[0]) * 60 + ((int) $partesS[1]);

        if ($minSalida < $minEntrada) {
            // Cruzó la medianoche (turno noche)
            $minSalida += 24 * 60;
        }

        $diferenciaMin = max(0, $minSalida - $minEntrada);

        return round($diferenciaMin / 60, 2);
    }
}
