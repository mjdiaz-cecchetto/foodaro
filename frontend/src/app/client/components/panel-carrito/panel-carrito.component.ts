import { Component, inject } from '@angular/core';

import { CarritoServicio } from '../../services/carrito.service';
import { UiClienteServicio } from '../../services/ui-cliente.service';
import { ListaItemsCarritoComponente } from '../lista-items-carrito/lista-items-carrito.component';
import { ResumenTotalesComponente } from '../resumen-totales/resumen-totales.component';

/** Comanda lateral fija en escritorio (lg+). */
@Component({
  selector: 'app-panel-carrito',
  standalone: true,
  imports: [ListaItemsCarritoComponente, ResumenTotalesComponente],
  templateUrl: './panel-carrito.component.html',
  styleUrl: './panel-carrito.component.scss',
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
