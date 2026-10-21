import { GrupoOpciones, Local, Producto } from '../modelos';

const u = (id: string, w = 700) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

/** Imagen de la pseudo-categoría "Todo" cuando el local no tiene productos. */
export const IMAGEN_CATEGORIA_TODO = u('photo-1504674900247-0877df9cc836', 160);

/* ------------------------------------------------------------------ */
/*  Plantillas de grupos de opciones (reutilizables por el admin)      */
/* ------------------------------------------------------------------ */

const TAMANIO_PIZZA: GrupoOpciones = {
  id: 'tamanio-pizza',
  nombre: 'Tamaño',
  tipo: 'unica',
  obligatorio: true,
  opciones: [
    { id: 'p6', etiqueta: '6 porciones', precioAdicional: 0, porDefecto: true },
    { id: 'p12', etiqueta: '12 porciones', precioAdicional: 4500 },
  ],
};

const EXTRAS_PIZZA: GrupoOpciones = {
  id: 'extras-pizza',
  nombre: 'Extras',
  tipo: 'multiple',
  obligatorio: false,
  maximo: 3,
  opciones: [
    { id: 'muzza', etiqueta: 'Extra muzzarella', precioAdicional: 2500 },
    { id: 'borde', etiqueta: 'Borde relleno', precioAdicional: 3000 },
    { id: 'picante', etiqueta: 'Salsa picante casera', precioAdicional: 800 },
  ],
};

const CANTIDAD_EMPANADAS: GrupoOpciones = {
  id: 'cantidad-empanadas',
  nombre: 'Cantidad',
  tipo: 'unica',
  obligatorio: true,
  opciones: [
    { id: 'media', etiqueta: 'Media docena (6)', precioAdicional: 0, porDefecto: true },
    { id: 'docena', etiqueta: 'Docena (12)', precioAdicional: 8500 },
  ],
};

const COCCION_EMPANADAS: GrupoOpciones = {
  id: 'coccion-empanadas',
  nombre: 'Cocción',
  tipo: 'unica',
  obligatorio: false,
  opciones: [
    { id: 'horno', etiqueta: 'Al horno', precioAdicional: 0, porDefecto: true },
    { id: 'fritas', etiqueta: 'Fritas', precioAdicional: 0 },
  ],
};

const EXTRAS_BURGER: GrupoOpciones = {
  id: 'extras-burger',
  nombre: 'Extras',
  tipo: 'multiple',
  obligatorio: false,
  maximo: 4,
  opciones: [
    { id: 'medallon', etiqueta: 'Medallón extra', precioAdicional: 3200 },
    { id: 'cheddar', etiqueta: 'Doble cheddar', precioAdicional: 1200 },
    { id: 'panceta', etiqueta: 'Panceta', precioAdicional: 1500 },
    { id: 'huevo', etiqueta: 'Huevo frito', precioAdicional: 900 },
    { id: 'mayo', etiqueta: 'Mayonesa extra', precioAdicional: 500 },
  ],
};

const GUARNICION: GrupoOpciones = {
  id: 'guarnicion',
  nombre: 'Guarnición',
  tipo: 'unica',
  obligatorio: true,
  opciones: [
    { id: 'fritas', etiqueta: 'Papas fritas', precioAdicional: 0, porDefecto: true },
    { id: 'pure', etiqueta: 'Puré de papas', precioAdicional: 0 },
    { id: 'ensalada', etiqueta: 'Ensalada mixta', precioAdicional: 0 },
    { id: 'rusticas', etiqueta: 'Papas rústicas', precioAdicional: 1200 },
  ],
};

const SALSA_PASTAS: GrupoOpciones = {
  id: 'salsa-pastas',
  nombre: 'Salsa',
  tipo: 'unica',
  obligatorio: true,
  opciones: [
    { id: 'fileto', etiqueta: 'Fileto', precioAdicional: 0, porDefecto: true },
    { id: 'bolognesa', etiqueta: 'Bolognesa', precioAdicional: 1500 },
    { id: 'crema', etiqueta: 'Crema', precioAdicional: 1500 },
    { id: 'mixta', etiqueta: 'Mixta', precioAdicional: 1800 },
  ],
};

