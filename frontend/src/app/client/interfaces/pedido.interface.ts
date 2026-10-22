import { ItemCarrito, TotalesCarrito } from './carrito.interface';

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

/** Cuerpo que se envía a POST /locales/{slug}/pedidos. */
export interface PedidoApi {
  items: { productoId: number; cantidad: number; notas: string; opciones: { opcionId: number }[] }[];
  codigoPromo: string | null;
  modoEntrega: ModoEntrega;
  cliente: DatosCliente;
  direccion: DireccionEntrega | null;
  medioPago: MedioPago;
  montoEfectivo: number | null;
  comentarios: string;
}

/** Pedido registrado por el API (resumen que usa la confirmación). */
export interface PedidoRegistrado {
  id: number;
  numero: number;
  estado: string;
  totales: TotalesCarrito;
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
