import { Component, inject, input, output } from '@angular/core';

import { ModalComponente } from '../../../compartido/componentes/modal/modal.componente';
import { NotificacionesServicio } from '../../../nucleo/servicios/notificaciones.servicio';
import { LocalPublicoServicio } from '../../servicios/local-publico.servicio';

/** Compartir la carta: QR, copiar enlace y WhatsApp. */
@Component({
  selector: 'app-modal-compartir-qr',
  standalone: true,
  imports: [ModalComponente],
  templateUrl: './modal-compartir-qr.componente.html',
  styleUrl: './modal-compartir-qr.componente.scss',
})
export class ModalCompartirQrComponente {
  private readonly notificaciones = inject(NotificacionesServicio);
  readonly localPublico = inject(LocalPublicoServicio);

  readonly abierto = input.required<boolean>();
  readonly cerrado = output<void>();

  cerrar(): void {
    this.cerrado.emit();
  }

  async copiarEnlace(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.localPublico.urlCompartible());
      this.notificaciones.mostrar('Enlace copiado al portapapeles');
    } catch {
      this.notificaciones.mostrar('No se pudo copiar el enlace');
    }
  }
}
