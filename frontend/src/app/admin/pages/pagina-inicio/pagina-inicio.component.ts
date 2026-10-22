import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { NotificacionesServicio } from '../../../core/services/notificaciones.service';
import { CatalogoAdminServicio } from '../../services/catalogo-admin.service';
import { InicioAdminServicio } from '../../services/inicio-admin.service';
import { Producto } from '../../../shared/models';
import { mensajeDeError } from '../../../shared/utils/api';

/** Panel principal del admin: estado de la carta, puesta a punto, accesos rápidos y QR. */
@Component({
  selector: 'app-pagina-inicio',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './pagina-inicio.component.html',
  styleUrl: './pagina-inicio.component.scss',
})
export class PaginaInicioComponente {
  private readonly notificaciones = inject(NotificacionesServicio);
  private readonly catalogo = inject(CatalogoAdminServicio);
  readonly inicio = inject(InicioAdminServicio);

  readonly saludo = this.calcularSaludo();

  async copiar(url: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(url);
      this.notificaciones.mostrar('Enlace copiado al portapapeles');
    } catch {
      this.notificaciones.mostrar('No se pudo copiar el enlace');
    }
  }

  /** Vuelve a poner en carta un producto agotado desde el inicio. */
  reponer(producto: Producto): void {
    this.catalogo.alternarDisponibilidad(producto.id).subscribe({
      next: () => this.notificaciones.mostrar(`${producto.nombre} vuelve a estar disponible`),
      error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err)),
    });
  }

  private calcularSaludo(): string {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buen día';
    if (hora < 20) return 'Buenas tardes';
    return 'Buenas noches';
  }
}
