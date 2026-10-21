import { inject, Pipe, PipeTransform } from '@angular/core';

import { LocalServicio } from '../../core/services/local.service';

/**
 * Formatea importes en la moneda del local activo con formato es-AR
 * (`$ 14.500`, `-$ 2.900`). Para ARS no se muestran decimales.
 */
@Pipe({ name: 'precio', standalone: true })
export class PrecioPipe implements PipeTransform {
  private readonly local = inject(LocalServicio);
  private readonly formateadores = new Map<string, Intl.NumberFormat>();

  transform(valor: number | null | undefined, signo: '' | '-' | '+' = ''): string {
    const monto = Number(valor ?? 0);
    const moneda = this.local.configuracion().moneda;
    return `${signo}${this.formateador(moneda).format(monto)}`;
  }

  private formateador(moneda: string): Intl.NumberFormat {
    let f = this.formateadores.get(moneda);
    if (!f) {
      const sinDecimales = moneda === 'ARS';
      f = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: moneda,
        minimumFractionDigits: sinDecimales ? 0 : 2,
        maximumFractionDigits: sinDecimales ? 0 : 2,
      });
      this.formateadores.set(moneda, f);
    }
    return f;
  }
}
