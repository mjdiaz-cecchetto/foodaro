import { Component, inject } from '@angular/core';

import { NotificacionesServicio } from '../../../core/services/notificaciones.service';

/**
 * Notificación flotante global (toast). Dos variantes:
 * píldora superior (carta) y tarjeta inferior derecha (admin).
 */
@Component({
  selector: 'app-notificacion',
  standalone: true,
  templateUrl: './notificacion.component.html',
  styleUrl: './notificacion.component.scss',
})
export class NotificacionComponente {
  private readonly notificaciones = inject(NotificacionesServicio);

  readonly estado = this.notificaciones.estado;
  readonly posicion = this.notificaciones.posicion;
}
