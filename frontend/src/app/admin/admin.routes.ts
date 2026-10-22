import { Routes } from '@angular/router';

import { localAdminGuardia } from '../core/guards/local-admin.guard';

export const RUTAS_ADMIN: Routes = [
  {
    path: '',
    canActivate: [localAdminGuardia],
    loadComponent: () => import('./layout/layout-admin/layout-admin.component').then((m) => m.LayoutAdminComponente),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'perfil' },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./pages/pagina-perfil-local/pagina-perfil-local.component').then((m) => m.PaginaPerfilLocalComponente),
        title: 'Foodaro Admin • Datos del Local',
      },
      {
        path: 'categorias',
        loadComponent: () =>
          import('./pages/pagina-categorias/pagina-categorias.component').then((m) => m.PaginaCategoriasComponente),
        title: 'Foodaro Admin • Categorías',
      },
      {
        path: 'productos',
        loadComponent: () =>
          import('./pages/pagina-productos/pagina-productos.component').then((m) => m.PaginaProductosComponente),
        title: 'Foodaro Admin • Productos',
      },
      {
        path: 'promociones',
        loadComponent: () =>
          import('./pages/pagina-promociones/pagina-promociones.component').then((m) => m.PaginaPromocionesComponente),
        title: 'Foodaro Admin • Promociones',
      },
    ],
  },
];
