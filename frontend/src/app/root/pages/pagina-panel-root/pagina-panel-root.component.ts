import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { RootAutenticacionServicio } from '../../services/root-autenticacion.service';
import { NotificacionesServicio } from '../../../core/services/notificaciones.service';
import { AlternarTemaComponente } from '../../../shared/components/alternar-tema/alternar-tema.component';
import { LogoComponente } from '../../../shared/components/logo/logo.component';
import { ModalComponente } from '../../../shared/components/modal/modal.component';
import { PrecioPipe } from '../../../shared/pipes/precio.pipe';
import { mensajeDeError } from '../../../shared/utils/api';
import {
  EstadoSolicitudAlta,
  EstadoSuscripcion,
  LocalRoot,
  MedioPagoSuscripcion,
  PagoSuscripcionRoot,
  PlanRoot,
  RootServicio,
  SolicitudAltaRoot,
  UsuarioRoot,
} from '../../services/root.service';

type PestaniaRoot = 'locales' | 'solicitudes' | 'cobros' | 'usuarios' | 'planes' | 'actividad';
type FiltroLocales = 'todos' | 'activos' | 'pausados' | 'alerta';

@Component({
  selector: 'app-pagina-panel-root',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    LogoComponente,
    AlternarTemaComponente,
    ModalComponente,
    PrecioPipe,
  ],
  templateUrl: './pagina-panel-root.component.html',
})
export class PaginaPanelRootComponente {
  readonly root = inject(RootServicio);
  readonly autenticacion = inject(RootAutenticacionServicio);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly notificaciones = inject(NotificacionesServicio);

  readonly pestania = signal<PestaniaRoot>('locales');

  /* ------------------------------ Filtros Locales ------------------------------ */
  readonly busquedaLocal = signal('');
  readonly filtroEstadoLocal = signal<FiltroLocales>('todos');

  readonly localesFiltrados = computed(() => {
    const q = this.busquedaLocal().trim().toLowerCase();
    const f = this.filtroEstadoLocal();

    return this.root.locales().filter((l) => {
      if (f === 'activos' && !l.activo) return false;
      if (f === 'pausados' && l.activo) return false;
      if (f === 'alerta' && l.estadoSuscripcion === 'al_dia') return false;
      if (!q) return true;
      return (
        l.nombre.toLowerCase().includes(q) ||
        l.slug.toLowerCase().includes(q) ||
        l.rubro.toLowerCase().includes(q) ||
        l.planNombre.toLowerCase().includes(q)
      );
    });
  });

  /* ------------------------------ Filtros Usuarios ------------------------------ */
  readonly busquedaUsuario = signal('');
  readonly filtroLocalUsuario = signal<number | 'todos'>('todos');

