import { computed, inject, Injectable, signal } from '@angular/core';

import { LocalServicio } from '../../core/services/local.service';
import { ModoCliente } from '../interfaces';

/**
 * Estado de UI compartido de la carta pública: modo (menú / pedido), estado de
 * horario del local y modales globales.
 */
@Injectable({ providedIn: 'root' })
export class UiClienteServicio {
  private readonly local = inject(LocalServicio);

  readonly modo = signal<ModoCliente>('pedido');
  /** `true` si el local figura abierto según sus horarios configurados. */
  readonly localAbierto = computed(() => this.local.perfil()?.abiertoAhora ?? true);
  /** Texto del estado actual: "Abierto · Cierra 01:30" o "Cerrado · Abre a las 12:00". */
  readonly estadoHorario = computed(() => this.local.perfil()?.estado ?? '');
  /** `true` cuando la ruta es `/pedido` y además el local está abierto para recibir pedidos. */
  readonly pedidosHabilitados = computed(() => this.modo() === 'pedido' && this.localAbierto());

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
