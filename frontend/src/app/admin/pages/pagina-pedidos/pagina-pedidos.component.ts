import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
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
export type ModoVistaPedidos = 'lista' | 'tablero';

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
  pagado: boolean;
  pagadoEn?: string | null;
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
    cobrado?: { monto: number; cantidad: number };
    pendienteCobro?: { monto: number; cantidad: number };
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

/** Vista de Pedidos del local: consola en vivo con alerta sonora, comanda térmica 58/80mm, arqueo de caja y configuración. */
@Component({
  selector: 'app-pagina-pedidos',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, PrecioPipe, EncabezadoPaginaComponente],
  templateUrl: './pagina-pedidos.component.html',
})
export class PaginaPedidosComponente implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly localAdmin = inject(LocalAdminServicio);
  private readonly notificaciones = inject(NotificacionesServicio);

  private readonly inicial = this.localAdmin.perfil();
  private readonly configInicial = this.localAdmin.configuracion();

  readonly pestania = signal<PestaniaPedidos>('recibidos');

  /* ------------------------ Pedidos en Vivo y Alerta Sonora ------------------------ */
  readonly enVivo = signal(true);
  readonly sonidoActivo = signal(true);
  readonly modoVista = signal<ModoVistaPedidos>('lista');
  readonly pedidosNuevosIds = signal<number[]>([]);
  readonly ultimaActualizacion = signal<string>('');

  private intervaloRefresco: ReturnType<typeof setInterval> | null = null;
  private maxPedidoIdConocido: number | null = null;
  private audioCtx: AudioContext | null = null;

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
      cobrado: { monto: 0, cantidad: 0 },
      pendienteCobro: { monto: 0, cantidad: 0 },
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
  readonly periodoActivo = signal<PeriodoVentas>('hoy');
  readonly fechaDesde = signal('');
  readonly fechaHasta = signal('');
  readonly filtroEstado = signal<'todos' | EstadoPedidoAdmin>('todos');
  readonly filtroPago = signal<'todos' | 'sin_pagar' | 'pagados'>('todos');
  readonly mostrarDesgloseDiario = signal(false);

  readonly periodosDisponibles: { valor: PeriodoVentas; etiqueta: string }[] = [
    { valor: 'hoy', etiqueta: 'Hoy' },
    { valor: 'ayer', etiqueta: 'Ayer' },
    { valor: 'semana', etiqueta: 'Esta semana' },
    { valor: 'mes', etiqueta: 'Este mes' },
    { valor: 'personalizado', etiqueta: 'Elegir fechas' },
    { valor: 'todos', etiqueta: 'Todo el historial' },
  ];

  readonly conteoPagos = computed(() => {
    const validos = this.pedidos().filter((p) => p.estado !== 'cancelado');
    const pagados = validos.filter((p) => p.pagado);
    const sinPagar = validos.filter((p) => !p.pagado);
    return {
      pagados: pagados.length,
      montoPagados: pagados.reduce((acc, p) => acc + (p.totales?.total ?? 0), 0),
      sinPagar: sinPagar.length,
      montoSinPagar: sinPagar.reduce((acc, p) => acc + (p.totales?.total ?? 0), 0),
    };
  });

  readonly pedidosFiltrados = computed(() => {
    const f = this.filtroEstado();
    const fp = this.filtroPago();
    return this.pedidos().filter((p) => {
      if (f !== 'todos' && p.estado !== f) return false;
      if (fp === 'pagados' && !p.pagado) return false;
      if (fp === 'sin_pagar' && (p.pagado || p.estado === 'cancelado')) return false;
      return true;
    });
  });

  /** Columnas para la vista Tablero (mostrador / cocina). */
  readonly columnasTablero = computed(() => {
    const lista = this.pedidos();
    return [
      {
        id: 'pendientes',
        titulo: 'Nuevos / Pendientes',
        icono: 'fa-bell',
        colorCabecera: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300/60',
        pedidos: lista.filter((p) => p.estado === 'pendiente' || p.estado === 'confirmado'),
        siguienteEstado: 'en_preparacion' as EstadoPedidoAdmin,
        etiquetaSiguiente: 'Pasar a Cocina',
      },
      {
        id: 'preparacion',
        titulo: 'En preparación',
        icono: 'fa-fire-burner',
        colorCabecera: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-300/60',
        pedidos: lista.filter((p) => p.estado === 'en_preparacion'),
        siguienteEstado: 'listo' as EstadoPedidoAdmin,
        etiquetaSiguiente: 'Marcar Listo',
      },
      {
        id: 'listos',
        titulo: 'Listos para entregar',
        icono: 'fa-check-double',
        colorCabecera: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300/60',
        pedidos: lista.filter((p) => p.estado === 'listo'),
        siguienteEstado: 'entregado' as EstadoPedidoAdmin,
        etiquetaSiguiente: 'Entregado',
      },
      {
        id: 'entregados',
        titulo: 'Entregados hoy',
        icono: 'fa-circle-check',
        colorCabecera: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-300/60',
        pedidos: lista.filter((p) => p.estado === 'entregado'),
        siguienteEstado: null,
        etiquetaSiguiente: '',
      },
    ];
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
    this.cargarPedidos(false);
    this.iniciarAutoRefresco();
  }

  ngOnDestroy(): void {
    this.detenerAutoRefresco();
  }

  iniciarAutoRefresco(): void {
    this.detenerAutoRefresco();
    this.intervaloRefresco = setInterval(() => {
      if (this.enVivo() && this.pestania() === 'recibidos') {
        this.cargarPedidos(true);
      }
    }, 15000);
  }

  detenerAutoRefresco(): void {
    if (this.intervaloRefresco) {
      clearInterval(this.intervaloRefresco);
      this.intervaloRefresco = null;
    }
  }

  alternarEnVivo(): void {
    this.enVivo.update((v) => !v);
    if (this.enVivo()) {
      this.cargarPedidos(true);
      this.notificaciones.mostrar('Actualización en vivo activada (cada 15 s)');
    } else {
      this.notificaciones.mostrar('Actualización en vivo en pausa');
    }
  }

  alternarSonido(): void {
    this.sonidoActivo.update((v) => !v);
    if (this.sonidoActivo()) {
      this.reproducirTimbreCocina();
      this.notificaciones.mostrar('Alerta sonora activada');
    } else {
      this.notificaciones.mostrar('Alerta sonora silenciada');
    }
  }

  probarSonido(): void {
    this.reproducirTimbreCocina();
    this.notificaciones.mostrar('🔔 Timbre de cocina probado correctamente');
  }

  /** Doble campana gastronómica generada con Web Audio API (sin depender de archivos externos). */
  reproducirTimbreCocina(): void {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.audioCtx) {
        this.audioCtx = new Ctx();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const tocarCampana = (inicioSeg: number, frecuencia: number) => {
        if (!this.audioCtx) return;
        const ahora = this.audioCtx.currentTime + inicioSeg;
        const osc = this.audioCtx.createOscillator();
        const ganancia = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(frecuencia, ahora);
        osc.frequency.exponentialRampToValueAtTime(frecuencia * 1.005, ahora + 0.35);

        ganancia.gain.setValueAtTime(0.001, ahora);
        ganancia.gain.exponentialRampToValueAtTime(0.35, ahora + 0.02);
        ganancia.gain.exponentialRampToValueAtTime(0.0001, ahora + 0.55);

        osc.connect(ganancia);
        ganancia.connect(this.audioCtx.destination);
        osc.start(ahora);
        osc.stop(ahora + 0.58);
      };

      // Ding - Dong clásico de mostrador (Mi6 -> Do6 -> Mi6)
      tocarCampana(0, 1318.5);
      tocarCampana(0.22, 1046.5);
      tocarCampana(0.48, 1318.5);
    } catch {
      /* Si el navegador bloquea el audio hasta la primera interacción, no interrumpe */
    }
  }

  esPedidoNuevo(id: number): boolean {
    return this.pedidosNuevosIds().includes(id);
  }

  marcarPedidoVisto(id: number): void {
    this.pedidosNuevosIds.update((ids) => ids.filter((x) => x !== id));
  }

  seleccionarPeriodo(periodo: PeriodoVentas): void {
    this.periodoActivo.set(periodo);
    if (periodo !== 'personalizado') {
      this.cargarPedidos(false);
    }
  }

  aplicarRangoFechas(): void {
    this.cargarPedidos(false);
  }

  cargarPedidos(esRefrescoAutomatico = false): void {
    if (!esRefrescoAutomatico) {
      this.cargandoPedidos.set(true);
    }

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
        const lista = data ?? [];
        this.detectarNuevosPedidos(lista, esRefrescoAutomatico);
        this.pedidos.set(lista);
        this.cargandoPedidos.set(false);
        this.ultimaActualizacion.set(
          new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        );
      },
      error: () => {
        this.cargandoPedidos.set(false);
      },
    });
  }

  private detectarNuevosPedidos(lista: PedidoAdmin[], notificar: boolean): void {
    const maxActual = lista.reduce((max, p) => (p.id > max ? p.id : max), 0);

    if (this.maxPedidoIdConocido === null) {
      this.maxPedidoIdConocido = maxActual;
      return;
    }

    if (maxActual > this.maxPedidoIdConocido) {
      const nuevos = lista.filter((p) => p.id > (this.maxPedidoIdConocido ?? 0));
      this.maxPedidoIdConocido = maxActual;

      if (nuevos.length > 0) {
        this.pedidosNuevosIds.update((prev) => [...new Set([...prev, ...nuevos.map((n) => n.id)])]);
        if (notificar) {
          if (this.sonidoActivo()) {
            this.reproducirTimbreCocina();
          }
          const primero = nuevos[0];
          this.notificaciones.mostrar(
            nuevos.length === 1
              ? `🔔 ¡Nuevo pedido #${this.formatearNumero(primero.numero)} de ${primero.cliente.nombre}!`
              : `🔔 ¡Entraron ${nuevos.length} pedidos nuevos!`,
          );
        }
      }
    }
  }

  cambiarEstadoPedido(pedido: PedidoAdmin, estado: EstadoPedidoAdmin): void {
    this.marcarPedidoVisto(pedido.id);
    this.http
      .patch<RespuestaApi<PedidoAdmin>>(`${environment.apiUrl}/admin/pedidos/${pedido.id}/estado`, { estado })
      .subscribe({
        next: ({ data }) => {
          this.pedidos.update((lista) => lista.map((p) => (p.id === pedido.id ? data : p)));
          this.notificaciones.mostrar(`Pedido #${this.formatearNumero(pedido.numero)}: ${this.etiquetaEstado(estado)}`);
          this.cargarPedidos(true);
        },
        error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo actualizar el estado')),
      });
  }

  /** Marca un pedido como Pagado o Sin Pagar en 1 clic. */
  alternarPagoPedido(pedido: PedidoAdmin): void {
    this.marcarPedidoVisto(pedido.id);
    this.http
      .patch<RespuestaApi<PedidoAdmin>>(`${environment.apiUrl}/admin/pedidos/${pedido.id}/pago`, {})
      .subscribe({
        next: ({ data }) => {
          this.pedidos.update((lista) => lista.map((p) => (p.id === pedido.id ? data : p)));
          this.notificaciones.mostrar(
            data.pagado
              ? `✅ Pedido #${this.formatearNumero(pedido.numero)} marcado como PAGADO`
              : `⏳ Pedido #${this.formatearNumero(pedido.numero)} marcado como SIN PAGAR`,
          );
          this.cargarPedidos(true);
        },
        error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo cambiar el estado de pago')),
      });
  }

  /**
   * Imprime la comanda / ticket térmico de cocina (formato 58mm / 80mm) lista para mostrador o cadete.
   */
  imprimirComanda(p: PedidoAdmin): void {
    this.marcarPedidoVisto(p.id);
    const ventana = window.open('', '_blank', 'width=420,height=680');
    if (!ventana) {
      this.notificaciones.mostrar('Habilitá las ventanas emergentes para imprimir la comanda');
      return;
    }

    const nombreLocal = this.localAdmin.perfil().nombre || 'Foodaro';
    const numero = this.formatearNumero(p.numero);
    const fecha = this.formatearFecha(p.creadoEn);
    const fmt = (n: number) => '$' + Math.round(n || 0).toLocaleString('es-AR');

    const modalidad = p.modoEntrega === 'envio' ? 'ENVIO A DOMICILIO' : 'RETIRO EN LOCAL';
    const medioPago = p.medioPago.toUpperCase();

    const direccionHtml =
      p.modoEntrega === 'envio' && p.direccion
        ? `<div class="bloque">
             <div class="titulo-sec">DIRECCION DE ENTREGA</div>
             <div class="grande">${this.escaparHtml(p.direccion.calle)} ${this.escaparHtml(p.direccion.pisoDepto || '')}</div>
             ${p.direccion.referencia ? `<div class="nota">Ref: ${this.escaparHtml(p.direccion.referencia)}</div>` : ''}
           </div>`
        : '';

    const itemsHtml = p.items
      .map((item) => {
        const opciones = (item.opciones || [])
          .map((op) => `<div class="sub">+ ${this.escaparHtml(op.grupoNombre)}: ${this.escaparHtml(op.etiqueta)}</div>`)
          .join('');
        const nota = item.notas ? `<div class="nota-item">NOTA: ${this.escaparHtml(item.notas)}</div>` : '';
        return `
          <div class="item">
            <div class="fila-item">
              <span class="cant">${item.cantidad}x ${this.escaparHtml(item.nombre)}</span>
              <span class="imp">${fmt(item.total)}</span>
            </div>
            ${opciones}
            ${nota}
          </div>
        `;
      })
      .join('');

    const vuelto =
      p.medioPago === 'efectivo' && p.montoEfectivo && p.montoEfectivo > p.totales.total
        ? `<div class="fila"><span>Abona con:</span><span>${fmt(p.montoEfectivo)}</span></div>
           <div class="fila negrita"><span>Vuelto:</span><span>${fmt(p.montoEfectivo - p.totales.total)}</span></div>`
        : '';

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Comanda #${numero} - ${this.escaparHtml(nombreLocal)}</title>
  <style>
    @page { margin: 3mm; size: 80mm auto; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 6px;
      width: 100%;
      max-width: 300px;
      font-size: 12px;
      line-height: 1.35;
    }
    .centro { text-align: center; }
    .local { font-size: 15px; font-weight: 900; text-transform: uppercase; }
    .pedido-num { font-size: 22px; font-weight: 900; margin: 4px 0; }
    .badge-modo {
      display: inline-block;
      border: 2px solid #000;
      padding: 2px 8px;
      font-weight: 900;
      font-size: 13px;
      margin: 4px 0;
    }
    .bloque {
      border-top: 1px dashed #000;
      padding-top: 6px;
      margin-top: 6px;
    }
    .titulo-sec { font-weight: 900; font-size: 11px; margin-bottom: 2px; text-decoration: underline; }
    .grande { font-size: 13px; font-weight: 700; }
    .item { margin-bottom: 6px; }
    .fila-item { display: flex; justify-content: space-between; gap: 6px; font-weight: 900; font-size: 13px; }
    .sub { padding-left: 10px; font-size: 11px; }
    .nota-item {
      margin-top: 2px;
      padding: 2px 4px;
      border: 1px solid #000;
      font-weight: 900;
      font-size: 11px;
    }
    .nota { font-size: 11px; font-style: italic; }
    .fila { display: flex; justify-content: space-between; margin: 2px 0; }
    .total {
      display: flex;
      justify-content: space-between;
      font-size: 16px;
      font-weight: 900;
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
      padding: 4px 0;
      margin: 4px 0;
    }
    .negrita { font-weight: 900; }
    .pie { margin-top: 10px; font-size: 10px; text-align: center; }
  </style>
</head>
<body>
  <div class="centro">
    <div class="local">${this.escaparHtml(nombreLocal)}</div>
    <div>${fecha}</div>
    <div class="pedido-num">PEDIDO #${numero}</div>
    <div class="badge-modo">${modalidad}</div>
  </div>

  <div class="bloque">
    <div class="titulo-sec">CLIENTE</div>
    <div class="grande">${this.escaparHtml(p.cliente.nombre)}</div>
    <div>Tel: ${this.escaparHtml(p.cliente.telefono)}</div>
  </div>

  ${direccionHtml}

  <div class="bloque">
    <div class="titulo-sec">DETALLE DEL PEDIDO</div>
    ${itemsHtml}
  </div>

  ${
    p.comentarios
      ? `<div class="bloque">
           <div class="titulo-sec">OBSERVACIONES</div>
           <div class="nota-item">${this.escaparHtml(p.comentarios)}</div>
         </div>`
      : ''
  }

  <div class="bloque">
    <div class="fila"><span>Subtotal:</span><span>${fmt(p.totales.subtotal)}</span></div>
    ${p.totales.descuento > 0 ? `<div class="fila"><span>Descuento:</span><span>-${fmt(p.totales.descuento)}</span></div>` : ''}
    ${p.totales.cargoServicio > 0 ? `<div class="fila"><span>Servicio/Empaque:</span><span>${fmt(p.totales.cargoServicio)}</span></div>` : ''}
    ${p.totales.costoEnvio > 0 ? `<div class="fila"><span>Envío:</span><span>${fmt(p.totales.costoEnvio)}</span></div>` : ''}
    <div class="total"><span>TOTAL</span><span>${fmt(p.totales.total)}</span></div>
    <div class="fila negrita"><span>MEDIO DE PAGO:</span><span>${medioPago}</span></div>
    <div class="nota-item" style="text-align:center;margin-top:4px;font-size:12px;">
      ${p.pagado ? '✓ PEDIDO PAGADO' : '*** FALTA COBRAR: ' + fmt(p.totales.total) + ' ***'}
    </div>
    ${vuelto}
  </div>

  <div class="pie">Comanda generada por Foodaro</div>
  <script>
    window.onload = function() {
      window.focus();
      window.print();
    };
  </script>
</body>
</html>`;

    ventana.document.open();
    ventana.document.write(html);
    ventana.document.close();
  }

  private escaparHtml(texto: string): string {
    return (texto || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Descarga en 1 clic un archivo CSV (con BOM UTF-8 compatible con Excel en español)
   * con el Resumen del Arqueo de Caja, el desglose día por día y el detalle de pedidos del período.
   */
  exportarCierreCsv(): void {
    const a = this.metricas().arqueo;
    const nombreLocal = this.localAdmin.perfil().nombre || 'Local';
    const periodo = this.etiquetaPeriodoActivo();
    const fechaEmision = new Date().toLocaleString('es-AR');

    const escCsv = (val: unknown): string => {
      const s = String(val ?? '').replace(/"/g, '""');
      return `"${s}"`;
    };

    const filas: string[] = [];
    filas.push(['CIERRE DE CAJA - ' + nombreLocal.toUpperCase(), ''].map(escCsv).join(';'));
    filas.push(['Período', periodo].map(escCsv).join(';'));
    filas.push(['Emitido el', fechaEmision].map(escCsv).join(';'));
    filas.push('');

    filas.push(['RESUMEN GENERAL', 'CANTIDAD', 'MONTO ($)'].map(escCsv).join(';'));
    filas.push(['Total vendido (válidos)', a.pedidosValidos, Math.round(a.totalVendido)].map(escCsv).join(';'));
    filas.push(['Cobrado (pedidos pagados)', a.cobrado?.cantidad ?? 0, Math.round(a.cobrado?.monto ?? 0)].map(escCsv).join(';'));
    filas.push(['Pendiente de cobro (sin pagar)', a.pendienteCobro?.cantidad ?? 0, Math.round(a.pendienteCobro?.monto ?? 0)].map(escCsv).join(';'));
    filas.push(['Ticket promedio', '-', Math.round(a.ticketPromedio)].map(escCsv).join(';'));
    filas.push(['Pedidos en curso', a.pedidosEnCurso, '-'].map(escCsv).join(';'));
    filas.push(['Pedidos cancelados (no suman)', a.pedidosCancelados, 0].map(escCsv).join(';'));
    filas.push('');

    filas.push(['ARQUEO POR MEDIO DE PAGO', 'PEDIDOS', 'MONTO ($)'].map(escCsv).join(';'));
    filas.push(['Efectivo', a.porMedioPago.efectivo.cantidad, Math.round(a.porMedioPago.efectivo.monto)].map(escCsv).join(';'));
    filas.push(['Transferencia', a.porMedioPago.transferencia.cantidad, Math.round(a.porMedioPago.transferencia.monto)].map(escCsv).join(';'));
    filas.push(['Débito / Tarjeta', a.porMedioPago.debito.cantidad, Math.round(a.porMedioPago.debito.monto)].map(escCsv).join(';'));
    filas.push('');

    filas.push(['POR MODALIDAD DE ENTREGA', 'PEDIDOS', 'MONTO ($)'].map(escCsv).join(';'));
    filas.push(['Envío a domicilio', a.porModoEntrega.envio.cantidad, Math.round(a.porModoEntrega.envio.monto)].map(escCsv).join(';'));
    filas.push(['Costo de envíos cobrado', '-', Math.round(a.porModoEntrega.envio.costoEnviosCobrado)].map(escCsv).join(';'));
    filas.push(['Retiro en local', a.porModoEntrega.retiro.cantidad, Math.round(a.porModoEntrega.retiro.monto)].map(escCsv).join(';'));
    filas.push('');

    if (a.ventasPorDia.length > 0) {
      filas.push(['DESGLOSE DÍA POR DÍA', 'PEDIDOS', 'EFECTIVO ($)', 'TRANSFERENCIA ($)', 'DÉBITO ($)', 'TOTAL DÍA ($)'].map(escCsv).join(';'));
      for (const d of a.ventasPorDia) {
        filas.push([
          d.fecha,
          d.pedidos,
          Math.round(d.efectivo),
          Math.round(d.transferencia),
          Math.round(d.debito),
          Math.round(d.total),
        ].map(escCsv).join(';'));
      }
      filas.push('');
    }

    filas.push([
      'NRO PEDIDO',
      'FECHA Y HORA',
      'ESTADO',
      'COBRO',
      'MODALIDAD',
      'MEDIO PAGO',
      'CLIENTE',
      'TELÉFONO',
      'DIRECCIÓN',
      'DETALLE PRODUCTOS',
      'ENVÍO ($)',
      'DESCUENTO ($)',
      'TOTAL ($)',
    ].map(escCsv).join(';'));

    for (const p of this.pedidos()) {
      const detalleItems = p.items.map((i) => `${i.cantidad}x ${i.nombre}`).join(' | ');
      const dir = p.modoEntrega === 'envio' && p.direccion ? `${p.direccion.calle} ${p.direccion.pisoDepto || ''}`.trim() : 'Retiro en local';
      filas.push([
        `#${this.formatearNumero(p.numero)}`,
        this.formatearFecha(p.creadoEn),
        this.etiquetaEstado(p.estado),
        p.estado === 'cancelado' ? 'CANCELADO' : (p.pagado ? 'PAGADO' : 'SIN PAGAR'),
        p.modoEntrega === 'envio' ? 'Envío' : 'Retiro',
        p.medioPago.toUpperCase(),
        p.cliente.nombre,
        p.cliente.telefono,
        dir,
        detalleItems,
        Math.round(p.totales.costoEnvio),
        Math.round(p.totales.descuento),
        Math.round(p.totales.total),
      ].map(escCsv).join(';'));
    }

    const contenidoCsv = '\uFEFF' + filas.join('\r\n');
    const blob = new Blob([contenidoCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    const fechaArchivo = new Date().toISOString().slice(0, 10);
    enlace.href = url;
    enlace.download = `cierre-caja-${this.periodoActivo()}-${fechaArchivo}.csv`;
    enlace.click();
    URL.revokeObjectURL(url);
    this.notificaciones.mostrar('Cierre de caja exportado para Excel (.CSV)');
  }

  /**
   * Abre una ventana limpia lista para imprimir el Cierre de Caja del período seleccionado o guardarlo en PDF.
   */
  imprimirCierreCaja(): void {
    const a = this.metricas().arqueo;
    const nombreLocal = this.escaparHtml(this.localAdmin.perfil().nombre || 'Local');
    const periodo = this.escaparHtml(this.etiquetaPeriodoActivo());
    const fechaEmision = new Date().toLocaleString('es-AR');
    const fmt = (n: number) => '$' + Math.round(n || 0).toLocaleString('es-AR');

    const ventana = window.open('', '_blank', 'width=680,height=780');
    if (!ventana) {
      this.notificaciones.mostrar('Habilitá las ventanas emergentes para imprimir el cierre de caja');
      return;
    }

    const filasDias = a.ventasPorDia
      .map(
        (d) => `
        <tr>
          <td>${this.escaparHtml(d.fecha)}</td>
          <td class="der">${d.pedidos}</td>
          <td class="der">${fmt(d.efectivo)}</td>
          <td class="der">${fmt(d.transferencia)}</td>
          <td class="der">${fmt(d.debito)}</td>
          <td class="der negrita">${fmt(d.total)}</td>
        </tr>`,
      )
      .join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Cierre de Caja · ${nombreLocal}</title>
  <style>
    @page { margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      color: #18181b;
      margin: 0;
      padding: 16px;
      font-size: 13px;
    }
    .encabezado {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #18181b;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    h1 { margin: 0; font-size: 20px; font-weight: 900; }
    .sub { color: #52525b; font-size: 12px; margin-top: 2px; }
    .grilla-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }
    .kpi {
      border: 1px solid #d4d4d8;
      border-radius: 10px;
      padding: 10px 12px;
    }
    .kpi-destacado {
      background: #18181b;
      color: #fff;
      border-color: #18181b;
    }
    .kpi-etiq { font-size: 10px; text-transform: uppercase; font-weight: 700; opacity: 0.75; }
    .kpi-val { font-size: 18px; font-weight: 900; margin-top: 4px; }
    .grilla-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }
    .caja {
      border: 1px solid #d4d4d8;
      border-radius: 10px;
      padding: 12px;
    }
    .caja h3 {
      margin: 0 0 8px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #e11d48;
    }
    .fila {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1px dashed #e4e4e7;
    }
    .fila:last-child { border-bottom: none; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
    th, td { border: 1px solid #e4e4e7; padding: 6px 8px; text-align: left; }
    th { background: #f4f4f5; font-size: 10px; text-transform: uppercase; }
    .der { text-align: right; }
    .negrita { font-weight: 800; }
    .pie { margin-top: 20px; text-align: center; font-size: 11px; color: #71717a; }
  </style>
</head>
<body>
  <div class="encabezado">
    <div>
      <h1>CIERRE DE CAJA · ${nombreLocal}</h1>
      <div class="sub">Período: <strong>${periodo}</strong></div>
    </div>
    <div style="text-align: right" class="sub">
      <div>Emitido: ${fechaEmision}</div>
      <div>Foodaro Administración</div>
    </div>
  </div>

  <div class="grilla-4">
    <div class="kpi kpi-destacado">
      <div class="kpi-etiq">Total Vendido</div>
      <div class="kpi-val">${fmt(a.totalVendido)}</div>
    </div>
    <div class="kpi">
      <div class="kpi-etiq">Pedidos Válidos</div>
      <div class="kpi-val">${a.pedidosValidos}</div>
    </div>
    <div class="kpi">
      <div class="kpi-etiq">Ticket Promedio</div>
      <div class="kpi-val">${fmt(a.ticketPromedio)}</div>
    </div>
    <div class="kpi">
      <div class="kpi-etiq">Cancelados</div>
      <div class="kpi-val">${a.pedidosCancelados}</div>
    </div>
  </div>

  <div class="grilla-2">
    <div class="caja">
      <h3>Arqueo por Medio de Pago</h3>
      <div class="fila"><span>Efectivo (${a.porMedioPago.efectivo.cantidad} ped.)</span><span class="negrita">${fmt(a.porMedioPago.efectivo.monto)}</span></div>
      <div class="fila"><span>Transferencia (${a.porMedioPago.transferencia.cantidad} ped.)</span><span class="negrita">${fmt(a.porMedioPago.transferencia.monto)}</span></div>
      <div class="fila"><span>Débito / Tarjeta (${a.porMedioPago.debito.cantidad} ped.)</span><span class="negrita">${fmt(a.porMedioPago.debito.monto)}</span></div>
    </div>
    <div class="caja">
      <h3>Por Modalidad de Entrega</h3>
      <div class="fila"><span>Envío a domicilio (${a.porModoEntrega.envio.cantidad} ped.)</span><span class="negrita">${fmt(a.porModoEntrega.envio.monto)}</span></div>
      <div class="fila"><span>Costo de envíos incluido</span><span>${fmt(a.porModoEntrega.envio.costoEnviosCobrado)}</span></div>
      <div class="fila"><span>Retiro en local (${a.porModoEntrega.retiro.cantidad} ped.)</span><span class="negrita">${fmt(a.porModoEntrega.retiro.monto)}</span></div>
    </div>
  </div>

  ${
    a.ventasPorDia.length > 0
      ? `<div class="caja">
           <h3>Desglose Día por Día</h3>
           <table>
             <thead>
               <tr>
                 <th>Fecha</th>
                 <th class="der">Pedidos</th>
                 <th class="der">Efectivo</th>
                 <th class="der">Transferencia</th>
                 <th class="der">Débito</th>
                 <th class="der">Total Día</th>
               </tr>
             </thead>
             <tbody>${filasDias}</tbody>
           </table>
         </div>`
      : ''
  }

  <div class="pie">Reporte generado por Foodaro · Los pedidos cancelados no suman a los totales de venta.</div>
  <script>
    window.onload = function() {
      window.focus();
      window.print();
    };
  </script>
</body>
</html>`;

    ventana.document.open();
    ventana.document.write(html);
    ventana.document.close();
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
