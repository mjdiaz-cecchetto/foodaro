<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Plan comercial de suscripción a la plataforma Foodaro. */
class Plan extends Model
{
    public const CODIGO_CATALOGO = 'catalogo-whatsapp';
    public const CODIGO_CONTROL = 'control-pedidos-stock';
    public const CODIGO_FULL = 'terminal-pos-mostrador';

    public const CAP_PEDIDOS_EN_VIVO = 'pedidos_en_vivo';
    public const CAP_REPORTES_CAJA = 'reportes_caja';
    public const CAP_PROMOCIONES_CUPONES = 'promociones_cupones';
    public const CAP_PERSONAL_ASISTENCIA = 'personal_asistencia';

    public const LIMITE_PRODUCTOS_PLAN_INICIAL = 50;

    protected $table = 'planes';

    protected $fillable = [
        'codigo',
        'nivel',
        'nombre',
        'mensual',
        'anual',
        'descripcion',
        'caracteristicas',
        'cta',
        'destacado',
        'activo',
        'orden',
    ];

    protected function casts(): array
    {
        return [
            'mensual' => 'decimal:2',
            'anual' => 'decimal:2',
            'caracteristicas' => 'array',
            'destacado' => 'boolean',
            'activo' => 'boolean',
            'orden' => 'integer',
        ];
    }

    public function locales(): HasMany
    {
        return $this->hasMany(Local::class, 'plan_id');
    }

    /**
     * Lista de capacidades habilitadas para este plan.
     *
     * @return array<string>
     */
    public function capacidades(): array
    {
        return match ($this->codigo) {
            self::CODIGO_CATALOGO => [],
            self::CODIGO_CONTROL => [
                self::CAP_PEDIDOS_EN_VIVO,
                self::CAP_REPORTES_CAJA,
                self::CAP_PROMOCIONES_CUPONES,
            ],
            self::CODIGO_FULL => [
                self::CAP_PEDIDOS_EN_VIVO,
                self::CAP_REPORTES_CAJA,
                self::CAP_PROMOCIONES_CUPONES,
                self::CAP_PERSONAL_ASISTENCIA,
            ],
            default => [
                self::CAP_PEDIDOS_EN_VIVO,
                self::CAP_REPORTES_CAJA,
                self::CAP_PROMOCIONES_CUPONES,
                self::CAP_PERSONAL_ASISTENCIA,
            ],
        };
    }

    /**
     * Evalúa si el plan incluye una capacidad específica.
     */
    public function tieneCapacidad(string $capacidad): bool
    {
        return in_array($capacidad, $this->capacidades(), true);
    }

    /**
     * Límite de productos en el catálogo (null si es ilimitado).
     */
    public function limiteProductos(): ?int
    {
        if ($this->codigo === self::CODIGO_CATALOGO) {
            return self::LIMITE_PRODUCTOS_PLAN_INICIAL;
        }

        return null;
    }

    /**
     * Nombre amigable del plan mínimo requerido para una capacidad.
     */
    public static function planRequeridoPara(string $capacidad): string
    {
        return match ($capacidad) {
            self::CAP_PERSONAL_ASISTENCIA => 'Full / Operación Completa',
            default => 'Control de Pedidos & Stock',
        };
    }
}
