import { Routes } from '@angular/router';

import { ModoCliente } from './interfaces';

const paginaCarta = () => import('./pages/pagina-carta/pagina-carta.component').then((m) => m.PaginaCartaComponente);
const layout = () => import('./layout/layout-cliente/layout-cliente.component').then((m) => m.LayoutClienteComponente);

/**
 * Dos entradas a la misma carta:
 *   /menu   → solo lectura (sin carrito ni confirmación)
 *   /pedido → con carrito, confirmación y envío del pedido por WhatsApp
 */
export const RUTAS_CLIENTE: Routes = [
  {
    path: 'menu',
    loadComponent: layout,
    data: { modo: 'menu' satisfies ModoCliente },
    children: [{ path: '', loadComponent: paginaCarta, title: 'Carta digital' }],
  },
  {
    path: 'pedido',
    loadComponent: layout,
    data: { modo: 'pedido' satisfies ModoCliente },
    children: [{ path: '', loadComponent: paginaCarta, title: 'Hacé tu pedido' }],
  },
];
