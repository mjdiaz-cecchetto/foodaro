import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { formatearMoneda } from '../../shared/utils/moneda';
import { RespuestaApi } from '../../shared/utils/api';
import { LocalServicio } from '../../core/services/local.service';
import {
  BorradorPedido,
  ETIQUETAS_MEDIO_PAGO,
  ETIQUETAS_MODO_ENTREGA,
  ItemCarrito,
  PedidoApi,
  PedidoRegistrado,
} from '../interfaces';
import { LocalPublicoServicio } from './local-publico.service';

/**
 * Registra el pedido en el API (que recalcula los importes) y lo envía al
 * WhatsApp del local como mensaje prolijo con el número asignado.
 */
@Injectable({ providedIn: 'root' })
export class PedidoServicio {
  private readonly http = inject(HttpClient);
  private readonly localPublico = inject(LocalPublicoServicio);
  private readonly local = inject(LocalServicio);

  /** POST /locales/{slug}/pedidos */
  registrar(pedido: BorradorPedido): Observable<PedidoRegistrado> {
    return this.http
      .post<RespuestaApi<PedidoRegistrado>>(this.local.urlApiPublica('pedidos'), this.aPayload(pedido))
      .pipe(map((r) => r.data));
  }

  /** Texto del pedido con formato de WhatsApp (negritas con *). */
  armarMensaje(pedido: BorradorPedido, registrado?: PedidoRegistrado): string {
    const perfil = this.localPublico.perfil();
    const config = this.local.configuracion();
    const totales = registrado?.totales ?? pedido.totales;
    const dinero = (n: number) => formatearMoneda(n, config.moneda);
    const sep = '━━━━━━━━━━━━━━━';
    const lineas: string[] = [];

    const numero = registrado ? ` #${String(registrado.numero).padStart(4, '0')}` : '';
    lineas.push(`🧾 *NUEVO PEDIDO${numero} · ${perfil.nombre}*`);
    lineas.push(sep);
    lineas.push('*Detalle:*');
    for (const item of pedido.items) {
      lineas.push(`• ${item.cantidad}x ${item.nombre}${this.describirOpciones(item)} — ${dinero(item.total)}`);
      if (item.notas) lineas.push(`   📝 ${item.notas}`);
    }
    lineas.push(sep);
    lineas.push(`Subtotal: ${dinero(totales.subtotal)}`);
    if (totales.descuento > 0) {
      lineas.push(`Descuento${pedido.codigoPromo ? ` ${pedido.codigoPromo}` : ''}: -${dinero(totales.descuento)}`);
    }
    if (totales.cargoServicio > 0) {
      lineas.push(`${config.etiquetaCargoServicio}: ${dinero(totales.cargoServicio)}`);
    }
    lineas.push(`*TOTAL: ${dinero(totales.total)}*`);
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
  urlWhatsApp(pedido: BorradorPedido, registrado?: PedidoRegistrado): string {
    const telefono = this.localPublico.perfil().contacto.whatsapp.replace(/\D/g, '');
    return `https://wa.me/${telefono}?text=${encodeURIComponent(this.armarMensaje(pedido, registrado))}`;
  }

  /** Abre WhatsApp en una pestaña nueva con el pedido. */
  abrirWhatsApp(pedido: BorradorPedido, registrado?: PedidoRegistrado): void {
    window.open(this.urlWhatsApp(pedido, registrado), '_blank', 'noopener');
  }

  private aPayload(pedido: BorradorPedido): PedidoApi {
    return {
      items: pedido.items.map((i) => ({
        productoId: i.productoId,
        cantidad: i.cantidad,
        notas: i.notas,
        opciones: i.opciones.map((o) => ({ opcionId: o.opcionId })),
      })),
      codigoPromo: pedido.codigoPromo,
      modoEntrega: pedido.modoEntrega,
      cliente: pedido.cliente,
      direccion: pedido.direccion,
      medioPago: pedido.medioPago,
      montoEfectivo: pedido.montoEfectivo,
      comentarios: pedido.comentarios,
    };
  }

  private describirOpciones(item: ItemCarrito): string {
    const partes = item.opciones.map((o) => o.etiqueta);
    return partes.length ? ` (${partes.join(', ')})` : '';
  }
}
