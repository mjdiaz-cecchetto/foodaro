import { Categoria, Producto, Promocion } from '../../shared/models';

/** Datos del formulario de categoría (alta/edición). */
export type ValorFormularioCategoria = Pick<Categoria, 'nombre' | 'imagen'>;

/** Datos del formulario de producto (alta/edición), incluidos sus grupos de opciones. */
export type ValorFormularioProducto = Pick<
  Producto,
  'nombre' | 'categoriaId' | 'precio' | 'tiempoPreparacion' | 'etiqueta' | 'imagen' | 'descripcion' | 'gruposOpciones'
>;

/** Datos del formulario de promoción (alta). */
export type ValorFormularioPromocion = Pick<Promocion, 'titulo' | 'descuento' | 'codigo' | 'imagen'>;

/** Ítem de navegación de la barra lateral. */
export interface ItemNavegacionAdmin {
  ruta: string;
  etiqueta: string;
  icono: string;
  /** 'contador' muestra un número; 'punto' un punto coral; 'flecha' un chevron. */
  indicador: 'contador' | 'punto' | 'flecha';
}
