import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { RespuestaApi } from '../../shared/utils/api';
import { CredencialesIngreso, RespuestaIngreso, UsuarioAutenticado } from '../../auth/interfaces';

const CLAVE_TOKEN_ROOT = 'foodaro_root_token';
const CLAVE_USUARIO_ROOT = 'foodaro_root_usuario';

/**
 * Sesión del Panel Root de Foodaro, TOTALMENTE independiente de la sesión del panel del local:
 * usa su propio endpoint (`/root/auth/ingreso`), su propio token y sus propias claves de almacenamiento.
 */
@Injectable({ providedIn: 'root' })
export class RootAutenticacionServicio {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/root/auth`;

  readonly token = signal<string | null>(this.leer(CLAVE_TOKEN_ROOT));
  readonly usuario = signal<UsuarioAutenticado | null>(this.leerJson<UsuarioAutenticado>(CLAVE_USUARIO_ROOT));

  readonly estaAutenticado = computed(() => !!this.token() && this.usuario()?.rol === 'superadmin');

  actualizarUsuario(usuario: UsuarioAutenticado): void {
    this.usuario.set(usuario);
    try {
      localStorage.setItem(CLAVE_USUARIO_ROOT, JSON.stringify(usuario));
    } catch {
      /* ignorar */
    }
  }

  /** POST /root/auth/ingreso */
  ingresar(credenciales: CredencialesIngreso): Observable<RespuestaIngreso> {
    return this.http.post<RespuestaApi<RespuestaIngreso>>(`${this.base}/ingreso`, credenciales).pipe(
      map((r) => r.data),
      tap((r) => this.guardarSesion(r)),
    );
  }

  /** POST /root/auth/salir */
  cerrarSesion(): Observable<void> {
    if (!this.token()) {
      this.limpiarSesion();
      return of(void 0);
    }
    return this.http.post<void>(`${this.base}/salir`, {}).pipe(
      catchError(() => of(void 0)),
      tap(() => this.limpiarSesion()),
      map(() => void 0),
    );
  }

  limpiarSesion(): void {
    this.token.set(null);
    this.usuario.set(null);
    try {
      localStorage.removeItem(CLAVE_TOKEN_ROOT);
      localStorage.removeItem(CLAVE_USUARIO_ROOT);
    } catch {
      /* ignorar */
    }
  }

  private guardarSesion(r: RespuestaIngreso): void {
    this.token.set(r.token);
    this.usuario.set(r.usuario);
    try {
      localStorage.setItem(CLAVE_TOKEN_ROOT, r.token);
      localStorage.setItem(CLAVE_USUARIO_ROOT, JSON.stringify(r.usuario));
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
