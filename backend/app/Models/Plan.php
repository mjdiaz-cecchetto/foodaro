<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Plan comercial de suscripción a la plataforma Foodaro. */
class Plan extends Model
{
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
}
