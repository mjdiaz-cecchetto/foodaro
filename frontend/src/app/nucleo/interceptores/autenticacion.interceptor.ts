import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AutenticacionServicio } from '../../autenticacion/servicios/autenticacion.servicio';

/**
 * Agrega el Bearer token a las peticiones salientes.
 * Hoy el token es ficticio (mock); cuando exista el API Laravel
 * este interceptor queda tal cual.
 */
export const autenticacionInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const token = inject(AutenticacionServicio).token();
  if (!token) {
    return siguiente(peticion);
  }
  return siguiente(peticion.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
