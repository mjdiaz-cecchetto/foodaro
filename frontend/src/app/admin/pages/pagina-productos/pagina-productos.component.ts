import { Component, computed, inject, signal } from '@angular/core';

import { Categoria, Producto } from '../../../shared/models';
import { PrecioPipe } from '../../../shared/pipes/precio.pipe';
import { NotificacionesServicio } from '../../../core/services/notificaciones.service';
import { CatalogoAdminServicio } from '../../services/catalogo-admin.service';
import { ValorFormularioCategoria, ValorFormularioProducto } from '../../interfaces';
import { ModalFormularioProductoComponente } from '../../components/modal-formulario-producto/modal-formulario-producto.component';
import { ModalFormularioCategoriaComponente } from '../../components/modal-formulario-categoria/modal-formulario-categoria.component';
import { mensajeDeError } from '../../../shared/utils/api';

/**
 * Vista unificada de Gestión de Productos (Catálogo & Modificadores):
 * barra lateral de categorías con sus imágenes, buscador en vivo, grilla de
 * tarjetas con switch de activo/agotado y slide-over de producto + grupos de opciones.
 */
@Component({
  selector: 'app-pagina-productos',
  standalone: true,
  imports: [PrecioPipe, ModalFormularioProductoComponente, ModalFormularioCategoriaComponente],
  templateUrl: './pagina-productos.component.html',
  styleUrl: './pagina-productos.component.scss',
})
export class PaginaProductosComponente {
  private readonly notificaciones = inject(NotificacionesServicio);
  readonly catalogo = inject(CatalogoAdminServicio);

  readonly categorias = this.catalogo.categorias;
  readonly busqueda = signal('');
  readonly filtroCategoria = signal<number | 'todas'>('todas');

  /** Seguimiento de imágenes rotas para mostrar el placeholder "Sin foto". */
  readonly imagenesRotas = signal<Record<number, boolean>>({});
  readonly imagenesCategoriasRotas = signal<Record<number, boolean>>({});

  readonly filtrados = computed(() => {
    this.catalogo.productos();
    return this.catalogo.filtrarProductos(this.busqueda(), this.filtroCategoria());
  });

  /* ----------------------- Estado Modal Producto ----------------------- */
  readonly modalProductoAbierto = signal(false);
  readonly productoEditando = signal<Producto | null>(null);

  /* ----------------------- Estado Modal Categoría ---------------------- */
  readonly modalCategoriaAbierto = signal(false);
  readonly categoriaEditando = signal<Categoria | null>(null);

  /* ----------------------------- Filtros ------------------------------- */

  alBuscar(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }

  seleccionarCategoria(id: number | 'todas'): void {
    this.filtroCategoria.set(id);
  }

  /* --------------------------- ABM Categorías -------------------------- */

  abrirAltaCategoria(): void {
    this.categoriaEditando.set(null);
    this.modalCategoriaAbierto.set(true);
  }

  abrirEdicionCategoria(categoria: Categoria, event: Event): void {
    event.stopPropagation();
    this.categoriaEditando.set(categoria);
    this.modalCategoriaAbierto.set(true);
  }

  cerrarModalCategoria(): void {
    this.modalCategoriaAbierto.set(false);
  }

  guardarCategoria(valor: ValorFormularioCategoria): void {
    const actual = this.categoriaEditando();
    const peticion = actual
      ? this.catalogo.actualizarCategoria(actual.id, valor)
      : this.catalogo.crearCategoria(valor);
    peticion.subscribe({
      next: (cat) => {
        this.imagenesCategoriasRotas.update((mapa) => ({ ...mapa, [cat.id]: false }));
        this.notificaciones.mostrar(actual ? 'Categoría actualizada' : 'Categoría creada');
        this.cerrarModalCategoria();
      },
      error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo guardar la categoría')),
    });
  }

  eliminarCategoria(categoria: Categoria, event: Event): void {
    event.stopPropagation();
    const asociados = this.catalogo.cantidadProductosPorCategoria(categoria.id);
    if (asociados) {
      this.notificaciones.mostrar(`Tiene ${asociados} producto(s): movelos o eliminalos antes de borrar la categoría`);
      return;
    }
    if (confirm(`¿Eliminar la categoría "${categoria.nombre}"?`)) {
      this.catalogo.eliminarCategoria(categoria.id).subscribe({
        next: () => {
          if (this.filtroCategoria() === categoria.id) {
            this.filtroCategoria.set('todas');
          }
          this.notificaciones.mostrar('Categoría eliminada');
        },
        error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo eliminar la categoría')),
      });
    }
  }

