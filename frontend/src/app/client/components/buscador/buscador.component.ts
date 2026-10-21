import { Component, inject } from '@angular/core';

import { CartaServicio } from '../../services/carta.service';

/** Buscador de productos por nombre o descripción. */
@Component({
  selector: 'app-buscador',
  standalone: true,
  templateUrl: './buscador.component.html',
  styleUrl: './buscador.component.scss',
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
