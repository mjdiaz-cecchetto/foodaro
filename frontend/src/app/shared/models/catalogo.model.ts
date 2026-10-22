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

/** Una opción dentro de un grupo: "12 porciones", "Mayonesa extra"... */
export interface OpcionProducto {
  id: number;
  etiqueta: string;
  /** Adicional sobre el precio base del producto (0 si no suma). */
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
  /** Porcentaje de descuento. */
  descuento: number;
  codigo: string;
  activa: boolean;
  imagen: string;
}
