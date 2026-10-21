import { computed, inject, Injectable, signal } from '@angular/core';

import { Producto, Promocion } from '../../shared/models';
import { LocalServicio } from '../../core/services/local.service';
import { ItemCarrito, SeleccionProducto, TotalesCarrito } from '../interfaces';

/**
 * Estado de la comanda. Cada combinación distinta de producto + opciones + notas
 * es una línea independiente, así el pedido llega completo al local.
 * El cargo de servicio y la moneda salen de la configuración del local.
 */
@Injectable({ providedIn: 'root' })
export class CarritoServicio {
  private readonly local = inject(LocalServicio);

  readonly items = signal<ItemCarrito[]>([]);
  /** Promoción/cupón aplicado (una sola a la vez). */
  readonly promoActiva = signal<Promocion | null>(null);
  readonly hojaAbierta = signal<boolean>(false);

  readonly etiquetaCargoServicio = computed(() => this.local.configuracion().etiquetaCargoServicio);

  readonly totales = computed<TotalesCarrito>(() => {
    const items = this.items();
    const promo = this.promoActiva();
    const cantidadTotal = items.reduce((acc, i) => acc + i.cantidad, 0);
    const subtotal = items.reduce((acc, i) => acc + i.total, 0);
    const descuento = promo ? (subtotal * promo.descuento) / 100 : 0;
    const cargoServicio = cantidadTotal > 0 ? this.local.configuracion().cargoServicio : 0;
    const total = Math.max(0, subtotal - descuento + cargoServicio);
    return { cantidadTotal, subtotal, descuento, cargoServicio, total };
  });

  readonly estaVacio = computed(() => this.items().length === 0);

  agregar(producto: Producto, seleccion: SeleccionProducto): void {
    const adicionales = seleccion.opciones.reduce((acc, o) => acc + o.precioAdicional, 0);
    const precioUnitario = producto.precio + adicionales;
    const notas = seleccion.notas.trim();
    const clave = [producto.id, ...seleccion.opciones.map((o) => o.opcionId), notas].join('|');

    this.items.update((items) => {
      const indice = items.findIndex((i) => i.clave === clave);
      if (indice > -1) {
        return items.map((i, idx) =>
          idx === indice
            ? { ...i, cantidad: i.cantidad + seleccion.cantidad, total: i.precioUnitario * (i.cantidad + seleccion.cantidad) }
            : i,
        );
      }
      return [
        ...items,
        {
          clave,
          productoId: producto.id,
          nombre: producto.nombre,
          precioUnitario,
          cantidad: seleccion.cantidad,
          total: precioUnitario * seleccion.cantidad,
          imagen: producto.imagen,
          opciones: seleccion.opciones,
          notas,
        },
      ];
    });
  }

  modificarCantidad(clave: string, delta: number): void {
    this.items.update((items) =>
      items
        .map((i) =>
          i.clave === clave ? { ...i, cantidad: i.cantidad + delta, total: i.precioUnitario * (i.cantidad + delta) } : i,
        )
        .filter((i) => i.cantidad > 0),
    );
  }

  vaciar(): void {
    this.items.set([]);
  }

  /** Aplica un cupón (reemplaza el anterior). @returns `false` si ya estaba activo. */
  aplicarPromo(promo: Promocion): boolean {
    if (this.promoActiva()?.id === promo.id) return false;
    this.promoActiva.set(promo);
    return true;
  }

  alternarHoja(): void {
    this.hojaAbierta.update((v) => !v);
  }

  cerrarHoja(): void {
    this.hojaAbierta.set(false);
  }
}
