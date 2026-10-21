import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AutenticacionServicio } from '../../auth/services/autenticacion.service';
import { LocalServicio } from '../services/local.service';

/** Protege el panel admin del local: sin sesión redirige al login del mismo local. */
export const autenticacionGuardia: CanActivateFn = (_ruta, estado) => {
  const autenticacion = inject(AutenticacionServicio);
  const router = inject(Router);
  const locales = inject(LocalServicio);

  if (autenticacion.estaAutenticado()) {
    return true;
  }

  return router.createUrlTree(locales.url('auth', 'login'), {
    queryParams: { volverA: estado.url },
  });
};
