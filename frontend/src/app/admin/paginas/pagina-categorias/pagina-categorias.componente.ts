import { Component, inject, signal } from '@angular/core';

import { Categoria } from '../../../compartido/modelos';
import { NotificacionesServicio } from '../../../nucleo/servicios/notificaciones.servicio';
import { CatalogoAdminServicio } from '../../servicios/catalogo-admin.servicio';
import { ValorFormularioCategoria } from '../../interfaces';
import { EncabezadoPaginaComponente } from '../../componentes/encabezado-pagina/encabezado-pagina.componente';
import { ModalFormularioCategoriaComponente } from '../../componentes/modal-formulario-categoria/modal-formulario-categoria.componente';

/** ABM de categorías de la carta. */
@Component({
  selector: 'app-pagina-categorias',
  standalone: true,
  imports: [EncabezadoPaginaComponente, ModalFormularioCategoriaComponente],
  templateUrl: './pagina-categorias.componente.html',
  styleUrl: './pagina-categorias.componente.scss',
})
export class PaginaCategoriasComponente {
  private readonly notificaciones = inject(NotificacionesServicio);
  readonly catalogo = inject(CatalogoAdminServicio);

  readonly categorias = this.catalogo.categorias;
  readonly modalAbierto = signal(false);
  readonly editando = signal<Categoria | null>(null);

  abrirAlta(): void {
    this.editando.set(null);
    this.modalAbierto.set(true);
  }

  abrirEdicion(categoria: Categoria): void {
    this.editando.set(categoria);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
  }

  guardar(valor: ValorFormularioCategoria): void {
    const actual = this.editando();
    if (actual) {
      this.catalogo.actualizarCategoria(actual.id, valor);
      this.notificaciones.mostrar('Categoría actualizada');
    } else {
      this.catalogo.crearCategoria(valor);
      this.notificaciones.mostrar('Categoría creada');
    }
    this.cerrarModal();
  }

  eliminar(categoria: Categoria): void {
    const asociados = this.catalogo.cantidadProductosPorCategoria(categoria.id);
    const aviso = asociados
      ? `Esta categoría tiene ${asociados} producto(s). ¿Eliminarla igualmente?`
      : '¿Eliminar esta categoría?';
    if (confirm(aviso)) {
      this.catalogo.eliminarCategoria(categoria.id);
      this.notificaciones.mostrar('Categoría eliminada');
    }
  }
}
