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
- Métricas globales, CRUD de Locales + suscripción (plan, estado, vencimiento), CRUD de Usuarios + blanqueo de contraseña, CRUD de Planes (3 planes por defecto, sincronizados con la landing).

### Cuentas por defecto
- Root: `root@foodaro.com` / `root1234`
- Admin demo: `admin@demolocal.com` / `demo1234`

---

## 🏪 Pendiente — Admin del local

| # | Funcionalidad | Detalle |
|---|---|---|
| 1 ⭐ | **Pedidos en vivo con alerta sonora** | Auto-refresco cada 15–20 s; al entrar un pedido nuevo suena un aviso y se resalta. Opcional: vista kanban (Pendiente → En preparación → Listo → Entregado). |
| 2 ⭐ | **Imprimir comanda / ticket de cocina** | Botón por pedido que imprime ticket angosto (58/80 mm) con productos, adicionales, notas, dirección y medio de pago. |
| 3 | **Exportar cierre de caja** | Descargar Excel/CSV o imprimir el arqueo del período elegido. |
| 4 | **Productos más vendidos y horarios pico** | Ranking por cantidad y monto; horas y días de mayor venta. |
| 5 | **Clientes frecuentes** | Agenda armada desde los pedidos: teléfono, cantidad de pedidos, total gastado, último pedido. Base para promos por WhatsApp. |
| 6 | **Pausa rápida** | Botón "Cerrar por hoy" / "Pausar envíos" sin tocar los horarios. |
| 7 | **Mi cuenta** | Cambiar contraseña propia y ver plan + fecha de vencimiento. |
| 8 | **Zonas de envío** | Costos de envío distintos por barrio/zona. |

## 👑 Pendiente — Root de Foodaro

| # | Funcionalidad | Detalle |
|---|---|---|
| A ⭐ | **Suscripciones que se aplican solas** | Al vencer: período de gracia → la carta pública muestra "no disponible". El admin del local ve el aviso "Tu plan vence en X días". |
| B ⭐ | **Registro de cobros de suscripciones** | Cargar cada pago (local, monto, fecha, medio, período); al cargarlo se extiende el vencimiento. Ver ingresos del mes e ingreso mensual recurrente. |
| C | **Límites por plan** | Cada plan limita cantidad de productos / promociones / cupones, aplicado en el backend. |
| D | **Solicitudes desde la landing** | Formulario "Quiero mi carta" → bandeja en el Root con estado (nuevo / contactado / dado de alta). |
| E | **Registro de actividad** | Últimos accesos por local y locales sin actividad hace X días. |
| F | **Mi cuenta Root** | Cambiar contraseña del Root y gestionar otros usuarios Root. |

## 🎯 Orden recomendado
1. **Local 1 + 2** — pedidos en vivo + comanda (uso diario en el mostrador).
2. **Root A + B** — suscripciones automáticas + registro de cobros.
3. **Local 7** — Mi cuenta (conecta ambos: el local ve su plan y vencimiento).
4. Luego: 3, 4, 5, C, D, 6, 8, E, F.

---

## ▶️ Cómo continuar

Pegá en el chat alguna de estas frases:

- **Seguir el orden recomendado:**
  > Leé `docs/HOJA-DE-RUTA.md` y continuemos con el orden recomendado (paso 1: Local 1 + 2).

- **Elegir puntos concretos:**
  > Leé `docs/HOJA-DE-RUTA.md` y hagamos los puntos **1, 2 y A**.

- **Al terminar cada bloque:**
  > Actualizá `docs/HOJA-DE-RUTA.md` marcando lo que ya hicimos.
