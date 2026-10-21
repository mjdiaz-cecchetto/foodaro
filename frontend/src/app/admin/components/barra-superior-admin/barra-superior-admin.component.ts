import { Component, computed, inject, output } from '@angular/core';

import { LogoComponente } from '../../../shared/components/logo/logo.component';
import { AlternarTemaComponente } from '../../../shared/components/alternar-tema/alternar-tema.component';
import { NotificacionesServicio } from '../../../core/services/notificaciones.service';
import { LocalServicio } from '../../../core/services/local.service';
import { LocalAdminServicio } from '../../services/local-admin.service';

/** Barra superior del admin (solo móvil): menú, isotipo + nombre del local, tema y carta. */
@Component({
  selector: 'app-barra-superior-admin',
  standalone: true,
  imports: [LogoComponente, AlternarTemaComponente],
  templateUrl: './barra-superior-admin.component.html',
  styleUrl: './barra-superior-admin.component.scss',
})
export class BarraSuperiorAdminComponente {
  private readonly notificaciones = inject(NotificacionesServicio);
  private readonly local = inject(LocalServicio);
  private readonly localAdmin = inject(LocalAdminServicio);

  readonly alternarMenu = output<void>();

  readonly perfil = this.localAdmin.perfil;
  readonly enlaceCarta = computed(() => this.local.ruta('pedido'));

  alAlternarTema(oscuro: boolean): void {
    this.notificaciones.mostrar(`Modo ${oscuro ? 'Oscuro' : 'Claro'} activado`);
  }
}
