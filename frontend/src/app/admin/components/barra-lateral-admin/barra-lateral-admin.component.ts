import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';

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
export class BarraLateralAdminComponente implements OnInit {
  private readonly catalogo = inject(CatalogoAdminServicio);
  private readonly localAdmin = inject(LocalAdminServicio);
  private readonly local = inject(LocalServicio);
  private readonly router = inject(Router);

  /** Abierta en móvil (drawer). En escritorio siempre visible. */
  readonly abierta = input<boolean>(false);
  readonly navegado = output<void>();

  readonly perfil = this.localAdmin.perfil;
  readonly enlaceCarta = computed(() => this.local.ruta('pedido'));
  readonly enlacePortada = computed(() => this.local.ruta());

  /** Controla qué ítem con submenú está desplegado (ej. 'pedidos'). */
  readonly submenuAbierto = signal<string | null>(null);

  readonly items: ItemNavegacionAdmin[] = [
    { ruta: 'inicio', etiqueta: 'Inicio', icono: 'fa-house', indicador: 'flecha' },
    { ruta: 'perfil', etiqueta: 'Datos del Local', icono: 'fa-store', indicador: 'flecha' },
    {
      ruta: 'pedidos',
      etiqueta: 'Gestión de Ventas',
      icono: 'fa-cash-register',
      indicador: 'flecha',
      subitems: [
        {
          ruta: 'pedidos/reportes',
          etiqueta: 'Reportes y Arqueos',
          icono: 'fa-chart-pie',
        },
        {
          ruta: 'pedidos/cocina',
          etiqueta: 'Cocina y Prioridades',
          icono: 'fa-fire-burner',
        },
        {
          ruta: 'pedidos/ranking',
          etiqueta: 'Productos Vendidos',
          icono: 'fa-ranking-star',
        },
        {
          ruta: 'pedidos/configuracion',
          etiqueta: 'WhatsApp, Envíos y Pagos',
          icono: 'fa-truck-fast',
        },
      ],
    },
    { ruta: 'productos', etiqueta: 'Gestión de Productos', icono: 'fa-boxes-stacked', indicador: 'contador' },
    { ruta: 'promociones', etiqueta: 'Promociones', icono: 'fa-tags', indicador: 'punto' },
    { ruta: 'cupones', etiqueta: 'Cupones', icono: 'fa-ticket', indicador: 'flecha' },
    { ruta: 'empleados', etiqueta: 'Personal y Asistencia', icono: 'fa-users-gear', indicador: 'flecha' },
  ];

  readonly claseActiva = 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400';
  readonly claseInactiva = 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-surface-cardDark';

  ngOnInit(): void {
    this.sincronizarSubmenuConUrl(this.router.url);
    this.router.events
      .pipe(filter((ev): ev is NavigationEnd => ev instanceof NavigationEnd))
      .subscribe((ev) => this.sincronizarSubmenuConUrl(ev.urlAfterRedirects));
  }

  private sincronizarSubmenuConUrl(url: string): void {
    if (url.includes('/pedidos')) {
      this.submenuAbierto.set('pedidos');
    } else {
      this.submenuAbierto.set(null);
    }
  }

  alClickItem(item: ItemNavegacionAdmin): void {
    if (item.subitems?.length) {
      this.submenuAbierto.set(item.ruta);
    } else {
      this.submenuAbierto.set(null);
    }
    this.navegado.emit();
  }

  contadorDe(_item: ItemNavegacionAdmin): number {
    return this.catalogo.cantidadProductos();
  }
}
