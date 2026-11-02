import { Component, inject, OnInit, signal } from '@angular/core';

const CLAVE_BARRA_COLAPSADA = 'foodaro_admin_barra_colapsada';
/** Por debajo de este ancho (xl de Tailwind) el menú arranca compactado para ganar espacio. */
const ANCHO_RIEL_POR_DEFECTO = 1280;
/** Por debajo de este ancho (md de Tailwind) el menú es un drawer móvil. */
const ANCHO_DRAWER = 768;
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
  /** Menú lateral en modo riel (íconos). Se persiste la elección del usuario; si no eligió, depende del ancho. */
  readonly barraLateralColapsada = signal(this.leerColapsoInicial());
  readonly suscripcion = this.local.suscripcion;

  ngOnInit(): void {
    this.notificaciones.definirPosicion('abajo-derecha');
  }

  /** Botón de menú de la barra superior: en móvil abre el drawer, en escritorio compacta/expande el riel. */
  alternarBarraLateral(): void {
    if (window.innerWidth < ANCHO_DRAWER) {
      this.barraLateralAbierta.update((v) => !v);
    } else {
      this.alternarColapsoBarra();
    }
  }

  alternarColapsoBarra(): void {
    const valor = !this.barraLateralColapsada();
    this.barraLateralColapsada.set(valor);
    try {
      localStorage.setItem(CLAVE_BARRA_COLAPSADA, valor ? '1' : '0');
    } catch {
      /* almacenamiento no disponible: la preferencia dura la sesión */
    }
  }

  private leerColapsoInicial(): boolean {
    try {
      const guardado = localStorage.getItem(CLAVE_BARRA_COLAPSADA);
      if (guardado === '1') return true;
      if (guardado === '0') return false;
    } catch {
      /* sin localStorage */
    }
    return window.innerWidth < ANCHO_RIEL_POR_DEFECTO;
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
