import { Component, inject } from '@angular/core';

import { PrecioPipe } from '../../../shared/pipes/precio.pipe';
import { CarritoServicio } from '../../services/carrito.service';

/** Subtotal, descuento, cargo de servicio y total. Reutilizado por panel, hoja y confirmación. */
@Component({
  selector: 'app-resumen-totales',
  standalone: true,
  imports: [PrecioPipe],
  templateUrl: './resumen-totales.component.html',
  styleUrl: './resumen-totales.component.scss',
})
export class ResumenTotalesComponente {
  private readonly carrito = inject(CarritoServicio);

  readonly totales = this.carrito.totales;
  readonly promo = this.carrito.promoActiva;
  readonly etiquetaCargo = this.carrito.etiquetaCargoServicio;
}
