import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PrecioPipe } from '../../../shared/pipes/precio.pipe';
import { NotificacionesServicio } from '../../../core/services/notificaciones.service';
import { CarritoServicio } from '../../services/carrito.service';

/** Subtotal, cupón de descuento, cargo de servicio y total. Reutilizado por panel, hoja y confirmación. */
@Component({
  selector: 'app-resumen-totales',
  standalone: true,
  imports: [FormsModule, PrecioPipe],
  templateUrl: './resumen-totales.component.html',
  styleUrl: './resumen-totales.component.scss',
})
export class ResumenTotalesComponente {
  private readonly carrito = inject(CarritoServicio);
  private readonly notificaciones = inject(NotificacionesServicio);

  readonly totales = this.carrito.totales;
  readonly cupon = this.carrito.cuponActivo;
  readonly etiquetaCargo = this.carrito.etiquetaCargoServicio;

  readonly codigoIngresado = signal('');
  readonly errorCupon = signal<string | null>(null);

  aplicarCupon(): void {
    this.errorCupon.set(null);
    const res = this.carrito.aplicarCodigoCupon(this.codigoIngresado());
    if (!res.ok) {
      this.errorCupon.set(res.mensaje);
      return;
    }
    this.codigoIngresado.set('');
    this.notificaciones.mostrar(res.mensaje);
  }

  quitarCupon(): void {
    this.carrito.quitarCupon();
    this.errorCupon.set(null);
    this.notificaciones.mostrar('Cupón quitado');
  }
}
