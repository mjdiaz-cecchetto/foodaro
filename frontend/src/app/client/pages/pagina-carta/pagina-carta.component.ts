import { Component, HostListener, inject, signal } from '@angular/core';

import { CartaServicio } from '../../services/carta.service';
import { UiClienteServicio } from '../../services/ui-cliente.service';
import { NavegacionCartaServicio } from '../../services/navegacion-carta.service';
import { PREFIJO_SECCION_CATEGORIA } from '../../interfaces';
import { BannerLocalComponente } from '../../components/banner-local/banner-local.component';
import { CarruselPromocionesComponente } from '../../components/carrusel-promociones/carrusel-promociones.component';
import { CarruselCategoriasComponente } from '../../components/carrusel-categorias/carrusel-categorias.component';
import { BuscadorComponente } from '../../components/buscador/buscador.component';
import { TarjetaProductoComponente } from '../../components/tarjeta-producto/tarjeta-producto.component';
import { PanelCarritoComponente } from '../../components/panel-carrito/panel-carrito.component';
import { ModalDetalleProductoComponente } from '../../components/modal-detalle-producto/modal-detalle-producto.component';

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
  templateUrl: './pagina-carta.component.html',
  styleUrl: './pagina-carta.component.scss',
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
