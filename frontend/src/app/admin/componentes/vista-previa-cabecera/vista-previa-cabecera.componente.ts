import { Component, input } from '@angular/core';

import { PerfilLocal } from '../../../compartido/modelos';

/** Vista previa en vivo del banner del local tal como se ve en la carta. */
@Component({
  selector: 'app-vista-previa-cabecera',
  standalone: true,
  templateUrl: './vista-previa-cabecera.componente.html',
  styleUrl: './vista-previa-cabecera.componente.scss',
})
export class VistaPreviaCabeceraComponente {
  readonly perfil = input.required<PerfilLocal>();
}
