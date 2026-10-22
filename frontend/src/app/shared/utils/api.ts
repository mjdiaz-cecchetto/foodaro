import { HttpErrorResponse } from '@angular/common/http';

/** Envoltorio estándar de las respuestas del API Laravel (`{ data: ... }`). */
export interface RespuestaApi<T> {
  data: T;
}

/** Respuesta paginada de Laravel (`paginate()` + Resource collection). */
export interface RespuestaPaginada<T> {
  data: T[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
}

/**
 * Extrae un mensaje legible de un error HTTP del API:
 * 422 → primer mensaje de validación; otros → `message` o un texto genérico.
 */
export function mensajeDeError(error: unknown, porDefecto = 'Ocurrió un error inesperado'): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'No se pudo conectar con el servidor';
    const cuerpo = error.error as { message?: string; errors?: Record<string, string[]> } | null;
    const primero = cuerpo?.errors ? Object.values(cuerpo.errors)[0]?.[0] : undefined;
    return primero ?? cuerpo?.message ?? porDefecto;
  }
  if (error && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  return porDefecto;
}
