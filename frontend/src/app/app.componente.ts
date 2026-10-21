import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { TemaServicio } from './nucleo/servicios/tema.servicio';
import { NotificacionComponente } from './compartido/componentes/notificacion/notificacion.componente';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NotificacionComponente],
  templateUrl: './app.componente.html',
  styleUrl: './app.componente.scss',
})
export class AppComponente {
  /** Se inyecta para inicializar el tema (clase `dark` en <html>) al arrancar. */
  private readonly tema = inject(TemaServicio);
}
