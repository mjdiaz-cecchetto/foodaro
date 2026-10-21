import { Component, inject, input, output } from '@angular/core';

import { ModalComponente } from '../../../shared/components/modal/modal.component';
import { LocalPublicoServicio } from '../../services/local-publico.service';

/** Información del local: dirección, horarios y contacto. */
@Component({
  selector: 'app-modal-perfil-local',
  standalone: true,
  imports: [ModalComponente],
  templateUrl: './modal-perfil-local.component.html',
  styleUrl: './modal-perfil-local.component.scss',
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
