import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { NotificacionesServicio } from '../../../core/services/notificaciones.service';
import { LocalServicio } from '../../../core/services/local.service';
import { AutenticacionServicio } from '../../../auth/services/autenticacion.service';
import { BarraLateralAdminComponente } from '../../components/barra-lateral-admin/barra-lateral-admin.component';
import { BarraSuperiorAdminComponente } from '../../components/barra-superior-admin/barra-superior-admin.component';

/** Layout del panel admin: barra lateral (drawer en móvil), barra superior móvil y contenido. */
@Component({
  selector: 'app-layout-admin',
  standalone: true,
  imports: [RouterOutlet, BarraLateralAdminComponente, BarraSuperiorAdminComponente],
  templateUrl: './layout-admin.component.html',
  styleUrl: './layout-admin.component.scss',
})
export class LayoutAdminComponente implements OnInit {
  private readonly notificaciones = inject(NotificacionesServicio);
  private readonly autenticacion = inject(AutenticacionServicio);
  private readonly local = inject(LocalServicio);
  private readonly router = inject(Router);

  readonly barraLateralAbierta = signal(false);

  ngOnInit(): void {
    this.notificaciones.definirPosicion('abajo-derecha');
  }

  alternarBarraLateral(): void {
    this.barraLateralAbierta.update((v) => !v);
  }

  cerrarBarraLateral(): void {
    this.barraLateralAbierta.set(false);
  }

  cerrarSesion(): void {
    this.autenticacion.cerrarSesion().subscribe(() => {
      this.local.cargaCompleta.set(false);
      this.notificaciones.mostrar('Sesión cerrada');
      this.router.navigate(this.local.url('auth', 'login'));
    });
  }
}
