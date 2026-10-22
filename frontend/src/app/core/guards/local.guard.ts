import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, of } from 'rxjs';

import { LocalServicio } from '../services/local.service';

/** Resuelve el local por el segmento `:local` contra el API; si no existe, vuelve a la landing. */
export const localGuardia: CanActivateFn = (ruta) => {
  const locales = inject(LocalServicio);
  const router = inject(Router);

  const slug = ruta.paramMap.get('local') ?? '';
  const alInicio = router.createUrlTree(['/'], { queryParams: { local: slug || null } });
  if (!slug) return alInicio;

  return locales.resolver(slug).pipe(catchError(() => of(alInicio)));
};
