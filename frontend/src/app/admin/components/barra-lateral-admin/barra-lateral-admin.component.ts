import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { LogoComponente } from '../../../shared/components/logo/logo.component';
import { AlternarTemaComponente } from '../../../shared/components/alternar-tema/alternar-tema.component';
import { NotificacionesServicio } from '../../../core/services/notificaciones.service';
import { LocalServicio } from '../../../core/services/local.service';
import { CatalogoAdminServicio } from '../../services/catalogo-admin.service';
import { LocalAdminServicio } from '../../services/local-admin.service';
import { ItemNavegacionAdmin } from '../../interfaces';

/** Barra lateral del admin: isotipo + identidad del local, navegación y accesos. */
@Component({
  selector: 'app-barra-lateral-admin',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LogoComponente, AlternarTemaComponente],
  templateUrl: './barra-lateral-admin.component.html',
  styleUrl: './barra-lateral-admin.component.scss',
})
export class BarraLateralAdminComponente {
  private readonly notificaciones = inject(NotificacionesServicio);
  private readonly catalogo = inject(CatalogoAdminServicio);
  private readonly localAdmin = inject(LocalAdminServicio);
  private readonly local = inject(LocalServicio);

  /** Abierta en móvil (drawer). En escritorio siempre visible. */
  readonly abierta = input<boolean>(false);
  readonly navegado = output<void>();
  readonly cerrarSesion = output<void>();

  readonly perfil = this.localAdmin.perfil;
  readonly enlaceCarta = computed(() => this.local.ruta('pedido'));
  readonly enlacePortada = computed(() => this.local.ruta());

  readonly items: ItemNavegacionAdmin[] = [
    { ruta: 'perfil', etiqueta: 'Datos del Local', icono: 'fa-store', indicador: 'flecha' },
    { ruta: 'categorias', etiqueta: 'Categorías', icono: 'fa-shapes', indicador: 'contador' },
    { ruta: 'productos', etiqueta: 'Productos', icono: 'fa-utensils', indicador: 'contador' },
    { ruta: 'promociones', etiqueta: 'Promociones', icono: 'fa-tags', indicador: 'punto' },
  ];

  readonly claseActiva = 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400';
  readonly claseInactiva = 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-surface-cardDark';

  contadorDe(item: ItemNavegacionAdmin): number {
    return item.ruta === 'categorias' ? this.catalogo.cantidadCategorias() : this.catalogo.cantidadProductos();
  }

  alAlternarTema(oscuro: boolean): void {
    this.notificaciones.mostrar(`Modo ${oscuro ? 'Oscuro' : 'Claro'} activado`);
  }
}
