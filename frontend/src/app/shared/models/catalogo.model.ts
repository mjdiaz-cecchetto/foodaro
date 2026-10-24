/**
 * Entidades del catálogo compartidas por la carta pública (cliente)
 * y el panel de administración (admin). Misma forma que los Resources del API Laravel.
 * Los ids los asigna la base de datos; en el admin, los registros aún no guardados
 * usan ids temporales negativos.
 */

export interface Categoria {
  id: number;
  nombre: string;
  slug?: string;
  imagen: string;
  activa: boolean;
  orden?: number;
}

/** 'unica' = elegir una sola opción (radio) · 'multiple' = varias (checkbox). */
export type TipoSeleccion = 'unica' | 'multiple';

/**
 * Cómo impactan las opciones del grupo en el precio del producto:
 * - 'adicional'   → suma (+$) al precio base (ej. Extras, Adicionales).
 * - 'variante'    → define/reemplaza ($) el precio base del plato (ej. 8 o 4 porciones, Docena o Media).
 * - 'informativo' → sin impacto en precio (ej. Cocción: Al horno / Fritas, Punto de carne).
 */
export type ModoPrecioGrupo = 'adicional' | 'variante' | 'informativo';

/** Una opción dentro de un grupo: "12 porciones", "Mayonesa extra"... */
export interface OpcionProducto {
  id: number;
  etiqueta: string;
  /** Adicional sobre el precio base o precio de la variante según `modoPrecio` del grupo. */
  precioAdicional: number;
  porDefecto?: boolean;
}

/**
 * Grupo de opciones de un producto: "Tamaño", "Cantidad", "Extras", "Punto de cocción".
 * Permite modelar cualquier variante sin lógica especial por rubro.
 */
export interface GrupoOpciones {
  id: number;
  nombre: string;
  tipo: TipoSeleccion;
  /** Modo de cálculo de precio de las opciones del grupo ('adicional' por defecto). */
  modoPrecio?: ModoPrecioGrupo;
  /** Si es obligatorio elegir al menos una opción (ej. tamaño de pizza). */
  obligatorio: boolean;
  /** Tope de opciones para 'multiple' (ej. hasta 3 extras). */
  maximo?: number | null;
  opciones: OpcionProducto[];
}

export interface Producto {
  id: number;
  nombre: string;
  categoriaId: number;
  calificacion: number;
  tiempoPreparacion: string;
  precio: number;
  etiqueta: string;
  disponible: boolean;
  imagen: string;
  descripcion: string;
  /** Opciones específicas de este producto (puede estar vacío). */
  gruposOpciones: GrupoOpciones[];
  orden?: number;
}

export interface Promocion {
  id: number;
  titulo: string;
  /** Precio de la promoción cuando se vende como combo/ítem directo en el carrito. */
  precio: number;
  /** Porcentaje de descuento visual (opcional, 0 si no aplica). */
  descuento: number;
  codigo?: string;
  activa: boolean;
  imagen: string;
}

export interface Cupon {
  id: number;
  codigo: string;
  /** Porcentaje de descuento (1 a 100) aplicable al confirmar el pedido. */
  descuento: number;
  descripcion: string;
  activo: boolean;
}
