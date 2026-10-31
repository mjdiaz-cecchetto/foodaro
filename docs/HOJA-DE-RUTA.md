# Foodaro — Cuadro General de Estado (Cliente, Admin del Local y Root)

> Última actualización: 31/10/2026

---

## 📱 1. Cliente (Carta / Menú Digital `/:slug` y Landing `/`)

| # | Funcionalidad | Estado | Detalle |
|---|---|---|---|
| 1 | **Catálogo digital interactivo** | ✅ **LISTO** | Filtro por categorías, buscador en vivo, fotos, precios tachados de oferta y modo Claro / Oscuro. |
| 2 | **Personalización de platos** | ✅ **LISTO** | Selección de variantes (tamaños), adicionales con precio extra y nota libre para la cocina. |
| 3 | **Carrito inteligente y Modalidades** | ✅ **LISTO** | Envío a domicilio (con cálculo de costo y envío gratis desde `$X`), Retiro en local y Consumo en salón/mesa. |
| 4 | **Medios de pago y Transferencias** | ✅ **LISTO** | Efectivo (con `%` de descuento automático), Transferencia (muestra CBU/Alias con botón **Copiar** en 1 clic) y Tarjeta/QR. |
| 5 | **Banners y Cupones de descuento** | ✅ **LISTO** | Carrusel promocional en la cabecera y validación de códigos de cupón (`%` o monto fijo) en el carrito. |
| 6 | **Envío formateado a WhatsApp + Tracking** | ✅ **LISTO** | Guarda el pedido en el sistema, abre WhatsApp con el ticket armado y muestra el estado en vivo (`Recibido` → `En cocina` → `En camino`). |
| 7 | **Horarios automáticos y Pausa de cocina** | ✅ **LISTO** | Abre/cierra solo según los horarios del comercio y muestra cartel si el local pausó pedidos por lluvia o demora. |
| 8 | **Landing comercial (Prueba 30 días)** | ✅ **LISTO** | Planes sincronizados con el Backend, calculadora de ahorro y formulario de **30 días gratis** conectado a WhatsApp (`3853115268`) y al Root. |
| 9 | **Selector de Zona/Barrio de envío** | ⏳ **FALTA** | Que el cliente elija su barrio en un desplegable para calcular distinto costo de envío según la distancia. |

---

## 🏪 2. Admin del Local (`/:slug/admin` y Terminal POS `/:slug/pos`)

| # | Funcionalidad | Estado | Detalle |
|---|---|---|---|
| 1 | **Consola de Pedidos en vivo + Sonido** | ✅ **LISTO** | Auto-refresco cada 15 s, timbre sonoro nativo, Vista Lista y Vista Tablero Kanban (4 columnas) con aviso a WhatsApp del cliente en 1 clic. |
| 2 | **Control Sin Pagar vs. Pagados** | ✅ **LISTO** | Botón `Sin pagar` / `Pagado` en 1 clic en cada pedido, filtro rápido (`Todos`, `Sin pagar`, `Pagados`) y alerta en comanda. |
| 3 | **Ticket para el Cliente / Repartidor** | ✅ **LISTO** | Formato 58/80 mm con precios, dirección, medio de pago, vuelto y recuadro grande `✓ PEDIDO PAGADO` o `*** FALTA COBRAR ***`. |
| 4 | **Cierre de Caja y Exportación Excel** | ✅ **LISTO** | Resumen por período (Hoy, Semana, Mes, Fechas), desglose `Cobrado` vs. `Pendiente`, medios de pago y descarga en `.CSV` / Excel. |
| 5 | **Pausa Rápida de Cocina y de Stock** | ✅ **LISTO** | Botón superior para pausar pedidos temporalmente y cajón **`⚡ Stock`** para agotar/activar productos en 1 toque sin salir de pedidos. |
| 6 | **Terminal POS Mostrador y Login por PIN** | ✅ **LISTO** | Pantalla táctil rápida para tomar pedidos en mostrador/teléfono e ingreso rápido con PIN de 4 dígitos (Encargado vs. Vendedor). |
| 7 | **Gestión de Menú, Promos y QR PDF** | ✅ **LISTO** | ABM de Categorías, Productos (con **Duplicar** en 1 clic), Banners, Cupones, Horarios y generador de **Kit Imprimible QR en PDF**. |
| 8 | **Mi Cuenta y Suscripción Foodaro** | ✅ **LISTO** | Modal en la barra superior con plan actual, vencimiento, historial de recibos pagados, botón a soporte y cambio de contraseña/PIN. |
| 9 ⭐ | **Comanda exclusiva de Cocina + Prioridad** | ✅ **LISTO** | Apartado **Cocina y Prioridades** (`/pedidos/cocina`) + botón **Ticket Cliente** (con precios) separado de **Comanda Cocina** (sin precios, platos grandes y notas) y marca de **Pedido Prioritario (`🔥 PRIORIDAD`)** en 1 clic. |
| 10 ⭐ | **Ranking y Contador de Productos Vendidos** | ✅ **LISTO** | Apartado **Productos Vendidos** (`/pedidos/ranking`) por Día, Ayer, Semana, Mes o fechas, con buscador instantáneo (ej. *"Muzzarella"*), filtro por categoría, ranking por cantidad/monto y exportación a Excel. |
| 11 ⭐ | **Gestión de Empleados, Asistencia y Paga Diaria** | ✅ **LISTO** | Apartado **Personal y Asistencia** (`/empleados`): alta de empleados con rol y sueldo por hora (`$/h`), fichaje de entrada/salida con fecha y cálculo automático de horas trabajadas y paga proporcional del día + control de jornal Pagado / Sin pagar. |
| 12 | **Subida de fotos desde celular/PC** | ⏳ **FALTA** | Subir archivos de imagen reales desde el dispositivo (hoy se cargan pegando el link/URL de la foto). |
| 13 | **Aumento masivo de precios (`+%`)** | ⏳ **FALTA** | Subir un porcentaje (ej. `+10%`) a toda una categoría o a todo el menú en 2 clics para actualizar por inflación. |
| 14 | **Agenda de Clientes frecuentes (CRM)** | ⏳ **FALTA** | Listado automático de clientes armado desde los pedidos (teléfono, cantidad de compras, total gastado). |
| 15 | **Configuración de Zonas de envío** | ⏳ **FALTA** | Cargar lista de barrios/zonas con precios de delivery diferenciados. |

