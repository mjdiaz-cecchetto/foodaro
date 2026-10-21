import { inject, Injectable } from '@angular/core';

import { Promocion } from '../../compartido/modelos';
import { LocalServicio } from '../../nucleo/servicios/local.servicio';
import { ValorFormularioPromocion } from '../interfaces';

/** ABM en memoria de promociones/cupones del local activo (misma fuente que la carta). */
@Injectable({ providedIn: 'root' })
export class PromocionesAdminServicio {
  private readonly local = inject(LocalServicio);

  readonly promociones = this.local.promociones;

  crear(valor: ValorFormularioPromocion): Promocion {
    const promo: Promocion = {
      id: Date.now(),
      titulo: valor.titulo.trim(),
      descuento: valor.descuento,
      codigo: valor.codigo.trim().toUpperCase(),
      imagen: valor.imagen.trim(),
      activa: true,
    };
    this.promociones.update((lista) => [promo, ...lista]);
    return promo;
  }

  alternarEstado(id: number): Promocion | undefined {
    let actualizada: Promocion | undefined;
    this.promociones.update((lista) =>
      lista.map((p) => {
        if (p.id !== id) return p;
        actualizada = { ...p, activa: !p.activa };
        return actualizada;
      }),
    );
    return actualizada;
  }

  eliminar(id: number): void {
    this.promociones.update((lista) => lista.filter((p) => p.id !== id));
  }
}
