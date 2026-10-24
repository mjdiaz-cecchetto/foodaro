import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Promocion } from '../../shared/models';
import { RespuestaApi } from '../../shared/utils/api';
import { LocalServicio } from '../../core/services/local.service';
import { ValorFormularioPromocion } from '../interfaces';

/** ABM de promociones/cupones del local activo contra el API. */
@Injectable({ providedIn: 'root' })
export class PromocionesAdminServicio {
  private readonly http = inject(HttpClient);
  private readonly local = inject(LocalServicio);
  private readonly api = `${environment.apiUrl}/admin/promociones`;

  readonly promociones = this.local.promociones;

  crear(valor: ValorFormularioPromocion): Observable<Promocion> {
    return this.http.post<RespuestaApi<Promocion>>(this.api, valor).pipe(
      map((r) => r.data),
      tap((promo) => this.promociones.update((lista) => [promo, ...lista])),
    );
  }

  actualizar(id: number, valor: ValorFormularioPromocion): Observable<Promocion> {
    return this.http.put<RespuestaApi<Promocion>>(`${this.api}/${id}`, valor).pipe(
      map((r) => r.data),
      tap((promo) => this.promociones.update((lista) => lista.map((p) => (p.id === id ? promo : p)))),
    );
  }

  alternarEstado(id: number): Observable<Promocion> {
    return this.http.patch<RespuestaApi<Promocion>>(`${this.api}/${id}/estado`, {}).pipe(
      map((r) => r.data),
      tap((promo) => this.promociones.update((lista) => lista.map((p) => (p.id === id ? promo : p)))),
    );
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`).pipe(
      tap(() => this.promociones.update((lista) => lista.filter((p) => p.id !== id))),
    );
  }
}
