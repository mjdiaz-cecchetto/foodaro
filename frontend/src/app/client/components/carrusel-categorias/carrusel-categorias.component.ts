import { AfterViewInit, Component, effect, ElementRef, inject, viewChild } from '@angular/core';

import { CartaServicio } from '../../services/carta.service';
import { NavegacionCartaServicio } from '../../services/navegacion-carta.service';
import { ID_CATEGORIA_TODO, IdCategoriaCarta } from '../../interfaces';

/**
 * Carrusel horizontal de categorías, fijo debajo del encabezado.
 * Al tocar una categoría se desplaza a su sección; al hacer scroll se
 * resalta la categoría visible y el chip activo se centra solo.
 * Cuando hay una categoría elegida aparece "Ver todos".
 */
@Component({
  selector: 'app-carrusel-categorias',
  standalone: true,
  templateUrl: './carrusel-categorias.component.html',
  styleUrl: './carrusel-categorias.component.scss',
})
export class CarruselCategoriasComponente implements AfterViewInit {
  private readonly carta = inject(CartaServicio);
  private readonly navegacion = inject(NavegacionCartaServicio);

  private readonly contenedor = viewChild<ElementRef<HTMLElement>>('pista');
  private readonly barra = viewChild<ElementRef<HTMLElement>>('barra');

  readonly ID_TODO = ID_CATEGORIA_TODO;
  readonly categorias = this.carta.categorias;
  readonly activa = this.carta.categoriaActiva;

  constructor() {
    // Centra el chip activo cuando cambia (por toque o por scroll-spy)
    effect(() => {
      const id = this.activa();
      const pista = this.contenedor()?.nativeElement;
      if (!pista) return;
      const chip = pista.querySelector<HTMLElement>(`[data-categoria="${id}"]`);
      if (!chip) return;
      // Desplazamiento horizontal manual (scrollIntoView movería también la página)
      const destino = chip.offsetLeft - pista.clientWidth / 2 + chip.clientWidth / 2;
      pista.scrollTo({ left: Math.max(0, destino), behavior: 'smooth' });
    });
  }

  ngAfterViewInit(): void {
    this.medirDesplazamiento();
    window.addEventListener('resize', () => this.medirDesplazamiento(), { passive: true });
  }

  seleccionar(id: IdCategoriaCarta): void {
    this.navegacion.irACategoria(id);
  }

  verTodos(): void {
    this.navegacion.irACategoria(ID_CATEGORIA_TODO);
  }

  /** Informa al servicio cuánto ocupan header + categorías para calcular el destino del scroll. */
  private medirDesplazamiento(): void {
    const barra = this.barra()?.nativeElement;
    if (!barra) return;
    const top = parseFloat(getComputedStyle(barra).top) || 0;
    this.navegacion.definirDesplazamientoFijo(top + barra.offsetHeight);
  }
}
