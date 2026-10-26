import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, of } from 'rxjs';

import { AutenticacionServicio } from '../../auth/services/autenticacion.service';
import { LocalServicio } from '../services/local.service';

/**
 * Carga el local completo del administrador (con productos agotados y plantillas)
 * antes de entrar al panel. Si el token venció, cierra la sesión y manda al login.
 * Un administrador solo puede entrar al panel de SU local: si la URL apunta a otro
 * local, se lo redirige al panel del suyo.
 */
export const localAdminGuardia: CanActivateFn = (_ruta, estado) => {
  const locales = inject(LocalServicio);
  const autenticacion = inject(AutenticacionServicio);
  const router = inject(Router);

  const slugUrl = estado.url.split('?')[0].split('/').filter(Boolean)[0]?.toLowerCase() ?? '';
  const slugPropio = autenticacion.usuario()?.local?.slug?.toLowerCase();

  if (slugPropio && slugUrl && slugUrl !== slugPropio) {
    locales.cargaCompleta.set(false);
    return router.createUrlTree(['/', slugPropio, 'admin']);
  }

  if (locales.cargaCompleta()) return true;

  return locales.cargarParaAdmin().pipe(
    catchError(() => {
      autenticacion.limpiarSesion();
      return of(router.createUrlTree(locales.url('auth', 'login'), { queryParams: { volverA: estado.url } }));
    }),
  );
};
