import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { RespuestaApi } from '../../shared/utils/api';
import { CredencialesIngreso, RespuestaIngreso, UsuarioAutenticado } from '../interfaces';

const CLAVE_TOKEN = 'foodaro_token';
const CLAVE_USUARIO = 'foodaro_usuario';

/** Autenticación del panel admin contra el API (tokens de Sanctum). */
@Injectable({ providedIn: 'root' })
export class AutenticacionServicio {
  private readonly http = inject(HttpClient);

  readonly token = signal<string | null>(this.leer(CLAVE_TOKEN));
  readonly usuario = signal<UsuarioAutenticado | null>(this.leerJson<UsuarioAutenticado>(CLAVE_USUARIO));

  readonly estaAutenticado = computed(() => !!this.token());

  /** POST /auth/ingreso */
  ingresar(credenciales: CredencialesIngreso): Observable<RespuestaIngreso> {
    return this.http.post<RespuestaApi<RespuestaIngreso>>(`${environment.apiUrl}/auth/ingreso`, credenciales).pipe(
      map((r) => r.data),
      tap((r) => this.guardarSesion(r)),
    );
  }

  /** POST /auth/salir — invalida el token en el servidor y limpia la sesión local. */
  cerrarSesion(): Observable<void> {
    if (!this.token()) {
      this.limpiarSesion();
      return of(void 0);
    }
    return this.http.post<void>(`${environment.apiUrl}/auth/salir`, {}).pipe(
      catchError(() => of(void 0)),
      tap(() => this.limpiarSesion()),
      map(() => void 0),
    );
  }

  limpiarSesion(): void {
    this.token.set(null);
    this.usuario.set(null);
    try {
      localStorage.removeItem(CLAVE_TOKEN);
      localStorage.removeItem(CLAVE_USUARIO);
    } catch {
      /* ignorar */
    }
  }

  private guardarSesion(r: RespuestaIngreso): void {
    this.token.set(r.token);
    this.usuario.set(r.usuario);
    try {
      localStorage.setItem(CLAVE_TOKEN, r.token);
      localStorage.setItem(CLAVE_USUARIO, JSON.stringify(r.usuario));
    } catch {
      /* ignorar */
    }
  }

  private leer(clave: string): string | null {
    try {
      return localStorage.getItem(clave);
    } catch {
      return null;
    }
  }

  private leerJson<T>(clave: string): T | null {
    const crudo = this.leer(clave);
    if (!crudo) return null;
    try {
      return JSON.parse(crudo) as T;
    } catch {
      return null;
    }
  }
}
