import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LogoComponente } from '../../../shared/components/logo/logo.component';
import { AlternarTemaComponente } from '../../../shared/components/alternar-tema/alternar-tema.component';
import { NotificacionesServicio } from '../../../core/services/notificaciones.service';
import { LocalServicio } from '../../../core/services/local.service';
import { UiClienteServicio } from '../../services/ui-cliente.service';
import { LocalPublicoServicio } from '../../services/local-publico.service';

/**
 * Encabezado sticky de la carta. A la izquierda solo el isotipo de Foodaro
 * (la marca protagonista es la del local, en su banner); a la derecha tema y QR.
 * En modo menú ofrece "Pedir".
 */
@Component({
  selector: 'app-encabezado-cliente',
  standalone: true,
  imports: [RouterLink, LogoComponente, AlternarTemaComponente],
  templateUrl: './encabezado-cliente.component.html',
  styleUrl: './encabezado-cliente.component.scss',
})
export class EncabezadoClienteComponente {
  private readonly notificaciones = inject(NotificacionesServicio);
  private readonly local = inject(LocalServicio);
  private readonly localPublico = inject(LocalPublicoServicio);
  readonly ui = inject(UiClienteServicio);

  readonly perfil = this.localPublico.perfil;
  readonly enlacePortada = computed(() => this.local.ruta());
  readonly enlacePedido = computed(() => this.local.url('pedido'));

  alAlternarTema(oscuro: boolean): void {
    this.notificaciones.mostrar(oscuro ? 'Modo Oscuro Activado' : 'Modo Claro Activado');
  }

  abrirQr(): void {
    this.ui.abrirModalQr();
  }
}
