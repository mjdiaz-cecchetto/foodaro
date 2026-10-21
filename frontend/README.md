# Foodaro — Frontend (Angular Standalone)

Carta digital pública + backoffice del local, replicados desde los mockups
`foodaro_essential_food_app_digital_menu.html` y `foodaro_business_admin_dashboard.html`.

## Stack

- Angular 22 (standalone, signals, control flow `@if/@for`)
- Tailwind CSS v4 (`@tailwindcss/postcss`) con los tokens de diseño unificados en `src/styles.scss`
- Font Awesome 7 (npm) · Google Fonts: Plus Jakarta Sans + Caveat
- Datos ficticios en `src/app/shared/mocks` (sin backend todavía)

## Scripts

```bash
npm install
npm start          # http://localhost:4200
npm run build      # dist/frontend
```

## Rutas

| Ruta | Módulo | Descripción |
|---|---|---|
| `/` | client | Carta digital (buscador, promo, categorías, platos, carrito, modales) |
| `/auth/login` | auth | Login del encargado (mock: cualquier email + contraseña de 4+ caracteres) |
| `/admin/perfil` | admin | Datos del local con vista previa en vivo |
| `/admin/categorias` | admin | CRUD de categorías |
| `/admin/platos` | admin | Tabla de platos, búsqueda, filtro y disponibilidad |
| `/admin/promos` | admin | Promociones y cupones |

`/admin/**` está protegido por `authGuard`; sin sesión redirige a `/auth/login?returnUrl=...`.

## Estructura

```
src/app/
├── core/        servicios transversales (ThemeService, ToastService), guards, interceptors
├── shared/      componentes reutilizables por todos los módulos (logo, theme-toggle, toast, modal),
│                models (Category, Product, Promotion, StoreProfile), mocks, pipes (price)
├── auth/        auth.routes.ts · pages/login · services/auth.service · interfaces
├── client/      client.routes.ts · layout · pages/menu-page · components · services (menu, cart, store) · interfaces
└── admin/       admin.routes.ts · layout · pages (perfil, categorías, platos, promos) · components · services · interfaces
```

Cada componente es standalone y tiene sus tres archivos `.component.ts`, `.component.html` y `.component.scss`.

## Convenciones

- Estado con signals; los servicios exponen `signal`/`computed` y los componentes solo orquestan.
- Las clases de Tailwind se mantienen literales en los templates (Tailwind v4 escanea `.html` y `.ts`).
- `ModalComponent` (shared) tiene dos variantes: `sheet` (bottom-sheet móvil → diálogo centrado, carta)
  y `dialog` (centrado con fade/scale, admin).
- El modo oscuro usa la clase `dark` en `<html>`, persistida en `localStorage['foodaro_theme']`.

## Pendientes conocidos (heredados de los mockups, a resolver en la integración con Laravel)

- El carrito agrupa por producto: agregar el mismo plato con otra porción/extras se fusiona y pierde los extras al cambiar cantidad; las notas no se guardan.
- Las promociones del admin no alimentan el banner más allá de la primera activa.
- Los platos marcados "Agotado" en el admin no se ocultan todavía en la carta pública.
- Las imágenes son URLs externas tipeadas a mano (falta upload).
