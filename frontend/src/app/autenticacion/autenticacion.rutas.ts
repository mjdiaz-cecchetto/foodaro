import { Routes } from '@angular/router';

export const RUTAS_AUTENTICACION: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./paginas/ingreso/ingreso.componente').then((m) => m.IngresoComponente),
    title: 'Foodaro • Iniciar sesión',
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
];
