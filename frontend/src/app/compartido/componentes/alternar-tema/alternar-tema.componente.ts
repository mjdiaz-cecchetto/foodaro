import { Component, inject, input, output } from '@angular/core';

import { TemaServicio } from '../../../nucleo/servicios/tema.servicio';

/**
 * Botón sol/luna para alternar modo oscuro.
 * Las clases del contenedor se parametrizan porque cada pantalla
 * usa un tamaño y paleta neutra distintos (gray vs zinc).
 */
@Component({
  selector: 'app-alternar-tema',
  standalone: true,
  templateUrl: './alternar-tema.componente.html',
  styleUrl: './alternar-tema.componente.scss',
})
export class AlternarTemaComponente {
  private readonly tema = inject(TemaServicio);

  readonly claseBoton = input<string>(
    'w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gray-100 dark:bg-dark-card border border-gray-200/80 dark:border-dark-border text-gray-700 dark:text-amber-400 flex items-center justify-center tap-scale shadow-sm hover:scale-105',
  );
  readonly claseIcono = input<string>('text-sm sm:text-base');

  readonly alternado = output<boolean>();

  readonly esOscuro = this.tema.esOscuro;

  alternar(): void {
    this.alternado.emit(this.tema.alternar());
  }
}
