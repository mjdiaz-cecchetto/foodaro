import { Component, inject, input, output } from '@angular/core';

import { ModalComponente } from '../../../shared/components/modal/modal.component';
import { NotificacionesServicio } from '../../../core/services/notificaciones.service';
import { LocalPublicoServicio } from '../../services/local-publico.service';

/** Compartir la carta: QR, copiar enlace y WhatsApp. */
@Component({
  selector: 'app-modal-compartir-qr',
  standalone: true,
  imports: [ModalComponente],
  templateUrl: './modal-compartir-qr.component.html',
  styleUrl: './modal-compartir-qr.component.scss',
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
