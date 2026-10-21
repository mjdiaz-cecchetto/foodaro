import { computed, inject, Injectable } from '@angular/core';

import { PerfilLocal } from '../../compartido/modelos';
import { LOCAL_DEMO } from '../../compartido/mocks';
import { LocalServicio } from '../../nucleo/servicios/local.servicio';

/** Perfil del local activo editable desde el panel admin (misma fuente que la carta). */
@Injectable({ providedIn: 'root' })
export class LocalAdminServicio {
  private readonly local = inject(LocalServicio);

  readonly perfil = computed<PerfilLocal>(() => this.local.perfil() ?? LOCAL_DEMO.perfil);

  guardar(perfil: PerfilLocal): void {
    this.local.actualizarPerfil(perfil);
  }
}
