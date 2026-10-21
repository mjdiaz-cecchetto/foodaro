import { Categoria, Producto } from '../../shared/models';

/** Categoría tal como se muestra en el carrusel (incluye la pseudo "Todo"). */
export type CategoriaCarta = Pick<Categoria, 'id' | 'nombre' | 'imagen'>;

export const ID_CATEGORIA_TODO = 'todo';

/** Bloque de la carta: una categoría con sus productos visibles. */
export interface SeccionCarta {
  categoria: CategoriaCarta;
  productos: Producto[];
}

/** Prefijo del id DOM de cada sección (para scroll y scroll-spy). */
export const PREFIJO_SECCION_CATEGORIA = 'categoria-';

/**
 * Modo de la carta pública:
 * - 'menu'   → solo lectura (/:local/menu)
 * - 'pedido' → con carrito y confirmación (/:local/pedido)
 */
export type ModoCliente = 'menu' | 'pedido';
