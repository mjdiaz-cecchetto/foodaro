import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Cupon } from '../../shared/models';
import { RespuestaApi } from '../../shared/utils/api';
import { LocalServicio } from '../../core/services/local.service';
import { ValorFormularioCupon } from '../interfaces';

/** ABM de cupones de descuento del local activo contra el API. */
@Injectable({ providedIn: 'root' })
export class CuponesAdminServicio {
  private readonly http = inject(HttpClient);
  private readonly local = inject(LocalServicio);
  private readonly api = `${environment.apiUrl}/admin/cupones`;

  readonly cupones = this.local.cupones;

  crear(valor: ValorFormularioCupon): Observable<Cupon> {
    return this.http.post<RespuestaApi<Cupon>>(this.api, valor).pipe(
      map((r) => r.data),
      tap((cupon) => this.cupones.update((lista) => [cupon, ...lista])),
    );
  }

  actualizar(id: number, valor: ValorFormularioCupon): Observable<Cupon> {
    return this.http.put<RespuestaApi<Cupon>>(`${this.api}/${id}`, valor).pipe(
      map((r) => r.data),
      tap((cupon) => this.cupones.update((lista) => lista.map((c) => (c.id === id ? cupon : c)))),
    );
  }

  alternarEstado(id: number): Observable<Cupon> {
    return this.http.patch<RespuestaApi<Cupon>>(`${this.api}/${id}/estado`, {}).pipe(
      map((r) => r.data),
      tap((cupon) => this.cupones.update((lista) => lista.map((c) => (c.id === id ? cupon : c)))),
    );
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`).pipe(
      tap(() => this.cupones.update((lista) => lista.filter((c) => c.id !== id))),
    );
  }
}
