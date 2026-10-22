import { Component, inject, signal } from '@angular/core';

import { Categoria } from '../../../shared/models';
import { NotificacionesServicio } from '../../../core/services/notificaciones.service';
import { CatalogoAdminServicio } from '../../services/catalogo-admin.service';
import { ValorFormularioCategoria } from '../../interfaces';
import { EncabezadoPaginaComponente } from '../../components/encabezado-pagina/encabezado-pagina.component';
import { ModalFormularioCategoriaComponente } from '../../components/modal-formulario-categoria/modal-formulario-categoria.component';
import { mensajeDeError } from '../../../shared/utils/api';

/** ABM de categorías de la carta. */
@Component({
  selector: 'app-pagina-categorias',
  standalone: true,
  imports: [EncabezadoPaginaComponente, ModalFormularioCategoriaComponente],
  templateUrl: './pagina-categorias.component.html',
  styleUrl: './pagina-categorias.component.scss',
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
    const peticion = actual ? this.catalogo.actualizarCategoria(actual.id, valor) : this.catalogo.crearCategoria(valor);
    peticion.subscribe({
      next: () => {
        this.notificaciones.mostrar(actual ? 'Categoría actualizada' : 'Categoría creada');
        this.cerrarModal();
      },
      error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo guardar la categoría')),
    });
  }

  eliminar(categoria: Categoria): void {
    const asociados = this.catalogo.cantidadProductosPorCategoria(categoria.id);
    if (asociados) {
      this.notificaciones.mostrar(`Tiene ${asociados} producto(s): movelos o eliminalos antes de borrar la categoría`);
      return;
    }
    if (confirm('¿Eliminar esta categoría?')) {
      this.catalogo.eliminarCategoria(categoria.id).subscribe({
        next: () => this.notificaciones.mostrar('Categoría eliminada'),
        error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo eliminar la categoría')),
      });
    }
  }
}
