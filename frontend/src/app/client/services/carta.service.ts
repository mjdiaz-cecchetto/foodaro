import { computed, inject, Injectable, signal } from '@angular/core';

import { Producto } from '../../shared/models';
import { LocalServicio } from '../../core/services/local.service';
import { CategoriaCarta, ID_CATEGORIA_TODO, IdCategoriaCarta, SeccionCarta } from '../interfaces';

/**
 * Catálogo público del local activo: categorías, productos, promos,
 * búsqueda y filtro. Lee del LocalServicio (hoy mocks; luego API).
 */
@Injectable({ providedIn: 'root' })
export class CartaServicio {
  private readonly local = inject(LocalServicio);

  readonly categorias = computed<CategoriaCarta[]>(() => [
    { id: ID_CATEGORIA_TODO, nombre: 'Todo', imagen: this.local.perfil()?.logoUrl ?? this.local.productos()[0]?.imagen ?? '' },
    ...this.local
      .categorias()
      .filter((c) => c.activa)
      .map(({ id, nombre, imagen }) => ({ id, nombre, imagen })),
  ]);

  /** Todos los productos del local (los pausados se muestran como "No disponible" sin opción de agregar). */
  readonly productos = computed<Producto[]>(() => this.local.productos());

  readonly promociones = computed(() => this.local.promociones().filter((p) => p.activa));

  readonly categoriaActiva = signal<IdCategoriaCarta>(ID_CATEGORIA_TODO);
  readonly busqueda = signal<string>('');

  readonly productosFiltrados = computed(() => {
    const categoria = this.categoriaActiva();
    const texto = this.busqueda().trim().toLowerCase();

    return this.productos().filter((p) => {
      const coincideCategoria = categoria === ID_CATEGORIA_TODO || p.categoriaId === categoria;
      const coincideBusqueda =
        p.nombre.toLowerCase().includes(texto) || p.descripcion.toLowerCase().includes(texto);
      return coincideCategoria && coincideBusqueda;
    });
  });

  /**
   * Carta agrupada por categoría (en el orden del admin), aplicando solo la
   * búsqueda. Las categorías sin productos coincidentes no se muestran.
   */
  readonly secciones = computed<SeccionCarta[]>(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const coincide = (p: Producto) =>
      !texto || p.nombre.toLowerCase().includes(texto) || p.descripcion.toLowerCase().includes(texto);

    return this.categorias()
      .filter((c) => c.id !== ID_CATEGORIA_TODO)
      .map((categoria) => ({
        categoria,
        productos: this.productos().filter((p) => p.categoriaId === categoria.id && coincide(p)),
      }))
      .filter((s) => s.productos.length > 0);
  });

  /** Cantidad total de productos visibles con la búsqueda actual. */
  readonly cantidadVisible = computed(() => this.secciones().reduce((acc, s) => acc + s.productos.length, 0));

  seleccionarCategoria(id: IdCategoriaCarta): void {
    this.categoriaActiva.set(id);
  }

  buscar(valor: string): void {
    this.busqueda.set(valor);
  }

  limpiarBusqueda(): void {
    this.busqueda.set('');
  }

  reiniciarFiltros(): void {
    this.categoriaActiva.set(ID_CATEGORIA_TODO);
    this.busqueda.set('');
  }

  obtenerProducto(id: number): Producto | undefined {
    return this.local.productos().find((p) => p.id === id);
  }
}
