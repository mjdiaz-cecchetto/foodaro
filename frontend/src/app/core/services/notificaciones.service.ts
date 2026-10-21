import { Injectable, signal } from '@angular/core';

/**
 * Posición/estilo de la notificación flotante:
 * - 'arriba'          → carta pública (píldora arriba al centro)
 * - 'abajo-derecha'   → panel admin (tarjeta abajo a la derecha)
 */
export type PosicionNotificacion = 'arriba' | 'abajo-derecha';

export interface EstadoNotificacion {
  mensaje: string;
  visible: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificacionesServicio {
  readonly estado = signal<EstadoNotificacion>({ mensaje: '', visible: false });
  readonly posicion = signal<PosicionNotificacion>('arriba');

  private temporizador: ReturnType<typeof setTimeout> | null = null;

  mostrar(mensaje: string, duracionMs = 2500): void {
    if (this.temporizador) clearTimeout(this.temporizador);
    this.estado.set({ mensaje, visible: true });
    this.temporizador = setTimeout(() => {
      this.estado.update((e) => ({ ...e, visible: false }));
      this.temporizador = null;
    }, duracionMs);
  }

  definirPosicion(posicion: PosicionNotificacion): void {
    this.posicion.set(posicion);
  }
}