  readonly usuariosFiltrados = computed(() => {
    const q = this.busquedaUsuario().trim().toLowerCase();
    const localId = this.filtroLocalUsuario();

    return this.root.usuarios().filter((u) => {
      if (localId !== 'todos' && u.localId !== localId) return false;
      if (!q) return true;
      return (
        u.nombre.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.localNombre ?? '').toLowerCase().includes(q)
      );
    });
  });

  /* ------------------------------ Modal Local (Crear / Editar) ------------------------------ */
  readonly modalLocalAbierto = signal(false);
  readonly localEditando = signal<LocalRoot | null>(null);
  readonly guardandoLocal = signal(false);
  readonly solicitudOrigenId = signal<number | null>(null);

  readonly formLocal = this.fb.nonNullable.group({
    nombre: ['', [Validators.required]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    rubro: ['Restaurante & Bar'],
    whatsapp: ['+54 9 ', [Validators.required]],
    direccion: [''],
    planId: [null as number | null],
    estadoSuscripcion: ['prueba' as EstadoSuscripcion, [Validators.required]],
    vencimientoSuscripcion: [this.fechaMasTreintaDias()],
    activo: [true],
    // Solo para alta de local nuevo:
    adminNombre: [''],
    adminEmail: [''],
    adminContrasenia: [''],
  });

  abrirNuevoLocal(): void {
    const planPorDefecto = this.root.planes().find((p) => p.destacado)?.id ?? this.root.planes()[0]?.id ?? null;
    this.localEditando.set(null);
    this.solicitudOrigenId.set(null);
    this.formLocal.reset({
      nombre: '',
      slug: '',
      rubro: 'Restaurante & Bar',
      whatsapp: '+54 9 ',
      direccion: '',
      planId: planPorDefecto,
      estadoSuscripcion: 'prueba',
      vencimientoSuscripcion: this.fechaMasTreintaDias(),
      activo: true,
      adminNombre: '',
      adminEmail: '',
      adminContrasenia: '',
    });
    this.modalLocalAbierto.set(true);
  }

  /** Abre el modal de Alta de Local con todos los datos pre-cargados desde una Solicitud de la Landing y 30 días de prueba gratis. */
  abrirAltaDesdeSolicitud(sol: SolicitudAltaRoot): void {
    const slugBase = sol.nombreComercio
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 40);

    const planCoincidente =
      sol.planId ??
      this.root.planes().find((p) => p.nombre.toLowerCase() === sol.planNombre.toLowerCase())?.id ??
      this.root.planes().find((p) => p.destacado)?.id ??
      this.root.planes()[0]?.id ??
      null;

    this.localEditando.set(null);
    this.solicitudOrigenId.set(sol.id);
    this.formLocal.reset({
      nombre: sol.nombreComercio,
      slug: slugBase,
      rubro: 'Gastronomía & Comercio',
      whatsapp: sol.whatsapp,
      direccion: sol.ciudad || '',
      planId: planCoincidente,
      estadoSuscripcion: 'prueba',
      vencimientoSuscripcion: this.fechaMasTreintaDias(),
      activo: true,
      adminNombre: `Admin ${sol.nombreComercio}`,
      adminEmail: slugBase ? `admin@${slugBase}.com` : '',
      adminContrasenia: '123456',
    });
    this.modalLocalAbierto.set(true);
  }

  abrirEditarLocal(local: LocalRoot): void {
    this.localEditando.set(local);
    this.solicitudOrigenId.set(null);
    this.formLocal.reset({
      nombre: local.nombre,
      slug: local.slug,
      rubro: local.rubro,
      whatsapp: local.whatsapp,
      direccion: local.direccion,
      planId: local.planId,
      estadoSuscripcion: local.estadoSuscripcion,
      vencimientoSuscripcion: local.vencimientoSuscripcion ?? this.fechaMasTreintaDias(),
      activo: local.activo,
      adminNombre: '',
      adminEmail: '',
      adminContrasenia: '',
    });
    this.modalLocalAbierto.set(true);
  }

  cerrarModalLocal(): void {
    this.modalLocalAbierto.set(false);
    this.solicitudOrigenId.set(null);
  }

  sugerirSlugDesdeNombre(): void {
    if (this.localEditando()) return;
    const nombre = this.formLocal.controls.nombre.value;
    const slug = nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 40);
    this.formLocal.controls.slug.setValue(slug);
    if (!this.formLocal.controls.adminEmail.dirty && slug) {
      this.formLocal.controls.adminEmail.setValue(`admin@${slug}.com`);
    }
  }

  guardarLocal(): void {
    if (this.formLocal.invalid || this.guardandoLocal()) {
      this.formLocal.markAllAsTouched();
      return;
    }

    const v = this.formLocal.getRawValue();
    const editando = this.localEditando();
    this.guardandoLocal.set(true);

    if (editando) {
      this.root
        .actualizarLocal(editando.id, {
          nombre: v.nombre,
          slug: v.slug,
          rubro: v.rubro,
          whatsapp: v.whatsapp,
          direccion: v.direccion,
          planId: v.planId ? Number(v.planId) : null,
          estadoSuscripcion: v.estadoSuscripcion,
          vencimientoSuscripcion: v.vencimientoSuscripcion || null,
          activo: v.activo,
        })
        .subscribe({
          next: () => {
            this.guardandoLocal.set(false);
            this.modalLocalAbierto.set(false);
            this.notificaciones.mostrar('Local y suscripción actualizados');
          },
          error: (err: unknown) => {
            this.guardandoLocal.set(false);
            this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo actualizar el local'));
          },
        });
    } else {
      this.root
        .crearLocal({
          nombre: v.nombre,
          slug: v.slug,
          rubro: v.rubro,
          whatsapp: v.whatsapp,
          direccion: v.direccion,
          planId: v.planId ? Number(v.planId) : null,
          estadoSuscripcion: v.estadoSuscripcion,
          vencimientoSuscripcion: v.vencimientoSuscripcion || null,
          activo: v.activo,
          adminNombre: v.adminNombre || undefined,
          adminEmail: v.adminEmail || undefined,
          adminContrasenia: v.adminContrasenia || undefined,
          solicitudId: this.solicitudOrigenId(),
        })
        .subscribe({
          next: () => {
            this.guardandoLocal.set(false);
            this.modalLocalAbierto.set(false);
            this.solicitudOrigenId.set(null);
            this.notificaciones.mostrar('¡Nuevo local creado con éxito (30 días de prueba activados)!');
          },
          error: (err: unknown) => {
            this.guardandoLocal.set(false);
            this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo crear el local'));
          },
        });
    }
  }

  alternarEstadoLocal(local: LocalRoot): void {
    this.root.alternarEstadoLocal(local.id).subscribe({
      next: (actualizado) => {
        this.notificaciones.mostrar(
          actualizado.activo ? `Local "${actualizado.nombre}" activado` : `Local "${actualizado.nombre}" pausado`,
        );
      },
      error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo cambiar el estado')),
    });
  }

  eliminarLocal(local: LocalRoot): void {
    if (!confirm(`¿Eliminar el local "${local.nombre}" (${local.slug}) y todos sus datos? Esta acción no se puede deshacer.`)) {
      return;
    }
    this.root.eliminarLocal(local.id).subscribe({
      next: () => this.notificaciones.mostrar('Local eliminado'),
      error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo eliminar el local')),
    });
  }

  verUsuariosDeLocal(local: LocalRoot): void {
    this.filtroLocalUsuario.set(local.id);
    this.pestania.set('usuarios');
  }

  /* ------------------------------ Modal Usuario (Crear / Editar / Contraseña) ------------------------------ */
  readonly modalUsuarioAbierto = signal(false);
  readonly usuarioEditando = signal<UsuarioRoot | null>(null);
  readonly guardandoUsuario = signal(false);

  readonly formUsuario = this.fb.nonNullable.group({
    nombre: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    contrasenia: [''],
    rol: ['administrador' as 'administrador' | 'superadmin', [Validators.required]],
    localId: [null as number | null],
    activo: [true],
  });

  readonly modalClaveAbierto = signal(false);
  readonly usuarioClave = signal<UsuarioRoot | null>(null);
  readonly nuevaClave = signal('');
  readonly guardandoClave = signal(false);

  abrirNuevoUsuario(localIdPreseleccionado: number | null = null): void {
    const idLocal = localIdPreseleccionado ?? this.root.locales()[0]?.id ?? null;
    this.usuarioEditando.set(null);
    this.formUsuario.reset({
      nombre: '',
      email: '',
      contrasenia: '',
      rol: 'administrador',
      localId: idLocal,
      activo: true,
    });
    this.modalUsuarioAbierto.set(true);
  }

  abrirEditarUsuario(u: UsuarioRoot): void {
    this.usuarioEditando.set(u);
    this.formUsuario.reset({
      nombre: u.nombre,
      email: u.email,
      contrasenia: '',
      rol: u.rol,
      localId: u.localId,
      activo: u.activo,
    });
    this.modalUsuarioAbierto.set(true);
  }

  cerrarModalUsuario(): void {
    this.modalUsuarioAbierto.set(false);
  }

  guardarUsuario(): void {
    if (this.formUsuario.invalid || this.guardandoUsuario()) {
      this.formUsuario.markAllAsTouched();
      return;
    }

    const v = this.formUsuario.getRawValue();
    const editando = this.usuarioEditando();

    if (!editando && !v.contrasenia.trim()) {
      this.notificaciones.mostrar('Ingresá una contraseña inicial para el usuario');
      return;
    }

    this.guardandoUsuario.set(true);
    const payload = {
      nombre: v.nombre,
      email: v.email,
      contrasenia: v.contrasenia.trim() || undefined,
      rol: v.rol,
      localId: v.localId ? Number(v.localId) : null,
      activo: v.activo,
    };

    const obs = editando
      ? this.root.actualizarUsuario(editando.id, payload)
      : this.root.crearUsuario(payload);

    obs.subscribe({
      next: () => {
        this.guardandoUsuario.set(false);
        this.modalUsuarioAbierto.set(false);
        this.notificaciones.mostrar(editando ? 'Usuario actualizado' : 'Usuario creado');
      },
      error: (err: unknown) => {
        this.guardandoUsuario.set(false);
        this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo guardar el usuario'));
      },
    });
  }

  abrirModalClave(u: UsuarioRoot): void {
    this.usuarioClave.set(u);
    this.nuevaClave.set('');
    this.modalClaveAbierto.set(true);
  }

  cerrarModalClave(): void {
    this.modalClaveAbierto.set(false);
  }

  confirmarCambioClave(): void {
    const u = this.usuarioClave();
    const clave = this.nuevaClave().trim();
    if (!u || clave.length < 4 || this.guardandoClave()) {
      this.notificaciones.mostrar('La contraseña debe tener al menos 4 caracteres');
      return;
    }

    this.guardandoClave.set(true);
    this.root.cambiarContraseniaUsuario(u.id, clave).subscribe({
      next: () => {
        this.guardandoClave.set(false);
        this.modalClaveAbierto.set(false);
        this.notificaciones.mostrar(`Contraseña de ${u.email} actualizada`);
      },
      error: (err: unknown) => {
        this.guardandoClave.set(false);
        this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo cambiar la contraseña'));
      },
    });
  }

  alternarEstadoUsuario(u: UsuarioRoot): void {
    this.root.alternarEstadoUsuario(u.id).subscribe({
      next: (act) => this.notificaciones.mostrar(act.activo ? 'Usuario activado' : 'Usuario desactivado'),
      error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo cambiar el estado')),
    });
  }

  eliminarUsuario(u: UsuarioRoot): void {
    if (!confirm(`¿Eliminar el usuario "${u.nombre}" (${u.email})?`)) return;
    this.root.eliminarUsuario(u.id).subscribe({
      next: () => this.notificaciones.mostrar('Usuario eliminado'),
      error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo eliminar el usuario')),
    });
  }

  /* ------------------------------ Modal Planes (Crear / Editar) ------------------------------ */
  readonly modalPlanAbierto = signal(false);
  readonly planEditando = signal<PlanRoot | null>(null);
  readonly guardandoPlan = signal(false);

  readonly formPlan = this.fb.nonNullable.group({
    nivel: ['Gestión Activa', [Validators.required]],
    nombre: ['', [Validators.required]],
    mensual: [29900, [Validators.required, Validators.min(0)]],
    anual: [23900, [Validators.required, Validators.min(0)]],
    descripcion: [''],
    caracteristicasTexto: ['', [Validators.required]],
    cta: ['Elegir Plan', [Validators.required]],
    destacado: [false],
    activo: [true],
  });

  abrirNuevoPlan(): void {
    this.planEditando.set(null);
    this.formPlan.reset({
      nivel: 'Profesional',
      nombre: '',
      mensual: 29900,
      anual: 23900,
      descripcion: '',
      caracteristicasTexto: 'Catálogo digital interactivo con QR y Link\nPedidos directos a tu WhatsApp\nPanel Administrador del comercio',
      cta: 'Elegir Plan',
      destacado: false,
      activo: true,
    });
    this.modalPlanAbierto.set(true);
  }

  abrirEditarPlan(plan: PlanRoot): void {
    this.planEditando.set(plan);
    this.formPlan.reset({
      nivel: plan.nivel,
      nombre: plan.nombre,
      mensual: plan.mensual,
      anual: plan.anual,
      descripcion: plan.descripcion,
      caracteristicasTexto: plan.caracteristicas.join('\n'),
      cta: plan.cta,
      destacado: plan.destacado,
      activo: plan.activo,
    });
    this.modalPlanAbierto.set(true);
  }

  cerrarModalPlan(): void {
    this.modalPlanAbierto.set(false);
  }

  guardarPlan(): void {
    if (this.formPlan.invalid || this.guardandoPlan()) {
      this.formPlan.markAllAsTouched();
      return;
    }

    const v = this.formPlan.getRawValue();
    const caracteristicas = v.caracteristicasTexto
      .split('\n')
      .map((linea) => linea.trim())
      .filter((linea) => linea.length > 0);

    if (!caracteristicas.length) {
      this.notificaciones.mostrar('Ingresá al menos una característica para el plan');
      return;
    }

    const payload = {
      nivel: v.nivel,
      nombre: v.nombre,
      mensual: Number(v.mensual) || 0,
      anual: Number(v.anual) || 0,
      descripcion: v.descripcion,
      caracteristicas,
      cta: v.cta,
      destacado: v.destacado,
      activo: v.activo,
    };

    const editando = this.planEditando();
    this.guardandoPlan.set(true);

    const obs = editando
      ? this.root.actualizarPlan(editando.id, payload)
      : this.root.crearPlan(payload);

    obs.subscribe({
      next: () => {
        this.guardandoPlan.set(false);
        this.modalPlanAbierto.set(false);
        this.notificaciones.mostrar(editando ? 'Plan actualizado' : 'Plan creado');
      },
      error: (err: unknown) => {
        this.guardandoPlan.set(false);
        this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo guardar el plan'));
      },
    });
  }

  alternarEstadoPlan(plan: PlanRoot): void {
    this.root.alternarEstadoPlan(plan.id).subscribe({
      next: (actualizado) =>
        this.notificaciones.mostrar(
          actualizado.activo
            ? `Plan "${actualizado.nombre}" reactivado y visible en la landing`
            : `Plan "${actualizado.nombre}" pausado (oculto en la landing)`,
        ),
      error: (err: unknown) =>
        this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo cambiar el estado del plan')),
    });
  }

  eliminarPlan(plan: PlanRoot): void {
    if (!confirm(`¿Eliminar el plan "${plan.nombre}"?`)) return;
    this.root.eliminarPlan(plan.id).subscribe({
      next: () => this.notificaciones.mostrar('Plan eliminado'),
      error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo eliminar el plan')),
    });
  }

  /* ------------------------------ Cobros de Suscripciones (Modal y Listado) ------------------------------ */
  readonly filtroLocalCobro = signal<number | 'todos'>('todos');
  readonly modalPagoAbierto = signal(false);
  readonly guardandoPago = signal(false);

  readonly pagosFiltrados = computed(() => {
    const localId = this.filtroLocalCobro();
    return this.root.pagos().filter((pg) => (localId === 'todos' ? true : pg.localId === localId));
  });

  readonly formPago = this.fb.nonNullable.group({
    localId: [0, [Validators.required, Validators.min(1)]],
    planId: [null as number | null],
    periodoMeses: [1, [Validators.required, Validators.min(1), Validators.max(24)]],
    monto: [0, [Validators.required, Validators.min(0)]],
    medioPago: ['transferencia' as MedioPagoSuscripcion, [Validators.required]],
    fechaPago: [new Date().toISOString().slice(0, 10), [Validators.required]],
    referencia: [''],
  });

  abrirRegistrarPago(local?: LocalRoot): void {
    const localObjetivo = local ?? this.root.locales()[0] ?? null;
    const planId = localObjetivo?.planId ?? this.root.planes()[0]?.id ?? null;
    const plan = this.root.planes().find((p) => p.id === planId);
    const montoSugerido = plan ? plan.mensual : localObjetivo?.planMensual ?? 0;

    this.formPago.reset({
      localId: localObjetivo?.id ?? 0,
      planId,
      periodoMeses: 1,
      monto: montoSugerido,
      medioPago: 'transferencia',
      fechaPago: new Date().toISOString().slice(0, 10),
      referencia: '',
    });
    this.modalPagoAbierto.set(true);
  }

   cerrarModalPago(): void {
    this.modalPagoAbierto.set(false);
  }

  alCambiarLocalEnPago(localId: number): void {
    const loc = this.root.locales().find((l) => l.id === Number(localId));
    if (loc) {
      this.formPago.patchValue({ planId: loc.planId });
      this.recalcularMontoSugeridoPago();
    }
  }

  recalcularMontoSugeridoPago(): void {
    const v = this.formPago.getRawValue();
    const plan = this.root.planes().find((p) => p.id === Number(v.planId));
    if (!plan) return;
    const meses = Math.max(1, Number(v.periodoMeses) || 1);
    const tarifaMensual = meses >= 12 && plan.anual > 0 ? plan.anual : plan.mensual;
    this.formPago.patchValue({ monto: Math.round(tarifaMensual * meses) });
  }

  guardarPago(): void {
    if (this.formPago.invalid || this.guardandoPago()) {
      this.formPago.markAllAsTouched();
      return;
    }

    const v = this.formPago.getRawValue();
    this.guardandoPago.set(true);

    this.root
      .registrarPago({
        localId: Number(v.localId),
        planId: v.planId ? Number(v.planId) : null,
        periodoMeses: Number(v.periodoMeses) || 1,
        monto: Number(v.monto) || 0,
        medioPago: v.medioPago,
        fechaPago: v.fechaPago,
        referencia: v.referencia,
      })
      .subscribe({
        next: (pago) => {
          this.guardandoPago.set(false);
          this.modalPagoAbierto.set(false);
          this.notificaciones.mostrar(
            `Cobro registrado · Nuevo vencimiento de ${pago.localNombre}: ${pago.vencimientoNuevo}`,
          );
        },
        error: (err: unknown) => {
          this.guardandoPago.set(false);
          this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo registrar el cobro'));
        },
      });
  }

  eliminarPago(pago: PagoSuscripcionRoot): void {
    if (!confirm(`¿Eliminar el registro de cobro de "${pago.localNombre}" por $${pago.monto}?`)) return;
    this.root.eliminarPago(pago.id).subscribe({
      next: () => this.notificaciones.mostrar('Registro de cobro eliminado'),
      error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo eliminar el cobro')),
    });
  }

  verCobrosDeLocal(local: LocalRoot): void {
    this.filtroLocalCobro.set(local.id);
    this.pestania.set('cobros');
  }

  /* ------------------------------ E. Registro de Actividad ------------------------------ */
  readonly filtroActividad = signal<'todos' | 'recientes' | 'inactivos'>('todos');

  readonly resumenActividad = computed(() => {
    const locales = this.root.locales();
    const inactivos = locales.filter((l) => (l.diasSinActividad ?? 0) >= 7).length;
    const recientes = locales.length - inactivos;
    const usuariosConAcceso = this.root.usuarios().filter((u) => !!u.ultimoAccesoEn).length;
    return { recientes, inactivos, usuariosConAcceso };
  });

  readonly localesActividadFiltrados = computed(() => {
    const f = this.filtroActividad();
    return this.root
      .locales()
      .filter((l) => {
        const dias = l.diasSinActividad ?? 0;
        if (f === 'inactivos') return dias >= 7;
        if (f === 'recientes') return dias < 7;
        return true;
      })
      .slice()
      .sort((a, b) => (b.diasSinActividad ?? 0) - (a.diasSinActividad ?? 0));
  });

  readonly usuariosRecientes = computed(() =>
    this.root
      .usuarios()
      .slice()
      .sort((a, b) => (b.ultimoAccesoEn ?? '').localeCompare(a.ultimoAccesoEn ?? '')),
  );

  /* ------------------------------ F. Mi Cuenta Root ------------------------------ */
  readonly modalMiCuentaAbierto = signal(false);
  readonly guardandoMiCuenta = signal(false);

  readonly usuariosSuperadmin = computed(() =>
    this.root.usuarios().filter((u) => u.rol === 'superadmin'),
  );

  readonly formMiCuenta = this.fb.nonNullable.group({
    nombre: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    contraseniaActual: [''],
    nuevaContrasenia: [''],
  });

  abrirMiCuenta(): void {
    const u = this.autenticacion.usuario();
    this.formMiCuenta.reset({
      nombre: u?.nombre ?? 'Root Foodaro',
      email: u?.email ?? 'root@foodaro.com',
      contraseniaActual: '',
      nuevaContrasenia: '',
    });
    this.modalMiCuentaAbierto.set(true);
  }

  cerrarMiCuenta(): void {
    this.modalMiCuentaAbierto.set(false);
  }

  guardarMiCuenta(): void {
    if (this.formMiCuenta.invalid || this.guardandoMiCuenta()) {
      this.formMiCuenta.markAllAsTouched();
      return;
    }

    const v = this.formMiCuenta.getRawValue();
    if (v.nuevaContrasenia && !v.contraseniaActual) {
      this.notificaciones.mostrar('Ingresá tu contraseña actual para poder cambiarla');
      return;
    }

    this.guardandoMiCuenta.set(true);
    this.root
      .actualizarMiCuenta({
        nombre: v.nombre,
        email: v.email,
        contraseniaActual: v.contraseniaActual || undefined,
        nuevaContrasenia: v.nuevaContrasenia || undefined,
      })
      .subscribe({
        next: () => {
          this.guardandoMiCuenta.set(false);
          this.modalMiCuentaAbierto.set(false);
          this.notificaciones.mostrar('Tu cuenta Root fue actualizada correctamente');
        },
        error: (err: unknown) => {
          this.guardandoMiCuenta.set(false);
          this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo actualizar tu cuenta Root'));
        },
      });
  }

  abrirNuevoSuperadmin(): void {
    this.modalMiCuentaAbierto.set(false);
    this.usuarioEditando.set(null);
    this.formUsuario.reset({
      nombre: '',
      email: '',
      contrasenia: '',
      rol: 'superadmin',
      localId: null,
      activo: true,
    });
    this.modalUsuarioAbierto.set(true);
  }

  /* ------------------------------ Bandeja de Solicitudes desde la Landing (D) ------------------------------ */
  readonly filtroEstadoSolicitud = signal<'todas' | EstadoSolicitudAlta>('todas');

  readonly solicitudesFiltradas = computed(() => {
    const f = this.filtroEstadoSolicitud();
    return this.root.solicitudes().filter((s) => (f === 'todas' ? true : s.estado === f));
  });

  readonly conteoSolicitudes = computed(() => {
    const lista = this.root.solicitudes();
    return {
      todas: lista.length,
      nuevas: lista.filter((s) => s.estado === 'nuevo').length,
      contactadas: lista.filter((s) => s.estado === 'contactado').length,
      altas: lista.filter((s) => s.estado === 'alta').length,
      descartadas: lista.filter((s) => s.estado === 'descartado').length,
    };
  });

  cambiarEstadoSolicitud(sol: SolicitudAltaRoot, estado: EstadoSolicitudAlta): void {
    this.root.actualizarSolicitud(sol.id, { estado }).subscribe({
      next: () => this.notificaciones.mostrar(`Solicitud de "${sol.nombreComercio}" marcada como ${this.etiquetaEstadoSolicitud(estado)}`),
      error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo actualizar la solicitud')),
    });
  }

  guardarNotaSolicitud(sol: SolicitudAltaRoot, notas: string): void {
    if (notas.trim() === (sol.notas ?? '').trim()) return;
    this.root.actualizarSolicitud(sol.id, { notas: notas.trim() }).subscribe({
      next: () => this.notificaciones.mostrar('Nota de seguimiento guardada'),
      error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo guardar la nota')),
    });
  }

  eliminarSolicitud(sol: SolicitudAltaRoot): void {
    if (!confirm(`¿Eliminar la solicitud de "${sol.nombreComercio}"?`)) return;
    this.root.eliminarSolicitud(sol.id).subscribe({
      next: () => this.notificaciones.mostrar('Solicitud eliminada'),
      error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo eliminar la solicitud')),
    });
  }

  urlWhatsappSolicitud(sol: SolicitudAltaRoot): string {
    const digitos = (sol.whatsapp || '').replace(/\D+/g, '');
    const msg = encodeURIComponent(
      `Hola! Te escribimos de Foodaro por tu solicitud para "${sol.nombreComercio}" (${sol.planNombre}). ¡Ya estamos listos para activarte tus 30 días de prueba gratis!`,
    );
    return `https://wa.me/${digitos}?text=${msg}`;
  }

  etiquetaEstadoSolicitud(estado: EstadoSolicitudAlta): string {
    switch (estado) {
      case 'nuevo':
        return 'Nuevo';
      case 'contactado':
        return 'Contactado';
      case 'alta':
        return 'Dado de alta';
      case 'descartado':
        return 'Descartado';
    }
  }

  claseEstadoSolicitud(estado: EstadoSolicitudAlta): string {
    switch (estado) {
      case 'nuevo':
        return 'bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-500/30';
      case 'contactado':
        return 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30';
      case 'alta':
        return 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30';
      case 'descartado':
        return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700';
    }
  }

  /* ------------------------------ Utilidades UI ------------------------------ */

  etiquetaSuscripcion(estado: EstadoSuscripcion): string {
    switch (estado) {
      case 'al_dia':
        return 'Al día';
      case 'prueba':
        return 'En prueba';
      case 'por_vencer':
        return 'Por vencer';
      case 'vencido':
        return 'Vencido';
    }
  }

  claseSuscripcion(estado: EstadoSuscripcion): string {
    switch (estado) {
      case 'al_dia':
        return 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30';
      case 'prueba':
        return 'bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/30';
      case 'por_vencer':
        return 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30';
      case 'vencido':
        return 'bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30';
    }
  }

  cerrarSesion(): void {
    this.autenticacion.cerrarSesion().subscribe(() => {
      this.root.cargado.set(false);
      this.router.navigateByUrl('/root/login');
    });
  }

  private fechaMasTreintaDias(): string {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  }
}
