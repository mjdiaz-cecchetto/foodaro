import { Component, HostListener, inject, signal } from '@angular/core';

import { CartaServicio } from '../../servicios/carta.servicio';
import { UiClienteServicio } from '../../servicios/ui-cliente.servicio';
import { NavegacionCartaServicio } from '../../servicios/navegacion-carta.servicio';
import { PREFIJO_SECCION_CATEGORIA } from '../../interfaces';
import { BannerLocalComponente } from '../../componentes/banner-local/banner-local.componente';
import { CarruselPromocionesComponente } from '../../componentes/carrusel-promociones/carrusel-promociones.componente';
import { CarruselCategoriasComponente } from '../../componentes/carrusel-categorias/carrusel-categorias.componente';
import { BuscadorComponente } from '../../componentes/buscador/buscador.componente';
import { TarjetaProductoComponente } from '../../componentes/tarjeta-producto/tarjeta-producto.componente';
import { PanelCarritoComponente } from '../../componentes/panel-carrito/panel-carrito.componente';
import { ModalDetalleProductoComponente } from '../../componentes/modal-detalle-producto/modal-detalle-producto.componente';

/**
 * Página principal de la carta: banner del local, promos, categorías, buscador
 * y la carta ordenada por secciones (una por categoría) con scroll-spy.
 */
@Component({
  selector: 'app-pagina-carta',
  standalone: true,
  imports: [
    BannerLocalComponente,
    CarruselPromocionesComponente,
    CarruselCategoriasComponente,
    BuscadorComponente,
    TarjetaProductoComponente,
    PanelCarritoComponente,
    ModalDetalleProductoComponente,
  ],
  templateUrl: './pagina-carta.componente.html',
  styleUrl: './pagina-carta.componente.scss',
})
export class PaginaCartaComponente {
  private readonly carta = inject(CartaServicio);
  private readonly navegacion = inject(NavegacionCartaServicio);
  readonly ui = inject(UiClienteServicio);

  readonly PREFIJO_SECCION = PREFIJO_SECCION_CATEGORIA;
  readonly secciones = this.carta.secciones;
  readonly cantidadVisible = this.carta.cantidadVisible;
  readonly busqueda = this.carta.busqueda;

  /** Id del producto abierto en el detalle (null = cerrado). */
  readonly productoSeleccionadoId = signal<number | null>(null);

  private ticket: number | null = null;

  /** Scroll-spy acotado a un frame por evento. */
  @HostListener('window:scroll')
  alHacerScroll(): void {
    if (this.ticket !== null) return;
    this.ticket = requestAnimationFrame(() => {
      this.ticket = null;
      this.navegacion.actualizarDesdeScroll();
    });
  }

  abrirProducto(id: number): void {
    this.productoSeleccionadoId.set(id);
  }

  cerrarProducto(): void {
    this.productoSeleccionadoId.set(null);
  }

  reiniciarFiltros(): void {
    this.carta.reiniciarFiltros();
  }
}
