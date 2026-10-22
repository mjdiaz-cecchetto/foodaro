<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categorias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('local_id')->constrained('locales')->cascadeOnDelete();
            $table->string('nombre', 100);
            $table->string('slug', 100);
            $table->string('imagen_url', 500)->nullable();
            $table->unsignedSmallInteger('orden')->default(0);
            $table->boolean('activa')->default(true);
            $table->timestamps();

            $table->unique(['local_id', 'slug']);
            $table->index(['local_id', 'orden']);
        });

        Schema::create('productos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('local_id')->constrained('locales')->cascadeOnDelete();
            $table->foreignId('categoria_id')->constrained('categorias')->cascadeOnDelete();
            $table->string('nombre', 150);
            $table->text('descripcion')->nullable();
            $table->decimal('precio', 12, 2);
            $table->string('imagen_url', 500)->nullable();
            $table->string('etiqueta', 40)->nullable();
            $table->string('tiempo_preparacion', 40)->nullable();
            $table->decimal('calificacion', 2, 1)->default(5.0);
            $table->boolean('disponible')->default(true);
            $table->unsignedSmallInteger('orden')->default(0);
            $table->timestamps();

            $table->index(['local_id', 'categoria_id', 'disponible']);
        });

        /**
         * Grupos de opciones (tamaño, cantidad, extras...).
         * producto_id NULL => plantilla reutilizable del local.
         * producto_id set  => grupo propio del producto (copia editable).
         */
        Schema::create('grupos_opciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('local_id')->constrained('locales')->cascadeOnDelete();
            $table->foreignId('producto_id')->nullable()->constrained('productos')->cascadeOnDelete();
            $table->string('nombre', 100);
            $table->enum('tipo', ['unica', 'multiple'])->default('unica');
            $table->boolean('obligatorio')->default(false);
            $table->unsignedTinyInteger('maximo')->nullable();
            $table->unsignedSmallInteger('orden')->default(0);
            $table->timestamps();

            $table->index(['local_id', 'producto_id']);
        });

        Schema::create('opciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('grupo_opciones_id')->constrained('grupos_opciones')->cascadeOnDelete();
            $table->string('etiqueta', 100);
            $table->decimal('precio_adicional', 12, 2)->default(0);
            $table->boolean('por_defecto')->default(false);
            $table->unsignedSmallInteger('orden')->default(0);
            $table->timestamps();
        });

        Schema::create('promociones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('local_id')->constrained('locales')->cascadeOnDelete();
            $table->string('titulo', 150);
            $table->unsignedTinyInteger('descuento'); // porcentaje 1..100
            $table->string('codigo', 30);
            $table->string('imagen_url', 500)->nullable();
            $table->boolean('activa')->default(true);
            $table->timestamps();

            $table->unique(['local_id', 'codigo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promociones');
        Schema::dropIfExists('opciones');
        Schema::dropIfExists('grupos_opciones');
        Schema::dropIfExists('productos');
        Schema::dropIfExists('categorias');
    }
};
