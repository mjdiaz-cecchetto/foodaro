import { Component, inject } from '@angular/core';

import { PrecioPipe } from '../../../shared/pipes/precio.pipe';
import { CarritoServicio } from '../../services/carrito.service';

/** Barra flotante inferior con cantidad y total (móvil/tablet). Abre la hoja de la comanda. */
@Component({
  selector: 'app-barra-carrito-movil',
  standalone: true,
  imports: [PrecioPipe],
  templateUrl: './barra-carrito-movil.component.html',
  styleUrl: './barra-carrito-movil.component.scss',
})
export class BarraCarritoMovilComponente {
  readonly carrito = inject(CarritoServicio);

  abrir(): void {
    this.carrito.alternarHoja();
  }
}
