<?php

namespace App\Services;

use App\Models\Local;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Horarios del local: persistencia (semana + excepciones) y cálculo del estado
 * actual ("Abierto · Cierra 01:30", "Cerrado · Abre mañana 12:00").
 *
 * Formato de intercambio (igual al frontend):
 *   semana:      [{ dia: 1..7, abierto: bool, franjas: [{ desde: 'HH:MM', hasta: 'HH:MM' }] }]
 *   excepciones: [{ fecha: 'YYYY-MM-DD', cerrado: bool, motivo: string|null, franjas: [...] }]
 */
class HorariosServicio
{
    public const DIAS = [1 => 'Lunes', 2 => 'Martes', 3 => 'Miércoles', 4 => 'Jueves', 5 => 'Viernes', 6 => 'Sábado', 7 => 'Domingo'];

    /* ------------------------------ Persistencia ------------------------------ */

    public function guardar(Local $local, array $semana, array $excepciones): void
    {
        DB::transaction(function () use ($local, $semana, $excepciones) {
            $local->horarios()->delete();
            foreach ($semana as $dia) {
                if (empty($dia['abierto'])) {
                    continue;
                }
                foreach (array_values($dia['franjas'] ?? []) as $orden => $franja) {
                    $local->horarios()->create([
                        'dia_semana' => (int) $dia['dia'],
                        'desde' => $this->hora($franja['desde']),
                        'hasta' => $this->hora($franja['hasta']),
                        'orden' => $orden,
                    ]);
                }
            }

            $local->excepcionesHorario()->delete();
            foreach ($excepciones as $exc) {
                $cerrado = (bool) ($exc['cerrado'] ?? true);
                $franjas = $cerrado ? [] : array_values($exc['franjas'] ?? []);
                if ($cerrado || empty($franjas)) {
                    $local->excepcionesHorario()->create([
                        'fecha' => $exc['fecha'],
                        'cerrado' => true,
                        'motivo' => $exc['motivo'] ?? null,
                    ]);
                    continue;
                }
                foreach ($franjas as $franja) {
                    $local->excepcionesHorario()->create([
                        'fecha' => $exc['fecha'],
                        'cerrado' => false,
                        'desde' => $this->hora($franja['desde']),
                        'hasta' => $this->hora($franja['hasta']),
                        'motivo' => $exc['motivo'] ?? null,
                    ]);
                }
            }
        });
    }

    /* ------------------------------ Lectura ------------------------------ */

    /** Semana completa (7 días) a partir de las franjas cargadas en el local. */
    public function semana(Local $local): array
    {
        $porDia = $local->horarios->groupBy('dia_semana');
        $semana = [];
        foreach (self::DIAS as $dia => $nombre) {
            $franjas = ($porDia[$dia] ?? collect())->map(fn ($h) => [
                'desde' => $this->hora($h->desde),
                'hasta' => $this->hora($h->hasta),
            ])->values()->all();
            $semana[] = ['dia' => $dia, 'nombre' => $nombre, 'abierto' => count($franjas) > 0, 'franjas' => $franjas];
        }

        return $semana;
    }

    /** Excepciones agrupadas por fecha, solo desde hoy. */
    public function excepciones(Local $local): array
    {
        $hoy = $this->ahora()->toDateString();

        return $local->excepcionesHorario
            ->filter(fn ($e) => $e->fecha->toDateString() >= $hoy)
            ->groupBy(fn ($e) => $e->fecha->toDateString())
            ->map(function (Collection $grupo, string $fecha) {
                $cerrado = $grupo->first()->cerrado;

                return [
                    'fecha' => $fecha,
                    'cerrado' => $cerrado,
                    'motivo' => $grupo->first()->motivo,
                    'franjas' => $cerrado ? [] : $grupo->map(fn ($e) => [
                        'desde' => $this->hora($e->desde),
                        'hasta' => $this->hora($e->hasta),
                    ])->values()->all(),
                ];
            })
            ->values()
            ->all();
    }

    /* ------------------------------ Estado actual ------------------------------ */

    /** @return array{abierto: bool, texto: string} */
    public function estadoActual(Local $local): array
    {
        if ($local->cerrado_temporalmente) {
            return ['abierto' => false, 'texto' => 'Cerrado por hoy'];
        }

        $ahora = $this->ahora();

        // Franja vigente: la de hoy, o la de ayer que cruza la medianoche
        foreach ([0, 1] as $diasAtras) {
            $fecha = $ahora->subDays($diasAtras);
            foreach ($this->franjasDe($local, $fecha) as $franja) {
                [$inicio, $fin] = $this->intervalo($fecha, $franja);
                if ($ahora->betweenIncluded($inicio, $fin)) {
                    return ['abierto' => true, 'texto' => 'Abierto · Cierra '.$fin->format('H:i')];
                }
            }
        }

        // Próxima apertura dentro de los próximos 7 días
        for ($i = 0; $i < 8; $i++) {
            $fecha = $ahora->addDays($i);
            foreach ($this->franjasDe($local, $fecha) as $franja) {
                [$inicio] = $this->intervalo($fecha, $franja);
                if ($inicio->greaterThan($ahora)) {
                    $cuando = match ($i) {
                        0 => 'Abre a las '.$inicio->format('H:i'),
                        1 => 'Abre mañana '.$inicio->format('H:i'),
                        default => 'Abre el '.mb_strtolower(self::DIAS[(int) $inicio->isoWeekday()]).' '.$inicio->format('H:i'),
                    };

                    return ['abierto' => false, 'texto' => 'Cerrado · '.$cuando];
                }
            }
        }

        return ['abierto' => false, 'texto' => 'Cerrado'];
    }

    /** Franjas que rigen una fecha: excepción (si existe) o el día de la semana. */
    private function franjasDe(Local $local, CarbonImmutable $fecha): array
    {
        $clave = $fecha->toDateString();
        $excepciones = $local->excepcionesHorario->filter(fn ($e) => $e->fecha->toDateString() === $clave);
        if ($excepciones->isNotEmpty()) {
            if ($excepciones->first()->cerrado) {
                return [];
            }

            return $excepciones->map(fn ($e) => ['desde' => $this->hora($e->desde), 'hasta' => $this->hora($e->hasta)])->all();
        }

        return $local->horarios
            ->where('dia_semana', (int) $fecha->isoWeekday())
            ->map(fn ($h) => ['desde' => $this->hora($h->desde), 'hasta' => $this->hora($h->hasta)])
            ->values()
            ->all();
    }

    /** @return array{0: CarbonImmutable, 1: CarbonImmutable} */
    private function intervalo(CarbonImmutable $fecha, array $franja): array
    {
        $inicio = $fecha->setTimeFromTimeString($franja['desde']);
        $fin = $fecha->setTimeFromTimeString($franja['hasta']);
        if ($fin->lessThanOrEqualTo($inicio)) {
            $fin = $fin->addDay(); // cruza la medianoche
        }

        return [$inicio, $fin];
    }

    private function ahora(): CarbonImmutable
    {
        return CarbonImmutable::now(config('app.timezone'));
    }

    /** Normaliza "20:00:00" / "20:00" → "20:00". */
    private function hora(?string $valor): string
    {
        return substr((string) $valor, 0, 5);
    }
}