const PUNTO_CARNE: GrupoOpciones = {
  id: 'punto-carne',
  nombre: 'Punto de cocción',
  tipo: 'unica',
  obligatorio: true,
  opciones: [
    { id: 'jugoso', etiqueta: 'Jugoso', precioAdicional: 0 },
    { id: 'apunto', etiqueta: 'A punto', precioAdicional: 0, porDefecto: true },
    { id: 'cocido', etiqueta: 'Bien cocido', precioAdicional: 0 },
  ],
};

const SABOR_GASEOSA: GrupoOpciones = {
  id: 'sabor-gaseosa',
  nombre: 'Sabor',
  tipo: 'unica',
  obligatorio: true,
  opciones: [
    { id: 'coca', etiqueta: 'Coca-Cola', precioAdicional: 0, porDefecto: true },
    { id: 'cocazero', etiqueta: 'Coca-Cola Zero', precioAdicional: 0 },
    { id: 'sprite', etiqueta: 'Sprite', precioAdicional: 0 },
    { id: 'fanta', etiqueta: 'Fanta', precioAdicional: 0 },
  ],
};

const SABOR_HELADO: GrupoOpciones = {
  id: 'sabor-helado',
  nombre: 'Sabores (elegí hasta 2)',
  tipo: 'multiple',
  obligatorio: true,
  maximo: 2,
  opciones: [
    { id: 'ddl', etiqueta: 'Dulce de leche granizado', precioAdicional: 0 },
    { id: 'choc', etiqueta: 'Chocolate', precioAdicional: 0 },
    { id: 'frutilla', etiqueta: 'Frutilla a la crema', precioAdicional: 0 },
    { id: 'limon', etiqueta: 'Limón', precioAdicional: 0 },
  ],
};

const SIN_GRUPOS: GrupoOpciones[] = [];

/* ------------------------------------------------------------------ */
/*  Helper para declarar productos con menos ruido                      */
/* ------------------------------------------------------------------ */

const producto = (
  id: number,
  categoriaId: string,
  nombre: string,
  precio: number,
  etiqueta: string,
  tiempoPreparacion: string,
  calificacion: number,
  imagen: string,
  descripcion: string,
  gruposOpciones: GrupoOpciones[] = SIN_GRUPOS,
): Producto => ({
  id,
  nombre,
  categoriaId,
  calificacion,
  tiempoPreparacion,
  precio,
  etiqueta,
  disponible: true,
  imagen: u(imagen),
  descripcion,
  gruposOpciones,
});

/**
 * Demo Local — resto bar de demostración de la plataforma (ficticio).
 * Catálogo amplio con precios en pesos argentinos. Vive en foodaro.net/demolocal.
 */
