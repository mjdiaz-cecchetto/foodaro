import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AutenticacionServicio } from '../../auth/services/autenticacion.service';
import { LocalServicio } from '../services/local.service';

/**
 * Agrega el Bearer token a las peticiones al API y, si el servidor responde 401
 * (token vencido o inválido), limpia la sesión y redirige al login del local.
 * Si hay una navegación en curso (el 401 vino de un guard) no redirige acá:
 * el guard decide el destino y conserva la URL a la que se quería entrar.
 */
export const autenticacionInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const autenticacion = inject(AutenticacionServicio);
  const locales = inject(LocalServicio);
  const router = inject(Router);

  const esApi = peticion.url.startsWith(environment.apiUrl);
  const token = autenticacion.token();
  const conToken = esApi && token ? peticion.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : peticion;

  return siguiente(conToken).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && esApi && !peticion.url.includes('/auth/ingreso')) {
        autenticacion.limpiarSesion();
        locales.cargaCompleta.set(false);
        if (!router.getCurrentNavigation()) {
          router.navigate(locales.url('auth', 'login'), { queryParams: { volverA: router.url } });
        }
      }
      return throwError(() => error);
    }),
  );
};
