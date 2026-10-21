import { ItemCarrito, TotalesCarrito } from './carrito.interfaz';

export type ModoEntrega = 'retiro' | 'envio';
export type MedioPago = 'transferencia' | 'debito' | 'efectivo';

export interface DatosCliente {
  nombre: string;
  telefono: string;
}

export interface DireccionEntrega {
  calle: string;
  pisoDepto: string;
  referencia: string;
}

/** Pedido armado en la confirmación, listo para enviarse al local. */
export interface BorradorPedido {
  items: ItemCarrito[];
  totales: TotalesCarrito;
  codigoPromo: string | null;
  modoEntrega: ModoEntrega;
  cliente: DatosCliente;
  direccion: DireccionEntrega | null;
  medioPago: MedioPago;
  /** Solo para efectivo: con cuánto abona (opcional). */
  montoEfectivo: number | null;
  comentarios: string;
}

export const ETIQUETAS_MODO_ENTREGA: Record<ModoEntrega, string> = {
  retiro: 'Retiro en el local',
  envio: 'Envío a domicilio',
};

export const ETIQUETAS_MEDIO_PAGO: Record<MedioPago, string> = {
  transferencia: 'Transferencia',
  debito: 'Débito',
  efectivo: 'Efectivo',
};
