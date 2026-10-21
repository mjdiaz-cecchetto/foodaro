import { Component, inject, signal } from '@angular/core';

import { Promocion } from '../../../shared/models';
import { NotificacionesServicio } from '../../../core/services/notificaciones.service';
import { PromocionesAdminServicio } from '../../services/promociones-admin.service';
import { ValorFormularioPromocion } from '../../interfaces';
import { EncabezadoPaginaComponente } from '../../components/encabezado-pagina/encabezado-pagina.component';
import { ModalFormularioPromocionComponente } from '../../components/modal-formulario-promocion/modal-formulario-promocion.component';

/** Promociones y cupones que se muestran en el carrusel de la carta. */
@Component({
  selector: 'app-pagina-promociones',
  standalone: true,
  imports: [EncabezadoPaginaComponente, ModalFormularioPromocionComponente],
  templateUrl: './pagina-promociones.component.html',
  styleUrl: './pagina-promociones.component.scss',
})
export class PaginaPromocionesComponente {
  private readonly promocionesAdmin = inject(PromocionesAdminServicio);
  private readonly notificaciones = inject(NotificacionesServicio);

  readonly promociones = this.promocionesAdmin.promociones;
  readonly modalAbierto = signal(false);

  abrirAlta(): void {
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
  }

  guardar(valor: ValorFormularioPromocion): void {
    this.promocionesAdmin.crear(valor);
    this.notificaciones.mostrar('Promoción creada');
    this.cerrarModal();
  }

  alternarEstado(promo: Promocion): void {
    const actualizada = this.promocionesAdmin.alternarEstado(promo.id);
    if (actualizada) this.notificaciones.mostrar(`Promoción ${actualizada.activa ? 'activada' : 'pausada'}`);
  }

  eliminar(promo: Promocion): void {
    if (confirm(`¿Eliminar la promoción "${promo.titulo}"?`)) {
      this.promocionesAdmin.eliminar(promo.id);
      this.notificaciones.mostrar('Promoción eliminada');
    }
  }
}
