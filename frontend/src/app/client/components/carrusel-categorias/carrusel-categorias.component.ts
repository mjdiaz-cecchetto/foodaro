import { AfterViewInit, Component, effect, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';

import { CartaServicio } from '../../services/carta.service';
import { NavegacionCartaServicio } from '../../services/navegacion-carta.service';
import { LocalPublicoServicio } from '../../services/local-publico.service';
import { UiClienteServicio } from '../../services/ui-cliente.service';
import { ID_CATEGORIA_TODO, IdCategoriaCarta } from '../../interfaces';

/** Alto fijo (px) de la mini-cabecera con logo y nombre del local que aparece al hacer scroll. */
const ALTURA_MINI_CABECERA = 48;
/** Scroll (px) a partir del cual se muestra la mini-cabecera (aprox. cuando el banner deja de verse). */
const UMBRAL_MINI_CABECERA = 200;

/**
 * Carrusel horizontal de categorías, fijo arriba al hacer scroll.
 * Al bajar, suma una mini-cabecera con el logo circular y el nombre del local.
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
  private readonly localPublico = inject(LocalPublicoServicio);
  readonly ui = inject(UiClienteServicio);

  private readonly contenedor = viewChild<ElementRef<HTMLElement>>('pista');
  private readonly barra = viewChild<ElementRef<HTMLElement>>('barra');
  private readonly miniCabecera = viewChild<ElementRef<HTMLElement>>('miniCabecera');

  readonly ID_TODO = ID_CATEGORIA_TODO;
  readonly categorias = this.carta.categorias;
  readonly activa = this.carta.categoriaActiva;
  readonly perfil = this.localPublico.perfil;

  /** `true` cuando el usuario bajó lo suficiente: muestra logo + nombre del local arriba de las categorías. */
  readonly compacto = signal(false);

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

  @HostListener('window:scroll')
  alHacerScroll(): void {
    const debeCompactar = window.scrollY > UMBRAL_MINI_CABECERA;
    if (debeCompactar !== this.compacto()) {
      this.compacto.set(debeCompactar);
    }
  }

  seleccionar(id: IdCategoriaCarta): void {
    this.navegacion.irACategoria(id);
  }

  verTodos(): void {
    this.navegacion.irACategoria(ID_CATEGORIA_TODO);
  }

  abrirInfo(): void {
    this.ui.abrirModalLocal();
  }

  /**
   * Informa al servicio cuánto ocupan las categorías fijas (+ mini-cabecera) para calcular
   * el destino del scroll. Se considera siempre la mini-cabecera desplegada, ya que al ir a
   * una sección la página queda scrolleada y la cabecera visible.
   */
  private medirDesplazamiento(): void {
    const barra = this.barra()?.nativeElement;
    if (!barra) return;
    const top = parseFloat(getComputedStyle(barra).top) || 0;
    const altoMiniActual = this.miniCabecera()?.nativeElement.offsetHeight ?? 0;
    this.navegacion.definirDesplazamientoFijo(top + barra.offsetHeight - altoMiniActual + ALTURA_MINI_CABECERA);
  }
}
