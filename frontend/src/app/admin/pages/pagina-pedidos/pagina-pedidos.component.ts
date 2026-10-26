import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

import { environment } from '../../../../environments/environment';
import { ConfiguracionLocal, PerfilLocal } from '../../../shared/models';
import { PrecioPipe } from '../../../shared/pipes/precio.pipe';
import { mensajeDeError, RespuestaApi } from '../../../shared/utils/api';
import { NotificacionesServicio } from '../../../core/services/notificaciones.service';
import { LocalAdminServicio } from '../../services/local-admin.service';
import { EncabezadoPaginaComponente } from '../../components/encabezado-pagina/encabezado-pagina.component';

export type EstadoPedidoAdmin =
  | 'pendiente'
  | 'confirmado'
  | 'en_preparacion'
  | 'listo'
  | 'entregado'
  | 'cancelado';

export type PeriodoVentas = 'hoy' | 'ayer' | 'semana' | 'mes' | 'personalizado' | 'todos';

export interface ItemPedidoAdmin {
  id: number;
  productoId: number | null;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  total: number;
  notas: string;
  opciones: { grupoNombre: string; etiqueta: string; precioAdicional: number }[];
}

export interface PedidoAdmin {
  id: number;
  numero: number;
  estado: EstadoPedidoAdmin;
  modoEntrega: 'retiro' | 'envio';
  cliente: { nombre: string; telefono: string };
  direccion: { calle: string; pisoDepto: string; referencia: string } | null;
  medioPago: 'transferencia' | 'debito' | 'efectivo';
  montoEfectivo: number | null;
  comentarios: string;
  codigoPromo: string | null;
  totales: {
    cantidadTotal: number;
    subtotal: number;
    descuento: number;
    cargoServicio: number;
    costoEnvio: number;
    total: number;
  };
  items: ItemPedidoAdmin[];
  creadoEn: string;
}

export interface ResumenCortoPeriodo {
  monto: number;
  pedidos: number;
  cancelados: number;
}

export interface VentaDiaria {
  fecha: string;
  pedidos: number;
  efectivo: number;
  transferencia: number;
  debito: number;
  total: number;
}

export interface MetricasPedidosAdmin {
  comparativa: {
    hoy: ResumenCortoPeriodo;
    semana: ResumenCortoPeriodo;
    mes: ResumenCortoPeriodo;
  };
  arqueo: {
    totalVendido: number;
    pedidosValidos: number;
    pedidosCancelados: number;
    pedidosEnCurso: number;
    ticketPromedio: number;
    porMedioPago: {
      efectivo: { monto: number; cantidad: number };
      transferencia: { monto: number; cantidad: number };
      debito: { monto: number; cantidad: number };
    };
    porModoEntrega: {
      envio: { monto: number; cantidad: number; costoEnviosCobrado: number };
      retiro: { monto: number; cantidad: number };
    };
    ventasPorDia: VentaDiaria[];
  };
}

type PestaniaPedidos = 'recibidos' | 'configuracion';

