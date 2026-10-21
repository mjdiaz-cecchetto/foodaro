import { Component, inject, signal } from '@angular/core';

import { Promocion } from '../../../compartido/modelos';
import { NotificacionesServicio } from '../../../nucleo/servicios/notificaciones.servicio';
import { PromocionesAdminServicio } from '../../servicios/promociones-admin.servicio';
import { ValorFormularioPromocion } from '../../interfaces';
import { EncabezadoPaginaComponente } from '../../componentes/encabezado-pagina/encabezado-pagina.componente';
import { ModalFormularioPromocionComponente } from '../../componentes/modal-formulario-promocion/modal-formulario-promocion.componente';

/** Promociones y cupones que se muestran en el carrusel de la carta. */
@Component({
  selector: 'app-pagina-promociones',
  standalone: true,
  imports: [EncabezadoPaginaComponente, ModalFormularioPromocionComponente],
  templateUrl: './pagina-promociones.componente.html',
  styleUrl: './pagina-promociones.componente.scss',
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
