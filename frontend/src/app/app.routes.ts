import { Routes } from '@angular/router';

import { autenticacionGuardia } from './core/guards/autenticacion.guard';
import { localGuardia } from './core/guards/local.guard';

/**
 * Estructura multi-local (tenant):
 *   /                      landing de la plataforma (foodaro.net)
 *   /:local                portada del local (banner, accesos, info, QR)
 *   /:local/menu           carta de solo lectura
 *   /:local/pedido         carta con carrito y confirmación de pedido
 *   /:local/auth/login     acceso del encargado
 *   /:local/admin/...      panel de administración del local
 */
export const rutas: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./platform/pages/landing-plataforma/landing-plataforma.component').then((m) => m.LandingPlataformaComponente),
    title: 'Foodaro • Catálogo Digital y Plataforma de Ventas para tu Comercio',
  },
  {
    path: ':local',
    canActivate: [localGuardia],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./client/pages/portada-local/portada-local.component').then((m) => m.PortadaLocalComponente),
        title: 'Foodaro • Portada del local',
      },
      {
        path: '',
        loadChildren: () => import('./client/client.routes').then((m) => m.RUTAS_CLIENTE),
      },
      {
        path: 'auth',
        loadChildren: () => import('./auth/auth.routes').then((m) => m.RUTAS_AUTENTICACION),
      },
      {
        path: 'admin',
        canActivate: [autenticacionGuardia],
        loadChildren: () => import('./admin/admin.routes').then((m) => m.RUTAS_ADMIN),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