---

## 👑 3. Root de Foodaro (`/root` — Superadmin SaaS)

| # | Funcionalidad | Estado | Detalle |
|---|---|---|---|
| A | **Métricas SaaS, MRR y Cobros del mes** | ✅ **LISTO** | Panel financiero con Ingreso Mensual Recurrente (MRR), recaudación real del mes, locales activos, en prueba y por vencer. |
| B | **Vencimientos automáticos y Suspensión** | ✅ **LISTO** | Cálculo automático de días disponibles, aviso de "Por vencer", días de gracia y bloqueo automático del local vencido/suspendido. |
| C | **Registro de Cobros de Suscripciones** | ✅ **LISTO** | Botón **Cobrar** (mensual o anual) que genera el recibo en el historial y extiende la fecha de vencimiento automáticamente. |
| D | **Bandeja de Solicitudes Landing ("Leads")** | ✅ **LISTO** | Recibe los comercios que piden los **30 días gratis** en la web, permite cambiar estado (`Nuevo`, `Contactado`, `Alta`) y crearles el local en 1 clic con **`✨ Dar de alta (30d)`**. |
| E | **Gestión de Planes + Pausar Plan** | ✅ **LISTO** | Editar precios, descuentos anuales, características y botón **`⏸️ Pausar` / `▶️ Activar`** para ocultar o mostrar planes en la landing. |
| F | **Impersonación (`🔑 Entrar como Admin`)** | ✅ **LISTO** | Botón para entrar en 1 clic al panel administrador de cualquier comercio para darle soporte o cargarle el menú sin pedirle su clave. |
| G | **Registro de Actividad y Uso** | ✅ **LISTO** | Monitoreo de cuándo fue el último login de cada dueño y cuándo recibió su último pedido (detecta locales inactivos). |
| H | **Mi Cuenta Root y Administradores** | ✅ **LISTO** | Cambio de email y contraseña propia del Root y gestión de usuarios del sistema. |
| I | **Límites y Bloqueos por Plan (Gating)** | ⏳ **FALTA** | Restringir módulos o cantidad de productos según el plan contratado *(Documentado en `docs/ANALISIS-DE-PLANES.md`)*. |
| J | **Despliegue en Servidor Cloud (VPS)** | ⏳ **FALTA** | Subir el sistema a un servidor en producción con dominio propio e HTTPS permanente. |

---

## 🎯 Orden recomendado para el próximo bloque (Feedback real de Cliente)

1. **Punto 9 ⭐ — Doble Comanda (Ticket Cliente vs. Comanda Cocina) + Prioridad (`🔥 URGENTE`)**:
   - En cada pedido tener los 2 botones claros: **`🧾 Ticket Cliente`** (con precios y cobro) y **`👨‍🍳 Comanda Cocina`** (sin precios, solo ítems en grande, notas y modalidad) + botón de 1 clic para marcar **`🔥 Prioridad`** y que resalte arriba o con alerta visual para la cocina.
2. **Punto 10 ⭐ — Ranking y Contador de Productos Vendidos (Día / Semana / Mes)**:
   - En la pestaña de **Ventas / Caja**, sumar el cuadro de **Productos Vendidos en el período** (ej. *"Hoy: 24x Pizza Muzzarella, 15x Milanesa Napolitana..."*) con buscador rápido y totales.
3. **Punto 11 ⭐ — Gestión de Empleados, Asistencia (Entrada/Salida) y Cálculo de Paga Diaria**:
   - Nueva sección **Personal / Asistencia**: alta de empleados con rol y valor hora (`$/hora`), fichaje de entrada/salida con fecha y cálculo automático de horas trabajadas y monto a pagar en el día/semana.
4. **Punto 12 — Subida de fotos desde celular/PC**.
5. **Punto I — Definición y bloqueo por Planes (`docs/ANALISIS-DE-PLANES.md`)**.
