import { Component, input, output } from '@angular/core';

/** Título, subtítulo y acción principal de cada página del admin. */
@Component({
  selector: 'app-encabezado-pagina',
  standalone: true,
  templateUrl: './encabezado-pagina.component.html',
  styleUrl: './encabezado-pagina.component.scss',
})
export class EncabezadoPaginaComponente {
  readonly titulo = input.required<string>();
  readonly subtitulo = input<string>('');
  readonly etiquetaAccion = input<string>('');
  readonly iconoAccion = input<string>('fa-plus');
  readonly accion = output<void>();
}
