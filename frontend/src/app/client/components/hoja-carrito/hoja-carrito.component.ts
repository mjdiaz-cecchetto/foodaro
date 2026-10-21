import { Component, inject } from '@angular/core';

import { ModalComponente } from '../../../shared/components/modal/modal.component';
import { CarritoServicio } from '../../services/carrito.service';
import { UiClienteServicio } from '../../services/ui-cliente.service';
import { ListaItemsCarritoComponente } from '../lista-items-carrito/lista-items-carrito.component';
import { ResumenTotalesComponente } from '../resumen-totales/resumen-totales.component';

/** Comanda como bottom-sheet compacto (móvil y tablet). */
@Component({
  selector: 'app-hoja-carrito',
  standalone: true,
  imports: [ModalComponente, ListaItemsCarritoComponente, ResumenTotalesComponente],
  templateUrl: './hoja-carrito.component.html',
  styleUrl: './hoja-carrito.component.scss',
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
