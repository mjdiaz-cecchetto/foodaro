import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { LogoComponente } from '../../../shared/components/logo/logo.component';
import { LocalServicio } from '../../../core/services/local.service';
import { CatalogoAdminServicio } from '../../services/catalogo-admin.service';
import { LocalAdminServicio } from '../../services/local-admin.service';
import { ItemNavegacionAdmin } from '../../interfaces';

/** Barra lateral fija del admin: marca, tarjeta del local, navegación y acceso a la carta. */
@Component({
  selector: 'app-barra-lateral-admin',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LogoComponente],
  templateUrl: './barra-lateral-admin.component.html',
  styleUrl: './barra-lateral-admin.component.scss',
})
export class BarraLateralAdminComponente {
  private readonly catalogo = inject(CatalogoAdminServicio);
  private readonly localAdmin = inject(LocalAdminServicio);
  private readonly local = inject(LocalServicio);

  /** Abierta en móvil (drawer). En escritorio siempre visible. */
  readonly abierta = input<boolean>(false);
  readonly navegado = output<void>();

  readonly perfil = this.localAdmin.perfil;
  readonly enlaceCarta = computed(() => this.local.ruta('pedido'));
  readonly enlacePortada = computed(() => this.local.ruta());

  readonly items: ItemNavegacionAdmin[] = [
    { ruta: 'inicio', etiqueta: 'Inicio', icono: 'fa-house', indicador: 'flecha' },
    { ruta: 'perfil', etiqueta: 'Datos del Local', icono: 'fa-store', indicador: 'flecha' },
    { ruta: 'pedidos', etiqueta: 'Pedidos y Envíos', icono: 'fa-truck-fast', indicador: 'flecha' },
    { ruta: 'productos', etiqueta: 'Gestión de Productos', icono: 'fa-boxes-stacked', indicador: 'contador' },
    { ruta: 'promociones', etiqueta: 'Promociones', icono: 'fa-tags', indicador: 'punto' },
    { ruta: 'cupones', etiqueta: 'Cupones', icono: 'fa-ticket', indicador: 'flecha' },
  ];

  readonly claseActiva = 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400';
  readonly claseInactiva = 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-surface-cardDark';

  contadorDe(_item: ItemNavegacionAdmin): number {
    return this.catalogo.cantidadProductos();
  }

}
