import { Routes } from '@angular/router';

import { localAdminGuardia } from '../core/guards/local-admin.guard';

export const RUTAS_ADMIN: Routes = [
  {
    path: '',
    canActivate: [localAdminGuardia],
    loadComponent: () => import('./layout/layout-admin/layout-admin.component').then((m) => m.LayoutAdminComponente),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        loadComponent: () => import('./pages/pagina-inicio/pagina-inicio.component').then((m) => m.PaginaInicioComponente),
        title: 'Foodaro Admin • Inicio',
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./pages/pagina-perfil-local/pagina-perfil-local.component').then((m) => m.PaginaPerfilLocalComponente),
        title: 'Foodaro Admin • Datos del Local',
      },
      {
        path: 'pedidos',
        loadComponent: () =>
          import('./pages/pagina-pedidos/pagina-pedidos.component').then((m) => m.PaginaPedidosComponente),
        title: 'Foodaro Admin • Pedidos y Envíos',
      },
      {
        path: 'categorias',
        redirectTo: 'productos',
        pathMatch: 'full',
      },
      {
        path: 'productos',
        loadComponent: () =>
          import('./pages/pagina-productos/pagina-productos.component').then((m) => m.PaginaProductosComponente),
        title: 'Foodaro Admin • Gestión de Productos',
      },
      {
        path: 'promociones',
        loadComponent: () =>
          import('./pages/pagina-promociones/pagina-promociones.component').then((m) => m.PaginaPromocionesComponente),
        title: 'Foodaro Admin • Promociones',
      },
      {
        path: 'cupones',
        loadComponent: () =>
          import('./pages/pagina-cupones/pagina-cupones.component').then((m) => m.PaginaCuponesComponente),
        title: 'Foodaro Admin • Cupones de Descuento',
      },
    ],
  },
];
