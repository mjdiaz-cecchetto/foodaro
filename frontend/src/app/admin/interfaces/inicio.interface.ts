/** Tarjeta numérica del panel de inicio. */
export interface IndicadorInicio {
  etiqueta: string;
  valor: number;
  detalle: string;
  icono: string;
  /** Clases de color del icono (fondo + texto). */
  estilo: string;
  ruta: string;
}

/** Paso de la lista "Completá tu local". */
export interface PasoPuestaAPunto {
  id: string;
  titulo: string;
  descripcion: string;
  completo: boolean;
  ruta: string;
}

/** Acceso directo a una sección del panel. */
export interface AccesoRapido {
  titulo: string;
  descripcion: string;
  icono: string;
  ruta: string;
}
