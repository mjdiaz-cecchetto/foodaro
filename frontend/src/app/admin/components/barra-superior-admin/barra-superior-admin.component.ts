import { Component, computed, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AlternarTemaComponente } from '../../../shared/components/alternar-tema/alternar-tema.component';
import { ModalComponente } from '../../../shared/components/modal/modal.component';
import { PrecioPipe } from '../../../shared/pipes/precio.pipe';
import { NotificacionesServicio } from '../../../core/services/notificaciones.service';
import { LocalServicio } from '../../../core/services/local.service';
import { AutenticacionServicio } from '../../../auth/services/autenticacion.service';
import { LocalAdminServicio, PagoSuscripcionLocal } from '../../services/local-admin.service';
import { mensajeDeError } from '../../../shared/utils/api';
import { WHATSAPP_VENTAS_FOODARO } from '../../../platform/mocks/landing.mock';

/**
 * Encabezado fijo del panel admin: nombre del local a la izquierda, botones de
 * Pausa Rápida (Cerrar por hoy / Pausar envíos), Mi Cuenta y Suscripción, y controles de sesión.
 */
@Component({
  selector: 'app-barra-superior-admin',
  standalone: true,
  imports: [ReactiveFormsModule, AlternarTemaComponente, ModalComponente, PrecioPipe],
  templateUrl: './barra-superior-admin.component.html',
  styleUrl: './barra-superior-admin.component.scss',
})
export class BarraSuperiorAdminComponente {
  private readonly fb = inject(FormBuilder);
  private readonly notificaciones = inject(NotificacionesServicio);
  private readonly local = inject(LocalServicio);
  private readonly localAdmin = inject(LocalAdminServicio);
  private readonly autenticacion = inject(AutenticacionServicio);

  readonly alternarMenu = output<void>();
  readonly cerrarSesion = output<void>();

  readonly perfil = this.localAdmin.perfil;
  readonly configuracion = this.localAdmin.configuracion;
  readonly suscripcion = this.localAdmin.suscripcion;
  readonly usuario = this.autenticacion.usuario;
  readonly enlaceCarta = computed(() => this.local.ruta('pedido'));

  readonly cerradoTemporalmente = computed(() => !!this.configuracion().cerradoTemporalmente);
  readonly enviosPausados = computed(() => !!this.configuracion().enviosPausados);
  readonly actualizandoPausa = signal(false);

  /* ------------------------ Modal Mi Cuenta y Suscripción (Punto 7) ------------------------ */
  readonly modalMiCuentaAbierto = signal(false);
  readonly cargandoMiCuenta = signal(false);
  readonly guardandoMiCuenta = signal(false);
  readonly pagosSuscripcion = signal<PagoSuscripcionLocal[]>([]);

  readonly formMiCuenta = this.fb.nonNullable.group({
    nombre: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    contraseniaActual: [''],
    nuevaContrasenia: [''],
    confirmarContrasenia: [''],
  });

  readonly enlaceRenovarWhatsapp = computed(() => {
    const nombreLocal = this.perfil().nombre || 'mi comercio';
    const planNombre = this.suscripcion()?.planNombre || 'Foodaro';
    const msg = encodeURIComponent(
      `Hola Foodaro! Te escribo desde el panel de "${nombreLocal}" (${planNombre}) para consultar / abonar mi suscripción.`,
    );
    return `https://wa.me/${WHATSAPP_VENTAS_FOODARO}?text=${msg}`;
  });

  abrirMiCuenta(): void {
    const u = this.usuario();
    this.formMiCuenta.reset({
      nombre: u?.nombre ?? '',
      email: u?.email ?? '',
      contraseniaActual: '',
      nuevaContrasenia: '',
      confirmarContrasenia: '',
    });
    this.modalMiCuentaAbierto.set(true);
    this.cargandoMiCuenta.set(true);

    this.localAdmin.obtenerMiCuenta().subscribe({
      next: (datos) => {
        this.cargandoMiCuenta.set(false);
        this.pagosSuscripcion.set(datos.pagos ?? []);
        this.formMiCuenta.patchValue({
          nombre: datos.usuario.nombre,
          email: datos.usuario.email,
        });
      },
      error: () => {
        this.cargandoMiCuenta.set(false);
      },
    });
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
    if (v.nuevaContrasenia) {
      if (!v.contraseniaActual) {
        this.notificaciones.mostrar('Ingresá tu contraseña actual para poder cambiarla');
        return;
      }
      if (v.nuevaContrasenia.length < 4) {
        this.notificaciones.mostrar('La nueva contraseña debe tener al menos 4 caracteres');
        return;
      }
      if (v.nuevaContrasenia !== v.confirmarContrasenia) {
        this.notificaciones.mostrar('La confirmación de la nueva contraseña no coincide');
        return;
      }
    }

    this.guardandoMiCuenta.set(true);
    this.localAdmin
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
          this.notificaciones.mostrar('Tus datos de acceso fueron actualizados correctamente');
        },
        error: (err: unknown) => {
          this.guardandoMiCuenta.set(false);
          this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo actualizar tu cuenta'));
        },
      });
  }

  etiquetaEstadoSuscripcion(estado?: string): string {
    switch (estado) {
      case 'prueba':
        return 'En prueba gratis';
      case 'por_vencer':
        return 'Por vencer';
      case 'vencido':
        return 'Vencido';
      default:
        return 'Al día';
    }
  }

  claseEstadoSuscripcion(estado?: string): string {
    switch (estado) {
      case 'prueba':
        return 'bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30';
      case 'por_vencer':
        return 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30';
      case 'vencido':
        return 'bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-300 border-red-200 dark:border-red-500/30';
      default:
        return 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30';
    }
  }

  alternarCierreTemporal(): void {
    if (this.actualizandoPausa()) return;
    const nuevoEstado = !this.cerradoTemporalmente();
    this.actualizandoPausa.set(true);
    this.localAdmin.alternarPausaRapida({ cerradoTemporalmente: nuevoEstado }).subscribe({
      next: () => {
        this.actualizandoPausa.set(false);
        this.notificaciones.mostrar(
          nuevoEstado
            ? '⏸️ Local cerrado por hoy (Pausa rápida activada)'
            : '✅ Local reabierto según tu horario habitual',
        );
      },
      error: (err: unknown) => {
        this.actualizandoPausa.set(false);
        this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo cambiar el estado del local'));
      },
    });
  }

  alternarPausaEnvios(): void {
    if (this.actualizandoPausa()) return;
    const nuevoEstado = !this.enviosPausados();
    this.actualizandoPausa.set(true);
    this.localAdmin.alternarPausaRapida({ enviosPausados: nuevoEstado }).subscribe({
      next: () => {
        this.actualizandoPausa.set(false);
        this.notificaciones.mostrar(
          nuevoEstado
            ? '🛵 Envíos a domicilio pausados (solo Retiro en local)'
            : '🛵 Envíos a domicilio reactivados',
        );
      },
      error: (err: unknown) => {
        this.actualizandoPausa.set(false);
        this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo cambiar el estado de envíos'));
      },
    });
  }

  alAlternarTema(oscuro: boolean): void {
    this.notificaciones.mostrar(`Modo ${oscuro ? 'Oscuro' : 'Claro'} activado`);
  }
}