  moverCategoria(categoria: Categoria, delta: -1 | 1, event: Event): void {
    event.stopPropagation();
    const lista = [...this.categorias()];
    const idx = lista.findIndex((c) => c.id === categoria.id);
    const destino = idx + delta;
    if (idx < 0 || destino < 0 || destino >= lista.length) return;

    [lista[idx], lista[destino]] = [lista[destino], lista[idx]];
    this.catalogo.reordenarCategorias(lista.map((c) => c.id)).subscribe({
      error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo reordenar la categoría')),
    });
  }

  /* --------------------------- ABM Productos --------------------------- */

  abrirAltaProducto(): void {
    if (this.categorias().length === 0) {
      this.notificaciones.mostrar('Creá primero una categoría para agregar productos');
      this.abrirAltaCategoria();
      return;
    }
    this.productoEditando.set(null);
    this.modalProductoAbierto.set(true);
  }

  abrirEdicionProducto(producto: Producto): void {
    this.productoEditando.set(producto);
    this.modalProductoAbierto.set(true);
  }

  duplicarProducto(producto: Producto): void {
    const copia: Producto = {
      ...structuredClone(producto),
      id: 0,
      nombre: `${producto.nombre} (copia)`,
    };
    this.productoEditando.set(copia);
    this.modalProductoAbierto.set(true);
    this.notificaciones.mostrar('Revisá el nombre o precio y tocá Guardar para crear la copia');
  }

  cerrarModalProducto(): void {
    this.modalProductoAbierto.set(false);
  }

  guardarProducto(valor: ValorFormularioProducto): void {
    const actual = this.productoEditando();
    const esEdicionReal = actual && actual.id > 0;
    const peticion = esEdicionReal
      ? this.catalogo.actualizarProducto(actual.id, valor)
      : this.catalogo.crearProducto(valor);
    peticion.subscribe({
      next: (prod) => {
        this.imagenesRotas.update((mapa) => ({ ...mapa, [prod.id]: false }));
        this.notificaciones.mostrar(esEdicionReal ? 'Producto y modificadores actualizados' : 'Producto agregado a la carta');
        this.cerrarModalProducto();
      },
      error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo guardar el producto')),
    });
  }

  alternarDisponibilidad(producto: Producto): void {
    this.catalogo.alternarDisponibilidad(producto.id).subscribe({
      next: (actualizado) =>
        this.notificaciones.mostrar(
          `${actualizado.nombre}: ${actualizado.disponible ? 'activo en la carta' : 'pausado / agotado'}`,
        ),
      error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err)),
    });
  }

  eliminarProducto(producto: Producto): void {
    if (confirm(`¿Eliminar "${producto.nombre}" de la carta?`)) {
      this.catalogo.eliminarProducto(producto.id).subscribe({
        next: () => this.notificaciones.mostrar('Producto eliminado'),
        error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo eliminar el producto')),
      });
    }
  }

  moverProducto(producto: Producto, delta: -1 | 1): void {
    const visibles = this.filtrados();
    const idxVisible = visibles.findIndex((p) => p.id === producto.id);
    const destinoVisible = idxVisible + delta;
    if (idxVisible < 0 || destinoVisible < 0 || destinoVisible >= visibles.length) return;

    const otroProducto = visibles[destinoVisible];
    const todos = [...this.catalogo.productos()];
    const idxA = todos.findIndex((p) => p.id === producto.id);
    const idxB = todos.findIndex((p) => p.id === otroProducto.id);
    if (idxA < 0 || idxB < 0) return;

    [todos[idxA], todos[idxB]] = [todos[idxB], todos[idxA]];
    this.catalogo.reordenarProductos(todos.map((p) => p.id)).subscribe({
      error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo reordenar el producto')),
    });
  }

  /* ------------------------- Imágenes fallback ------------------------- */

  imagenRota(productoId: number): boolean {
    return !!this.imagenesRotas()[productoId];
  }

  marcarImagenRota(productoId: number): void {
    this.imagenesRotas.update((mapa) => ({ ...mapa, [productoId]: true }));
  }

  imagenCategoriaRota(categoriaId: number): boolean {
    return !!this.imagenesCategoriasRotas()[categoriaId];
  }

  marcarImagenCategoriaRota(categoriaId: number): void {
    this.imagenesCategoriasRotas.update((mapa) => ({ ...mapa, [categoriaId]: true }));
  }
}
