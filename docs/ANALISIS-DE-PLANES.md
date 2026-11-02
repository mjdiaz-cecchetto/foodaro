# Foodaro — Definición y Reglas de Planes Comerciales (Gating)

> Última actualización: 02/11/2026
> Documento oficial de especificación para las capacidades, límites y bloqueo técnico (Gating) por plan de suscripción en Foodaro.

---

## 1. Planes Comerciales y Niveles

| Código | Nivel | Nombre Comercial | Precio Mensual | Precio Anual (x mes) | Enfoque |
|---|---|---|---|---|---|
| `catalogo-whatsapp` | **Inicial** | **Catálogo & WhatsApp** | $ 19.900 | $ 15.900 | Digitalización rápida de menú y pedidos a WhatsApp sin consola operativa. |
| `control-pedidos-stock` | **Gestión Activa** | **Control de Pedidos & Stock** | $ 29.900 | $ 23.900 | Despachos en tiempo real, comanda térmica, control de cobros y caja diaria. *(Más Elegido)* |
| `terminal-pos-mostrador` | **Operación Completa** | **Full / Operación Completa** | $ 44.900 | $ 35.900 | Toda la operación gastronómica: pedidos, caja y gestión de personal/asistencia. |

---

## 2. Matriz Definitiva de Capacidades (Gating)

| Capacidad / Módulo | Plan 1: Catálogo & WhatsApp<br>*(Inicial)* | Plan 2: Control de Pedidos<br>*(Gestión Activa)* | Plan 3: Full<br>*(Operación Completa)* |
|---|:---:|:---:|:---:|
| **Carta digital pública (QR + Link directo)** | ✅ Ilimitado | ✅ Ilimitado | ✅ Ilimitado |
| **Personalización de platos (variantes/adicionales)** | ✅ Incluido | ✅ Incluido | ✅ Incluido |
| **Recepción de pedidos formateados a WhatsApp** | ✅ Incluido | ✅ Incluido | ✅ Incluido |
| **Datos del local, horarios y pausa rápida** | ✅ Incluido | ✅ Incluido | ✅ Incluido |
| **Límite de productos en el catálogo** | 🔒 **Máximo 50 productos** | ✅ **Ilimitados** | ✅ **Ilimitados** |
| **Promociones (Banners destacados)** | 🔒 Bloqueado | ✅ **Incluido** | ✅ **Incluido** |
| **Cupones de descuento (% y monto fijo)** | 🔒 Bloqueado | ✅ **Incluido** | ✅ **Incluido** |
| **Consola Pedidos en Vivo (Auto-refresco + Sonido)** | 🔒 Bloqueado | ✅ **Incluido** | ✅ **Incluido** |
| **Vistas Tabla + Tablero Kanban (4 etapas)** | 🔒 Bloqueado | ✅ **Incluido** | ✅ **Incluido** |
| **Control de cobros (Sin Pagar vs. Pagados)** | 🔒 Bloqueado | ✅ **Incluido** | ✅ **Incluido** |
| **Comandas Térmicas 58/80 mm (Cocina y Cliente)** | 🔒 Bloqueado | ✅ **Incluido** | ✅ **Incluido** |
| **Modo Cocina y Prioridad (`🔥`)** | 🔒 Bloqueado | ✅ **Incluido** | ✅ **Incluido** |
| **Arqueo de Caja y Exportación a Excel (`.csv`)** | 🔒 Bloqueado | ✅ **Incluido** | ✅ **Incluido** |
| **Ranking de Productos Vendidos por período** | 🔒 Bloqueado | ✅ **Incluido** | ✅ **Incluido** |
| **Personal y Asistencia (Fichaje y Jornales)** | 🔒 Bloqueado | 🔒 Bloqueado | ✅ **Exclusivo Plan 3** |
| **Módulo de Salón / Mesas / Mozos** *(a futuro)* | 🔒 Bloqueado | 🔒 Bloqueado | ✅ **Exclusivo Plan 3** |
| **Agenda de Clientes Frecuentes CRM** *(a futuro)* | 🔒 Bloqueado | 🔒 Bloqueado | ✅ **Exclusivo Plan 3** |

---

## 3. Comportamiento del Sistema ante Bloqueos (Gating)

### A. Capa de Seguridad (Backend - Laravel)
1. **Helper / Método de Capacidades:**
   - En el modelo `Local` o `Plan` se implementa `tieneCapacidad(string $capacidad): bool` o `limiteProductos(): ?int`.
2. **Middleware `verificar.plan:capacidad`:**
   - Protege rutas de la API de administración (`/api/admin/pedidos/*`, `/api/admin/reportes/*`, `/api/admin/promociones/*`, `/api/admin/cupones/*`, `/api/admin/empleados/*`).
   - Si el plan del local no cuenta con la capacidad requerida, devuelve respuesta HTTP `403 Forbidden`:
     ```json
     {
       "error": "Esta función requiere el plan Control de Pedidos o superior.",
       "planRequerido": "control-pedidos-stock",
       "capacidad": "pedidos_en_vivo"
     }
     ```
3. **Límite de Catálogo (`max_productos`):**
   - En `ProductoAdminController::store` y duplicación: si el local tiene el Plan 1 y ya cuenta con **50 productos**, se rechaza el alta con un `422 Unprocessable Entity` explicando que alcanzó el tope del plan y sugiriendo upgrade.

### B. Capa de Experiencia de Usuario (Frontend - Angular)
1. **Menú Lateral (`BarraLateralAdminComponente`):**
   - Los ítems bloqueados según el plan del local muestran un distintivo visual (ícono de candado `🔒` o badge sutil del plan requerido).
2. **Guard de Navegación + Pantalla de Upgrade (`PaginaPlanBloqueadoComponente`):**
   - Si el usuario accede por URL directa a una sección bloqueada (ejemplo: `/demo/admin/pedidos` teniendo Plan 1):
     - No ve una pantalla en blanco ni error roto.
     - Ve una vista profesional explicando el valor de esa funcionalidad:
       - Título: *"Desbloqueá la Consola de Pedidos en Vivo"*
       - Beneficios: *"Controlá despachos en tiempo real, imprimí comandas para cocina y cerrá la caja diaria con 1 clic."*
       - Botón destacado: **"Solicitar Upgrade a Plan Control"** (con enlace directo al WhatsApp del soporte / Root con mensaje prearmado).
3. **Límite de 50 productos en Catálogo:**
   - En la lista de productos se muestra un contador de cupo: *"50 / 50 productos (Tope alcanzado en Plan Inicial)"*.
   - El botón *"Nuevo Producto"* avisa que debe mejorar el plan para cargar más ítems.

---

## 4. Estrategia de Prueba con el Local Demo
- El local demo de pruebas (`/demo`) tiene cargados exactamente **50 productos** en su catálogo inicial.
- Esto permite probar de inmediato:
  - Cambiar el plan del local demo a **Plan 1 (Catálogo)** desde el panel Root (`/root`): el botón de crear producto se bloqueará al estar en 50/50, y las pestañas de Pedidos, Caja, Promociones y Empleados quedarán protegidas con la pantalla de upgrade.
  - Subirlo a **Plan 2 (Control)**: se desbloquean inmediatamente Pedidos, Comandas, Caja, Promociones, Cupones y productos ilimitados.
  - Subirlo a **Plan 3 (Full)**: se desbloquea Personal y Asistencia.
