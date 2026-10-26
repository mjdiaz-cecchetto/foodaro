import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { RespuestaApi } from '../../shared/utils/api';

export type EstadoSuscripcion = 'al_dia' | 'prueba' | 'por_vencer' | 'vencido';

export interface MetricasRoot {
  totalLocales: number;
  localesActivos: number;
  localesPausados: number;
  suscripcionesAlDia: number;
  suscripcionesPorVencer: number;
  suscripcionesVencidas: number;
  ingresosMensualesEstimados: number;
  totalProductos: number;
  totalPedidos: number;
  totalUsuarios: number;
}

export interface LocalRoot {
  id: number;
  slug: string;
  nombre: string;
  rubro: string;
  eslogan: string;
  logoUrl: string;
  whatsapp: string;
  direccion: string;
  activo: boolean;
  planId: number | null;
  planNombre: string;
  planMensual: number;
  estadoSuscripcion: EstadoSuscripcion;
  vencimientoSuscripcion: string | null;
  productosCount: number;
  categoriasCount: number;
  usuariosCount: number;
  pedidosCount: number;
  creadoEn: string | null;
}

export interface UsuarioRoot {
  id: number;
  nombre: string;
  email: string;
  rol: 'administrador' | 'superadmin';
  activo: boolean;
  localId: number | null;
  localNombre: string | null;
  localSlug: string | null;
}

export interface PlanRoot {
  id: number;
  codigo: string;
  nivel: string;
  nombre: string;
  mensual: number;
  anual: number;
  descripcion: string;
  caracteristicas: string[];
  cta: string;
  destacado: boolean;
  activo: boolean;
  orden: number;
  localesCount: number;
}

export interface ResumenRoot {
  metricas: MetricasRoot;
  locales: LocalRoot[];
  usuarios: UsuarioRoot[];
  planes: PlanRoot[];
}

export interface PayloadCrearLocal {
  nombre: string;
  slug: string;
  rubro?: string;
  whatsapp: string;
  direccion?: string;
  planId: number | null;
  estadoSuscripcion: EstadoSuscripcion;
  vencimientoSuscripcion: string | null;
  activo: boolean;
  adminNombre?: string;
  adminEmail?: string;
  adminContrasenia?: string;
}

export interface PayloadActualizarLocal {
  nombre: string;
  slug: string;
  rubro?: string;
  whatsapp: string;
  direccion?: string;
  planId: number | null;
  estadoSuscripcion: EstadoSuscripcion;
  vencimientoSuscripcion: string | null;
  activo: boolean;
}

export interface PayloadUsuarioRoot {
  nombre: string;
  email: string;
  contrasenia?: string;
  rol: 'administrador' | 'superadmin';
  localId: number | null;
  activo: boolean;
}

export interface PayloadPlanRoot {
  nivel: string;
  nombre: string;
  mensual: number;
  anual: number;
  descripcion: string;
  caracteristicas: string[];
  cta: string;
  destacado: boolean;
  activo: boolean;
}

const METRICAS_VACIAS: MetricasRoot = {
  totalLocales: 0,
  localesActivos: 0,
  localesPausados: 0,
  suscripcionesAlDia: 0,
  suscripcionesPorVencer: 0,
  suscripcionesVencidas: 0,
  ingresosMensualesEstimados: 0,
  totalProductos: 0,
  totalPedidos: 0,
  totalUsuarios: 0,
};

