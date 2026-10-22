import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { map, Observable, of, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  Categoria,
  ConfiguracionLocal,
  GrupoOpciones,
  Local,
  PerfilLocal,
  Producto,
  Promocion,
} from '../../shared/models';
import { RespuestaApi } from '../../shared/utils/api';

const CONFIGURACION_POR_DEFECTO: ConfiguracionLocal = {
  moneda: 'ARS',
  cargoServicio: 0,
  etiquetaCargoServicio: 'Servicio / empaque',
};

/**
 * Local (tenant) activo según el primer segmento de la URL: foodaro.net/<slug>/...
 * Expone perfil, configuración y catálogo como señales escribibles: la carta
 * las lee y el panel admin las edita sobre la misma fuente (ambos vía API).
 */
@Injectable({ providedIn: 'root' })
export class LocalServicio {
  private readonly http = inject(HttpClient);

  readonly id = signal<number | null>(null);
  readonly slug = signal<string | null>(null);
  readonly perfil = signal<PerfilLocal | null>(null);
  readonly configuracion = signal<ConfiguracionLocal>(CONFIGURACION_POR_DEFECTO);
  readonly categorias = signal<Categoria[]>([]);
  readonly productos = signal<Producto[]>([]);
  readonly promociones = signal<Promocion[]>([]);
  readonly plantillasOpciones = signal<GrupoOpciones[]>([]);
  /** `true` cuando se cargó el local completo del admin (incluye agotados y plantillas). */
  readonly cargaCompleta = signal(false);

  readonly resuelto = computed(() => this.slug() !== null && this.perfil() !== null);

  /** Resuelve la carta pública por slug (GET /locales/{slug}). Reutiliza la ya cargada. */
  resolver(slug: string): Observable<boolean> {
    const normalizado = slug.trim().toLowerCase();
    if (this.slug() === normalizado && this.perfil()) {
      return of(true);
    }
    return this.http.get<RespuestaApi<Local>>(`${environment.apiUrl}/locales/${encodeURIComponent(normalizado)}`).pipe(
      tap((r) => this.aplicar(r.data, false)),
      map(() => true),
    );
  }

  /** Carga el local completo del administrador autenticado (GET /admin/local). */
  cargarParaAdmin(): Observable<boolean> {
    return this.http.get<RespuestaApi<Local>>(`${environment.apiUrl}/admin/local`).pipe(
      tap((r) => this.aplicar(r.data, true)),
      map(() => true),
    );
  }

  /** Reemplaza el estado con un local recibido del API. */
  aplicar(local: Local, completo: boolean): void {
    this.id.set(local.id ?? null);
    this.slug.set(local.slug);
    this.perfil.set(local.perfil);
    this.configuracion.set(local.configuracion);
    this.categorias.set(local.categorias ?? []);
    this.productos.set(local.productos ?? []);
    this.promociones.set(local.promociones ?? []);
    this.plantillasOpciones.set(local.plantillasOpciones ?? []);
    this.cargaCompleta.set(completo);
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

  /** URL base del API para el local activo (público). */
  urlApiPublica(...segmentos: string[]): string {
    return [`${environment.apiUrl}/locales/${this.slug() ?? ''}`, ...segmentos].join('/');
  }
}
