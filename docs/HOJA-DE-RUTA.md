# Foodaro — Hoja de ruta (Root y Admin del local)

> Última actualización: 27/10/2026
> Para retomar en una conversación nueva, ver la sección **"Cómo continuar"** al final.

---

## ✅ Estado actual (ya implementado)

### Separación de paneles (estricta)
- **Login del local:** `/{slug}/auth/login` → `POST /api/auth/ingreso` (solo rol `administrador` con `local_id`). Token con habilidad `admin`.
- **Login Root:** `/root/login` → `POST /api/root/auth/ingreso` (solo rol `superadmin`). Token con habilidad `root`.
- Middlewares `solo.admin` (`SoloAdministradorLocal`) y `solo.root` (`SoloRoot`) en `backend/routes/api.php`.
- Sesiones independientes en el front: `AutenticacionServicio` (`foodaro_token`) y `RootAutenticacionServicio` (`foodaro_root_token`). El interceptor elige el token según la URL (`/api/root/...`).
- El Root **no** pertenece a ningún local y **no** puede entrar al panel de un local. Un admin solo entra al panel de **su** local.

### Admin del local
- Inicio compacto + **Cartel QR** imprimible.
- Datos del Local (identidad, ubicación, horarios, contacto).
- **Pedidos y Envíos**:
  - Pestaña *Pedidos Recibidos*: listado con cambio de estado y filtro por estado.
  - **Ventas**: tarjetas Hoy / Esta semana / Este mes; selector de período (Hoy, Ayer, Semana, Mes, rango de fechas, Todo); arqueo por medio de pago (efectivo / transferencia / débito) y por modalidad (envío / retiro); ticket promedio; desglose día por día. Endpoint `GET /api/admin/pedidos/metricas`. Cancelados no suman.
  - Pestaña *Configuración*: WhatsApp de pedidos, costo/mínimo de envío, alias de transferencia, cargo por servicio.
- Gestión de Productos (con **Duplicar producto** en 1 clic), Promociones, Cupones.

### Root de Foodaro
- Métricas globales, CRUD de Locales + suscripción (plan, estado, vencimiento), CRUD de Usuarios + blanqueo de contraseña, CRUD de Planes (3 planes por defecto, sincronizados con la landing, con opción de **Pausar / Activar** cada plan en 1 clic para ocultarlo o mostrarlo en la landing).

### Cuentas por defecto
- Root: `root@foodaro.com` / `root1234`
- Admin demo: `admin@demolocal.com` / `demo1234`

---

## 🏪 Pendiente — Admin del local

| # | Funcionalidad | Detalle |
|---|---|---|
| ✅ 1 ⭐ | **Pedidos en vivo con alerta sonora (HECHO)** | Auto-refresco cada 15 s, timbre gastronómico nativo (`Web Audio API`) con botón de prueba, resalte `¡NUEVO!` y selector **Vista Lista / Vista Tablero Mostrador** (4 columnas con avance en 1 clic). |
| ✅ 2 ⭐ | **Imprimir comanda / ticket de cocina (HECHO)** | Botón **Comanda / Ticket** por pedido con formato térmico 58/80 mm (productos, adicionales, notas, dirección, referencias, total, medio de pago y vuelto). |
| ✅ 3 | **Exportar cierre de caja (HECHO)** | Descargar Excel/CSV (con BOM UTF-8, resumen + desglose diario + detalle de pedidos) o imprimir el arqueo del período elegido en 1 clic. |
| 4 | **Productos más vendidos y horarios pico** | Ranking por cantidad y monto; horas y días de mayor venta. |
| 5 | **Clientes frecuentes** | Agenda armada desde los pedidos: teléfono, cantidad de pedidos, total gastado, último pedido. Base para promos por WhatsApp. |
| ✅ 6 | **Pausa rápida (HECHO)** | Botones rápidos en la barra superior del admin: **"Cerrar por hoy / Reabrir"** y **"Pausar envíos / Reactivar"** sin tocar los horarios semanales. |
| ✅ 7 | **Mi cuenta y Suscripción (HECHO)** | Modal **Mi Cuenta y Suscripción Foodaro** desde la barra superior del admin: plan contratado, estado, fecha de vencimiento, días disponibles, historial de pagos a Foodaro, botón directo a WhatsApp y cambio de nombre/email/contraseña propia. |
| 8 | **Zonas de envío** | Costos de envío distintos por barrio/zona. |
| 9 | **Subida de fotos desde celular/PC** | Permitir subir imágenes reales desde archivo (además de pegar URL) para logo, portada y productos. |

