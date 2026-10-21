import { Component, inject } from '@angular/core';

import { NotificacionesServicio } from '../../../nucleo/servicios/notificaciones.servicio';

/**
 * Notificación flotante global (toast). Dos variantes:
 * píldora superior (carta) y tarjeta inferior derecha (admin).
 */
@Component({
  selector: 'app-notificacion',
  standalone: true,
  templateUrl: './notificacion.componente.html',
  styleUrl: './notificacion.componente.scss',
})
export class NotificacionComponente {
  private readonly notificaciones = inject(NotificacionesServicio);

  readonly estado = this.notificaciones.estado;
  readonly posicion = this.notificaciones.posicion;
}
