<?php

namespace App\Models;

use App\Enums\EstadoPedido;
use App\Enums\MedioPago;
use App\Enums\ModoEntrega;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Pedido extends Model
{
    protected $table = 'pedidos';

    protected $attributes = [
        'estado' => EstadoPedido::Pendiente,
        'prioritario' => false,
        'pagado' => false,
    ];

    protected $fillable = [
        'local_id', 'numero', 'estado', 'prioritario', 'modo_entrega',
        'nombre_cliente', 'telefono_cliente', 'calle', 'piso_depto', 'referencia',
        'medio_pago', 'pagado', 'pagado_en', 'monto_efectivo', 'comentarios',
        'promocion_id', 'codigo_promo', 'subtotal', 'descuento', 'cargo_servicio', 'costo_envio', 'total',
    ];

    protected function casts(): array
    {
        return [
            'estado' => EstadoPedido::class,
            'prioritario' => 'boolean',
            'modo_entrega' => ModoEntrega::class,
            'medio_pago' => MedioPago::class,
            'pagado' => 'boolean',
            'pagado_en' => 'datetime',
            'monto_efectivo' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'descuento' => 'decimal:2',
            'cargo_servicio' => 'decimal:2',
            'costo_envio' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }

    public function local(): BelongsTo
    {
        return $this->belongsTo(Local::class);
    }

    public function promocion(): BelongsTo
    {
        return $this->belongsTo(Promocion::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PedidoItem::class);
    }
}
