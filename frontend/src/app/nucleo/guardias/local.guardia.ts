import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { LocalServicio } from '../servicios/local.servicio';

/** Resuelve el local por el segmento `:local`; si no existe, vuelve a la landing. */
export const localGuardia: CanActivateFn = (ruta) => {
  const locales = inject(LocalServicio);
  const router = inject(Router);

  const slug = ruta.paramMap.get('local') ?? '';
  if (slug && locales.resolver(slug)) {
    return true;
  }
  return router.createUrlTree(['/'], { queryParams: { local: slug || null } });
};
