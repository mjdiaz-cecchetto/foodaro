import { DemoRubro, Plan, PreguntaFrecuente } from '../interfaces';

/** Datos del mockup interactivo multirrubro del hero. */
export const DEMOS_RUBRO: DemoRubro[] = [
  {
    clave: 'gastro',
    pestania: '🍔 Resto/Bar',
    local: '• Restaurante & Bar',
    promo: 'Burger + Pinta con 20% OFF',
    categorias: [
      { icono: '🍔', nombre: 'Burgers' },
      { icono: '🍕', nombre: 'Pizzas' },
      { icono: '🥟', nombre: 'Empanadas' },
      { icono: '☕', nombre: 'Café' },
    ],
    item: {
      nombre: 'Doble Smash Angus',
      precio: '$ 13.800',
      imagen: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=120&q=80',
    },
  },
  {
    clave: 'moda',
    pestania: '👕 Ropa/Moda',
    local: '• Tienda de Moda',
    promo: 'Liquidación Temporada: 30% OFF',
    categorias: [
      { icono: '👕', nombre: 'Remeras' },
      { icono: '👖', nombre: 'Pantalones' },
      { icono: '🧥', nombre: 'Abrigos' },
      { icono: '🧢', nombre: 'Accesorios' },
    ],
    item: {
      nombre: 'Remera Boxy Fit 100% Algodón',
      precio: '$ 24.500',
      imagen: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=120&q=80',
    },
  },
  {
    clave: 'almacen',
    pestania: '🥑 Almacén',
    local: '• Almacén & Dietética',
    promo: 'Mix Frutos Secos en Promo',
    categorias: [
      { icono: '🥑', nombre: 'Frescos' },
      { icono: '🥜', nombre: 'Frutos Secos' },
      { icono: '🫒', nombre: 'Aceites' },
      { icono: '🍯', nombre: 'Mieles' },
    ],
    item: {
      nombre: 'Mix Energía Premium 500g',
      precio: '$ 8.900',
      imagen: 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?auto=format&fit=crop&w=120&q=80',
    },
  },
];

export const PLANES: Plan[] = [
  {
    id: 'Catálogo & WhatsApp',
    nivel: 'Inicial',
    nombre: 'Catálogo & WhatsApp',
    mensual: 19900,
    anual: 15900,
    descripcion: 'Ideal para digitalizar tus productos y recibir pedidos directos sin intermediarios.',
    caracteristicas: [
      'Catálogo digital interactivo con QR y Link',
      'Pedidos directos a tu WhatsApp',
      'Panel Administrador del comercio',
      'Modificación de precios y stock en vivo',
      'Soporte para Modo Claro y Oscuro',
    ],
    cta: 'Elegir Básico',
  },
  {
    id: 'Control de Pedidos & Stock',
    nivel: 'Gestión Activa',
    nombre: 'Control de Pedidos & Stock',
    mensual: 29900,
    anual: 23900,
    descripcion: 'Para negocios con volumen diario que necesitan controlar despachos y pedidos.',
    caracteristicas: [
      'Todo lo del plan Básico',
      'Consola de pedidos en tiempo real',
      'Control de pedidos Sin Pagar vs Pagados',
      'Pausa rápida de ítems agotados',
      'Banners promocionales y cupones de descuento',
      'Kit imprimible de mostrador en PDF',
    ],
    cta: 'Probar 30 Días Gratis',
    destacado: true,
  },
  {
    id: 'Terminal POS & Mostrador',
    nivel: 'Operación Completa',
    nombre: 'Terminal POS & Mostrador',
    mensual: 44900,
    anual: 35900,
    descripcion: 'Operación integral de salón, mozos o cajeros para atención presencial y pedidos.',
    caracteristicas: [
      'Todo lo del plan Control',
      'Terminal táctil para mozos o vendedores',
      'Login por PIN (Vendedor vs Encargado)',
      'Registro de cliente con nombre en mostrador',
      'Control de horario comercial y turnos',
      'Arqueo rápido de caja y cobros del turno',
    ],
    cta: 'Comenzar con POS',
  },
];

export const PREGUNTAS_FRECUENTES: PreguntaFrecuente[] = [
  {
    pregunta: '¿Cómo cobro las ventas que entran por Foodaro?',
    respuesta:
      'Directamente vos. Los clientes te pagan en tu local, en mostrador o por transferencia directa a tu alias/CBU o billetera virtual. Nosotros no cobramos comisión ni retenemos tu dinero.',
  },
  {
    pregunta: '¿Sirve para indumentaria, almacenes o dietéticas?',
    respuesta:
      'Sí. Foodaro te permite cargar cualquier tipo de producto con fotos, descripciones, talles, colores o sabores, funcionando como un catálogo online ágil con pedidos directos.',
  },
  {
    pregunta: '¿Puedo empezar con el plan básico y después sumar la terminal de ventas?',
    respuesta:
      'Totalmente. Podés arrancar digitalizando tu catálogo y más adelante activar la terminal de toma-pedidos y control de cobros de caja cuando tu negocio crezca.',
  },
];

/** WhatsApp comercial de Foodaro (con código de país 549 para Argentina). */
export const WHATSAPP_VENTAS_FOODARO = '5493853115268';
export const WHATSAPP_REGISTRO_FOODARO = '5493853115268';

/** Comisión promedio que retienen las apps de delivery (para la calculadora). */
export const TASA_COMISION_MARKETPLACE = 0.25;
