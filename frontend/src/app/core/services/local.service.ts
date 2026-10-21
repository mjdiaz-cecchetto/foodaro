import { computed, Injectable, signal } from '@angular/core';

import {
  Categoria,
  ConfiguracionLocal,
  GrupoOpciones,
  Local,
  PerfilLocal,
  Producto,
  Promocion,
} from '../../shared/models';
import { LOCALES_MOCK } from '../../shared/mocks';

const CONFIGURACION_POR_DEFECTO: ConfiguracionLocal = {
  moneda: 'ARS',
  cargoServicio: 0,
  etiquetaCargoServicio: 'Servicio / empaque',
};

/**
 * Local (tenant) activo según el primer segmento de la URL: foodaro.net/<slug>/...
 * Expone perfil, configuración y catálogo como señales escribibles: la carta
 * las lee y el panel admin las edita sobre la misma fuente.
 */
@Injectable({ providedIn: 'root' })
export class LocalServicio {
  readonly slug = signal<string | null>(null);
  readonly perfil = signal<PerfilLocal | null>(null);
  readonly configuracion = signal<ConfiguracionLocal>(CONFIGURACION_POR_DEFECTO);
  readonly categorias = signal<Categoria[]>([]);
  readonly productos = signal<Producto[]>([]);
  readonly promociones = signal<Promocion[]>([]);
  readonly plantillasOpciones = signal<GrupoOpciones[]>([]);

  readonly resuelto = computed(() => this.slug() !== null && this.perfil() !== null);

  /** Resuelve el local por slug. MOCK: busca en memoria; luego consultará el API. */
  resolver(slug: string): Local | null {
    const normalizado = slug.trim().toLowerCase();
    if (this.slug() === normalizado && this.perfil()) {
      return this.instantanea();
    }
    const local = LOCALES_MOCK.find((l) => l.slug === normalizado) ?? null;
    if (local) {
      const copia = structuredClone(local);
      this.slug.set(copia.slug);
      this.perfil.set(copia.perfil);
      this.configuracion.set(copia.configuracion);
      this.categorias.set(copia.categorias);
      this.productos.set(copia.productos);
      this.promociones.set(copia.promociones);
      this.plantillasOpciones.set(copia.plantillasOpciones);
    }
    return local;
  }

  /** Actualiza el perfil del local activo (usado por el panel admin). */
  actualizarPerfil(perfil: PerfilLocal): void {
    this.perfil.set(perfil);
  }

  /** Ruta absoluta dentro del local: url('menu') → ['/', 'demolocal', 'menu']. */
  url(...segmentos: string[]): string[] {
    return ['/', this.slug() ?? '', ...segmentos];
  }

  /** Igual que `url` pero como string: '/demolocal/menu'. */
  ruta(...segmentos: string[]): string {
    return `/${[this.slug() ?? '', ...segmentos].filter(Boolean).join('/')}`;
  }

  private instantanea(): Local {
    return {
      slug: this.slug()!,
      perfil: this.perfil()!,
      configuracion: this.configuracion(),
      categorias: this.categorias(),
      productos: this.productos(),
      promociones: this.promociones(),
      plantillasOpciones: this.plantillasOpciones(),
    };
  }
}
