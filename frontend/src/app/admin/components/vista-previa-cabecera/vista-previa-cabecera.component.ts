import { Component, input } from '@angular/core';

import { PerfilLocal } from '../../../shared/models';

/** Vista previa en vivo del banner del local tal como se ve en la carta. */
@Component({
  selector: 'app-vista-previa-cabecera',
  standalone: true,
  templateUrl: './vista-previa-cabecera.component.html',
  styleUrl: './vista-previa-cabecera.component.scss',
})
export class VistaPreviaCabeceraComponente {
  readonly perfil = input.required<PerfilLocal>();
}
