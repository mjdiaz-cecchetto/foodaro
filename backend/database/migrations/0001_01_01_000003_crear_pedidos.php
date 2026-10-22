<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pedidos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('local_id')->constrained('locales')->cascadeOnDelete();
            $table->unsignedInteger('numero'); // correlativo por local (#0001)
            $table->enum('estado', ['pendiente', 'confirmado', 'en_preparacion', 'listo', 'entregado', 'cancelado'])
                ->default('pendiente');
            $table->enum('modo_entrega', ['retiro', 'envio']);
            $table->string('nombre_cliente', 120);
            $table->string('telefono_cliente', 40);
            $table->string('calle', 150)->nullable();
            $table->string('piso_depto', 60)->nullable();
            $table->string('referencia', 150)->nullable();
            $table->enum('medio_pago', ['transferencia', 'debito', 'efectivo']);
            $table->decimal('monto_efectivo', 12, 2)->nullable();
            $table->text('comentarios')->nullable();
            $table->foreignId('promocion_id')->nullable()->constrained('promociones')->nullOnDelete();
            $table->string('codigo_promo', 30)->nullable();
            $table->decimal('subtotal', 12, 2);
            $table->decimal('descuento', 12, 2)->default(0);
            $table->decimal('cargo_servicio', 12, 2)->default(0);
            $table->decimal('total', 12, 2);
            $table->timestamps();

            $table->unique(['local_id', 'numero']);
            $table->index(['local_id', 'estado', 'created_at']);
        });

        /** Líneas del pedido. Se guarda una foto de nombre y precio por si el producto cambia después. */
        Schema::create('pedido_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pedido_id')->constrained('pedidos')->cascadeOnDelete();
            $table->foreignId('producto_id')->nullable()->constrained('productos')->nullOnDelete();
            $table->string('nombre', 150);
            $table->decimal('precio_unitario', 12, 2);
            $table->unsignedSmallInteger('cantidad');
            $table->decimal('total', 12, 2);
            $table->string('notas', 255)->nullable();
            $table->timestamps();
        });

        Schema::create('pedido_item_opciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pedido_item_id')->constrained('pedido_items')->cascadeOnDelete();
            $table->string('grupo_nombre', 100);
            $table->string('etiqueta', 100);
            $table->decimal('precio_adicional', 12, 2)->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pedido_item_opciones');
        Schema::dropIfExists('pedido_items');
        Schema::dropIfExists('pedidos');
    }
};
