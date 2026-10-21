import { computed, inject, Injectable } from '@angular/core';

import { PerfilLocal } from '../../shared/models';
import { LOCAL_DEMO } from '../../shared/mocks';
import { LocalServicio } from '../../core/services/local.service';

/** Perfil del local activo editable desde el panel admin (misma fuente que la carta). */
@Injectable({ providedIn: 'root' })
export class LocalAdminServicio {
  private readonly local = inject(LocalServicio);

  readonly perfil = computed<PerfilLocal>(() => this.local.perfil() ?? LOCAL_DEMO.perfil);

  guardar(perfil: PerfilLocal): void {
    this.local.actualizarPerfil(perfil);
  }
}
