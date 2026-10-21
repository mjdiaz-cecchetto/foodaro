import { Local } from '../models';
import { LOCAL_DEMO } from './demo-local.mock';

/**
 * Locales ficticios. En producción vendrán del API según el slug de la URL.
 * Por ahora hay un único local de demostración: foodaro.net/demolocal.
 */
export const LOCALES_MOCK: Local[] = [LOCAL_DEMO];

/** Slug del local de demostración (enlazado desde la landing de la plataforma). */
export const SLUG_LOCAL_DEMO = LOCAL_DEMO.slug;
