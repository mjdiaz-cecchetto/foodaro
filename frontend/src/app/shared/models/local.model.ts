import { Categoria, Cupon, GrupoOpciones, Producto, Promocion } from './catalogo.model';

/** Franja horaria "HH:MM"–"HH:MM". Si `hasta` <= `desde`, termina al día siguiente (20:00–01:30). */
export interface FranjaHoraria {
  desde: string;
  hasta: string;
}

/** Día de la semana ISO: 1 = lunes … 7 = domingo. */
export type DiaSemana = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Horario habitual de un día de la semana. */
export interface HorarioDia {
  dia: DiaSemana;
  abierto: boolean;
  franjas: FranjaHoraria[];
}

/** Excepción para una fecha puntual (YYYY-MM-DD): cerrado o con horario especial. */
export interface ExcepcionHorario {
  fecha: string;
  cerrado: boolean;
  motivo: string | null;
  franjas: FranjaHoraria[];
}

/** Horarios de atención: semana habitual (7 días) + excepciones por fecha. */
export interface Horarios {
  semana: HorarioDia[];
  excepciones: ExcepcionHorario[];
}

export interface Contacto {
  /** WhatsApp público de contacto (se muestra en la carta). */
  whatsapp: string;
  /** WhatsApp al que llegan los pedidos armados (puede ser otro número). */
  whatsappPedidos: string;
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
  /** Texto del estado actual calculado por el API: "Abierto · Cierra 00:30". */
  estado: string;
  abiertoAhora: boolean;
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
  /** Costo fijo de envío a domicilio (0 = sin cargo / a coordinar). */
  costoEnvio?: number;
  /** Subtotal mínimo requerido para habilitar envío a domicilio (0 = sin mínimo). */
  montoMinimoEnvio?: number;
  /** Alias o CBU/CVU para pagos por transferencia. */
  aliasTransferencia?: string;
  /** Nombre del titular o banco de la cuenta de transferencia. */
  titularTransferencia?: string;
  /** Pausa rápida: cierra el local por hoy sin modificar los horarios semanales. */
  cerradoTemporalmente?: boolean;
  /** Pausa rápida: deshabilita temporalmente los envíos a domicilio (solo retiro). */
  enviosPausados?: boolean;
}

export interface SuscripcionLocal {
  planId: number | null;
  planNombre: string;
  planNivel?: string;
  planMensual: number;
  planAnual?: number;
  planCaracteristicas?: string[];
  estado: 'al_dia' | 'prueba' | 'por_vencer' | 'vencido';
  vencimiento: string | null;
  diasRestantes: number | null;
  enPeriodoGracia: boolean;
  diasGraciaRestantes: number;
  cartaSuspendida: boolean;
}

/**
 * Local (tenant) alojado en Foodaro. Se identifica por su slug en la URL: foodaro.net/<slug>.
 * `plantillasOpciones` son grupos reutilizables que el admin aplica a varios productos.
 */
export interface Local {
  id?: number;
  slug: string;
  suscripcion?: SuscripcionLocal;
  perfil: PerfilLocal;
  configuracion: ConfiguracionLocal;
  categorias: Categoria[];
  productos: Producto[];
  promociones: Promocion[];
  cupones?: Cupon[];
  /** Solo llega en el panel admin (GET /admin/local). */
  plantillasOpciones?: GrupoOpciones[];
}

/** Perfil vacío para renderizar antes de resolver el local. */
export const PERFIL_LOCAL_VACIO: PerfilLocal = {
  nombre: '',
  eslogan: '',
  logoUrl: '',
  portadaUrl: '',
  direccion: '',
  referenciaDireccion: '',
  mapsUrl: '',
  rubro: '',
  estado: '',
  abiertoAhora: false,
  horarios: { semana: [], excepciones: [] },
  contacto: { whatsapp: '', whatsappPedidos: '', instagram: '', tiktok: '', telefono: '' },
};
