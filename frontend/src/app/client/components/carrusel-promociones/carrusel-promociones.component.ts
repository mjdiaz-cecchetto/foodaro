import { Component, computed, effect, ElementRef, inject, OnDestroy, signal, viewChild } from '@angular/core';

import { Promocion } from '../../../shared/models';
import { PrecioPipe } from '../../../shared/pipes/precio.pipe';
import { CartaServicio } from '../../services/carta.service';
import { CarritoServicio } from '../../services/carrito.service';
import { UiClienteServicio } from '../../services/ui-cliente.service';
import { NotificacionesServicio } from '../../../core/services/notificaciones.service';

const INTERVALO_MS = 5000;

/**
 * Carrusel compacto de promociones con auto-deslizado cada 5 s.
 * El usuario puede deslizar a mano (snap) o tocar los puntos; el autoplay se
 * pausa mientras interactúa. En modo pedido cada promo permite sumarla al carrito
 * (si tiene precio) o aplicar su cupón de descuento.
 */
@Component({
  selector: 'app-carrusel-promociones',
  standalone: true,
  imports: [PrecioPipe],
  templateUrl: './carrusel-promociones.component.html',
  styleUrl: './carrusel-promociones.component.scss',
})
export class CarruselPromocionesComponente implements OnDestroy {
  private readonly carta = inject(CartaServicio);
  private readonly carrito = inject(CarritoServicio);
  private readonly notificaciones = inject(NotificacionesServicio);
  readonly ui = inject(UiClienteServicio);

  readonly promociones = this.carta.promociones;
  readonly indice = signal(0);
  readonly promoActivaId = computed(() => this.carrito.promoActiva()?.id ?? null);

  private readonly pistaRef = viewChild<ElementRef<HTMLElement>>('pista');

  private temporizador: ReturnType<typeof setInterval> | null = null;
  private pausado = false;

  constructor() {
    effect(() => {
      // Reinicia el autoplay si cambia la cantidad de promos
      this.promociones().length;
      this.reiniciarAutoplay();
    });
  }

  ngOnDestroy(): void {
    this.detener();
  }

  irA(i: number, manual = true): void {
    const total = this.promociones().length;
    if (!total) return;
    const destino = ((i % total) + total) % total;
    this.indice.set(destino);
    const pista = this.pistaRef()?.nativeElement;
    if (pista) {
      pista.scrollTo({ left: destino * pista.clientWidth, behavior: 'smooth' });
    }
    if (manual) this.reiniciarAutoplay();
  }

  siguiente(manual = false): void {
    this.irA(this.indice() + 1, manual);
  }

  /** Sincroniza el punto activo cuando el usuario desliza con el dedo. */
  alDesplazar(el: HTMLElement): void {
    if (!el.clientWidth) return;
    const nuevo = Math.round(el.scrollLeft / el.clientWidth);
    if (nuevo !== this.indice()) this.indice.set(nuevo);
  }

  pausar(): void {
    this.pausado = true;
  }

  reanudar(): void {
    this.pausado = false;
  }

  cantidadEnCarrito(promoId: number): number {
    return this.carrito.items().find((i) => i.promocionId === promoId)?.cantidad ?? 0;
  }

  seleccionarPromo(promo: Promocion, event: Event): void {
    event.stopPropagation();
    if (!this.ui.pedidosHabilitados()) return;

    this.carrito.agregarPromocion(promo);
    this.notificaciones.mostrar(`¡"${promo.titulo}" sumada al pedido!`);
  }

  private reiniciarAutoplay(): void {
    this.detener();
    if (this.promociones().length < 2) return;
    this.temporizador = setInterval(() => {
      if (!this.pausado) this.siguiente();
    }, INTERVALO_MS);
  }

  private detener(): void {
    if (this.temporizador) {
      clearInterval(this.temporizador);
      this.temporizador = null;
    }
  }
}
