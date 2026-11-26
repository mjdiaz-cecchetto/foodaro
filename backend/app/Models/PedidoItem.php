<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PedidoItem extends Model
{
    protected $table = 'pedido_items';

    protected $fillable = [
        'pedido_id',
        'ronda',
        'producto_id',
        'nombre',
        'precio_unitario',
        'cantidad',
        'total',
        'notas',
        'entregado',
        'entregado_en',
        'comandado_en',
    ];

    protected function casts(): array
    {
        return [
            'ronda' => 'integer',
            'precio_unitario' => 'decimal:2',
            'total' => 'decimal:2',
            'entregado' => 'boolean',
            'entregado_en' => 'datetime',
            'comandado_en' => 'datetime',
        ];
    }

    public function pedido(): BelongsTo
    {
        return $this->belongsTo(Pedido::class);
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class);
    }

    public function opciones(): HasMany
    {
        return $this->hasMany(PedidoItemOpcion::class);
    }
}
