import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AutenticacionServicio } from '../../auth/services/autenticacion.service';
import { RootAutenticacionServicio } from '../../root/services/root-autenticacion.service';
import { LocalServicio } from '../services/local.service';

/**
 * Agrega el Bearer token correcto según el panel:
 *  - Peticiones a `/api/root/...` → token de la sesión Root.
 *  - Resto del API                → token de la sesión del local.
 * Las sesiones son independientes: un 401/403 en un panel solo cierra la sesión de ese panel.
 * Si hay una navegación en curso (el error vino de un guard) no redirige acá: decide el guard.
 */
export const autenticacionInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const autenticacion = inject(AutenticacionServicio);
  const autenticacionRoot = inject(RootAutenticacionServicio);
  const locales = inject(LocalServicio);
  const router = inject(Router);

  const esApi = peticion.url.startsWith(environment.apiUrl);
  const esRoot = peticion.url.startsWith(`${environment.apiUrl}/root/`);
  const esIngreso = peticion.url.includes('/auth/ingreso');

  const token = esRoot ? autenticacionRoot.token() : autenticacion.token();
  const conToken = esApi && token ? peticion.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : peticion;

  return siguiente(conToken).pipe(
    catchError((error: unknown) => {
      const sinPermiso = error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403);
      if (sinPermiso && esApi && !esIngreso) {
        if (esRoot) {
          autenticacionRoot.limpiarSesion();
          if (!router.getCurrentNavigation()) router.navigateByUrl('/root/login');
        } else if (peticion.url.includes('/admin/') || peticion.url.includes('/auth/')) {
          autenticacion.limpiarSesion();
          locales.cargaCompleta.set(false);
          if (!router.getCurrentNavigation()) {
            router.navigate(locales.url('auth', 'login'), { queryParams: { volverA: router.url } });
          }
        }
      }
      return throwError(() => error);
    }),
  );
};
