<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Local (tenant) de la plataforma. */
class Local extends Model
{
    protected $table = 'locales';

    protected $fillable = [
        'slug', 'nombre', 'eslogan', 'rubro', 'logo_url', 'portada_url',
        'direccion', 'referencia_direccion', 'maps_url',
        'whatsapp', 'whatsapp_pedidos', 'instagram', 'tiktok', 'telefono',
        'moneda', 'cargo_servicio', 'etiqueta_cargo_servicio', 'activo',
    ];

    protected function casts(): array
    {
        return [
            'cargo_servicio' => 'decimal:2',
            'activo' => 'boolean',
        ];
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
}