export const LOCAL_DEMO: Local = {
  slug: 'demolocal',
  perfil: {
    nombre: 'Demo Local',
    eslogan: 'Resto Bar de demostración · Pizzas a la piedra, empanadas, burgers y parrilla.',
    logoUrl: u('photo-1590947132387-155cc02f3212', 240),
    portadaUrl: u('photo-1414235077428-338989a2e8c0', 1400),
    direccion: 'Av. Belgrano (S) 1850, Santiago del Estero',
    referenciaDireccion: 'A dos cuadras de la Plaza Libertad',
    mapsUrl: 'https://maps.google.com/?q=Av.+Belgrano+Sur+1850,+Santiago+del+Estero',
    rubro: 'Pizzas · Empanadas · Parrilla',
    estado: 'Abierto Hoy • Cierra 00:30',
    horarios: {
      lunesAJueves: '12:00 - 15:00 | 20:00 - 00:00',
      viernesYSabado: '12:00 - 15:30 | 20:00 - 01:30',
      domingo: '12:00 - 16:00 | 20:00 - 00:00',
    },
    contacto: {
      whatsapp: '+54 9 385 311-5268',
      instagram: '@demolocal',
      tiktok: '@demolocal',
      telefono: '+54 385 421-7788',
    },
  },
  configuracion: {
    moneda: 'ARS',
    cargoServicio: 500,
    etiquetaCargoServicio: 'Servicio / empaque',
  },
  plantillasOpciones: [
    TAMANIO_PIZZA,
    EXTRAS_PIZZA,
    CANTIDAD_EMPANADAS,
    COCCION_EMPANADAS,
    EXTRAS_BURGER,
    GUARNICION,
    SALSA_PASTAS,
    PUNTO_CARNE,
    SABOR_GASEOSA,
    SABOR_HELADO,
  ],
  categorias: [
    { id: 'pizzas', nombre: 'Pizzas', imagen: u('photo-1513104890138-7c749659a591', 160), activa: true },
    { id: 'empanadas', nombre: 'Empanadas', imagen: u('photo-1626700051175-6818013e1d4f', 160), activa: true },
    { id: 'hamburguesas', nombre: 'Burgers', imagen: u('photo-1568901346375-23c9450c58cd', 160), activa: true },
    { id: 'milanesas', nombre: 'Milanesas', imagen: u('photo-1562967914-608f82629710', 160), activa: true },
    { id: 'pastas', nombre: 'Pastas', imagen: u('photo-1621996346565-e3dbc646d9a9', 160), activa: true },
    { id: 'parrilla', nombre: 'Parrilla', imagen: u('photo-1544025162-d76694265947', 160), activa: true },
    { id: 'picadas', nombre: 'Picadas', imagen: u('photo-1452195100486-9cc805987862', 160), activa: true },
    { id: 'postres', nombre: 'Postres', imagen: u('photo-1551024601-bec78aea704b', 160), activa: true },
    { id: 'bebidas', nombre: 'Bebidas', imagen: u('photo-1554866585-cd94860890b7', 160), activa: true },
    { id: 'tragos', nombre: 'Tragos & Cervezas', imagen: u('photo-1551538827-9c037cb4f32a', 160), activa: true },
  ],
  productos: [
    // ---------------- Pizzas ----------------
    producto(101, 'pizzas', 'Muzzarella', 12500, 'Clásica', '15-20 min', 4.9, 'photo-1574071318508-1cdbab80d002', 'Salsa de tomate casera, muzzarella de primera, orégano y aceitunas verdes. Masa a la piedra fermentada 24 hs.', [TAMANIO_PIZZA, EXTRAS_PIZZA]),
    producto(102, 'pizzas', 'Napolitana', 14500, 'Favorita', '15-20 min', 4.8, 'photo-1604382355076-af4b0eb60143', 'Muzzarella, rodajas de tomate fresco, ajo, perejil y un hilo de aceite de oliva.', [TAMANIO_PIZZA, EXTRAS_PIZZA]),
    producto(103, 'pizzas', 'Fugazzeta rellena', 16800, 'La más pedida', '20-25 min', 4.9, 'photo-1571407970349-bc81e7e96d47', 'Doble masa rellena de muzzarella, cubierta con cebolla dorada, orégano y aceitunas.', [TAMANIO_PIZZA, EXTRAS_PIZZA]),
    producto(104, 'pizzas', 'Calabresa', 15900, 'Picantita', '15-20 min', 4.7, 'photo-1628840042765-356cda07504e', 'Muzzarella, longaniza calabresa en rodajas, morrón asado y aceitunas negras.', [TAMANIO_PIZZA, EXTRAS_PIZZA]),
    producto(105, 'pizzas', 'Jamón y morrones', 15500, 'Clásica', '15-20 min', 4.8, 'photo-1565299624946-b28f40a0ae38', 'Muzzarella, jamón cocido natural, morrones asados y aceitunas verdes.', [TAMANIO_PIZZA, EXTRAS_PIZZA]),
    producto(106, 'pizzas', 'Cuatro quesos', 17200, 'Premium', '15-20 min', 4.8, 'photo-1593560708920-61dd98c46a4e', 'Muzzarella, roquefort, provolone y parmesano con un toque de miel de caña.', [TAMANIO_PIZZA, EXTRAS_PIZZA]),
    producto(107, 'pizzas', 'Rúcula y jamón crudo', 18900, 'Premium', '15-20 min', 4.9, 'photo-1513104890138-7c749659a591', 'Muzzarella, jamón crudo serrano, rúcula fresca, parmesano en escamas y oliva.', [TAMANIO_PIZZA, EXTRAS_PIZZA]),
    producto(108, 'pizzas', 'Especial de la casa', 19500, 'De la casa', '20-25 min', 5.0, 'photo-1574071318508-1cdbab80d002', 'Muzzarella, jamón, morrones, huevo duro, aceitunas y palmitos con salsa golf.', [TAMANIO_PIZZA, EXTRAS_PIZZA]),
    producto(109, 'pizzas', 'Provolone y panceta', 17800, 'Nueva', '15-20 min', 4.7, 'photo-1604382355076-af4b0eb60143', 'Muzzarella, provolone gratinado, panceta crocante y cebolla morada.', [TAMANIO_PIZZA, EXTRAS_PIZZA]),
    producto(110, 'pizzas', 'Anchoas', 16200, 'Clásica', '15-20 min', 4.6, 'photo-1571407970349-bc81e7e96d47', 'Salsa de tomate, muzzarella, filetes de anchoa, ajo y orégano.', [TAMANIO_PIZZA, EXTRAS_PIZZA]),
    producto(111, 'pizzas', 'Vegetariana', 15800, 'Veggie', '15-20 min', 4.7, 'photo-1565299624946-b28f40a0ae38', 'Muzzarella, berenjena grillada, zucchini, champiñones, tomates cherry y albahaca.', [TAMANIO_PIZZA, EXTRAS_PIZZA]),
    producto(112, 'pizzas', 'Pizza de cancha', 7500, 'Sin queso', '10 min', 4.5, 'photo-1628840042765-356cda07504e', 'La clásica de cancha: salsa de tomate abundante, orégano, ají molido y aceite. Sin queso.', [TAMANIO_PIZZA]),

    // ---------------- Empanadas ----------------
    producto(201, 'empanadas', 'Empanadas santiagueñas', 9500, 'Tradición', '20-25 min', 5.0, 'photo-1626700051175-6818013e1d4f', 'Carne cortada a cuchillo, cebolla, huevo y comino. Fritas en grasa como manda la receta santiagueña.', [CANTIDAD_EMPANADAS, COCCION_EMPANADAS]),
    producto(202, 'empanadas', 'Empanadas de pollo', 9000, 'Al horno', '20-25 min', 4.8, 'photo-1601050690597-df0568f70950', 'Pollo desmenuzado, cebolla de verdeo, morrón y especias. Al horno de barro.', [CANTIDAD_EMPANADAS, COCCION_EMPANADAS]),
    producto(203, 'empanadas', 'Empanadas de jamón y queso', 8800, 'Al horno', '20-25 min', 4.7, 'photo-1626700051175-6818013e1d4f', 'Jamón cocido y muzzarella fundida con un toque de orégano.', [CANTIDAD_EMPANADAS, COCCION_EMPANADAS]),
    producto(204, 'empanadas', 'Empanadas árabes', 9500, 'Especial', '20-25 min', 4.8, 'photo-1601050690597-df0568f70950', 'Carne, tomate, cebolla y jugo de limón en masa abierta triangular.', [CANTIDAD_EMPANADAS]),
    producto(205, 'empanadas', 'Empanadas surtidas', 9800, 'Para compartir', '25 min', 4.9, 'photo-1626700051175-6818013e1d4f', 'Elegí hasta 3 gustos: carne, pollo, jamón y queso, humita, verdura o caprese. Indicá los gustos en las notas.', [CANTIDAD_EMPANADAS, COCCION_EMPANADAS]),

    // ---------------- Hamburguesas ----------------
    producto(301, 'hamburguesas', 'Demo Burger simple', 11500, 'Clásica', '15 min', 4.8, 'photo-1568901346375-23c9450c58cd', 'Medallón de 150 g, cheddar, lechuga, tomate, cebolla y salsa de la casa en pan de papa. Con papas.', [EXTRAS_BURGER]),
    producto(302, 'hamburguesas', 'Doble cheddar & bacon', 14900, 'Top', '15-20 min', 4.9, 'photo-1553979459-d2229ba7433b', 'Doble medallón smash, doble cheddar, panceta crocante y cebolla caramelizada. Con papas.', [EXTRAS_BURGER]),
    producto(303, 'hamburguesas', 'Criolla', 13200, 'Argenta', '15 min', 4.7, 'photo-1586190848861-99aa4a171e90', 'Medallón, provoleta, huevo frito, morrón asado y chimichurri. Con papas.', [EXTRAS_BURGER]),
    producto(304, 'hamburguesas', 'Veggie de garbanzos', 12200, 'Veggie', '15 min', 4.6, 'photo-1550547660-d9450f859349', 'Medallón de garbanzos y espinaca, queso, rúcula, tomate y mayonesa de ajo. Con batatas.', [EXTRAS_BURGER]),

    // ---------------- Milanesas ----------------
    producto(401, 'milanesas', 'Milanesa napolitana', 16500, 'La más pedida', '20 min', 4.9, 'photo-1562967914-608f82629710', 'Milanesa de ternera, salsa de tomate, jamón y muzzarella gratinada.', [GUARNICION]),
    producto(402, 'milanesas', 'Milanesa a caballo', 15800, 'Clásica', '20 min', 4.7, 'photo-1562967914-608f82629710', 'Milanesa de ternera con dos huevos fritos.', [GUARNICION]),
    producto(403, 'milanesas', 'Suprema de pollo', 14200, 'Clásica', '20 min', 4.7, 'photo-1562967914-608f82629710', 'Pechuga de pollo empanada con pan rallado casero.', [GUARNICION]),
    producto(404, 'milanesas', 'Milanesa XL (para 2)', 26500, 'Para compartir', '25 min', 5.0, 'photo-1562967914-608f82629710', 'Milanesa XL con cheddar, panceta, cebolla caramelizada y huevo. Con papas con cheddar.'),

    // ---------------- Pastas ----------------
    producto(501, 'pastas', 'Ñoquis de papa', 12800, 'Caseros', '15-20 min', 4.8, 'photo-1621996346565-e3dbc646d9a9', 'Ñoquis caseros de papa, con la salsa que elijas.', [SALSA_PASTAS]),
    producto(502, 'pastas', 'Sorrentinos de jamón y queso', 14500, 'Caseros', '15-20 min', 4.8, 'photo-1551183053-bf91a1d81141', 'Sorrentinos artesanales con la salsa que elijas.', [SALSA_PASTAS]),
    producto(503, 'pastas', 'Ravioles de verdura y ricota', 13500, 'Caseros', '15-20 min', 4.7, 'photo-1473093295043-cdd812d0e601', 'Ravioles caseros con la salsa que elijas.', [SALSA_PASTAS]),
    producto(504, 'pastas', 'Lasaña de carne', 15900, 'De la casa', '25 min', 4.9, 'photo-1621996346565-e3dbc646d9a9', 'Capas de pasta fresca, bolognesa, salsa blanca y muzzarella gratinada.'),

    // ---------------- Parrilla ----------------
    producto(601, 'parrilla', 'Bife de chorizo (400 g)', 24500, 'Premium', '25-30 min', 4.9, 'photo-1544025162-d76694265947', 'Bife de chorizo a la parrilla con chimichurri.', [PUNTO_CARNE, GUARNICION]),
    producto(602, 'parrilla', 'Entraña', 22800, 'Premium', '25 min', 4.9, 'photo-1558030006-450675393462', 'Entraña tierna con salsa criolla.', [PUNTO_CARNE, GUARNICION]),
    producto(603, 'parrilla', 'Parrillada para 2', 39800, 'Para compartir', '35-40 min', 5.0, 'photo-1529692236671-f1f6cf9683ba', 'Asado, vacío, chorizo, morcilla, pollo y provoleta. Con ensalada mixta y papas.', [PUNTO_CARNE]),
    producto(604, 'parrilla', 'Choripán', 6500, 'Clásico', '10-15 min', 4.7, 'photo-1558030006-450675393462', 'Chorizo a la parrilla en pan francés con chimichurri y salsa criolla.'),
    producto(605, 'parrilla', 'Provoleta', 7800, 'Entrada', '10 min', 4.8, 'photo-1544025162-d76694265947', 'Provolone a la parrilla con orégano, ají molido y tomates cherry.'),

    // ---------------- Picadas ----------------
    producto(701, 'picadas', 'Picada de la casa (para 2)', 19500, 'Para compartir', '15 min', 4.9, 'photo-1452195100486-9cc805987862', 'Quesos, fiambres, aceitunas, maní, papas fritas y pan casero.'),
    producto(702, 'picadas', 'Tabla de quesos y fiambres (para 4)', 32000, 'Para compartir', '15 min', 4.8, 'photo-1541529086526-db283c563270', 'Selección de quesos, salame, jamón crudo, bondiola, frutos secos y grisines.'),
    producto(703, 'picadas', 'Papas con cheddar y panceta', 9800, 'Favorita', '10-15 min', 4.8, 'photo-1585109649139-366815a0d713', 'Papas fritas bañadas en cheddar fundido con panceta crocante y verdeo.'),

    // ---------------- Postres ----------------
    producto(801, 'postres', 'Flan casero con dulce de leche', 5500, 'Clásico', '5 min', 4.9, 'photo-1551024601-bec78aea704b', 'Flan de huevo casero con dulce de leche y crema. Mixto si querés.'),
    producto(802, 'postres', 'Tiramisú', 6800, 'De la casa', '5 min', 4.8, 'photo-1587314168485-3236d6710814', 'Capas de vainillas al café, crema de mascarpone y cacao.'),
    producto(803, 'postres', 'Volcán de chocolate', 7200, 'Caliente', '10 min', 4.9, 'photo-1606313564200-e75d5e30476c', 'Bizcocho tibio con centro líquido de chocolate y helado de crema americana.'),
    producto(804, 'postres', 'Helado artesanal (2 bochas)', 4800, 'Fresco', '5 min', 4.7, 'photo-1563805042-7684c019e1cb', 'Helado artesanal de elaboración propia.', [SABOR_HELADO]),

    // ---------------- Bebidas ----------------
    producto(901, 'bebidas', 'Gaseosa 500 ml', 2800, 'Fría', '2 min', 4.6, 'photo-1554866585-cd94860890b7', 'Línea Coca-Cola bien fría.', [SABOR_GASEOSA]),
    producto(902, 'bebidas', 'Gaseosa 1,5 L', 4500, 'Para compartir', '2 min', 4.6, 'photo-1554866585-cd94860890b7', 'Línea Coca-Cola de 1,5 litros.', [SABOR_GASEOSA]),
    producto(903, 'bebidas', 'Agua mineral 500 ml', 2200, 'Fría', '2 min', 4.5, 'photo-1513558161293-cdaf765ed2fd', 'Con o sin gas.', [
      { id: 'gas-agua', nombre: 'Tipo', tipo: 'unica', obligatorio: true, opciones: [
        { id: 'singas', etiqueta: 'Sin gas', precioAdicional: 0, porDefecto: true },
        { id: 'congas', etiqueta: 'Con gas', precioAdicional: 0 },
      ] },
    ]),
    producto(904, 'bebidas', 'Limonada con menta y jengibre (jarra)', 5900, 'Casera', '5 min', 4.9, 'photo-1600271886742-f049cd451bba', 'Jarra de 1 litro de limonada natural con menta fresca y jengibre.'),

    // ---------------- Tragos & Cervezas ----------------
    producto(1001, 'tragos', 'Cerveza artesanal IPA (pinta)', 5500, 'Tirada', '3 min', 4.8, 'photo-1535958636474-b021ee887b13', 'IPA de producción local, 6,5 % de alcohol. Pinta de 473 ml.'),
    producto(1002, 'tragos', 'Cerveza Quilmes 1 L', 5200, 'Clásica', '2 min', 4.5, 'photo-1535958636474-b021ee887b13', 'Botella de litro bien fría.'),
    producto(1003, 'tragos', 'Fernet con Coca', 6500, 'El de siempre', '3 min', 5.0, 'photo-1551538827-9c037cb4f32a', 'Fernet Branca con Coca-Cola, mucho hielo. Vaso de 500 ml.'),
    producto(1004, 'tragos', 'Aperol Spritz', 7200, 'Refrescante', '5 min', 4.8, 'photo-1551538827-9c037cb4f32a', 'Aperol, espumante y soda con rodaja de naranja.'),
    producto(1005, 'tragos', 'Copa de vino Malbec', 4900, 'Mendoza', '2 min', 4.7, 'photo-1510812431401-41d2bd2722f3', 'Malbec de bodega mendocina. Consultá la botella del mes.'),
  ],
  promociones: [
    { id: 1, titulo: '2 muzzarellas grandes + gaseosa 1,5 L', descuento: 20, codigo: 'DEMO20', activa: true, imagen: u('photo-1574071318508-1cdbab80d002', 600) },
    { id: 2, titulo: 'Docena de empanadas + cerveza 1 L', descuento: 15, codigo: 'EMPA15', activa: true, imagen: u('photo-1626700051175-6818013e1d4f', 600) },
    { id: 3, titulo: 'Happy hour: tragos al 2x1 de 20 a 22 hs', descuento: 50, codigo: 'HAPPY2X1', activa: true, imagen: u('photo-1551538827-9c037cb4f32a', 600) },
  ],
};
