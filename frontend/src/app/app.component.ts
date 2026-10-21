import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { TemaServicio } from './core/services/tema.service';
import { NotificacionComponente } from './shared/components/notificacion/notificacion.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NotificacionComponente],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponente {
  /** Se inyecta para inicializar el tema (clase `dark` en <html>) al arrancar. */
  private readonly tema = inject(TemaServicio);
}
