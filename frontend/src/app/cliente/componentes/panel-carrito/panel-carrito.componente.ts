import { Component, inject } from '@angular/core';

import { CarritoServicio } from '../../servicios/carrito.servicio';
import { UiClienteServicio } from '../../servicios/ui-cliente.servicio';
import { ListaItemsCarritoComponente } from '../lista-items-carrito/lista-items-carrito.componente';
import { ResumenTotalesComponente } from '../resumen-totales/resumen-totales.componente';

/** Comanda lateral fija en escritorio (lg+). */
@Component({
  selector: 'app-panel-carrito',
  standalone: true,
  imports: [ListaItemsCarritoComponente, ResumenTotalesComponente],
  templateUrl: './panel-carrito.componente.html',
  styleUrl: './panel-carrito.componente.scss',
})
export class PanelCarritoComponente {
  private readonly ui = inject(UiClienteServicio);
  readonly carrito = inject(CarritoServicio);

  confirmar(): void {
    if (this.carrito.estaVacio()) return;
    this.ui.abrirConfirmacion();
  }

  vaciar(): void {
    this.carrito.vaciar();
  }
}
