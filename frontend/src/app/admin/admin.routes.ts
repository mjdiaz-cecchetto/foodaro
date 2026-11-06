import { Routes } from '@angular/router';

import { localAdminGuardia } from '../core/guards/local-admin.guard';
import { requiereCapacidadGuardia } from '../core/guards/requiere-capacidad.guard';

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
        canActivate: [requiereCapacidadGuardia],
        loadComponent: () =>
          import('./pages/pagina-pedidos/pagina-pedidos.component').then((m) => m.PaginaPedidosComponente),
        data: { seccion: 'recibidos', capacidad: 'pedidos_en_vivo' },
        title: 'Foodaro Admin • Gestión de Ventas (Hoy)',
      },
      {
        path: 'pedidos/reportes',
        canActivate: [requiereCapacidadGuardia],
        loadComponent: () =>
          import('./pages/pagina-pedidos/pagina-pedidos.component').then((m) => m.PaginaPedidosComponente),
        data: { seccion: 'reportes', capacidad: 'pedidos_en_vivo' },
        title: 'Foodaro Admin • Reportes y Arqueo de Caja',
      },
      {
        path: 'pedidos/cocina',
        canActivate: [requiereCapacidadGuardia],
        loadComponent: () =>
          import('./pages/pagina-pedidos/pagina-pedidos.component').then((m) => m.PaginaPedidosComponente),
        data: { seccion: 'cocina', capacidad: 'pedidos_en_vivo' },
        title: 'Foodaro Admin • Monitor de Cocina y Prioridades',
      },
      {
        path: 'pedidos/ranking',
        canActivate: [requiereCapacidadGuardia],
        loadComponent: () =>
          import('./pages/pagina-pedidos/pagina-pedidos.component').then((m) => m.PaginaPedidosComponente),
        data: { seccion: 'ranking', capacidad: 'pedidos_en_vivo' },
        title: 'Foodaro Admin • Productos Vendidos y Ranking',
      },
      {
        path: 'pedidos/configuracion',
        canActivate: [requiereCapacidadGuardia],
        loadComponent: () =>
          import('./pages/pagina-pedidos/pagina-pedidos.component').then((m) => m.PaginaPedidosComponente),
        data: { seccion: 'configuracion', capacidad: 'pedidos_en_vivo' },
        title: 'Foodaro Admin • Config. WhatsApp, Envíos y Pagos',
      },
      {
        path: 'empleados',
        canActivate: [requiereCapacidadGuardia],
        loadComponent: () =>
          import('./pages/pagina-empleados/pagina-empleados.component').then((m) => m.PaginaEmpleadosComponente),
        data: { capacidad: 'personal_asistencia' },
        title: 'Foodaro Admin • Personal y Asistencia',
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
        canActivate: [requiereCapacidadGuardia],
        loadComponent: () =>
          import('./pages/pagina-promociones/pagina-promociones.component').then((m) => m.PaginaPromocionesComponente),
        data: { capacidad: 'promociones_cupones' },
        title: 'Foodaro Admin • Promociones',
      },
      {
        path: 'cupones',
        canActivate: [requiereCapacidadGuardia],
        loadComponent: () =>
          import('./pages/pagina-cupones/pagina-cupones.component').then((m) => m.PaginaCuponesComponente),
        data: { capacidad: 'promociones_cupones' },
        title: 'Foodaro Admin • Cupones de Descuento',
      },
      {
        path: 'plan-bloqueado',
        loadComponent: () =>
          import('./pages/pagina-plan-bloqueado/pagina-plan-bloqueado.component').then(
            (m) => m.PaginaPlanBloqueadoComponente,
          ),
        title: 'Foodaro Admin • Función no incluida en tu plan',
      },
    ],
  },
];
