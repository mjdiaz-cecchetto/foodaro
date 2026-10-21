import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { LogoComponente } from '../../../compartido/componentes/logo/logo.componente';
import { AlternarTemaComponente } from '../../../compartido/componentes/alternar-tema/alternar-tema.componente';
import { NotificacionesServicio } from '../../../nucleo/servicios/notificaciones.servicio';
import { LocalServicio } from '../../../nucleo/servicios/local.servicio';
import { CatalogoAdminServicio } from '../../servicios/catalogo-admin.servicio';
import { LocalAdminServicio } from '../../servicios/local-admin.servicio';
import { ItemNavegacionAdmin } from '../../interfaces';

/** Barra lateral del admin: isotipo + identidad del local, navegación y accesos. */
@Component({
  selector: 'app-barra-lateral-admin',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LogoComponente, AlternarTemaComponente],
  templateUrl: './barra-lateral-admin.componente.html',
  styleUrl: './barra-lateral-admin.componente.scss',
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
