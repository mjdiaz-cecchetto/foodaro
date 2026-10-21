import { Component, inject, input, output } from '@angular/core';

import { ModalComponente } from '../../../compartido/componentes/modal/modal.componente';
import { LocalPublicoServicio } from '../../servicios/local-publico.servicio';

/** Información del local: dirección, horarios y contacto. */
@Component({
  selector: 'app-modal-perfil-local',
  standalone: true,
  imports: [ModalComponente],
  templateUrl: './modal-perfil-local.componente.html',
  styleUrl: './modal-perfil-local.componente.scss',
})
export class ModalPerfilLocalComponente {
  readonly localPublico = inject(LocalPublicoServicio);

  readonly abierto = input.required<boolean>();
  readonly cerrado = output<void>();

  readonly perfil = this.localPublico.perfil;

  cerrar(): void {
    this.cerrado.emit();
  }
}