## 👑 Pendiente — Root de Foodaro

| # | Funcionalidad | Detalle |
|---|---|---|
| ✅ A ⭐ | **Suscripciones que se aplican solas (HECHO)** | Cálculo automático por fecha de vencimiento (`por_vencer` ≤ 5 días, `vencido` < 0 días, 3 días de gracia y suspensión automática de la carta pública vencida). Banner de aviso en el panel del local. |
| ✅ B ⭐ | **Registro de cobros de suscripciones (HECHO)** | Tabla `pagos_suscripcion`, pestaña **Cobros de Suscripciones** en Root y botón **Cobrar** en cada local que acredita 1, 3, 6 o 12 meses y extiende el vencimiento automáticamente. Métrica de ingresos reales cobrados en el mes + MRR. |
| C | **Límites por plan** | Cada plan limita cantidad de productos / promociones / cupones y módulos visibles, aplicado en el backend y frontend. *(Ver análisis detallado en `docs/ANALISIS-DE-PLANES.md`)*. |
| ✅ D | **Solicitudes desde la landing (HECHO)** | Formulario de **30 días de prueba gratis** en la landing → guarda en `solicitudes_alta`, abre WhatsApp y muestra la bandeja **Solicitudes Landing** en el Root con estados (`nuevo`, `contactado`, `alta`, `descartado`), notas y botón **Dar de alta (30d)** que pre-carga el modal de nuevo local en 1 clic. |
| ✅ E | **Registro de actividad (HECHO)** | Pestaña **Actividad y Uso** en Root: último acceso de cada admin, último pedido recibido por local, estado operativo en vivo y filtro de locales sin actividad (+7 días). |
| ✅ F | **Mi cuenta Root (HECHO)** | Modal **Mi Cuenta Root** desde la barra superior para cambiar nombre, email y contraseña propia (validando la actual) y gestionar administradores Root de Foodaro. |

## 🎯 Orden recomendado (próximos pasos pendientes)
1. **Local 7 (Mi cuenta y Suscripción del local)** — Permite que el dueño del local vea qué plan tiene, cuándo vence su suscripción, su historial de pagos y pueda cambiar su propia contraseña.
2. **Root C (Límites y permisos por Plan)** — Que cada plan (Inicial, Control, Terminal POS) defina límites o módulos habilitados en el panel del local.
3. **Root D (Bandeja de Solicitudes desde la Landing)** — Cuando un comercio completa "Quiero probar 15 días gratis" en la landing, además de abrir WhatsApp, se guarda en el Root para hacerle seguimiento y darlo de alta en 1 clic.
4. **Local 4 + 5 (Productos más vendidos + Clientes frecuentes)** — Ranking de platos estrella, horarios pico y agenda automática de clientes (con monto histórico y botón directo a WhatsApp).
5. **Local 8 (Zonas de envío con costo diferenciado)** — Configurar barrios/zonas con distintos precios de envío para que el cliente elija su zona al pedir.

---

## ▶️ Cómo continuar

Pegá en el chat alguna de estas frases:

- **Seguir el orden recomendado:**
  > Leé `docs/HOJA-DE-RUTA.md` y continuemos con el orden recomendado (paso 1: Local 1 + 2).

- **Elegir puntos concretos:**
  > Leé `docs/HOJA-DE-RUTA.md` y hagamos los puntos **1, 2 y A**.

- **Al terminar cada bloque:**
  > Actualizá `docs/HOJA-DE-RUTA.md` marcando lo que ya hicimos.
