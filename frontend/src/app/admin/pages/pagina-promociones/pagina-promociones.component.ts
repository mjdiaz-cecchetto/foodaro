import { Component, inject, signal } from '@angular/core';

import { Promocion } from '../../../shared/models';
import { PrecioPipe } from '../../../shared/pipes/precio.pipe';
import { NotificacionesServicio } from '../../../core/services/notificaciones.service';
import { PromocionesAdminServicio } from '../../services/promociones-admin.service';
import { ValorFormularioPromocion } from '../../interfaces';
import { EncabezadoPaginaComponente } from '../../components/encabezado-pagina/encabezado-pagina.component';
import { ModalFormularioPromocionComponente } from '../../components/modal-formulario-promocion/modal-formulario-promocion.component';
import { mensajeDeError } from '../../../shared/utils/api';

/** Promociones y cupones que se muestran en el carrusel de la carta. */
@Component({
  selector: 'app-pagina-promociones',
  standalone: true,
  imports: [EncabezadoPaginaComponente, ModalFormularioPromocionComponente, PrecioPipe],
  templateUrl: './pagina-promociones.component.html',
  styleUrl: './pagina-promociones.component.scss',
})
export class PaginaPromocionesComponente {
  private readonly promocionesAdmin = inject(PromocionesAdminServicio);
  private readonly notificaciones = inject(NotificacionesServicio);

  readonly promociones = this.promocionesAdmin.promociones;
  readonly modalAbierto = signal(false);
  readonly editando = signal<Promocion | null>(null);

  abrirAlta(): void {
    this.editando.set(null);
    this.modalAbierto.set(true);
  }

  abrirEdicion(promo: Promocion): void {
    this.editando.set(promo);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.editando.set(null);
  }

  guardar(valor: ValorFormularioPromocion): void {
    const actual = this.editando();
    const peticion$ = actual
      ? this.promocionesAdmin.actualizar(actual.id, valor)
      : this.promocionesAdmin.crear(valor);

    peticion$.subscribe({
      next: () => {
        this.notificaciones.mostrar(actual ? 'Promoción actualizada' : 'Promoción creada');
        this.cerrarModal();
      },
      error: (err: unknown) =>
        this.notificaciones.mostrar(
          mensajeDeError(err, actual ? 'No se pudo actualizar la promoción' : 'No se pudo crear la promoción'),
        ),
    });
  }

  alternarEstado(promo: Promocion): void {
    this.promocionesAdmin.alternarEstado(promo.id).subscribe({
      next: (actualizada) => this.notificaciones.mostrar(`Promoción ${actualizada.activa ? 'activada' : 'pausada'}`),
      error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err)),
    });
  }

  eliminar(promo: Promocion): void {
    if (confirm(`¿Eliminar la promoción "${promo.titulo}"?`)) {
      this.promocionesAdmin.eliminar(promo.id).subscribe({
        next: () => this.notificaciones.mostrar('Promoción eliminada'),
        error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo eliminar la promoción')),
      });
    }
  }
}
