import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';

import { LocalServicio } from '../services/local.service';

/**
 * Guardia que valida si el local tiene la capacidad requerida por su plan comercial.
 * Si no la tiene, redirige a la vista amigable de "Plan Bloqueado" con botón a WhatsApp.
 */
export const requiereCapacidadGuardia: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const local = inject(LocalServicio);
  const router = inject(Router);

  const capacidad = route.data['capacidad'] as string | undefined;

  if (!capacidad || local.tieneCapacidad(capacidad)) {
    return true;
  }

  const slug = local.slug() ?? '';
  return router.createUrlTree(['/', slug, 'admin', 'plan-bloqueado'], {
    queryParams: { capacidad },
  });
};
