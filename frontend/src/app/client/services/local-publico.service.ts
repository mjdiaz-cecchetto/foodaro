import { computed, inject, Injectable } from '@angular/core';

import { PerfilLocal } from '../../shared/models';
import { LOCAL_DEMO } from '../../shared/mocks';
import { LocalServicio } from '../../core/services/local.service';

/** Perfil público del local activo y utilidades para compartirlo (QR, WhatsApp, enlaces). */
@Injectable({ providedIn: 'root' })
export class LocalPublicoServicio {
  private readonly local = inject(LocalServicio);

  /** Siempre devuelve un perfil: el del local resuelto o el demo por defecto. */
  readonly perfil = computed<PerfilLocal>(() => this.local.perfil() ?? LOCAL_DEMO.perfil);

  /** URL compartible de la carta (origen + ruta actual). */
  urlCompartible(): string {
    return window.location.origin + window.location.pathname;
  }

  urlImagenQr(tamanio = 300, margen = 10): string {
    const data = encodeURIComponent(this.urlCompartible());
    return `https://api.qrserver.com/v1/create-qr-code/?size=${tamanio}x${tamanio}&data=${data}&margin=${margen}&color=22-25-29`;
  }

  urlDescargaQr(): string {
    const data = encodeURIComponent(this.urlCompartible());
    return `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${data}&margin=20`;
  }

  urlCompartirWhatsApp(): string {
    const texto = encodeURIComponent(
      `¡Hola! Te comparto la carta digital de ${this.perfil().nombre}: ${this.urlCompartible()}`,
    );
    return `https://api.whatsapp.com/send?text=${texto}`;
  }

  /** Número de WhatsApp del local en formato wa.me (solo dígitos). */
  enlaceWhatsApp(): string {
    return `https://wa.me/${this.perfil().contacto.whatsapp.replace(/\D/g, '')}`;
  }

  enlaceTelefono(): string {
    return `tel:${this.perfil().contacto.telefono.replace(/[^\d+]/g, '')}`;
  }
}
