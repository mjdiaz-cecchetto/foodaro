<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Local (tenant) de la plataforma. */
class Local extends Model
{
    public const DIAS_AVISO_POR_VENCER = 5;

    public const DIAS_GRACIA = 3;

    protected $table = 'locales';

    protected $fillable = [
        'slug', 'nombre', 'eslogan', 'rubro', 'logo_url', 'portada_url',
        'direccion', 'referencia_direccion', 'maps_url',
        'whatsapp', 'whatsapp_pedidos', 'instagram', 'tiktok', 'telefono',
        'moneda', 'cargo_servicio', 'etiqueta_cargo_servicio',
        'costo_envio', 'monto_minimo_envio', 'alias_transferencia', 'titular_transferencia',
        'activo', 'cerrado_temporalmente', 'envios_pausados',
        'plan_id', 'estado_suscripcion', 'vencimiento_suscripcion',
    ];

    protected function casts(): array
    {
        return [
            'cargo_servicio' => 'decimal:2',
            'costo_envio' => 'decimal:2',
            'monto_minimo_envio' => 'decimal:2',
            'activo' => 'boolean',
            'cerrado_temporalmente' => 'boolean',
            'envios_pausados' => 'boolean',
            'vencimiento_suscripcion' => 'date:Y-m-d',
        ];
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class, 'plan_id');
    }

    public function pagosSuscripcion(): HasMany
    {
        return $this->hasMany(PagoSuscripcion::class, 'local_id')->orderByDesc('fecha_pago')->orderByDesc('id');
    }

    public function usuarios(): HasMany
    {
        return $this->hasMany(Usuario::class);
    }

    public function categorias(): HasMany
    {
        return $this->hasMany(Categoria::class)->orderBy('orden')->orderBy('id');
    }

    public function productos(): HasMany
    {
        return $this->hasMany(Producto::class)->orderBy('orden')->orderBy('id');
    }

    public function promociones(): HasMany
    {
        return $this->hasMany(Promocion::class)->orderByDesc('id');
    }

    public function cupones(): HasMany
    {
        return $this->hasMany(Cupon::class)->orderByDesc('id');
    }

    /** Plantillas de grupos de opciones (sin producto asociado). */
    public function plantillasOpciones(): HasMany
    {
        return $this->hasMany(GrupoOpciones::class)->whereNull('producto_id')->orderBy('orden')->orderBy('id');
    }

    public function pedidos(): HasMany
    {
        return $this->hasMany(Pedido::class);
    }

    /** Franjas semanales ordenadas por día y orden. */
    public function horarios(): HasMany
    {
        return $this->hasMany(Horario::class)->orderBy('dia_semana')->orderBy('orden');
    }

    /** Excepciones por fecha (se exponen solo las de hoy en adelante). */
    public function excepcionesHorario(): HasMany
    {
        return $this->hasMany(ExcepcionHorario::class)->orderBy('fecha')->orderBy('desde');
    }

    /**
     * Evalúa automáticamente la fecha de vencimiento y actualiza `estado_suscripcion` en base de datos
     * si pasó a estar `por_vencer` (<= 5 días) o `vencido` (< 0 días).
     */
    public function sincronizarEstadoSuscripcion(): void
    {
        if (! $this->vencimiento_suscripcion) {
            return;
        }

        $hoy = Carbon::today();
        $vencimiento = Carbon::parse($this->vencimiento_suscripcion)->startOfDay();
        $diasRestantes = (int) $hoy->diffInDays($vencimiento, false);

        $nuevoEstado = $this->estado_suscripcion;

        if ($diasRestantes < 0) {
            $nuevoEstado = 'vencido';
        } elseif ($diasRestantes <= self::DIAS_AVISO_POR_VENCER) {
            $nuevoEstado = 'por_vencer';
        } elseif ($this->estado_suscripcion === 'vencido' || $this->estado_suscripcion === 'por_vencer') {
            $nuevoEstado = 'al_dia';
        }

        if ($nuevoEstado !== $this->estado_suscripcion) {
            $this->estado_suscripcion = $nuevoEstado;
            $this->saveQuietly();
        }
    }

    /**
     * Devuelve el estado detallado de la suscripción (días restantes, período de gracia y si la carta pública está suspendida).
     */
    public function resumenSuscripcion(): array
    {
        $this->sincronizarEstadoSuscripcion();

        $hoy = Carbon::today();
        $diasRestantes = $this->vencimiento_suscripcion
            ? (int) $hoy->diffInDays(Carbon::parse($this->vencimiento_suscripcion)->startOfDay(), false)
            : null;

        $enPeriodoGracia = $diasRestantes !== null && $diasRestantes < 0 && $diasRestantes >= -self::DIAS_GRACIA;
        $diasGraciaRestantes = $enPeriodoGracia ? (self::DIAS_GRACIA + $diasRestantes) : 0;
        $suspendidaPorVencimiento = $diasRestantes !== null && $diasRestantes < -self::DIAS_GRACIA;

        return [
            'planId' => $this->plan_id,
            'planNombre' => $this->plan?->nombre ?? 'Sin plan',
            'planNivel' => $this->plan?->nivel ?? '',
            'planMensual' => (float) ($this->plan?->mensual ?? 0),
            'planAnual' => (float) ($this->plan?->anual ?? 0),
            'planCaracteristicas' => $this->plan?->caracteristicas ?? [],
            'estado' => $this->estado_suscripcion ?? 'al_dia',
            'vencimiento' => $this->vencimiento_suscripcion ? $this->vencimiento_suscripcion->format('Y-m-d') : null,
            'diasRestantes' => $diasRestantes,
            'enPeriodoGracia' => $enPeriodoGracia,
            'diasGraciaRestantes' => $diasGraciaRestantes,
            'cartaSuspendida' => ! $this->activo || $suspendidaPorVencimiento,
        ];
    }
}
