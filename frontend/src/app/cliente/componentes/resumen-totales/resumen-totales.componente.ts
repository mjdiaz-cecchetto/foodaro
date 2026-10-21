import { Component, inject } from '@angular/core';

import { PrecioPipe } from '../../../compartido/pipes/precio.pipe';
import { CarritoServicio } from '../../servicios/carrito.servicio';

/** Subtotal, descuento, cargo de servicio y total. Reutilizado por panel, hoja y confirmación. */
@Component({
  selector: 'app-resumen-totales',
  standalone: true,
  imports: [PrecioPipe],
  templateUrl: './resumen-totales.componente.html',
  styleUrl: './resumen-totales.componente.scss',
})
export class ResumenTotalesComponente {
  private readonly carrito = inject(CarritoServicio);

  readonly totales = this.carrito.totales;
  readonly promo = this.carrito.promoActiva;
  readonly etiquetaCargo = this.carrito.etiquetaCargoServicio;
}
