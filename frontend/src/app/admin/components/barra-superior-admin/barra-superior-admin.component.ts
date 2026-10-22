import { Component, computed, inject, output } from '@angular/core';

import { AlternarTemaComponente } from '../../../shared/components/alternar-tema/alternar-tema.component';
import { NotificacionesServicio } from '../../../core/services/notificaciones.service';
import { LocalServicio } from '../../../core/services/local.service';
import { AutenticacionServicio } from '../../../auth/services/autenticacion.service';
import { LocalAdminServicio } from '../../services/local-admin.service';

/**
 * Encabezado fijo del panel admin: nombre del local a la izquierda y, en la
 * esquina derecha, tema, acceso a la carta, usuario y cierre de sesión.
 * En móvil suma el botón del menú lateral.
 */
@Component({
  selector: 'app-barra-superior-admin',
  standalone: true,
  imports: [AlternarTemaComponente],
  templateUrl: './barra-superior-admin.component.html',
  styleUrl: './barra-superior-admin.component.scss',
})
export class BarraSuperiorAdminComponente {
  private readonly notificaciones = inject(NotificacionesServicio);
  private readonly local = inject(LocalServicio);
  private readonly localAdmin = inject(LocalAdminServicio);
  private readonly autenticacion = inject(AutenticacionServicio);

  readonly alternarMenu = output<void>();
  readonly cerrarSesion = output<void>();

  readonly perfil = this.localAdmin.perfil;
  readonly usuario = this.autenticacion.usuario;
  readonly enlaceCarta = computed(() => this.local.ruta('pedido'));

  alAlternarTema(oscuro: boolean): void {
    this.notificaciones.mostrar(`Modo ${oscuro ? 'Oscuro' : 'Claro'} activado`);
  }
}
