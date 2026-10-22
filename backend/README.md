# Foodaro — Backend (Laravel 12 + MySQL)

API REST de la plataforma de cartas digitales. Un solo backend sirve a todos los locales
(multi-tenant por `slug`): `foodaro.net/<slug>` consume `GET /api/locales/<slug>`.

## Puesta en marcha (Windows + XAMPP)

1. Instalar [Composer](https://getcomposer.org/download/) y tener corriendo MySQL de XAMPP.
2. Crear la base `foodaro` (phpMyAdmin → Nueva → `foodaro`, cotejamiento `utf8mb4_unicode_ci`).
3. En esta carpeta:

```bash
composer install
copy .env.example .env      # revisar DB_USERNAME / DB_PASSWORD (XAMPP: root sin clave)
php artisan key:generate
php artisan migrate --seed  # crea las tablas y carga el local demo
php artisan serve           # http://localhost:8000
```

Usuario admin del demo: `admin@demolocal.com` / `demo1234` (ver `DEMO_ADMIN_*` en `.env`).

Pruebas (usan SQLite en memoria, no tocan MySQL): `php artisan test`.

## Estructura

```
app/
  Enums/          TipoSeleccion, EstadoPedido, ModoEntrega, MedioPago, RolUsuario
  Models/         Local, Usuario, Categoria, Producto, GrupoOpciones, Opcion, Promocion,
                  Pedido, PedidoItem, PedidoItemOpcion
  Http/
    Controllers/Api/Publico   carta pública y alta de pedidos
    Controllers/Api/Auth      ingreso / salir / yo (tokens Sanctum)
    Controllers/Api/Admin     local, categorías, productos, promociones, plantillas, pedidos
    Requests/                 validaciones (Form Requests)
    Resources/                respuestas JSON con claves camelCase (= interfaces de Angular)
    Middleware/               ForzarRespuestaJson
  Policies/       cada admin solo opera sobre registros de su local
  Services/       CatalogoServicio, GruposOpcionesServicio, PedidoServicio
database/
  migrations/     tablas en español con FK e índices
  seeders/        LocalDemoSeeder (+ datos/demolocal.json)
```

## Modelo de datos

- `locales` — perfil público, horarios, contacto, `moneda`, `cargo_servicio` (0 = sin cargos).
- `usuarios` — admins del panel; `local_id` + `rol` (`administrador` | `superadmin`).
- `categorias`, `productos` — catálogo por local; `productos.disponible` oculta de la carta.
- `grupos_opciones` + `opciones` — opciones por producto (tamaño, cantidad, extras).
  `producto_id = NULL` ⇒ plantilla reutilizable del local; al asignarla a un producto se copia.
- `promociones` — cupones con % de descuento (`codigo` único por local).
- `pedidos`, `pedido_items`, `pedido_item_opciones` — foto del pedido con precios recalculados
  en el servidor; `numero` correlativo por local; `estado` para la futura consola de pedidos.

## Endpoints

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/locales/{slug}` | Carta pública (perfil, configuración, categorías, productos + opciones, promos activas) |
| POST | `/api/locales/{slug}/pedidos` | Registra un pedido (`BorradorPedido` de Angular) → 201 |
| POST | `/api/auth/ingreso` | `{ email, contrasenia }` → `{ token, usuario }` |
| GET | `/api/auth/yo` · POST `/api/auth/salir` | usuario actual / cierra el token |
| GET/PUT | `/api/admin/local` | local completo (con plantillas) / actualizar perfil y configuración |
| CRUD | `/api/admin/categorias` | 409 si se intenta borrar una categoría con productos |
| CRUD | `/api/admin/productos` + PATCH `/{id}/disponibilidad` | el `gruposOpciones` anidado reemplaza los grupos |
| CRUD | `/api/admin/promociones` + PATCH `/{id}/estado` | |
| CRUD | `/api/admin/plantillas-opciones` | plantillas de grupos del local |
| GET | `/api/admin/pedidos[?estado=]` · GET `/{id}` · PATCH `/{id}/estado` | |

Las rutas `admin` requieren `Authorization: Bearer <token>`. Errores de validación: 422 con
`{ message, errors }` (formato estándar de Laravel). Respuestas envueltas en `{ data: ... }`.
