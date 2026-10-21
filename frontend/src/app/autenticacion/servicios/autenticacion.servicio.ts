import { computed, Injectable, signal } from '@angular/core';
import { delay, Observable, of, tap, throwError } from 'rxjs';

import { CredencialesIngreso, RespuestaIngreso, UsuarioAutenticado } from '../interfaces';

const CLAVE_TOKEN = 'foodaro_token';
const CLAVE_USUARIO = 'foodaro_usuario';

const USUARIO_MOCK: UsuarioAutenticado = {
  id: 1,
  nombre: 'Encargado del Local',
  email: 'admin@foodaro.net',
  rol: 'admin',
};

/**
 * Autenticación del panel admin.
 * MOCK (demo): acepta cualquier email con "@" y cualquier contraseña no vacía,
 * y emite un token ficticio. Cuando exista el API Laravel, `ingresar()` pasará
 * a usar HttpClient manteniendo la misma firma.
 */
@Injectable({ providedIn: 'root' })
export class AutenticacionServicio {
  readonly token = signal<string | null>(this.leer(CLAVE_TOKEN));
  readonly usuario = signal<UsuarioAutenticado | null>(this.leerJson<UsuarioAutenticado>(CLAVE_USUARIO));

  readonly estaAutenticado = computed(() => !!this.token());

  ingresar(credenciales: CredencialesIngreso): Observable<RespuestaIngreso> {
    const valido = credenciales.email.includes('@') && credenciales.contrasenia.length > 0;

    if (!valido) {
      return throwError(() => ({ status: 401, message: 'Credenciales inválidas' })).pipe(delay(400));
    }

    const respuesta: RespuestaIngreso = {
      token: `mock-token-${Date.now()}`,
      usuario: { ...USUARIO_MOCK, email: credenciales.email },
    };

    return of(respuesta).pipe(
      delay(600),
      tap((r) => this.guardarSesion(r)),
    );
  }

  cerrarSesion(): void {
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
