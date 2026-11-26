# Foodaro — Cuadro General de Estado (Cliente, Admin del Local y Root)

> Última actualización: 26/11/2026

---

## 📱 1. Cliente (Carta / Menú Digital `/:slug` y Landing `/`)

| # | Funcionalidad | Estado | Detalle |
|---|---|---|---|
| 1 | **Catálogo digital interactivo** | ✅ **LISTO** | Filtro por categorías, buscador en vivo, fotos mejoradas en tarjetas/detalle/carrito, precios tachados de oferta y modo Claro / Oscuro (con tema por defecto configurable por local). |
| 2 | **Personalización de platos** | ✅ **LISTO** | Selección de variantes (tamaños con modo reemplazo de precio), adicionales con precio extra y nota libre para la cocina. |
| 3 | **Carrito inteligente y Modalidades** | ✅ **LISTO** | Envío a domicilio (con cálculo de costo y envío gratis desde `$X`), Retiro en local y soporte para Consumo en salón/mesa. |
| 4 | **Medios de pago y Transferencias** | ✅ **LISTO** | Efectivo, Transferencia (muestra CBU/Alias con botón **Copiar** en 1 clic) y Tarjeta/Débito. |
| 5 | **Banners y Cupones de descuento** | ✅ **LISTO** | Carrusel promocional en la cabecera (con promos directas con precio) y validación de códigos de cupón (`%` o monto fijo) en el carrito. |
| 6 | **Envío formateado a WhatsApp** | ✅ **LISTO** | Guarda el pedido en el sistema recalculando precios en servidor y abre WhatsApp con el ticket armado. |
| 7 | **Horarios automáticos y Pausa de cocina** | ✅ **LISTO** | Abre/cierra solo según los horarios y excepciones por fecha del comercio, y muestra cartel si el local pausó pedidos o envíos. |
| 8 | **Landing comercial (Prueba 30 días)** | ✅ **LISTO** | Planes sincronizados con el Backend, calculadora de ahorro y formulario de **30 días gratis** conectado a WhatsApp y a la bandeja Root. |
| 9 | **Tracking en vivo del pedido (Cliente)** | ⏳ **FALTA** | Vista pública para que el cliente consulte en tiempo real el estado de su pedido (`Recibido` → `En cocina` → `En camino`). |
| 10 | **Selector de Zona/Barrio de envío** | ⏳ **FALTA** | Que el cliente elija su barrio en un desplegable para calcular distinto costo de envío según la distancia. |

---

## 🏪 2. Admin del Local (`/:slug/admin`)

| # | Funcionalidad | Estado | Detalle |
|---|---|---|---|
| 1 | **Consola de Pedidos en vivo + Sonido** | ✅ **LISTO** | Auto-refresco cada 15 s, controles compactos de timbre sonoro nativo (solo íconos), Vista Tabla y Vista Tablero Kanban (4 columnas con drag & drop) y aviso a WhatsApp del cliente. |
| 2 | **Control Sin Pagar vs. Pagados** | ✅ **LISTO** | Botón `Sin pagar` / `Pagado` y selector rápido de medio de pago (`Efectivo`, `Transf.`, `Débito`) en 1 clic, más filtros segmentados. |
| 3 | **Ticket Cliente Consolidado + Comanda Cocina** | ✅ **LISTO** | Formato térmico 58/80 mm: **Ticket Cliente** (consolida ítems repetidos entre rondas en una sola cuenta con total y estado de cobro) separado de **Comanda Cocina** (sin precios, platos grandes, notas, prioridad y soporte para imprimir solo rondas pendientes). |
| 4 | **Caja Diaria, Movimientos y Exportación Excel** | ✅ **LISTO** | Jornada comercial con corte 06:00 AM, **Caja inicial**, registro/anulación de **Gastos y Retiros** (`Efectivo` / `Transferencia`), cálculo de `Efectivo en cajón` vs. `Transf./Débito`, cierre diario imprimible, reportes por período y descarga en `.CSV` / Excel. |
| 5 | **Pausa Rápida de Cocina / Envíos y Stock** | ✅ **LISTO** | Controles superiores para cerrar temporalmente o pausar envíos, y alternar disponibilidad de productos en 1 clic. |
| 6 | **Toma Rápida de Pedidos (Mostrador / Teléfono)** | ✅ **LISTO** | Modal POS rápido desde Gestión de Ventas con buscador, categorías desplazables (flechas + rueda del mouse), carga `+1` en 1 clic, configurador de variantes/adicionales, modalidad, cobro y creación + impresión en cocina. |
| 7 ⭐ | **Gestión por Rondas / Agregados en Cuenta Abierta** | ✅ **LISTO** | Agregados en lote (`Ronda #2`, `#3`…) sobre un pedido abierto con borrador rápido, entrega por ronda e ítem individual, badge de rondas pendientes en tabla, comanda parcial a cocina (`Solo Pendientes / Ronda #N`) y vista agrupada en Monitor de Cocina. |
| 8 | **Gestión de Menú, Plantillas, Promos y QR** | ✅ **LISTO** | ABM de Categorías, Productos (con reordenamiento y plantillas de opciones reutilizables), Banners, Cupones, Horarios/Excepciones y generador de QR imprimible. |
| 9 | **Mi Cuenta y Suscripción Foodaro** | ✅ **LISTO** | Modal en la barra superior con plan actual, vencimiento, historial de recibos pagados, botón a soporte y cambio de contraseña. |
| 10 ⭐ | **Monitor de Cocina y Prioridades** | ✅ **LISTO** | Apartado **Cocina y Prioridades** (`/pedidos/cocina`) sin precios, marca **`🔥 PRIORIDAD`** en 1 clic, rondas pendientes en grande y rondas ya entregadas compactadas para evitar duplicaciones en cocina. |
| 11 ⭐ | **Ranking y Contador de Productos Vendidos** | ✅ **LISTO** | Apartado **Productos Vendidos** (`/pedidos/ranking`) por Día, Ayer, Semana, Mes o fechas, con buscador instantáneo, filtro por categoría, ranking por cantidad/monto y exportación a Excel. |
| 12 ⭐ | **Gestión de Empleados, Asistencia y Paga Diaria** | ✅ **LISTO** | Apartado **Personal y Asistencia** (`/empleados`): alta de empleados con rol y sueldo por hora (`$/h`), fichaje de entrada/salida con fecha, cálculo automático de horas/paga proporcional y control de jornal Pagado / Sin pagar. |
| 13 | **Subida de fotos desde celular/PC** | ⏳ **FALTA** | Subir archivos de imagen reales desde el dispositivo (hoy se cargan pegando el link/URL de la foto). |
| 14 | **Aumento masivo de precios (`+%`)** | ⏳ **FALTA** | Subir un porcentaje (ej. `+10%`) a toda una categoría o a todo el menú en 2 clics para actualizar por inflación. |
| 15 | **Terminal POS dedicada (`/:slug/pos`) + Login por PIN** | ⏳ **FALTA** | Vista independiente para mostrador/mozos con ingreso rápido por PIN de 4 dígitos (Encargado vs. Vendedor). |
| 16 | **Configuración de Zonas de envío** | ⏳ **FALTA** | Cargar lista de barrios/zonas con precios de delivery diferenciados. |
| 17 | **Agenda de Clientes frecuentes (CRM)** | ⏳ **FALTA** | Listado automático de clientes armado desde los pedidos (teléfono, cantidad de compras, total gastado) *(Exclusivo Plan 3)*. |
| 18 | **Módulo de Salón / Mesas / Mozos** | ⏳ **FALTA** | Mapa visual de mesas ocupadas/libres integrado con las rondas abiertas *(Exclusivo Plan 3; maqueta base en `maquetas/menu-mozo.html`)*. |

