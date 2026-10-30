import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { UsuarioAutenticado } from '../../auth/interfaces';
import { RespuestaApi } from '../../shared/utils/api';
import { RootAutenticacionServicio } from './root-autenticacion.service';

export type EstadoSuscripcion = 'al_dia' | 'prueba' | 'por_vencer' | 'vencido';
export type MedioPagoSuscripcion = 'transferencia' | 'efectivo' | 'tarjeta' | 'otro';
export type EstadoSolicitudAlta = 'nuevo' | 'contactado' | 'alta' | 'descartado';

export interface MetricasRoot {
  totalLocales: number;
  localesActivos: number;
  localesPausados: number;
  suscripcionesAlDia: number;
  suscripcionesPorVencer: number;
  suscripcionesVencidas: number;
  ingresosMensualesEstimados: number;
  ingresosCobradosMes: number;
  ingresosCobradosTotal: number;
  cantidadPagosMes: number;
  totalProductos: number;
  totalPedidos: number;
  totalUsuarios: number;
  solicitudesNuevas?: number;
  totalSolicitudes?: number;
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
  cerradoTemporalmente?: boolean;
  enviosPausados?: boolean;
  planId: number | null;
  planNombre: string;
  planMensual: number;
  estadoSuscripcion: EstadoSuscripcion;
  vencimientoSuscripcion: string | null;
  diasRestantes: number | null;
  enPeriodoGracia: boolean;
  cartaSuspendida: boolean;
  productosCount: number;
  categoriasCount: number;
  usuariosCount: number;
  pedidosCount: number;
  creadoEn: string | null;
  ultimoAccesoEn?: string | null;
  ultimoPedidoEn?: string | null;
  ultimaActividadEn?: string | null;
  diasSinActividad?: number;
}

export interface PagoSuscripcionRoot {
  id: number;
  localId: number;
  localNombre: string;
  localSlug: string;
  planId: number | null;
  planNombre: string;
  monto: number;
  periodoMeses: number;
  medioPago: MedioPagoSuscripcion;
  fechaPago: string;
  vencimientoAnterior: string | null;
  vencimientoNuevo: string;
  referencia: string;
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
  ultimoAccesoEn?: string | null;
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

export interface SolicitudAltaRoot {
  id: number;
  nombreComercio: string;
  ciudad: string;
  whatsapp: string;
  planNombre: string;
  planId: number | null;
  estado: EstadoSolicitudAlta;
  localId: number | null;
  localNombre: string | null;
  localSlug: string | null;
  notas: string;
  creadoEn: string | null;
}

export interface ResumenRoot {
  metricas: MetricasRoot;
  locales: LocalRoot[];
  usuarios: UsuarioRoot[];
  planes: PlanRoot[];
  pagos: PagoSuscripcionRoot[];
  solicitudes?: SolicitudAltaRoot[];
}

export interface PayloadRegistrarPago {
  localId: number;
  planId: number | null;
  monto: number;
  periodoMeses: number;
  medioPago: MedioPagoSuscripcion;
  fechaPago: string;
  referencia?: string;
}

export interface PayloadMiCuentaRoot {
  nombre: string;
  email: string;
  contraseniaActual?: string;
  nuevaContrasenia?: string;
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
  solicitudId?: number | null;
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
  ingresosCobradosMes: 0,
  ingresosCobradosTotal: 0,
  cantidadPagosMes: 0,
  totalProductos: 0,
  totalPedidos: 0,
  totalUsuarios: 0,
};

@Injectable({ providedIn: 'root' })
export class RootServicio {
  private readonly http = inject(HttpClient);
  private readonly autenticacionRoot = inject(RootAutenticacionServicio);
  private readonly base = `${environment.apiUrl}/root`;

  readonly metricas = signal<MetricasRoot>(METRICAS_VACIAS);
  readonly locales = signal<LocalRoot[]>([]);
  readonly usuarios = signal<UsuarioRoot[]>([]);
  readonly planes = signal<PlanRoot[]>([]);
  readonly pagos = signal<PagoSuscripcionRoot[]>([]);
  readonly solicitudes = signal<SolicitudAltaRoot[]>([]);
  readonly cargado = signal(false);

  cargarResumen(): Observable<void> {
    return this.http.get<RespuestaApi<ResumenRoot>>(`${this.base}/resumen`).pipe(
      tap(({ data }) => {
        this.metricas.set(data.metricas);
        this.locales.set(data.locales);
        this.usuarios.set(data.usuarios);
        this.planes.set(data.planes);
        this.pagos.set(data.pagos ?? []);
        this.solicitudes.set(data.solicitudes ?? []);
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

  alternarEstadoPlan(id: number): Observable<PlanRoot> {
    return this.http.patch<RespuestaApi<PlanRoot>>(`${this.base}/planes/${id}/estado`, {}).pipe(
      map((r) => r.data),
      tap((actualizado) =>
        this.planes.update((lista) => lista.map((p) => (p.id === id ? actualizado : p))),
      ),
    );
  }

  eliminarPlan(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/planes/${id}`).pipe(
      tap(() => this.cargarResumen().subscribe()),
    );
  }

  /* ------------------------------ Cobros de Suscripciones ------------------------------ */

  registrarPago(payload: PayloadRegistrarPago): Observable<PagoSuscripcionRoot> {
    return this.http.post<RespuestaApi<PagoSuscripcionRoot>>(`${this.base}/pagos`, payload).pipe(
      map((r) => r.data),
      tap(() => this.cargarResumen().subscribe()),
    );
  }

  eliminarPago(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/pagos/${id}`).pipe(
      tap(() => this.cargarResumen().subscribe()),
    );
  }

  /* ------------------------------ Solicitudes desde la Landing ------------------------------ */

  actualizarSolicitud(
    id: number,
    payload: { estado?: EstadoSolicitudAlta; notas?: string; localId?: number | null },
  ): Observable<SolicitudAltaRoot> {
    return this.http.patch<RespuestaApi<SolicitudAltaRoot>>(`${this.base}/solicitudes/${id}`, payload).pipe(
      map((r) => r.data),
      tap(() => this.cargarResumen().subscribe()),
    );
  }

  eliminarSolicitud(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/solicitudes/${id}`).pipe(
      tap(() => this.cargarResumen().subscribe()),
    );
  }

  /* ------------------------------ Mi Cuenta Root ------------------------------ */

  actualizarMiCuenta(payload: PayloadMiCuentaRoot): Observable<UsuarioAutenticado> {
    return this.http.put<RespuestaApi<UsuarioAutenticado>>(`${this.base}/mi-cuenta`, payload).pipe(
      map((r) => r.data),
      tap((u) => {
        this.autenticacionRoot.actualizarUsuario(u);
        this.cargarResumen().subscribe();
      }),
    );
  }
}
