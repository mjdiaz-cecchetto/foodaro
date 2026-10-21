import { Component, inject } from '@angular/core';

import { ModalComponente } from '../../../compartido/componentes/modal/modal.componente';
import { CarritoServicio } from '../../servicios/carrito.servicio';
import { UiClienteServicio } from '../../servicios/ui-cliente.servicio';
import { ListaItemsCarritoComponente } from '../lista-items-carrito/lista-items-carrito.componente';
import { ResumenTotalesComponente } from '../resumen-totales/resumen-totales.componente';

/** Comanda como bottom-sheet compacto (móvil y tablet). */
@Component({
  selector: 'app-hoja-carrito',
  standalone: true,
  imports: [ModalComponente, ListaItemsCarritoComponente, ResumenTotalesComponente],
  templateUrl: './hoja-carrito.componente.html',
  styleUrl: './hoja-carrito.componente.scss',
})
export class HojaCarritoComponente {
  private readonly ui = inject(UiClienteServicio);
  readonly carrito = inject(CarritoServicio);

  cerrar(): void {
    this.carrito.cerrarHoja();
  }

  confirmar(): void {
    if (this.carrito.estaVacio()) return;
    this.carrito.cerrarHoja();
    this.ui.abrirConfirmacion();
  }

  vaciar(): void {
    this.carrito.vaciar();
    this.carrito.cerrarHoja();
  }
}
