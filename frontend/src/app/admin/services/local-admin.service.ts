import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ConfiguracionLocal, Local, PERFIL_LOCAL_VACIO, PerfilLocal } from '../../shared/models';
import { RespuestaApi } from '../../shared/utils/api';
import { LocalServicio } from '../../core/services/local.service';

/** Perfil y configuración del local activo editables desde el panel admin (PUT /admin/local). */
@Injectable({ providedIn: 'root' })
export class LocalAdminServicio {
  private readonly http = inject(HttpClient);
  private readonly local = inject(LocalServicio);

  readonly perfil = computed<PerfilLocal>(() => this.local.perfil() ?? PERFIL_LOCAL_VACIO);
  readonly configuracion = this.local.configuracion;

  guardar(perfil: PerfilLocal, configuracion?: Partial<ConfiguracionLocal>): Observable<PerfilLocal> {
    return this.http.put<RespuestaApi<Local>>(`${environment.apiUrl}/admin/local`, { perfil, configuracion }).pipe(
      map((r) => r.data),
      tap((local) => {
        this.local.perfil.set(local.perfil);
        this.local.configuracion.set(local.configuracion);
      }),
      map((local) => local.perfil),
    );
  }
}
