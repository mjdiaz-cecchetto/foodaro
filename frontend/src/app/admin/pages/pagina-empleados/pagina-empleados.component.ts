import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { environment } from '../../../../environments/environment';
import { PrecioPipe } from '../../../shared/pipes/precio.pipe';
import { mensajeDeError, RespuestaApi } from '../../../shared/utils/api';
import { NotificacionesServicio } from '../../../core/services/notificaciones.service';
import { LocalAdminServicio } from '../../services/local-admin.service';
import { EncabezadoPaginaComponente } from '../../components/encabezado-pagina/encabezado-pagina.component';

export type PeriodoAsistencia = 'hoy' | 'ayer' | 'semana' | 'mes' | 'personalizado' | 'todos';

export interface EmpleadoLocal {
  id: number;
  nombre: string;
  rol: string;
  telefono: string;
  dni: string;
  sueldoHora: number;
  activo: boolean;
}

export interface AsistenciaLocal {
  id: number;
  empleadoId: number;
  empleadoNombre: string;
  empleadoRol: string;
  fecha: string;
  horaEntrada: string;
  horaSalida: string | null;
  horasTrabajadas: number;
  valorHora: number;
  totalPaga: number;
  pagado: boolean;
  notas: string;
}

export interface ResumenAsistencias {
  totalHoras: number;
  totalPaga: number;
  totalPagado: number;
  totalPendiente: number;
  turnosActivos: number;
}

export interface RespuestaEmpleadosAdmin {
  empleados: EmpleadoLocal[];
  asistencias: AsistenciaLocal[];
  resumen: ResumenAsistencias;
}

