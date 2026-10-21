import { computed, inject, Injectable } from '@angular/core';

import { Categoria, GrupoOpciones, Producto } from '../../compartido/modelos';
import { LocalServicio } from '../../nucleo/servicios/local.servicio';
import { ValorFormularioCategoria, ValorFormularioProducto } from '../interfaces';

/**
 * ABM en memoria de categorías, productos y plantillas de opciones del local activo.
 * Opera sobre las señales del LocalServicio (misma fuente que la carta);
 * luego delegará en el API Laravel.
 */
@Injectable({ providedIn: 'root' })
export class CatalogoAdminServicio {
  private readonly local = inject(LocalServicio);

  readonly categorias = this.local.categorias;
  readonly productos = this.local.productos;
  readonly plantillasOpciones = this.local.plantillasOpciones;

  readonly cantidadCategorias = computed(() => this.categorias().length);
  readonly cantidadProductos = computed(() => this.productos().length);

  /* ------------------------------ Categorías ------------------------------ */

  cantidadProductosPorCategoria(categoriaId: string): number {
    return this.productos().filter((p) => p.categoriaId === categoriaId).length;
  }

  nombreCategoria(categoriaId: string): string {
    return this.categorias().find((c) => c.id === categoriaId)?.nombre ?? categoriaId;
  }

  crearCategoria(valor: ValorFormularioCategoria): Categoria {
    const categoria: Categoria = {
      id: this.generarSlug(valor.nombre),
      nombre: valor.nombre.trim(),
      imagen: valor.imagen.trim(),
      activa: true,
    };
    this.categorias.update((lista) => [...lista, categoria]);
    return categoria;
  }

  actualizarCategoria(id: string, valor: ValorFormularioCategoria): void {
    this.categorias.update((lista) =>
      lista.map((c) => (c.id === id ? { ...c, nombre: valor.nombre.trim(), imagen: valor.imagen.trim() } : c)),
    );
  }

  eliminarCategoria(id: string): void {
    this.categorias.update((lista) => lista.filter((c) => c.id !== id));
  }

  /* ------------------------------- Productos ------------------------------ */

  filtrarProductos(busqueda: string, categoriaId: string): Producto[] {
    const texto = busqueda.trim().toLowerCase();
    return this.productos().filter((p) => {
      const coincideTexto = p.nombre.toLowerCase().includes(texto) || p.descripcion.toLowerCase().includes(texto);
      const coincideCategoria = categoriaId === 'todas' || p.categoriaId === categoriaId;
      return coincideTexto && coincideCategoria;
    });
  }

  crearProducto(valor: ValorFormularioProducto): Producto {
    const producto: Producto = {
      id: Date.now(),
      ...valor,
      nombre: valor.nombre.trim(),
      tiempoPreparacion: valor.tiempoPreparacion.trim() || '15 min',
      etiqueta: valor.etiqueta.trim(),
      calificacion: 5.0,
      disponible: true,
    };
    this.productos.update((lista) => [producto, ...lista]);
    return producto;
  }

  actualizarProducto(id: number, valor: ValorFormularioProducto): void {
    this.productos.update((lista) => lista.map((p) => (p.id === id ? { ...p, ...valor } : p)));
  }

  alternarDisponibilidad(id: number): Producto | undefined {
    let actualizado: Producto | undefined;
    this.productos.update((lista) =>
      lista.map((p) => {
        if (p.id !== id) return p;
        actualizado = { ...p, disponible: !p.disponible };
        return actualizado;
      }),
    );
    return actualizado;
  }

  eliminarProducto(id: number): void {
    this.productos.update((lista) => lista.filter((p) => p.id !== id));
  }

  /* ------------------------- Plantillas de opciones ----------------------- */

  /** Guarda un grupo como plantilla reutilizable del local (reemplaza si ya existe el id). */
  guardarPlantilla(grupo: GrupoOpciones): void {
    this.plantillasOpciones.update((lista) => {
      const existe = lista.some((g) => g.id === grupo.id);
      return existe ? lista.map((g) => (g.id === grupo.id ? structuredClone(grupo) : g)) : [...lista, structuredClone(grupo)];
    });
  }

  generarSlug(texto: string): string {
    return texto
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
