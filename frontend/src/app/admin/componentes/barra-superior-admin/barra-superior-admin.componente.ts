import { Component, computed, inject, output } from '@angular/core';

import { LogoComponente } from '../../../compartido/componentes/logo/logo.componente';
import { AlternarTemaComponente } from '../../../compartido/componentes/alternar-tema/alternar-tema.componente';
import { NotificacionesServicio } from '../../../nucleo/servicios/notificaciones.servicio';
import { LocalServicio } from '../../../nucleo/servicios/local.servicio';
import { LocalAdminServicio } from '../../servicios/local-admin.servicio';

/** Barra superior del admin (solo móvil): menú, isotipo + nombre del local, tema y carta. */
@Component({
  selector: 'app-barra-superior-admin',
  standalone: true,
  imports: [LogoComponente, AlternarTemaComponente],
  templateUrl: './barra-superior-admin.componente.html',
  styleUrl: './barra-superior-admin.componente.scss',
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