/** Gestión de empleados del local, control de horarios de entrada/salida y cálculo de paga diaria proporcional. */
@Component({
  selector: 'app-pagina-empleados',
  standalone: true,
  imports: [FormsModule, PrecioPipe, EncabezadoPaginaComponente],
  templateUrl: './pagina-empleados.component.html',
})
export class PaginaEmpleadosComponente implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly notificaciones = inject(NotificacionesServicio);
  private readonly localAdmin = inject(LocalAdminServicio);

  readonly cargando = signal(false);
  readonly empleados = signal<EmpleadoLocal[]>([]);
  readonly asistencias = signal<AsistenciaLocal[]>([]);
  readonly resumen = signal<ResumenAsistencias>({
    totalHoras: 0,
    totalPaga: 0,
    totalPagado: 0,
    totalPendiente: 0,
    turnosActivos: 0,
  });

  /* ------------------------ Filtros de Asistencia ------------------------ */
  readonly periodoActivo = signal<PeriodoAsistencia>('hoy');
  readonly fechaDesde = signal('');
  readonly fechaHasta = signal('');
  readonly filtroEmpleadoId = signal<string>('');

  readonly periodosDisponibles: { valor: PeriodoAsistencia; etiqueta: string }[] = [
    { valor: 'hoy', etiqueta: 'Hoy' },
    { valor: 'ayer', etiqueta: 'Ayer' },
    { valor: 'semana', etiqueta: 'Esta semana' },
    { valor: 'mes', etiqueta: 'Este mes' },
    { valor: 'personalizado', etiqueta: 'Elegir fechas' },
    { valor: 'todos', etiqueta: 'Todo el historial' },
  ];

  readonly rolesSugeridos = [
    'Cocinero/a',
    'Pizzero/a',
    'Ayudante de cocina',
    'Cajero/a',
    'Mozo/a',
    'Repartidor / Cadete',
    'Encargado/a',
    'Limpieza',
  ];

  /* ------------------------ Formulario Rápido de Fichaje / Jornada ------------------------ */
  readonly fichajeEmpleadoId = signal<number | null>(null);
  readonly fichajeFecha = signal(this.hoyIso());
  readonly fichajeEntrada = signal(this.horaActualHm());
  readonly fichajeSalida = signal('');
  readonly fichajeNotas = signal('');
  readonly guardandoFichaje = signal(false);

  readonly empleadoSeleccionadoFichaje = computed(() => {
    const id = Number(this.fichajeEmpleadoId());
    return this.empleados().find((e) => e.id === id) ?? null;
  });

  /** Vista previa en vivo de horas y paga proporcional según entrada y salida ingresadas. */
  readonly calculoPrevioFichaje = computed(() => {
    const emp = this.empleadoSeleccionadoFichaje();
    const entrada = this.fichajeEntrada();
    const salida = this.fichajeSalida();
    if (!emp || !entrada || !salida) return null;

    const horas = this.calcularHorasLocal(entrada, salida);
    const paga = Math.round(horas * emp.sueldoHora);
    return {
      horas,
      valorHora: emp.sueldoHora,
      paga,
    };
  });

  /* ------------------------ Modal / Formulario de Empleado ------------------------ */
  readonly modalEmpleadoAbierto = signal(false);
  readonly editandoEmpleadoId = signal<number | null>(null);
  readonly empNombre = signal('');
  readonly empRol = signal('Cocinero/a');
  readonly empTelefono = signal('');
  readonly empDni = signal('');
  readonly empSueldoHora = signal<number>(0);
  readonly empActivo = signal(true);
  readonly guardandoEmpleado = signal(false);

  /* ------------------------ Edición rápida de salida en fila ------------------------ */
  readonly editandoAsistenciaId = signal<number | null>(null);
  readonly editAsistenciaEntrada = signal('');
  readonly editAsistenciaSalida = signal('');
  readonly editAsistenciaNotas = signal('');

  readonly claseCampo =
    'w-full bg-zinc-50/90 dark:bg-surface-cardDark border border-zinc-300 dark:border-surface-borderDark rounded-xl px-3.5 py-2 text-xs sm:text-[13px] font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:bg-white dark:focus:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition';

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando.set(true);
    let params = new HttpParams().set('periodo', this.periodoActivo());
    if (this.periodoActivo() === 'personalizado') {
      if (this.fechaDesde()) params = params.set('desde', this.fechaDesde());
      if (this.fechaHasta()) params = params.set('hasta', this.fechaHasta());
    }
    if (this.filtroEmpleadoId()) {
      params = params.set('empleadoId', this.filtroEmpleadoId());
    }

    this.http.get<RespuestaApi<RespuestaEmpleadosAdmin>>(`${environment.apiUrl}/admin/empleados`, { params }).subscribe({
      next: ({ data }) => {
        this.empleados.set(data.empleados ?? []);
        this.asistencias.set(data.asistencias ?? []);
        if (data.resumen) this.resumen.set(data.resumen);

        // Seleccionar por defecto el primer empleado activo si no hay ninguno elegido
        if (!this.fichajeEmpleadoId() && data.empleados?.length) {
          const primeroActivo = data.empleados.find((e) => e.activo) ?? data.empleados[0];
          this.fichajeEmpleadoId.set(primeroActivo.id);
        }
        this.cargando.set(false);
      },
      error: (err: unknown) => {
        this.cargando.set(false);
        this.notificaciones.mostrar(mensajeDeError(err, 'No se pudieron cargar los empleados'));
      },
    });
  }

  seleccionarPeriodo(p: PeriodoAsistencia): void {
    this.periodoActivo.set(p);
    if (p !== 'personalizado') {
      this.cargarDatos();
    }
  }

  /* ------------------------ Acciones de Empleados ------------------------ */
  abrirNuevoEmpleado(): void {
    this.editandoEmpleadoId.set(null);
    this.empNombre.set('');
    this.empRol.set('Cocinero/a');
    this.empTelefono.set('');
    this.empDni.set('');
    this.empSueldoHora.set(3500);
    this.empActivo.set(true);
    this.modalEmpleadoAbierto.set(true);
  }

  abrirEditarEmpleado(e: EmpleadoLocal): void {
    this.editandoEmpleadoId.set(e.id);
    this.empNombre.set(e.nombre);
    this.empRol.set(e.rol);
    this.empTelefono.set(e.telefono);
    this.empDni.set(e.dni);
    this.empSueldoHora.set(e.sueldoHora);
    this.empActivo.set(e.activo);
    this.modalEmpleadoAbierto.set(true);
  }

  guardarEmpleado(): void {
    const nombre = this.empNombre().trim();
    if (!nombre) {
      this.notificaciones.mostrar('Ingresá el nombre del empleado');
      return;
    }

    const payload = {
      nombre,
      rol: this.empRol().trim() || 'General',
      telefono: this.empTelefono().trim(),
      dni: this.empDni().trim(),
      sueldoHora: Math.max(0, Number(this.empSueldoHora()) || 0),
      activo: this.empActivo(),
    };

    this.guardandoEmpleado.set(true);
    const id = this.editandoEmpleadoId();
    const peticion = id
      ? this.http.put<RespuestaApi<EmpleadoLocal>>(`${environment.apiUrl}/admin/empleados/${id}`, payload)
      : this.http.post<RespuestaApi<EmpleadoLocal>>(`${environment.apiUrl}/admin/empleados`, payload);

    peticion.subscribe({
      next: () => {
        this.guardandoEmpleado.set(false);
        this.modalEmpleadoAbierto.set(false);
        this.notificaciones.mostrar(id ? 'Empleado actualizado' : 'Empleado dado de alta');
        this.cargarDatos();
      },
      error: (err: unknown) => {
        this.guardandoEmpleado.set(false);
        this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo guardar el empleado'));
      },
    });
  }

  eliminarEmpleado(e: EmpleadoLocal): void {
    if (!confirm(`¿Eliminar a ${e.nombre} y su historial de asistencia?`)) return;
    this.http.delete(`${environment.apiUrl}/admin/empleados/${e.id}`).subscribe({
      next: () => {
        this.notificaciones.mostrar('Empleado eliminado');
        this.cargarDatos();
      },
      error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo eliminar el empleado')),
    });
  }

  /* ------------------------ Acciones de Fichaje y Asistencia ------------------------ */
  registrarJornada(soloEntradaAhora = false): void {
    const empleadoId = Number(this.fichajeEmpleadoId());
    if (!empleadoId) {
      this.notificaciones.mostrar('Seleccioná un empleado primero');
      return;
    }

    const horaEntrada = soloEntradaAhora ? this.horaActualHm() : this.fichajeEntrada();
    const horaSalida = soloEntradaAhora ? null : (this.fichajeSalida() || null);

    if (!horaEntrada) {
      this.notificaciones.mostrar('Indicá el horario de entrada');
      return;
    }

    this.guardandoFichaje.set(true);
    this.http
      .post<RespuestaApi<AsistenciaLocal>>(`${environment.apiUrl}/admin/asistencias`, {
        empleadoId,
        fecha: soloEntradaAhora ? this.hoyIso() : (this.fichajeFecha() || this.hoyIso()),
        horaEntrada,
        horaSalida,
        notas: this.fichajeNotas().trim() || null,
      })
      .subscribe({
        next: ({ data }) => {
          this.guardandoFichaje.set(false);
          this.fichajeSalida.set('');
          this.fichajeNotas.set('');
          this.notificaciones.mostrar(
            data.horaSalida
              ? `✅ Jornada registrada: ${data.horasTrabajadas} hs · Paga: $${Math.round(data.totalPaga).toLocaleString('es-AR')}`
              : `🟢 Entrada registrada a las ${data.horaEntrada} para ${data.empleadoNombre}`,
          );
          this.cargarDatos();
        },
        error: (err: unknown) => {
          this.guardandoFichaje.set(false);
          this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo registrar el horario'));
        },
      });
  }

  marcarSalidaAhora(a: AsistenciaLocal): void {
    this.http
      .put<RespuestaApi<AsistenciaLocal>>(`${environment.apiUrl}/admin/asistencias/${a.id}`, {
        marcarSalidaAhora: true,
      })
      .subscribe({
        next: ({ data }) => {
          this.notificaciones.mostrar(
            `🔴 Salida de ${data.empleadoNombre} (${data.horaSalida}): ${data.horasTrabajadas} hs · Paga del día: $${Math.round(data.totalPaga).toLocaleString('es-AR')}`,
          );
          this.cargarDatos();
        },
        error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo registrar la salida')),
      });
  }

  iniciarEdicionAsistencia(a: AsistenciaLocal): void {
    this.editandoAsistenciaId.set(a.id);
    this.editAsistenciaEntrada.set(a.horaEntrada);
    this.editAsistenciaSalida.set(a.horaSalida || this.horaActualHm());
    this.editAsistenciaNotas.set(a.notas || '');
  }

  guardarEdicionAsistencia(a: AsistenciaLocal): void {
    this.http
      .put<RespuestaApi<AsistenciaLocal>>(`${environment.apiUrl}/admin/asistencias/${a.id}`, {
        horaEntrada: this.editAsistenciaEntrada(),
        horaSalida: this.editAsistenciaSalida() || null,
        notas: this.editAsistenciaNotas().trim() || null,
      })
      .subscribe({
        next: ({ data }) => {
          this.editandoAsistenciaId.set(null);
          this.notificaciones.mostrar(
            `Horario actualizado: ${data.horasTrabajadas} hs · $${Math.round(data.totalPaga).toLocaleString('es-AR')}`,
          );
          this.cargarDatos();
        },
        error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo actualizar el horario')),
      });
  }

  alternarPagoAsistencia(a: AsistenciaLocal): void {
    this.http
      .patch<RespuestaApi<AsistenciaLocal>>(`${environment.apiUrl}/admin/asistencias/${a.id}/pago`, {})
      .subscribe({
        next: ({ data }) => {
          this.asistencias.update((lista) => lista.map((item) => (item.id === a.id ? data : item)));
          this.notificaciones.mostrar(
            data.pagado
              ? `✅ Jornal de ${data.empleadoNombre} marcado como PAGADO`
              : `⏳ Jornal de ${data.empleadoNombre} marcado como PENDIENTE`,
          );
          this.cargarDatos();
        },
        error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo actualizar el estado de pago')),
      });
  }

  eliminarAsistencia(a: AsistenciaLocal): void {
    if (!confirm(`¿Eliminar el registro de horario de ${a.empleadoNombre} del ${a.fecha}?`)) return;
    this.http.delete(`${environment.apiUrl}/admin/asistencias/${a.id}`).subscribe({
      next: () => {
        this.notificaciones.mostrar('Registro eliminado');
        this.cargarDatos();
      },
      error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo eliminar el registro')),
    });
  }

  exportarAsistenciasCsv(): void {
    const nombreLocal = this.localAdmin.perfil().nombre || 'Local';
    const r = this.resumen();
    const escCsv = (val: unknown): string => `"${String(val ?? '').replace(/"/g, '""')}"`;

    const filas: string[] = [];
    filas.push(['PLANILLA DE ASISTENCIA Y JORNALES - ' + nombreLocal.toUpperCase(), ''].map(escCsv).join(';'));
    filas.push(['Total horas trabajadas', r.totalHoras].map(escCsv).join(';'));
    filas.push(['Total a pagar ($)', Math.round(r.totalPaga)].map(escCsv).join(';'));
    filas.push(['Ya pagado ($)', Math.round(r.totalPagado)].map(escCsv).join(';'));
    filas.push(['Pendiente de pago ($)', Math.round(r.totalPendiente)].map(escCsv).join(';'));
    filas.push('');
    filas.push(['FECHA', 'EMPLEADO', 'ROL', 'HORA ENTRADA', 'HORA SALIDA', 'HORAS TRABAJADAS', 'VALOR HORA ($)', 'PAGA DEL DÍA ($)', 'ESTADO PAGO', 'NOTAS'].map(escCsv).join(';'));

    for (const a of this.asistencias()) {
      filas.push([
        a.fecha,
        a.empleadoNombre,
        a.empleadoRol,
        a.horaEntrada,
        a.horaSalida || 'En turno',
        a.horasTrabajadas,
        Math.round(a.valorHora),
        Math.round(a.totalPaga),
        a.pagado ? 'PAGADO' : 'PENDIENTE',
        a.notas,
      ].map(escCsv).join(';'));
    }

    const contenidoCsv = '\uFEFF' + filas.join('\r\n');
    const blob = new Blob([contenidoCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `asistencia-personal-${this.periodoActivo()}-${this.hoyIso()}.csv`;
    enlace.click();
    URL.revokeObjectURL(url);
    this.notificaciones.mostrar('Planilla de asistencia exportada a Excel (.CSV)');
  }

  formatearFechaCorta(ymd: string): string {
    if (!ymd) return '';
    const [a, m, d] = ymd.split('-').map(Number);
    const f = new Date(a, (m || 1) - 1, d || 1);
    return f.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit' });
  }

  private calcularHorasLocal(entrada: string, salida: string): number {
    const [hE, mE] = entrada.split(':').map(Number);
    const [hS, mS] = salida.split(':').map(Number);
    if (isNaN(hE) || isNaN(mE) || isNaN(hS) || isNaN(mS)) return 0;

    const minE = hE * 60 + mE;
    let minS = hS * 60 + mS;
    if (minS < minE) minS += 24 * 60;
    return Math.round(((minS - minE) / 60) * 100) / 100;
  }

  private hoyIso(): string {
    const d = new Date();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mes}-${dia}`;
  }

  private horaActualHm(): string {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
}