/** Vista de Pedidos del local: control prolijo de ventas (día/semana/mes), arqueo de caja y configuración de envíos/pagos. */
@Component({
  selector: 'app-pagina-pedidos',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, PrecioPipe, EncabezadoPaginaComponente],
  templateUrl: './pagina-pedidos.component.html',
})
export class PaginaPedidosComponente implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly localAdmin = inject(LocalAdminServicio);
  private readonly notificaciones = inject(NotificacionesServicio);

  private readonly inicial = this.localAdmin.perfil();
  private readonly configInicial = this.localAdmin.configuracion();

  readonly pestania = signal<PestaniaPedidos>('recibidos');

  /* ------------------------ Filtros y Métricas de Ventas ------------------------ */
  readonly pedidos = signal<PedidoAdmin[]>([]);
  readonly metricas = signal<MetricasPedidosAdmin>({
    comparativa: {
      hoy: { monto: 0, pedidos: 0, cancelados: 0 },
      semana: { monto: 0, pedidos: 0, cancelados: 0 },
      mes: { monto: 0, pedidos: 0, cancelados: 0 },
    },
    arqueo: {
      totalVendido: 0,
      pedidosValidos: 0,
      pedidosCancelados: 0,
      pedidosEnCurso: 0,
      ticketPromedio: 0,
      porMedioPago: {
        efectivo: { monto: 0, cantidad: 0 },
        transferencia: { monto: 0, cantidad: 0 },
        debito: { monto: 0, cantidad: 0 },
      },
      porModoEntrega: {
        envio: { monto: 0, cantidad: 0, costoEnviosCobrado: 0 },
        retiro: { monto: 0, cantidad: 0 },
      },
      ventasPorDia: [],
    },
  });

  readonly cargandoPedidos = signal(false);
  readonly periodoActivo = signal<PeriodoVentas>('mes');
  readonly fechaDesde = signal('');
  readonly fechaHasta = signal('');
  readonly filtroEstado = signal<'todos' | EstadoPedidoAdmin>('todos');
  readonly mostrarDesgloseDiario = signal(false);

  readonly periodosDisponibles: { valor: PeriodoVentas; etiqueta: string }[] = [
    { valor: 'hoy', etiqueta: 'Hoy' },
    { valor: 'ayer', etiqueta: 'Ayer' },
    { valor: 'semana', etiqueta: 'Esta semana' },
    { valor: 'mes', etiqueta: 'Este mes' },
    { valor: 'personalizado', etiqueta: 'Elegir fechas' },
    { valor: 'todos', etiqueta: 'Todo el historial' },
  ];

  readonly pedidosFiltrados = computed(() => {
    const f = this.filtroEstado();
    if (f === 'todos') return this.pedidos();
    return this.pedidos().filter((p) => p.estado === f);
  });

  readonly estadosDisponibles: { valor: EstadoPedidoAdmin; etiqueta: string }[] = [
    { valor: 'pendiente', etiqueta: 'Pendiente' },
    { valor: 'confirmado', etiqueta: 'Confirmado' },
    { valor: 'en_preparacion', etiqueta: 'En preparación' },
    { valor: 'listo', etiqueta: 'Listo' },
    { valor: 'entregado', etiqueta: 'Entregado' },
    { valor: 'cancelado', etiqueta: 'Cancelado' },
  ];

  /* -------------------- Configuración de Envíos y WhatsApp ------------------- */
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

  ngOnInit(): void {
    this.cargarPedidos();
  }

  seleccionarPeriodo(periodo: PeriodoVentas): void {
    this.periodoActivo.set(periodo);
    if (periodo !== 'personalizado') {
      this.cargarPedidos();
    }
  }

  aplicarRangoFechas(): void {
    this.cargarPedidos();
  }

  cargarPedidos(): void {
    this.cargandoPedidos.set(true);

    let params = new HttpParams().set('periodo', this.periodoActivo());
    if (this.periodoActivo() === 'personalizado') {
      if (this.fechaDesde()) params = params.set('desde', this.fechaDesde());
      if (this.fechaHasta()) params = params.set('hasta', this.fechaHasta());
    }

    this.http
      .get<RespuestaApi<MetricasPedidosAdmin>>(`${environment.apiUrl}/admin/pedidos/metricas`, { params })
      .subscribe({
        next: ({ data }) => {
          if (data) this.metricas.set(data);
        },
      });

    this.http.get<RespuestaApi<PedidoAdmin[]>>(`${environment.apiUrl}/admin/pedidos`, { params }).subscribe({
      next: ({ data }) => {
        this.pedidos.set(data ?? []);
        this.cargandoPedidos.set(false);
      },
      error: () => {
        this.cargandoPedidos.set(false);
      },
    });
  }

  cambiarEstadoPedido(pedido: PedidoAdmin, estado: EstadoPedidoAdmin): void {
    this.http
      .patch<RespuestaApi<PedidoAdmin>>(`${environment.apiUrl}/admin/pedidos/${pedido.id}/estado`, { estado })
      .subscribe({
        next: ({ data }) => {
          this.pedidos.update((lista) => lista.map((p) => (p.id === pedido.id ? data : p)));
          this.notificaciones.mostrar(`Pedido #${this.formatearNumero(pedido.numero)}: ${this.etiquetaEstado(estado)}`);
          // Refrescamos métricas por si pasó a/desde cancelado o cambió pedidos en curso
          this.cargarPedidos();
        },
        error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo actualizar el estado')),
      });
  }

  formatearNumero(n: number): string {
    return String(n).padStart(4, '0');
  }

  formatearFecha(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatearFechaDia(ymd: string): string {
    if (!ymd) return '';
    const [anio, mes, dia] = ymd.split('-').map(Number);
    const fecha = new Date(anio, (mes || 1) - 1, dia || 1);
    return fecha.toLocaleDateString('es-AR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
  }

  etiquetaPeriodoActivo(): string {
    return this.periodosDisponibles.find((p) => p.valor === this.periodoActivo())?.etiqueta ?? 'Período';
  }

  etiquetaEstado(estado: EstadoPedidoAdmin): string {
    return this.estadosDisponibles.find((e) => e.valor === estado)?.etiqueta ?? estado;
  }

  claseEstado(estado: EstadoPedidoAdmin): string {
    switch (estado) {
      case 'pendiente':
        return 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30';
      case 'confirmado':
      case 'en_preparacion':
        return 'bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/30';
      case 'listo':
      case 'entregado':
        return 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30';
      case 'cancelado':
        return 'bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30';
    }
  }

  enlaceWhatsAppCliente(telefono: string): string {
    const digitos = (telefono || '').replace(/\D/g, '');
    return `https://wa.me/${digitos}`;
  }

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
