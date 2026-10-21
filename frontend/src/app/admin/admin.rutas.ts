import { Routes } from '@angular/router';

export const RUTAS_ADMIN: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/layout-admin/layout-admin.componente').then((m) => m.LayoutAdminComponente),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'perfil' },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./paginas/pagina-perfil-local/pagina-perfil-local.componente').then((m) => m.PaginaPerfilLocalComponente),
        title: 'Foodaro Admin • Datos del Local',
      },
      {
        path: 'categorias',
        loadComponent: () =>
          import('./paginas/pagina-categorias/pagina-categorias.componente').then((m) => m.PaginaCategoriasComponente),
        title: 'Foodaro Admin • Categorías',
      },
      {
        path: 'productos',
        loadComponent: () =>
          import('./paginas/pagina-productos/pagina-productos.componente').then((m) => m.PaginaProductosComponente),
        title: 'Foodaro Admin • Productos',
      },
      {
        path: 'promociones',
        loadComponent: () =>
          import('./paginas/pagina-promociones/pagina-promociones.componente').then((m) => m.PaginaPromocionesComponente),
        title: 'Foodaro Admin • Promociones',
      },
    ],
  },
];
