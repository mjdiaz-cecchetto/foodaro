import { inject, Injectable } from '@angular/core';

import { formatearMoneda } from '../../compartido/utilidades/moneda';
import { LocalServicio } from '../../nucleo/servicios/local.servicio';
import { BorradorPedido, ETIQUETAS_MEDIO_PAGO, ETIQUETAS_MODO_ENTREGA, ItemCarrito } from '../interfaces';
import { LocalPublicoServicio } from './local-publico.servicio';

/**
 * Arma el pedido y lo envía al WhatsApp del local como mensaje prolijo.
 * Más adelante también lo registrará en el API Laravel.
 */
@Injectable({ providedIn: 'root' })
export class PedidoServicio {
  private readonly localPublico = inject(LocalPublicoServicio);
  private readonly local = inject(LocalServicio);

  /** Texto del pedido con formato de WhatsApp (negritas con *). */
  armarMensaje(pedido: BorradorPedido): string {
    const perfil = this.localPublico.perfil();
    const config = this.local.configuracion();
    const dinero = (n: number) => formatearMoneda(n, config.moneda);
    const sep = '━━━━━━━━━━━━━━━';
    const lineas: string[] = [];

    lineas.push(`🧾 *NUEVO PEDIDO · ${perfil.nombre}*`);
    lineas.push(sep);
    lineas.push('*Detalle:*');
    for (const item of pedido.items) {
      lineas.push(`• ${item.cantidad}x ${item.nombre}${this.describirOpciones(item)} — ${dinero(item.total)}`);
      if (item.notas) lineas.push(`   📝 ${item.notas}`);
    }
    lineas.push(sep);
    lineas.push(`Subtotal: ${dinero(pedido.totales.subtotal)}`);
    if (pedido.totales.descuento > 0) {
      lineas.push(`Descuento${pedido.codigoPromo ? ` ${pedido.codigoPromo}` : ''}: -${dinero(pedido.totales.descuento)}`);
    }
    if (pedido.totales.cargoServicio > 0) {
      lineas.push(`${config.etiquetaCargoServicio}: ${dinero(pedido.totales.cargoServicio)}`);
    }
    lineas.push(`*TOTAL: ${dinero(pedido.totales.total)}*`);
    lineas.push(sep);

    const icono = pedido.modoEntrega === 'envio' ? '🛵' : '🏪';
    lineas.push(`${icono} *${ETIQUETAS_MODO_ENTREGA[pedido.modoEntrega]}*`);
    if (pedido.modoEntrega === 'envio' && pedido.direccion) {
      lineas.push(`📍 ${[pedido.direccion.calle, pedido.direccion.pisoDepto].filter(Boolean).join(', ')}`);
      if (pedido.direccion.referencia) lineas.push(`🗒 Ref: ${pedido.direccion.referencia}`);
    }
    lineas.push(`👤 ${pedido.cliente.nombre}`);
    lineas.push(`📞 ${pedido.cliente.telefono}`);

    let pago = `💳 Pago: ${ETIQUETAS_MEDIO_PAGO[pedido.medioPago]}`;
    if (pedido.medioPago === 'efectivo' && pedido.montoEfectivo) {
      pago += ` (abona con ${dinero(pedido.montoEfectivo)})`;
    }
    lineas.push(pago);

    if (pedido.comentarios) {
      lineas.push(sep);
      lineas.push(`💬 ${pedido.comentarios}`);
    }

    return lineas.join('\n');
  }

  /** URL de WhatsApp del local con el pedido precargado. */
  urlWhatsApp(pedido: BorradorPedido): string {
    const telefono = this.localPublico.perfil().contacto.whatsapp.replace(/\D/g, '');
    return `https://wa.me/${telefono}?text=${encodeURIComponent(this.armarMensaje(pedido))}`;
  }

  /** Abre WhatsApp en una pestaña nueva con el pedido. */
  enviarPorWhatsApp(pedido: BorradorPedido): void {
    window.open(this.urlWhatsApp(pedido), '_blank', 'noopener');
  }

  private describirOpciones(item: ItemCarrito): string {
    const partes = item.opciones.map((o) => o.etiqueta);
    return partes.length ? ` (${partes.join(', ')})` : '';
  }
}
