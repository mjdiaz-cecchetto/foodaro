import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ModalComponente } from '../../../compartido/componentes/modal/modal.componente';
import { PrecioPipe } from '../../../compartido/pipes/precio.pipe';
import { NotificacionesServicio } from '../../../nucleo/servicios/notificaciones.servicio';
import { CarritoServicio } from '../../servicios/carrito.servicio';
import { PedidoServicio } from '../../servicios/pedido.servicio';
import { UiClienteServicio } from '../../servicios/ui-cliente.servicio';
import { LocalPublicoServicio } from '../../servicios/local-publico.servicio';
import { BorradorPedido, ETIQUETAS_MEDIO_PAGO, ETIQUETAS_MODO_ENTREGA, MedioPago, ModoEntrega } from '../../interfaces';
import { ResumenTotalesComponente } from '../resumen-totales/resumen-totales.componente';

type Paso = 1 | 2 | 3 | 4;

/**
 * Confirmación del pedido en 4 pasos: entrega → datos → pago → revisión.
 * Al confirmar arma el BorradorPedido y lo envía al WhatsApp del local.
 */
@Component({
  selector: 'app-modal-confirmar-pedido',
  standalone: true,
  imports: [ReactiveFormsModule, ModalComponente, PrecioPipe, ResumenTotalesComponente],
  templateUrl: './modal-confirmar-pedido.componente.html',
  styleUrl: './modal-confirmar-pedido.componente.scss',
})
export class ModalConfirmarPedidoComponente {
  private readonly fb = inject(FormBuilder);
  private readonly notificaciones = inject(NotificacionesServicio);
  private readonly pedidoServicio = inject(PedidoServicio);
  private readonly localPublico = inject(LocalPublicoServicio);
  readonly ui = inject(UiClienteServicio);
  readonly carrito = inject(CarritoServicio);

  readonly ETIQUETAS_ENTREGA = ETIQUETAS_MODO_ENTREGA;
  readonly ETIQUETAS_PAGO = ETIQUETAS_MEDIO_PAGO;

  readonly mediosPago: { id: MedioPago; icono: string; detalle: string }[] = [
    { id: 'transferencia', icono: 'fa-building-columns', detalle: 'Te pasamos el alias por WhatsApp' },
    { id: 'debito', icono: 'fa-credit-card', detalle: 'Pagás con tarjeta al recibir / retirar' },
    { id: 'efectivo', icono: 'fa-money-bill-wave', detalle: 'Pagás al recibir / retirar' },
  ];

  readonly paso = signal<Paso>(1);
  readonly enviando = signal(false);
  readonly enviado = signal(false);

  readonly titulosPaso: Record<Paso, string> = {
    1: '¿Cómo lo recibís?',
    2: 'Tus datos',
    3: '¿Cómo pagás?',
    4: 'Revisá tu pedido',
  };

  readonly formulario = this.fb.nonNullable.group({
    modoEntrega: this.fb.nonNullable.control<ModoEntrega>('retiro', Validators.required),
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    telefono: ['', [Validators.required, Validators.pattern(/^[\d\s+()-]{8,}$/)]],
    calle: [''],
    pisoDepto: [''],
    referencia: [''],
    medioPago: this.fb.nonNullable.control<MedioPago>('transferencia', Validators.required),
    montoEfectivo: this.fb.control<number | null>(null),
    comentarios: [''],
  });

  readonly modoEntrega = signal<ModoEntrega>('retiro');
  readonly medioPago = signal<MedioPago>('transferencia');

  readonly esEnvio = computed(() => this.modoEntrega() === 'envio');
  readonly nombreLocal = computed(() => this.localPublico.perfil().nombre);
  readonly direccionLocal = computed(() => this.localPublico.perfil().direccion);

  constructor() {
    this.formulario.controls.modoEntrega.valueChanges.subscribe((v) => {
      this.modoEntrega.set(v);
      const calle = this.formulario.controls.calle;
      calle.setValidators(v === 'envio' ? [Validators.required, Validators.minLength(4)] : []);
      calle.updateValueAndValidity();
    });
    this.formulario.controls.medioPago.valueChanges.subscribe((v) => this.medioPago.set(v));

    // Al abrir, se reinicia al primer paso
    effect(() => {
      if (this.ui.confirmacionAbierta()) {
        this.paso.set(1);
        this.enviado.set(false);
        this.enviando.set(false);
      }
    });
  }

  /** Clases Tailwind de los inputs del formulario (con estado de error). */
  claseCampo(conError = false): string {
    const base =
      'w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-dark-card border text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition';
    return `${base} ${conError ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-gray-200/80 dark:border-dark-border'}`;
  }

  elegirEntrega(modo: ModoEntrega): void {
    this.formulario.controls.modoEntrega.setValue(modo);
  }

  elegirPago(medio: MedioPago): void {
    this.formulario.controls.medioPago.setValue(medio);
  }

  /** Valida solo los controles del paso actual antes de avanzar. */
  puedeAvanzar(): boolean {
    const c = this.formulario.controls;
    switch (this.paso()) {
      case 1:
        return c.modoEntrega.valid;
      case 2:
        return c.nombre.valid && c.telefono.valid && (!this.esEnvio() || c.calle.valid);
      case 3:
        return c.medioPago.valid;
      default:
        return this.formulario.valid;
    }
  }

  siguiente(): void {
    if (!this.puedeAvanzar()) {
      this.marcarPasoTocado();
      return;
    }
    this.paso.update((p) => (p < 4 ? ((p + 1) as Paso) : p));
  }

  anterior(): void {
    this.paso.update((p) => (p > 1 ? ((p - 1) as Paso) : p));
  }

  invalido(nombre: 'nombre' | 'telefono' | 'calle'): boolean {
    const c = this.formulario.controls[nombre];
    return c.invalid && c.touched;
  }

  confirmar(): void {
    if (!this.formulario.valid || this.carrito.estaVacio()) return;
    this.enviando.set(true);
    const pedido = this.armarPedido();
    this.pedidoServicio.enviarPorWhatsApp(pedido);
    this.enviado.set(true);
    this.enviando.set(false);
    this.notificaciones.mostrar('¡Pedido enviado! Te esperamos en WhatsApp');
  }

  finalizar(): void {
    this.carrito.vaciar();
    this.carrito.promoActiva.set(null);
    this.formulario.reset();
    this.cerrar();
  }

  cerrar(): void {
    this.ui.cerrarConfirmacion();
  }

  private armarPedido(): BorradorPedido {
    const v = this.formulario.getRawValue();
    return {
      items: this.carrito.items(),
      totales: this.carrito.totales(),
      codigoPromo: this.carrito.promoActiva()?.codigo ?? null,
      modoEntrega: v.modoEntrega,
      cliente: { nombre: v.nombre.trim(), telefono: v.telefono.trim() },
      direccion:
        v.modoEntrega === 'envio'
          ? { calle: v.calle.trim(), pisoDepto: v.pisoDepto.trim(), referencia: v.referencia.trim() }
          : null,
      medioPago: v.medioPago,
      montoEfectivo: v.medioPago === 'efectivo' && v.montoEfectivo ? Number(v.montoEfectivo) : null,
      comentarios: v.comentarios.trim(),
    };
  }

  private marcarPasoTocado(): void {
    const c = this.formulario.controls;
    if (this.paso() === 2) {
      c.nombre.markAsTouched();
      c.telefono.markAsTouched();
      c.calle.markAsTouched();
    }
  }
}
