import { Categoria, Cupon, Producto, Promocion } from '../../shared/models';

/** Datos del formulario de categoría (alta/edición). */
export type ValorFormularioCategoria = Pick<Categoria, 'nombre' | 'imagen'>;

/** Datos del formulario de producto (alta/edición), incluidos sus grupos de opciones y disponibilidad. */
export type ValorFormularioProducto = Pick<
  Producto,
  'nombre' | 'categoriaId' | 'precio' | 'tiempoPreparacion' | 'etiqueta' | 'imagen' | 'descripcion' | 'disponible' | 'gruposOpciones'
>;

/** Datos del formulario de promoción (alta/edición). */
export type ValorFormularioPromocion = Pick<Promocion, 'titulo' | 'precio' | 'descuento' | 'imagen' | 'activa'>;

/** Datos del formulario de cupón de descuento (alta/edición). */
export type ValorFormularioCupon = Pick<
  Cupon,
  'codigo' | 'descuento' | 'descripcion' | 'montoMinimo' | 'maxUsos' | 'fechaVencimiento' | 'activo'
>;

/** Ítem de navegación de la barra lateral. */
export interface ItemNavegacionAdmin {
  ruta: string;
  etiqueta: string;
  icono: string;
  /** 'contador' muestra un número; 'punto' un punto coral; 'flecha' un chevron. */
  indicador: 'contador' | 'punto' | 'flecha';
}
