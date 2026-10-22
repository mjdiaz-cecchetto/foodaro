import { inject, Injectable, signal } from '@angular/core';

import { ID_CATEGORIA_TODO, IdCategoriaCarta, PREFIJO_SECCION_CATEGORIA } from '../interfaces';
import { CartaServicio } from './carta.service';

/**
 * Coordina el carrusel de categorías con las secciones de la carta:
 * - al tocar una categoría se desplaza suavemente hasta su sección;
 * - al hacer scroll, la categoría activa sigue a la sección visible (scroll-spy).
 */
@Injectable({ providedIn: 'root' })
export class NavegacionCartaServicio {
  private readonly carta = inject(CartaServicio);

  /** Alto del encabezado + carrusel de categorías fijos (px). */
  private readonly desplazamientoFijo = signal(128);
  /** Mientras el desplazamiento programático está en curso, el scroll-spy no actualiza. */
  private bloqueoHasta = 0;

  definirDesplazamientoFijo(px: number): void {
    this.desplazamientoFijo.set(px);
  }

  /** Selecciona la categoría y lleva la vista hasta su sección (o al inicio para "Todo"). */
  irACategoria(id: IdCategoriaCarta): void {
    this.carta.seleccionarCategoria(id);
    this.bloqueoHasta = Date.now() + 900;

    if (id === ID_CATEGORIA_TODO) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const seccion = document.getElementById(PREFIJO_SECCION_CATEGORIA + id);
    if (!seccion) return;
    const destino = window.scrollY + seccion.getBoundingClientRect().top - this.desplazamientoFijo() - 8;
    window.scrollTo({ top: Math.max(0, destino), behavior: 'smooth' });
  }

  /** Scroll-spy: determina la sección bajo el encabezado fijo y la marca como activa. */
  actualizarDesdeScroll(): void {
    if (Date.now() < this.bloqueoHasta) return;

    const secciones = this.carta.secciones();
    if (!secciones.length) return;

    const limite = this.desplazamientoFijo() + 16;
    let activa: IdCategoriaCarta = ID_CATEGORIA_TODO;

    for (const s of secciones) {
      const el = document.getElementById(PREFIJO_SECCION_CATEGORIA + s.categoria.id);
      if (!el) continue;
      if (el.getBoundingClientRect().top <= limite) {
        activa = s.categoria.id;
      } else {
        break;
      }
    }

    // Si estamos arriba del todo (banner/promos), queda "Todo"
    if (window.scrollY < 40) activa = ID_CATEGORIA_TODO;

    if (this.carta.categoriaActiva() !== activa) {
      this.carta.seleccionarCategoria(activa);
    }
  }
}
