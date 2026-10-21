import { Component, computed, inject, signal } from '@angular/core';

import { Producto } from '../../../compartido/modelos';
import { PrecioPipe } from '../../../compartido/pipes/precio.pipe';
import { NotificacionesServicio } from '../../../nucleo/servicios/notificaciones.servicio';
import { CatalogoAdminServicio } from '../../servicios/catalogo-admin.servicio';
import { ValorFormularioProducto } from '../../interfaces';
import { EncabezadoPaginaComponente } from '../../componentes/encabezado-pagina/encabezado-pagina.componente';
import { ModalFormularioProductoComponente } from '../../componentes/modal-formulario-producto/modal-formulario-producto.componente';

/** Tabla de productos con búsqueda, filtro por categoría, disponibilidad y ABM. */
@Component({
  selector: 'app-pagina-productos',
  standalone: true,
  imports: [PrecioPipe, EncabezadoPaginaComponente, ModalFormularioProductoComponente],
  templateUrl: './pagina-productos.componente.html',
  styleUrl: './pagina-productos.componente.scss',
})
export class PaginaProductosComponente {
  private readonly notificaciones = inject(NotificacionesServicio);
  readonly catalogo = inject(CatalogoAdminServicio);

  readonly categorias = this.catalogo.categorias;
  readonly busqueda = signal('');
  readonly filtroCategoria = signal('todas');

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
    this.filtroCategoria.set((event.target as HTMLSelectElement).value);
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
    if (actual) {
      this.catalogo.actualizarProducto(actual.id, valor);
      this.notificaciones.mostrar('Producto actualizado');
    } else {
      this.catalogo.crearProducto(valor);
      this.notificaciones.mostrar('Producto agregado a la carta');
    }
    this.cerrarModal();
  }

  alternarDisponibilidad(producto: Producto): void {
    const actualizado = this.catalogo.alternarDisponibilidad(producto.id);
    if (actualizado) {
      this.notificaciones.mostrar(`${actualizado.nombre}: ${actualizado.disponible ? 'disponible en la carta' : 'marcado como agotado'}`);
    }
  }

  eliminar(producto: Producto): void {
    if (confirm(`¿Eliminar "${producto.nombre}" de la carta?`)) {
      this.catalogo.eliminarProducto(producto.id);
      this.notificaciones.mostrar('Producto eliminado');
    }
  }
}
