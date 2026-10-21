import { Component, inject } from '@angular/core';

import { PrecioPipe } from '../../../compartido/pipes/precio.pipe';
import { CarritoServicio } from '../../servicios/carrito.servicio';

/** Barra flotante inferior con cantidad y total (móvil/tablet). Abre la hoja de la comanda. */
@Component({
  selector: 'app-barra-carrito-movil',
  standalone: true,
  imports: [PrecioPipe],
  templateUrl: './barra-carrito-movil.componente.html',
  styleUrl: './barra-carrito-movil.componente.scss',
})
export class BarraCarritoMovilComponente {
  readonly carrito = inject(CarritoServicio);

  abrir(): void {
    this.carrito.alternarHoja();
  }
}
