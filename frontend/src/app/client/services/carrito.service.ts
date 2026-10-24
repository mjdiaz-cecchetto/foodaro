import { computed, inject, Injectable, signal } from '@angular/core';

import { Cupon, Producto, Promocion } from '../../shared/models';
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
  /** Cupón de descuento aplicado al pedido (uno solo a la vez). */
  readonly cuponActivo = signal<Cupon | null>(null);
  /** Alias por compatibilidad. */
  readonly promoActiva = this.cuponActivo;
  readonly hojaAbierta = signal<boolean>(false);

  readonly etiquetaCargoServicio = computed(() => this.local.configuracion().etiquetaCargoServicio);

  readonly totales = computed<TotalesCarrito>(() => {
    const items = this.items();
    const cupon = this.cuponActivo();
    const cantidadTotal = items.reduce((acc, i) => acc + i.cantidad, 0);
    const subtotal = items.reduce((acc, i) => acc + i.total, 0);
    const descuento = cupon ? Math.round((subtotal * cupon.descuento) / 100) : 0;
    const cargoServicio = cantidadTotal > 0 ? this.local.configuracion().cargoServicio : 0;
    const total = Math.max(0, subtotal - descuento + cargoServicio);
    return { cantidadTotal, subtotal, descuento, cargoServicio, total };
  });

  readonly estaVacio = computed(() => this.items().length === 0);

  agregar(producto: Producto, seleccion: SeleccionProducto): void {
    let base = producto.precio;
    let adicionales = 0;
    for (const o of seleccion.opciones) {
      if (o.modoPrecio === 'variante') {
        base = o.precioAdicional > 0 ? o.precioAdicional : producto.precio;
      } else if (o.modoPrecio !== 'informativo') {
        adicionales += o.precioAdicional;
      }
    }
    const precioUnitario = base + adicionales;
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

  /** Suma una promoción con precio directamente como línea del carrito. */
  agregarPromocion(promo: Promocion, cantidad = 1): void {
    const clave = `promo|${promo.id}`;
    const precioUnitario = promo.precio;

    this.items.update((items) => {
      const indice = items.findIndex((i) => i.clave === clave);
      if (indice > -1) {
        return items.map((i, idx) =>
          idx === indice
            ? { ...i, cantidad: i.cantidad + cantidad, total: i.precioUnitario * (i.cantidad + cantidad) }
            : i,
        );
      }
      return [
        ...items,
        {
          clave,
          promocionId: promo.id,
          nombre: `Promo: ${promo.titulo}`,
          precioUnitario,
          cantidad,
          total: precioUnitario * cantidad,
          imagen: promo.imagen,
          opciones: [],
          notas: '',
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

  /** Busca y aplica un código de cupón activo del local. */
  aplicarCodigoCupon(codigo: string): { ok: boolean; mensaje: string } {
    const limpio = codigo.trim().toUpperCase();
    if (!limpio) {
      return { ok: false, mensaje: 'Ingresá un código de cupón.' };
    }
    const encontrado = this.local
      .cupones()
      .find((c) => c.activo && c.codigo.toUpperCase() === limpio);

    if (!encontrado) {
      return { ok: false, mensaje: 'El código ingresado no es válido o no está activo.' };
    }

    this.cuponActivo.set(encontrado);
    return { ok: true, mensaje: `Cupón ${encontrado.codigo} aplicado: ${encontrado.descuento}% OFF` };
  }

  quitarCupon(): void {
    this.cuponActivo.set(null);
  }

  alternarHoja(): void {
    this.hojaAbierta.update((v) => !v);
  }

  cerrarHoja(): void {
    this.hojaAbierta.set(false);
  }
}
