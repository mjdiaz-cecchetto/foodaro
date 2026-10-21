import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LogoComponente } from '../../../shared/components/logo/logo.component';
import { AlternarTemaComponente } from '../../../shared/components/alternar-tema/alternar-tema.component';
import { LocalServicio } from '../../../core/services/local.service';
import { NotificacionesServicio } from '../../../core/services/notificaciones.service';
import { LocalPublicoServicio } from '../../services/local-publico.service';
import { CartaServicio } from '../../services/carta.service';

/**
 * Portada del local (foodaro.net/<slug>): banner con identidad, accesos a
 * /menu, /pedido y /admin, info del local y QR para compartir.
 */
@Component({
  selector: 'app-portada-local',
  standalone: true,
  imports: [RouterLink, LogoComponente, AlternarTemaComponente],
  templateUrl: './portada-local.component.html',
  styleUrl: './portada-local.component.scss',
})
export class PortadaLocalComponente implements OnInit {
  private readonly notificaciones = inject(NotificacionesServicio);
  private readonly carta = inject(CartaServicio);
  readonly local = inject(LocalServicio);
  readonly localPublico = inject(LocalPublicoServicio);

  readonly perfil = this.localPublico.perfil;
  readonly cantidadCategorias = computed(() => this.carta.categorias().length - 1);
  readonly cantidadProductos = computed(() => this.carta.productos().length);
  readonly promocionesActivas = computed(() => this.carta.promociones().length);
  readonly anio = new Date().getFullYear();

  readonly accesos = computed(() => [
    {
      titulo: 'Ver la carta',
      descripcion: 'Solo lectura: ideal para la mesa o el mostrador.',
      icono: 'fa-book-open',
      ruta: this.local.url('menu'),
      enlace: this.local.ruta('menu'),
      estilo: 'bg-white dark:bg-dark-surface text-gray-900 dark:text-white border-gray-100 dark:border-dark-border',
      estiloIcono: 'bg-gray-100 dark:bg-dark-card text-gray-700 dark:text-white',
    },
    {
      titulo: 'Hacer un pedido',
      descripcion: 'Armá tu pedido y envialo por WhatsApp.',
      icono: 'fa-bag-shopping',
      ruta: this.local.url('pedido'),
      enlace: this.local.ruta('pedido'),
      estilo: 'bg-brand-600 text-white border-brand-600 shadow-coral',
      estiloIcono: 'bg-white/20 text-white',
    },
  ]);

  ngOnInit(): void {
    this.notificaciones.definirPosicion('arriba');
  }

  alAlternarTema(oscuro: boolean): void {
    this.notificaciones.mostrar(oscuro ? 'Modo Oscuro Activado' : 'Modo Claro Activado');
  }

  async copiarEnlace(): Promise<void> {
    try {
      await navigator.clipboard.writeText(window.location.origin + this.local.ruta());
      this.notificaciones.mostrar('Enlace copiado al portapapeles');
    } catch {
      this.notificaciones.mostrar('No se pudo copiar el enlace');
    }
  }
}
