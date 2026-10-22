<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PedidoItemOpcion extends Model
{
    protected $table = 'pedido_item_opciones';

    public $timestamps = false;

    protected $fillable = ['pedido_item_id', 'grupo_nombre', 'etiqueta', 'precio_adicional'];

    protected function casts(): array
    {
        return ['precio_adicional' => 'decimal:2'];
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(PedidoItem::class, 'pedido_item_id');
    }
}
