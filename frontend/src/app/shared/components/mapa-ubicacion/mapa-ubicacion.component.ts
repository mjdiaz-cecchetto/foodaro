import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { urlMapaEmbebido } from '../../utils/mapas';

/** Mapa de Google embebido a partir del enlace de Maps del local (o su dirección). */
@Component({
  selector: 'app-mapa-ubicacion',
  standalone: true,
  templateUrl: './mapa-ubicacion.component.html',
  styleUrl: './mapa-ubicacion.component.scss',
})
export class MapaUbicacionComponente {
  private readonly sanitizer = inject(DomSanitizer);

  readonly mapsUrl = input<string | null | undefined>('');
  readonly direccion = input<string>('');
  /** Clases del contenedor (alto, radios). */
  readonly clase = input<string>('h-56 rounded-2xl');

  readonly urlSegura = computed<SafeResourceUrl | null>(() => {
    const url = urlMapaEmbebido(this.mapsUrl(), this.direccion());
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });
}
