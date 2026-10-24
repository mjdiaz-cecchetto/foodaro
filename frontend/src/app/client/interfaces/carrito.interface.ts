import { ModoPrecioGrupo } from '../../shared/models';

/** Opción elegida por el cliente dentro de un grupo de un producto. */
export interface OpcionElegida {
  grupoId: number;
  grupoNombre: string;
  opcionId: number;
  etiqueta: string;
  precioAdicional: number;
  modoPrecio?: ModoPrecioGrupo;
}

/** Línea de la comanda. Una por combinación de producto + opciones + notas, o promoción directa. */
export interface ItemCarrito {
  /** Clave única de la línea (producto + opciones + notas, o promo). */
  clave: string;
  productoId?: number;
  promocionId?: number;
  nombre: string;
  /** Precio unitario incluyendo las opciones elegidas. */
  precioUnitario: number;
  cantidad: number;
  total: number;
  imagen: string;
  opciones: OpcionElegida[];
  notas: string;
}

export interface TotalesCarrito {
  cantidadTotal: number;
  subtotal: number;
  descuento: number;
  cargoServicio: number;
  costoEnvio?: number;
  total: number;
}

/** Selección hecha en el detalle del producto antes de agregar al carrito. */
export interface SeleccionProducto {
  productoId: number;
  cantidad: number;
  opciones: OpcionElegida[];
  notas: string;
}
