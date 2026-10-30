import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { UsuarioAutenticado } from '../../auth/interfaces';
import { AutenticacionServicio } from '../../auth/services/autenticacion.service';
import { ConfiguracionLocal, Local, PERFIL_LOCAL_VACIO, PerfilLocal, SuscripcionLocal } from '../../shared/models';
import { RespuestaApi } from '../../shared/utils/api';
import { LocalServicio } from '../../core/services/local.service';

export interface PagoSuscripcionLocal {
  id: number;
  planNombre: string;
  monto: number;
  periodoMeses: number;
  medioPago: string;
  fechaPago: string;
  vencimientoNuevo: string;
  referencia: string;
}

export interface DatosMiCuentaLocal {
  usuario: UsuarioAutenticado;
  suscripcion: SuscripcionLocal;
  pagos: PagoSuscripcionLocal[];
}

export interface PayloadMiCuentaLocal {
  nombre: string;
  email: string;
  contraseniaActual?: string;
  nuevaContrasenia?: string;
}

/** Perfil y configuración del local activo editables desde el panel admin (PUT /admin/local). */
@Injectable({ providedIn: 'root' })
export class LocalAdminServicio {
  private readonly http = inject(HttpClient);
  private readonly local = inject(LocalServicio);
  private readonly autenticacion = inject(AutenticacionServicio);

  readonly perfil = computed<PerfilLocal>(() => this.local.perfil() ?? PERFIL_LOCAL_VACIO);
  readonly configuracion = this.local.configuracion;
  readonly suscripcion = this.local.suscripcion;

  guardar(perfil: PerfilLocal, configuracion?: Partial<ConfiguracionLocal>): Observable<PerfilLocal> {
    return this.http.put<RespuestaApi<Local>>(`${environment.apiUrl}/admin/local`, { perfil, configuracion }).pipe(
      map((r) => r.data),
      tap((local) => {
        this.local.perfil.set(local.perfil);
        this.local.configuracion.set(local.configuracion);
      }),
      map((local) => local.perfil),
    );
  }

  /** PATCH /admin/local/pausa-rapida — Cierra/reabre el local por hoy o pausa/reactiva los envíos en 1 clic. */
  alternarPausaRapida(cambios: { cerradoTemporalmente?: boolean; enviosPausados?: boolean }): Observable<Local> {
    return this.http.patch<RespuestaApi<Local>>(`${environment.apiUrl}/admin/local/pausa-rapida`, cambios).pipe(
      map((r) => r.data),
      tap((local) => {
        this.local.perfil.set(local.perfil);
        this.local.configuracion.set(local.configuracion);
      }),
    );
  }

  /** GET /admin/mi-cuenta — Obtiene usuario, estado detallado de suscripción e historial de pagos del local. */
  obtenerMiCuenta(): Observable<DatosMiCuentaLocal> {
    return this.http.get<RespuestaApi<DatosMiCuentaLocal>>(`${environment.apiUrl}/admin/mi-cuenta`).pipe(
      map((r) => r.data),
      tap((datos) => {
        if (datos.suscripcion) {
          this.local.suscripcion.set(datos.suscripcion);
        }
        if (datos.usuario) {
          this.autenticacion.actualizarUsuario(datos.usuario);
        }
      }),
    );
  }

  /** PUT /admin/mi-cuenta — Actualiza nombre, email y/o contraseña del administrador del local. */
  actualizarMiCuenta(payload: PayloadMiCuentaLocal): Observable<UsuarioAutenticado> {
    return this.http.put<RespuestaApi<UsuarioAutenticado>>(`${environment.apiUrl}/admin/mi-cuenta`, payload).pipe(
      map((r) => r.data),
      tap((u) => this.autenticacion.actualizarUsuario(u)),
    );
  }
}