@Injectable({ providedIn: 'root' })
export class RootServicio {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/root`;

  readonly metricas = signal<MetricasRoot>(METRICAS_VACIAS);
  readonly locales = signal<LocalRoot[]>([]);
  readonly usuarios = signal<UsuarioRoot[]>([]);
  readonly planes = signal<PlanRoot[]>([]);
  readonly cargado = signal(false);

  cargarResumen(): Observable<void> {
    return this.http.get<RespuestaApi<ResumenRoot>>(`${this.base}/resumen`).pipe(
      tap(({ data }) => {
        this.metricas.set(data.metricas);
        this.locales.set(data.locales);
        this.usuarios.set(data.usuarios);
        this.planes.set(data.planes);
        this.cargado.set(true);
      }),
      map(() => void 0),
    );
  }

  /* ------------------------------ Locales ------------------------------ */

  crearLocal(payload: PayloadCrearLocal): Observable<LocalRoot> {
    return this.http.post<RespuestaApi<LocalRoot>>(`${this.base}/locales`, payload).pipe(
      map((r) => r.data),
      tap(() => this.cargarResumen().subscribe()),
    );
  }

  actualizarLocal(id: number, payload: PayloadActualizarLocal): Observable<LocalRoot> {
    return this.http.put<RespuestaApi<LocalRoot>>(`${this.base}/locales/${id}`, payload).pipe(
      map((r) => r.data),
      tap(() => this.cargarResumen().subscribe()),
    );
  }

  alternarEstadoLocal(id: number): Observable<LocalRoot> {
    return this.http.patch<RespuestaApi<LocalRoot>>(`${this.base}/locales/${id}/estado`, {}).pipe(
      map((r) => r.data),
      tap(() => this.cargarResumen().subscribe()),
    );
  }

  eliminarLocal(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/locales/${id}`).pipe(
      tap(() => this.cargarResumen().subscribe()),
    );
  }

  /* ------------------------------ Usuarios ------------------------------ */

  crearUsuario(payload: PayloadUsuarioRoot): Observable<UsuarioRoot> {
    return this.http.post<RespuestaApi<UsuarioRoot>>(`${this.base}/usuarios`, payload).pipe(
      map((r) => r.data),
      tap(() => this.cargarResumen().subscribe()),
    );
  }

  actualizarUsuario(id: number, payload: PayloadUsuarioRoot): Observable<UsuarioRoot> {
    return this.http.put<RespuestaApi<UsuarioRoot>>(`${this.base}/usuarios/${id}`, payload).pipe(
      map((r) => r.data),
      tap(() => this.cargarResumen().subscribe()),
    );
  }

  cambiarContraseniaUsuario(id: number, contrasenia: string): Observable<UsuarioRoot> {
    return this.http
      .patch<RespuestaApi<UsuarioRoot>>(`${this.base}/usuarios/${id}/contrasenia`, { contrasenia })
      .pipe(
        map((r) => r.data),
        tap((actualizado) =>
          this.usuarios.update((lista) => lista.map((u) => (u.id === id ? actualizado : u))),
        ),
      );
  }

  alternarEstadoUsuario(id: number): Observable<UsuarioRoot> {
    return this.http.patch<RespuestaApi<UsuarioRoot>>(`${this.base}/usuarios/${id}/estado`, {}).pipe(
      map((r) => r.data),
      tap((actualizado) =>
        this.usuarios.update((lista) => lista.map((u) => (u.id === id ? actualizado : u))),
      ),
    );
  }

  eliminarUsuario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/usuarios/${id}`).pipe(
      tap(() => this.cargarResumen().subscribe()),
    );
  }

  /* ------------------------------ Planes ------------------------------ */

  crearPlan(payload: PayloadPlanRoot): Observable<PlanRoot> {
    return this.http.post<RespuestaApi<PlanRoot>>(`${this.base}/planes`, payload).pipe(
      map((r) => r.data),
      tap(() => this.cargarResumen().subscribe()),
    );
  }

  actualizarPlan(id: number, payload: PayloadPlanRoot): Observable<PlanRoot> {
    return this.http.put<RespuestaApi<PlanRoot>>(`${this.base}/planes/${id}`, payload).pipe(
      map((r) => r.data),
      tap(() => this.cargarResumen().subscribe()),
    );
  }

  eliminarPlan(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/planes/${id}`).pipe(
      tap(() => this.cargarResumen().subscribe()),
    );
  }
}
