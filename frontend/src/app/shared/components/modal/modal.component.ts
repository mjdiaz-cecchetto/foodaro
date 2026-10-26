import { Component, computed, effect, HostListener, input, output, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

export type VarianteModal = 'hoja' | 'dialogo';
export type PuntoCorteModal = 'sm' | 'md';

/**
 * Contenedor de modal reutilizable:
 *
 * - `hoja`    (carta pública): bottom-sheet en móvil que pasa a diálogo
 *   centrado a partir del punto de corte indicado (`sm` o `md`).
 * - `dialogo` (panel admin): diálogo centrado con fade + scale.
 *
 * El contenido se proyecta con <ng-content>. El estado abierto/cerrado lo
 * controla el padre vía `abierto`; el cierre se solicita con `cerrado`.
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponente {
  readonly abierto = input.required<boolean>();
  readonly variante = input<VarianteModal>('hoja');
  readonly puntoCorte = input<PuntoCorteModal>('sm');
  /** Ancho máximo del panel en escritorio (ej. `sm:max-w-lg`, `md:max-w-2xl`). */
  readonly claseAncho = input<string>('sm:max-w-lg');
  /** Clases adicionales del panel (padding, max-h, flex...). */
  readonly clasePanel = input<string>('');
  /** Clase de z-index para apilar modales. */
  readonly claseZ = input<string>('z-50');

  readonly cerrado = output<void>();

  /** Para `dialogo`: el panel se mantiene en el DOM durante la animación de salida. */
  readonly renderizado = signal(false);
  /** Para `dialogo`: estado visual (opacidad/escala) separado del montaje. */
  readonly visible = signal(false);

  /** Desplazamiento vertical en vivo al arrastrar la hoja hacia abajo con el dedo. */
  readonly desplazamientoY = signal(0);
  readonly arrastrando = signal(false);
  private toqueInicioY = 0;
  private puedeArrastrar = false;

  constructor() {
    effect(() => {
      const estaAbierto = this.abierto();
      if (!estaAbierto) {
        this.desplazamientoY.set(0);
        this.arrastrando.set(false);
      }
      if (this.variante() !== 'dialogo') return;
      if (estaAbierto) {
        this.renderizado.set(true);
        setTimeout(() => this.visible.set(true), 10);
      } else {
        this.visible.set(false);
        setTimeout(() => this.renderizado.set(false), 200);
      }
    });
  }

  @HostListener('document:keydown.escape')
  alPresionarEscape(): void {
    if (this.abierto()) this.cerrado.emit();
  }

  solicitarCierre(): void {
    this.cerrado.emit();
  }

  /* ----------------------- Gesto swipe hacia abajo (móvil) ----------------------- */

  alIniciarToque(event: TouchEvent): void {
    if (!this.abierto() || event.touches.length !== 1) return;
    if (this.contenedorScrolleado(event.target as HTMLElement | null)) {
      this.puedeArrastrar = false;
      return;
    }
    this.puedeArrastrar = true;
    this.toqueInicioY = event.touches[0].clientY;
    this.desplazamientoY.set(0);
    this.arrastrando.set(false);
  }

  alMoverToque(event: TouchEvent): void {
    if (!this.puedeArrastrar || event.touches.length !== 1) return;
    const deltaY = event.touches[0].clientY - this.toqueInicioY;

    if (deltaY < -6 && !this.arrastrando()) {
      this.puedeArrastrar = false;
      this.desplazamientoY.set(0);
      return;
    }

    if (deltaY > 6) {
      if (!this.arrastrando() && this.contenedorScrolleado(event.target as HTMLElement | null)) {
        this.puedeArrastrar = false;
        return;
      }
      this.arrastrando.set(true);
      this.desplazamientoY.set(deltaY);
    }
  }

  alTerminarToque(): void {
    if (!this.puedeArrastrar) return;
    const distancia = this.desplazamientoY();
    this.puedeArrastrar = false;
    this.arrastrando.set(false);
    this.desplazamientoY.set(0);

    if (distancia > 70) {
      this.cerrado.emit();
    }
  }

  private contenedorScrolleado(el: HTMLElement | null): boolean {
    let actual = el;
    while (actual && actual.getAttribute('role') !== 'dialog') {
      if (actual.scrollTop > 2) return true;
      actual = actual.parentElement;
    }
    return false;
  }

  /* ----------------------- Variante HOJA ----------------------- */

  private static readonly HOJA_BASE =
    'fixed pointer-events-none overflow-hidden bg-white dark:bg-dark-surface shadow-modal inset-x-0 bottom-0 rounded-t-[32px] flex flex-col border border-gray-100 dark:border-dark-border';

  private static readonly HOJA_ESCRITORIO: Record<PuntoCorteModal, string> = {
    sm: 'sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:rounded-3xl',
    md: 'md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:rounded-3xl',
  };

  private static readonly HOJA_CERRADA: Record<PuntoCorteModal, string> = {
    sm: 'translate-y-full sm:opacity-0 sm:scale-95 sm:translate-y-0',
    md: 'translate-y-full md:opacity-0 md:scale-95 md:translate-y-0',
  };

  private static readonly HOJA_ABIERTA: Record<PuntoCorteModal, string> = {
    sm: 'pointer-events-auto! translate-y-0 sm:opacity-100 sm:scale-100',
    md: 'pointer-events-auto! translate-y-0 md:opacity-100 md:scale-100',
  };

  readonly clasesHoja = computed(() => {
    const pc = this.puntoCorte();
    return [
      ModalComponente.HOJA_BASE,
      this.arrastrando() ? 'transition-none' : 'sheet-transition',
      this.claseZ(),
      ModalComponente.HOJA_ESCRITORIO[pc],
      this.claseAncho(),
      this.clasePanel(),
      this.abierto() ? ModalComponente.HOJA_ABIERTA[pc] : ModalComponente.HOJA_CERRADA[pc],
    ].join(' ');
  });

  /* ----------------------- Variante DIÁLOGO ----------------------- */

  readonly clasesDialogo = computed(() =>
    [
      'fixed inset-x-4 top-1/2 -translate-y-1/2 mx-auto bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-modal border border-zinc-100 dark:border-surface-borderDark transform transition-all duration-200',
      this.claseZ(),
      this.claseAncho(),
      this.clasePanel(),
      this.visible() ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
    ].join(' '),
  );
}
