# Foodaro — Análisis de Planes Comerciales (Estado actual y propuestas)

> Última actualización: 30/10/2026
> Documento de trabajo para definir qué incluye cada plan comercial, qué límites aplica el sistema y cómo comunicarlo en la Landing Pública.

---

## 1. Radiografía de los 3 planes actuales vs. lo que ya está construido

### Plan 1: **Catálogo & WhatsApp** — *Nivel Inicial ($ 19.900/mes · Anual $ 15.900/mes)*
> *"Ideal para digitalizar tus productos y recibir pedidos directos sin intermediarios."*

| Característica prometida hoy en la tarjeta | Estado real hoy en Foodaro | Detalle técnico |
|---|---|---|
| Catálogo digital interactivo con QR y Link | ✅ **100% hecho** | Carta pública `/{slug}`, categorías, buscador, variantes/adicionales y cartel QR imprimible. |
| Pedidos directos a tu WhatsApp | ✅ **100% hecho** | El cliente arma su carrito y envía el pedido formateado al WhatsApp del comercio. |
| Panel Administrador del comercio | ✅ **100% hecho** | Panel `/{slug}/admin` con datos del local, ubicación, horarios, envíos y medios de pago. |
| Modificación de precios y stock en vivo | ✅ **100% hecho** | Alta, edición, duplicación de productos y switch de disponibilidad en 1 clic. |
| Soporte para Modo Claro y Oscuro | ✅ **100% hecho** | Disponible tanto en la carta pública como en el panel del local. |

- **Observación clave:** Hoy **no hay restricción técnica** entre el Plan 1 y el Plan 2. Un comercio con el Plan 1 actualmente ve y puede usar también la consola de Pedidos, el Arqueo de Caja, Promociones y Cupones.

---

### Plan 2: **Control de Pedidos & Stock** — *Gestión Activa ($ 29.900/mes · Anual $ 23.900/mes — Más Elegido)*
> *"Para negocios con volumen diario que necesitan controlar despachos y pedidos."*

| Característica prometida hoy en la tarjeta | Estado real hoy en Foodaro | Detalle técnico |
|---|---|---|
| Todo lo del plan Básico | ✅ **100% hecho** | Incluido. |
| Consola de pedidos en tiempo real | ✅ **100% hecho** | Auto-refresco cada 15 s, alerta sonora (`Web Audio API`), etiqueta `¡NUEVO!` y vista **Lista** + **Tablero Mostrador (Kanban 4 columnas)**. |
| Control de pedidos Sin Pagar vs Pagados | ✅ **100% hecho** | Botón de 1 clic **`Sin pagar / Pagado`** en cada pedido (vista Lista y Tablero), filtro rápido de pendientes de cobro, arqueo con **Cobrado vs. Pendiente de cobro** e indicación en la comanda térmica (`✓ PEDIDO PAGADO` / `*** FALTA COBRAR ***`). |
| Pausa rápida de ítems agotados | ✅ **100% hecho** | Switch de disponibilidad por producto + botones superiores **"Cerrar por hoy"** y **"Pausar envíos"**. |
| Banners promocionales y cupones de descuento | ✅ **100% hecho** | Módulos completos de Promociones y Cupones con reglas de vigencia y monto mínimo. |
| Kit imprimible de mostrador en PDF | ✅ **100% hecho** | Cartel QR imprimible + Comanda térmica 58/80 mm + Cierre de caja imprimible. |

- **Funciones muy potentes que YA construimos y hoy NO figuran en la tarjeta del Plan 2:**
  1. **Comanda / Ticket de cocina térmico (58 y 80 mm)** en 1 clic.
  2. **Alerta sonora en vivo y Tablero Kanban de Mostrador**.
  3. **Arqueo de caja diario, semanal y mensual + Exportación a Excel (`.csv`)**.
  4. **Pausa rápida operativa** (*"Cerrar por hoy"* y *"Pausar envíos"* en 1 clic).

---

### Plan 3: **Terminal POS & Mostrador** — *Operación Completa ($ 44.900/mes · Anual $ 35.900/mes)*
> *"Operación integral de salón, mozos o cajeros para atención presencial y pedidos."*

