import { computed, Injectable, signal } from '@angular/core';

import { ModoCliente } from '../interfaces';

/**
 * Estado de UI compartido de la carta pública: modo (menú / pedido) y modales globales.
 * Permite que encabezado, banner del local, carrito y layout coordinen sin acoplarse.
 */
@Injectable({ providedIn: 'root' })
export class UiClienteServicio {
  readonly modo = signal<ModoCliente>('pedido');
  /** `true` cuando la carta permite armar pedidos (/pedido). */
  readonly pedidosHabilitados = computed(() => this.modo() === 'pedido');

  readonly modalLocalAbierto = signal(false);
  readonly modalQrAbierto = signal(false);
  readonly confirmacionAbierta = signal(false);

  definirModo(modo: ModoCliente): void {
    this.modo.set(modo);
  }

  abrirModalLocal(): void {
    this.modalLocalAbierto.set(true);
  }

  cerrarModalLocal(): void {
    this.modalLocalAbierto.set(false);
  }

  abrirModalQr(): void {
    this.modalQrAbierto.set(true);
  }

  cerrarModalQr(): void {
    this.modalQrAbierto.set(false);
  }

  abrirConfirmacion(): void {
    this.confirmacionAbierta.set(true);
  }

  cerrarConfirmacion(): void {
    this.confirmacionAbierta.set(false);
  }
}
