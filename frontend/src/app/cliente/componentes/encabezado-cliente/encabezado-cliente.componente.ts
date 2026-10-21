import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LogoComponente } from '../../../compartido/componentes/logo/logo.componente';
import { AlternarTemaComponente } from '../../../compartido/componentes/alternar-tema/alternar-tema.componente';
import { NotificacionesServicio } from '../../../nucleo/servicios/notificaciones.servicio';
import { LocalServicio } from '../../../nucleo/servicios/local.servicio';
import { UiClienteServicio } from '../../servicios/ui-cliente.servicio';
import { LocalPublicoServicio } from '../../servicios/local-publico.servicio';

/**
 * Encabezado sticky de la carta. A la izquierda solo el isotipo de Foodaro
 * (la marca protagonista es la del local, en su banner); a la derecha tema y QR.
 * En modo menú ofrece "Pedir".
 */
@Component({
  selector: 'app-encabezado-cliente',
  standalone: true,
  imports: [RouterLink, LogoComponente, AlternarTemaComponente],
  templateUrl: './encabezado-cliente.componente.html',
  styleUrl: './encabezado-cliente.componente.scss',
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
