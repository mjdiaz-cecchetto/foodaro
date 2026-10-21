import { Categoria, GrupoOpciones, Producto, Promocion } from './catalogo.model';

/** Horarios de atención del local (texto libre por franja). */
export interface Horarios {
  lunesAJueves: string;
  viernesYSabado: string;
  domingo: string;
}

export interface Contacto {
  whatsapp: string;
  instagram: string;
  tiktok: string;
  telefono: string;
}

/** Datos públicos del local (perfil, horarios y canales de contacto). */
export interface PerfilLocal {
  nombre: string;
  eslogan: string;
  logoUrl: string;
  portadaUrl: string;
  direccion: string;
  referenciaDireccion: string;
  mapsUrl: string;
  rubro: string;
  /** Texto del estado actual: "Abierto Hoy • Cierra 00:30". */
  estado: string;
  horarios: Horarios;
  contacto: Contacto;
}

/** Parámetros comerciales del local. */
export interface ConfiguracionLocal {
  /** Código ISO de la moneda (ARS, USD...). */
  moneda: string;
  /** Cargo fijo por servicio / empaque que se suma al pedido. */
  cargoServicio: number;
  etiquetaCargoServicio: string;
}

/**
 * Local (tenant) alojado en Foodaro. Se identifica por su slug en la URL: foodaro.net/<slug>.
 * `plantillasOpciones` son grupos reutilizables que el admin aplica a varios productos.
 */
export interface Local {
  slug: string;
  perfil: PerfilLocal;
  configuracion: ConfiguracionLocal;
  categorias: Categoria[];
  productos: Producto[];
  promociones: Promocion[];
  plantillasOpciones: GrupoOpciones[];
}
