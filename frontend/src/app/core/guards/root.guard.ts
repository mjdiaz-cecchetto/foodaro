import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { RootAutenticacionServicio } from '../../root/services/root-autenticacion.service';
import { RootServicio } from '../../root/services/root.service';

/**
 * Guardia para el Panel Root de Foodaro (`/root`):
 * usa EXCLUSIVAMENTE la sesión Root (independiente de la del local) y precarga el resumen global.
 */
export const rootGuardia: CanActivateFn = () => {
  const autenticacionRoot = inject(RootAutenticacionServicio);
  const root = inject(RootServicio);
  const router = inject(Router);

  if (!autenticacionRoot.estaAutenticado()) {
    return router.createUrlTree(['/root/login']);
  }

  if (root.cargado()) return true;

  return root.cargarResumen().pipe(
    map(() => true),
    catchError(() => {
      autenticacionRoot.limpiarSesion();
      return of(router.createUrlTree(['/root/login']));
    }),
  );
};
