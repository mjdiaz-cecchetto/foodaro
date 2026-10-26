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
  EstadoSuscripcion,
  LocalRoot,
  PlanRoot,
  RootServicio,
  UsuarioRoot,
} from '../../services/root.service';

type PestaniaRoot = 'locales' | 'usuarios' | 'planes';
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

  readonly formLocal = this.fb.nonNullable.group({
    nombre: ['', [Validators.required]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    rubro: ['Restaurante & Bar'],
    whatsapp: ['+54 9 ', [Validators.required]],
    direccion: [''],
    planId: [null as number | null],
    estadoSuscripcion: ['al_dia' as EstadoSuscripcion, [Validators.required]],
    vencimientoSuscripcion: [this.fechaMasUnMes()],
    activo: [true],
    // Solo para alta de local nuevo:
    adminNombre: [''],
    adminEmail: [''],
    adminContrasenia: [''],
  });

  abrirNuevoLocal(): void {
    const planPorDefecto = this.root.planes().find((p) => p.destacado)?.id ?? this.root.planes()[0]?.id ?? null;
    this.localEditando.set(null);
    this.formLocal.reset({
      nombre: '',
      slug: '',
      rubro: 'Restaurante & Bar',
      whatsapp: '+54 9 ',
      direccion: '',
      planId: planPorDefecto,
      estadoSuscripcion: 'al_dia',
      vencimientoSuscripcion: this.fechaMasUnMes(),
      activo: true,
      adminNombre: '',
      adminEmail: '',
      adminContrasenia: '',
    });
    this.modalLocalAbierto.set(true);
  }

  abrirEditarLocal(local: LocalRoot): void {
    this.localEditando.set(local);
    this.formLocal.reset({
      nombre: local.nombre,
      slug: local.slug,
      rubro: local.rubro,
      whatsapp: local.whatsapp,
      direccion: local.direccion,
      planId: local.planId,
      estadoSuscripcion: local.estadoSuscripcion,
      vencimientoSuscripcion: local.vencimientoSuscripcion ?? this.fechaMasUnMes(),
      activo: local.activo,
      adminNombre: '',
      adminEmail: '',
      adminContrasenia: '',
    });
    this.modalLocalAbierto.set(true);
  }

  cerrarModalLocal(): void {
    this.modalLocalAbierto.set(false);
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
        })
        .subscribe({
          next: () => {
            this.guardandoLocal.set(false);
            this.modalLocalAbierto.set(false);
            this.notificaciones.mostrar('¡Nuevo local creado con éxito!');
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

  eliminarPlan(plan: PlanRoot): void {
    if (!confirm(`¿Eliminar el plan "${plan.nombre}"?`)) return;
    this.root.eliminarPlan(plan.id).subscribe({
      next: () => this.notificaciones.mostrar('Plan eliminado'),
      error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo eliminar el plan')),
    });
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

  private fechaMasUnMes(): string {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  }
}
