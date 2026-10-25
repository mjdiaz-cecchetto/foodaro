import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

import { ConfiguracionLocal, PerfilLocal } from '../../../shared/models';
import { mensajeDeError } from '../../../shared/utils/api';
import { NotificacionesServicio } from '../../../core/services/notificaciones.service';
import { LocalAdminServicio } from '../../services/local-admin.service';
import { EncabezadoPaginaComponente } from '../../components/encabezado-pagina/encabezado-pagina.component';

/** Configuración operativa de pedidos: WhatsApp receptor, costos de envío, alias de transferencia y cargos. */
@Component({
  selector: 'app-pagina-pedidos',
  standalone: true,
  imports: [ReactiveFormsModule, EncabezadoPaginaComponente],
  templateUrl: './pagina-pedidos.component.html',
})
export class PaginaPedidosComponente {
  private readonly fb = inject(FormBuilder);
  private readonly localAdmin = inject(LocalAdminServicio);
  private readonly notificaciones = inject(NotificacionesServicio);

  private readonly inicial = this.localAdmin.perfil();
  private readonly configInicial = this.localAdmin.configuracion();

  readonly formulario = this.fb.nonNullable.group({
    whatsappPedidos: [this.inicial.contacto.whatsappPedidos, [Validators.required, Validators.pattern(/^[\d\s()+-]{6,}$/)]],
    costoEnvio: [this.configInicial.costoEnvio ?? 0, [Validators.min(0)]],
    montoMinimoEnvio: [this.configInicial.montoMinimoEnvio ?? 0, [Validators.min(0)]],
    aliasTransferencia: [this.configInicial.aliasTransferencia ?? ''],
    titularTransferencia: [this.configInicial.titularTransferencia ?? ''],
    cargoServicio: [this.configInicial.cargoServicio ?? 0, [Validators.min(0)]],
    etiquetaCargoServicio: [this.configInicial.etiquetaCargoServicio ?? 'Servicio / empaque'],
  });

  private readonly valorFormulario = toSignal(this.formulario.valueChanges, { initialValue: this.formulario.getRawValue() });
  readonly guardando = signal(false);

  /** Enlace wa.me para probar el número de pedidos tal como lo usa la carta. */
  readonly enlacePruebaPedidos = computed(() => {
    const v = this.valorFormulario();
    const digitos = (v.whatsappPedidos || '').replace(/\D/g, '');
    const nombreLocal = this.localAdmin.perfil().nombre;
    return digitos.length >= 6
      ? `https://wa.me/${digitos}?text=${encodeURIComponent('Prueba de Foodaro: a este número llegan los pedidos de ' + nombreLocal)}`
      : null;
  });

  readonly claseCampo =
    'w-full bg-zinc-50/90 dark:bg-surface-cardDark border border-zinc-300 dark:border-surface-borderDark rounded-xl px-3.5 py-2 text-xs sm:text-[13px] font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:bg-white dark:focus:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition';

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.notificaciones.mostrar('Ingresá un número válido para recibir los pedidos por WhatsApp');
      return;
    }

    const base = this.localAdmin.perfil();
    const v = this.formulario.getRawValue();

    const perfilActualizado: PerfilLocal = {
      ...base,
      contacto: {
        ...base.contacto,
        whatsappPedidos: v.whatsappPedidos.trim(),
      },
    };

    const configActualizada: Partial<ConfiguracionLocal> = {
      costoEnvio: Math.max(0, Number(v.costoEnvio) || 0),
      montoMinimoEnvio: Math.max(0, Number(v.montoMinimoEnvio) || 0),
      aliasTransferencia: v.aliasTransferencia.trim(),
      titularTransferencia: v.titularTransferencia.trim(),
      cargoServicio: Math.max(0, Number(v.cargoServicio) || 0),
      etiquetaCargoServicio: v.etiquetaCargoServicio.trim() || 'Servicio / empaque',
    };

    this.guardando.set(true);
    this.localAdmin.guardar(perfilActualizado, configActualizada).subscribe({
      next: () => {
        this.guardando.set(false);
        this.notificaciones.mostrar('Configuración de pedidos actualizada');
      },
      error: (err: unknown) => {
        this.guardando.set(false);
        this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo guardar la configuración'));
      },
    });
  }
}