| Característica prometida hoy en la tarjeta | Estado real hoy en Foodaro | Detalle técnico |
|---|---|---|
| Todo lo del plan Control | ✅ **100% hecho** | Incluido. |
| Terminal táctil para mozos o vendedores | ❌ **Pendiente** | Falta una pantalla de carga rápida de pedidos dentro del admin para mostrador/salón. |
| Login por PIN (Vendedor vs Encargado) | ❌ **Pendiente** | Hoy existe login único de administrador por email y contraseña. |
| Registro de cliente con nombre en mostrador | ⚠️ **Parcial** | Se registra en pedidos web, pero falta el cargador de mostrador y la **Agenda de Clientes Frecuentes**. |
| Control de horario comercial y turnos | ✅ **100% hecho** | Horarios semanales con doble franja (mañana/noche) + excepciones/feriados + pausa rápida. |
| Arqueo rápido de caja y cobros del turno | ✅ **100% hecho** | Métricas de ventas por día/semana/mes/rango, desglose por medio de pago y exportación a Excel. |

- **Observación clave:** Mientras no estén desarrolladas las funciones de POS de salón / PIN de vendedores, el Plan 3 se puede mantener **Pausado** desde el Panel Root (`/root` → pestaña *Planes Comerciales* → botón **Pausar**), o bien redefinir su alcance.

---

## 2. Propuesta de diferenciación real entre planes (Punto C)

Cuando decidas activarlo, podemos hacer que el sistema aplique estas diferencias automáticamente según el plan asignado al local:

| Módulo / Capacidad | Plan 1: **Catálogo & WhatsApp** | Plan 2: **Control de Pedidos & Stock** | Plan 3: **Full / Mostrador** |
|---|---|---|---|
| **Carta digital QR + Link + WhatsApp** | ✅ Sí | ✅ Sí | ✅ Sí |
| **Límite de productos en catálogo** | Hasta **40 productos** | **Ilimitados** | **Ilimitados** |
| **Datos del local, horarios y pausa rápida** | ✅ Sí | ✅ Sí | ✅ Sí |
| **Consola de Pedidos en vivo + Tablero + Sonido** | ❌ Solo llegan al WhatsApp | ✅ **Incluido** | ✅ **Incluido** |
| **Comanda térmica 58/80 mm** | ❌ No | ✅ **Incluido** | ✅ **Incluido** |
| **Cierre de caja, métricas y exportar Excel** | ❌ No | ✅ **Incluido** | ✅ **Incluido** |
| **Promociones y Cupones de descuento** | ❌ No | ✅ **Incluido** | ✅ **Incluido** |
| **Zonas de envío por barrio (Punto 8)** | ❌ 1 costo fijo | ✅ Hasta 5 zonas | ✅ Ilimitadas |
| **Ranking de más vendidos + Clientes frecuentes (4 y 5)** | ❌ No | ❌ Básico | ✅ **Completo + CRM WhatsApp** |
| **Carga rápida de pedido en Mostrador (POS simple)** | ❌ No | ❌ No | ✅ **Incluido** |
| **Comanda exclusiva de Cocina + Prioridad (`🔥`)** | ❌ No | ✅ **Incluido** | ✅ **Incluido** |
| **Contador de unidades vendidas por producto (Día/Semana/Mes)** | ❌ No | ✅ **Incluido** | ✅ **Incluido** |
| **Gestión de Empleados, Fichaje (Entrada/Salida) y Paga diaria** | ❌ No | ❌ No | ✅ **Exclusivo Plan 3 (Fuerte diferencial)** |

---

## 3. Opciones estratégicas para decidir más adelante

1. **Opción A (Salir ya con 2 planes activos y pausar el Plan 3):**
   - Dejar activos **Plan 1 (Inicial)** y **Plan 2 (Control)**, mejorando los textos del Plan 2 para destacar *Comanda térmica 58/80 mm*, *Alerta sonora en vivo* y *Cierre de caja en Excel*.
   - Mantener el **Plan 3 pausado** hasta sumar carga de mostrador y reportes avanzados.
2. **Opción B (3 planes activos orientados 100% a Delivery, Take Away y Gestión):**
   - **Plan 1 — Inicial:** Carta QR + Pedidos a WhatsApp (hasta 40 productos).
   - **Plan 2 — Control:** Consola de pedidos en vivo + Comanda térmica + Stock + Promos y Cupones.
   - **Plan 3 — Pro / Crecimiento:** Todo Control + **Cierre de caja y Excel + Ranking de productos más vendidos y horarios pico + Agenda de Clientes Frecuentes + Zonas de envío por barrio + Carga de pedidos telefónicos/mostrador**. (Sin depender de mozos ni PIN de salón).

---

## ▶️ Cómo retomar este análisis en cualquier momento

Cuando quieras volver a trabajar sobre los planes, pegá esta frase en el chat:

> **Leé `docs/ANALISIS-DE-PLANES.md` y continuemos definiendo los planes comerciales y el punto C.**
