export type ClaveRubro = 'gastro' | 'moda' | 'almacen';

/** Datos de una pestaña del mockup multirrubro del hero. */
export interface DemoRubro {
  clave: ClaveRubro;
  pestania: string;
  local: string;
  promo: string;
  categorias: { icono: string; nombre: string }[];
  item: { nombre: string; precio: string; imagen: string };
}

export interface Plan {
  id: string;
  nivel: string;
  nombre: string;
  mensual: number;
  anual: number;
  descripcion: string;
  caracteristicas: string[];
  cta: string;
  destacado?: boolean;
}

export interface PreguntaFrecuente {
  pregunta: string;
  respuesta: string;
}

export interface ValorFormularioRegistro {
  nombreComercio: string;
  ciudad: string;
  whatsapp: string;
  plan: string;
}