---

## 👑 3. Root de Foodaro (`/root` — Superadmin SaaS)

| # | Funcionalidad | Estado | Detalle |
|---|---|---|---|
| A | **Métricas SaaS, MRR y Cobros del mes** | ✅ **LISTO** | Panel financiero con Ingreso Mensual Recurrente (MRR), recaudación real del mes, locales activos, en prueba y por vencer. |
| B | **Vencimientos automáticos y Suspensión** | ✅ **LISTO** | Cálculo automático de días disponibles, aviso de "Por vencer" (5 días), días de gracia (3 días) y suspensión automática del local vencido. |
| C | **Registro de Cobros de Suscripciones** | ✅ **LISTO** | Botón **Cobrar** (mensual o anual) que genera el recibo en el historial y extiende la fecha de vencimiento automáticamente. |
| D | **Bandeja de Solicitudes Landing ("Leads")** | ✅ **LISTO** | Recibe los comercios que piden los **30 días gratis** en la web, permite cambiar estado (`Nuevo`, `Contactado`, `Alta`) y dar de alta el local. |
| E | **Gestión de Planes + Pausar Plan** | ✅ **LISTO** | Editar precios, descuentos anuales, características y botón **`⏸️ Pausar` / `▶️ Activar`** para ocultar o mostrar planes en la landing. |
| F | **Registro de Actividad y Uso** | ✅ **LISTO** | Monitoreo del último login de cada dueño y fecha de último pedido recibido (detecta locales inactivos). |
| G | **Mi Cuenta Root y Administradores** | ✅ **LISTO** | Cambio de email y contraseña propia del Root y ABM completo de usuarios del sistema. |
| H | **Límites y Bloqueos por Plan (Gating)** | ✅ **LISTO** | Middleware `VerificarCapacidadPlan`, tope de 50 productos en Plan Inicial (`422`), guardia Angular `requiereCapacidadGuardia`, candados en menú lateral, pantalla `PaginaPlanBloqueado` y tests en `BloqueoPlanesTest` *(Especificación en `docs/ANALISIS-DE-PLANES.md`)*. |
| I | **Impersonación (`🔑 Entrar como Admin`)** | ⏳ **FALTA** | Endpoint y botón para entrar en 1 clic al panel administrador de cualquier comercio para soporte sin pedir su clave. |
| J | **Despliegue en Servidor Cloud (VPS)** | ⏳ **FALTA** | Subir backend Laravel + MySQL y frontend Angular a producción con dominio propio e HTTPS permanente. |

---

## 🎯 Próximo bloque recomendado (Prioridades activas)

1. **Subida real de imágenes desde celular/PC** *(Admin #13)*: carga de archivos para productos, logo, portada y promociones con almacenamiento local/cloud.
2. **Aumento masivo de precios (`+%`)** *(Admin #14)*: actualización rápida por categoría o catálogo completo con vista previa antes de aplicar.
3. **Zonas / barrios de envío diferenciados** *(Cliente #10 y Admin #16)*: tarifas de delivery configurables por zona y selector en el carrito.
4. **Impersonación desde Root + Tracking en vivo del pedido** *(Root I y Cliente #9)*.
5. **Módulo de Salón / Mesas / Mozos + CRM de Clientes** *(Admin #17 y #18 — Plan 3)* aprovechando el motor de **Rondas** ya construido.
6. **Despliegue en producción (VPS + HTTPS)** *(Root J)* y ampliación de tests automatizados (Caja, Empleados y Root).
