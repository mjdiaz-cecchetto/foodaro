import { Component, inject, input, output } from '@angular/core';

import { ModalComponente } from '../../../shared/components/modal/modal.component';
import { LocalPublicoServicio } from '../../services/local-publico.service';
import { ListaHorariosComponente } from '../lista-horarios/lista-horarios.component';
import { MapaUbicacionComponente } from '../../../shared/components/mapa-ubicacion/mapa-ubicacion.component';

/** Información del local: dirección, horarios y contacto. */
@Component({
  selector: 'app-modal-perfil-local',
  standalone: true,
  imports: [ModalComponente, ListaHorariosComponente, MapaUbicacionComponente],
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
