import { Component, computed, inject, signal } from '@angular/core';

import { Producto } from '../../../shared/models';
import { PrecioPipe } from '../../../shared/pipes/precio.pipe';
import { NotificacionesServicio } from '../../../core/services/notificaciones.service';
import { CatalogoAdminServicio } from '../../services/catalogo-admin.service';
import { ValorFormularioProducto } from '../../interfaces';
import { EncabezadoPaginaComponente } from '../../components/encabezado-pagina/encabezado-pagina.component';
import { ModalFormularioProductoComponente } from '../../components/modal-formulario-producto/modal-formulario-producto.component';
import { mensajeDeError } from '../../../shared/utils/api';

/** Tabla de productos con búsqueda, filtro por categoría, disponibilidad y ABM. */
@Component({
  selector: 'app-pagina-productos',
  standalone: true,
  imports: [PrecioPipe, EncabezadoPaginaComponente, ModalFormularioProductoComponente],
  templateUrl: './pagina-productos.component.html',
  styleUrl: './pagina-productos.component.scss',
})
export class PaginaProductosComponente {
  private readonly notificaciones = inject(NotificacionesServicio);
  readonly catalogo = inject(CatalogoAdminServicio);

  readonly categorias = this.catalogo.categorias;
  readonly busqueda = signal('');
  readonly filtroCategoria = signal<number | 'todas'>('todas');

  readonly filtrados = computed(() => {
    this.catalogo.productos();
    return this.catalogo.filtrarProductos(this.busqueda(), this.filtroCategoria());
  });

  readonly modalAbierto = signal(false);
  readonly editando = signal<Producto | null>(null);

  alBuscar(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }

  alFiltrarCategoria(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    this.filtroCategoria.set(valor === 'todas' ? 'todas' : Number(valor));
  }

  abrirAlta(): void {
    this.editando.set(null);
    this.modalAbierto.set(true);
  }

  abrirEdicion(producto: Producto): void {
    this.editando.set(producto);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
  }

  guardar(valor: ValorFormularioProducto): void {
    const actual = this.editando();
    const peticion = actual ? this.catalogo.actualizarProducto(actual.id, valor) : this.catalogo.crearProducto(valor);
    peticion.subscribe({
      next: () => {
        this.notificaciones.mostrar(actual ? 'Producto actualizado' : 'Producto agregado a la carta');
        this.cerrarModal();
      },
      error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo guardar el producto')),
    });
  }

  alternarDisponibilidad(producto: Producto): void {
    this.catalogo.alternarDisponibilidad(producto.id).subscribe({
      next: (actualizado) =>
        this.notificaciones.mostrar(`${actualizado.nombre}: ${actualizado.disponible ? 'disponible en la carta' : 'marcado como agotado'}`),
      error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err)),
    });
  }

  eliminar(producto: Producto): void {
    if (confirm(`¿Eliminar "${producto.nombre}" de la carta?`)) {
      this.catalogo.eliminarProducto(producto.id).subscribe({
        next: () => this.notificaciones.mostrar('Producto eliminado'),
        error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo eliminar el producto')),
      });
    }
  }
}
