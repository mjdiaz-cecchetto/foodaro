import { Component, inject } from '@angular/core';

import { LocalPublicoServicio } from '../../services/local-publico.service';
import { UiClienteServicio } from '../../services/ui-cliente.service';

/**
 * Banner del local al inicio de la carta: portada de fondo con degradé,
 * logo en cuadro, nombre, eslogan y estado. Al tocarlo abre el perfil completo.
 */
@Component({
  selector: 'app-banner-local',
  standalone: true,
  templateUrl: './banner-local.component.html',
  styleUrl: './banner-local.component.scss',
})
export class BannerLocalComponente {
  private readonly localPublico = inject(LocalPublicoServicio);
  private readonly ui = inject(UiClienteServicio);

  readonly perfil = this.localPublico.perfil;

  abrirPerfil(): void {
    this.ui.abrirModalLocal();
  }
}
