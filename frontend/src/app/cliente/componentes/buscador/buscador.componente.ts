import { Component, inject } from '@angular/core';

import { CartaServicio } from '../../servicios/carta.servicio';

/** Buscador de productos por nombre o descripción. */
@Component({
  selector: 'app-buscador',
  standalone: true,
  templateUrl: './buscador.componente.html',
  styleUrl: './buscador.componente.scss',
})
export class BuscadorComponente {
  private readonly carta = inject(CartaServicio);

  readonly valor = this.carta.busqueda;

  alEscribir(event: Event): void {
    this.carta.buscar((event.target as HTMLInputElement).value);
  }

  limpiar(): void {
    this.carta.limpiarBusqueda();
  }
}
