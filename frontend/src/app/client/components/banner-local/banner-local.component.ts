import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AlternarTemaComponente } from '../../../shared/components/alternar-tema/alternar-tema.component';
import { LocalServicio } from '../../../core/services/local.service';
import { NotificacionesServicio } from '../../../core/services/notificaciones.service';
import { LocalPublicoServicio } from '../../services/local-publico.service';
import { UiClienteServicio } from '../../services/ui-cliente.service';

/**
 * Banner del local al inicio de la carta: portada de fondo con degradé,
 * controles flotantes (Info, QR y Tema Claro/Oscuro), logo en cuadro, nombre, eslogan y estado.
 */
@Component({
  selector: 'app-banner-local',
  standalone: true,
  imports: [RouterLink, AlternarTemaComponente],
  templateUrl: './banner-local.component.html',
  styleUrl: './banner-local.component.scss',
})
export class BannerLocalComponente {
  private readonly localPublico = inject(LocalPublicoServicio);
  private readonly local = inject(LocalServicio);
  private readonly notificaciones = inject(NotificacionesServicio);
  readonly ui = inject(UiClienteServicio);

  readonly perfil = this.localPublico.perfil;
  readonly enlacePedido = computed(() => this.local.url('pedido'));

  abrirPerfil(): void {
    this.ui.abrirModalLocal();
  }

  abrirQr(): void {
    this.ui.abrirModalQr();
  }

  alAlternarTema(oscuro: boolean): void {
    this.notificaciones.mostrar(oscuro ? 'Modo Oscuro Activado' : 'Modo Claro Activado');
  }
}
