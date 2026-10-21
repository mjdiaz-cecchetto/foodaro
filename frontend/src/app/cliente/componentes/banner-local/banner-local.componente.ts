import { Component, inject } from '@angular/core';

import { LocalPublicoServicio } from '../../servicios/local-publico.servicio';
import { UiClienteServicio } from '../../servicios/ui-cliente.servicio';

/**
 * Banner del local al inicio de la carta: portada de fondo con degradé,
 * logo en cuadro, nombre, eslogan y estado. Al tocarlo abre el perfil completo.
 */
@Component({
  selector: 'app-banner-local',
  standalone: true,
  templateUrl: './banner-local.componente.html',
  styleUrl: './banner-local.componente.scss',
})
export class BannerLocalComponente {
  private readonly localPublico = inject(LocalPublicoServicio);
  private readonly ui = inject(UiClienteServicio);

  readonly perfil = this.localPublico.perfil;

  abrirPerfil(): void {
    this.ui.abrirModalLocal();
  }
}
