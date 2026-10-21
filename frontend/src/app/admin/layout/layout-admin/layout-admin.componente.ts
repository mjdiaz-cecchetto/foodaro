import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { NotificacionesServicio } from '../../../nucleo/servicios/notificaciones.servicio';
import { LocalServicio } from '../../../nucleo/servicios/local.servicio';
import { AutenticacionServicio } from '../../../autenticacion/servicios/autenticacion.servicio';
import { BarraLateralAdminComponente } from '../../componentes/barra-lateral-admin/barra-lateral-admin.componente';
import { BarraSuperiorAdminComponente } from '../../componentes/barra-superior-admin/barra-superior-admin.componente';

/** Layout del panel admin: barra lateral (drawer en móvil), barra superior móvil y contenido. */
@Component({
  selector: 'app-layout-admin',
  standalone: true,
  imports: [RouterOutlet, BarraLateralAdminComponente, BarraSuperiorAdminComponente],
  templateUrl: './layout-admin.componente.html',
  styleUrl: './layout-admin.componente.scss',
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
    this.autenticacion.cerrarSesion();
    this.notificaciones.mostrar('Sesión cerrada');
    this.router.navigate(this.local.url('auth', 'login'));
  }
}
