import { Component, computed, effect, inject, input, output, signal } from '@angular/core';

import { GrupoOpciones, OpcionProducto, Producto } from '../../../compartido/modelos';
import { PrecioPipe } from '../../../compartido/pipes/precio.pipe';
import { ModalComponente } from '../../../compartido/componentes/modal/modal.componente';
import { NotificacionesServicio } from '../../../nucleo/servicios/notificaciones.servicio';
import { CartaServicio } from '../../servicios/carta.servicio';
import { CarritoServicio } from '../../servicios/carrito.servicio';
import { UiClienteServicio } from '../../servicios/ui-cliente.servicio';
import { OpcionElegida } from '../../interfaces';

/**
 * Detalle del producto. Renderiza los grupos de opciones del producto
 * (selección única → radios, múltiple → checkboxes con máximo) y no permite
 * agregar hasta completar los grupos obligatorios. En modo menú solo informa.
 */
@Component({
  selector: 'app-modal-detalle-producto',
  standalone: true,
  imports: [ModalComponente, PrecioPipe],
  templateUrl: './modal-detalle-producto.componente.html',
  styleUrl: './modal-detalle-producto.componente.scss',
})
export class ModalDetalleProductoComponente {
  private readonly carta = inject(CartaServicio);
  private readonly carrito = inject(CarritoServicio);
  private readonly notificaciones = inject(NotificacionesServicio);
  readonly ui = inject(UiClienteServicio);

  /** Id del producto a mostrar; `null` cierra el modal. */
  readonly productoId = input<number | null>(null);
  readonly cerrado = output<void>();

  readonly abierto = computed(() => this.productoId() !== null);

  /** Último producto mostrado: se conserva durante la animación de cierre. */
  readonly producto = signal<Producto | null>(null);
  readonly cantidad = signal(1);
  readonly notas = signal('');
  /** Opciones elegidas por grupo: grupoId → ids de opciones. */
  readonly seleccion = signal<Record<string, string[]>>({});

  readonly nombreCategoria = computed(() => {
    const p = this.producto();
    return p ? (this.carta.categorias().find((c) => c.id === p.categoriaId)?.nombre ?? '') : '';
  });

  readonly opcionesElegidas = computed<OpcionElegida[]>(() => {
    const p = this.producto();
    if (!p) return [];
    const sel = this.seleccion();
    const elegidas: OpcionElegida[] = [];
    for (const g of p.gruposOpciones) {
      for (const id of sel[g.id] ?? []) {
        const o = g.opciones.find((op) => op.id === id);
        if (o) {
          elegidas.push({ grupoId: g.id, grupoNombre: g.nombre, opcionId: o.id, etiqueta: o.etiqueta, precioAdicional: o.precioAdicional });
        }
      }
    }
    return elegidas;
  });

  readonly precioUnitario = computed(() => {
    const p = this.producto();
    if (!p) return 0;
    return p.precio + this.opcionesElegidas().reduce((acc, o) => acc + o.precioAdicional, 0);
  });

  readonly total = computed(() => this.precioUnitario() * this.cantidad());

  /** Grupos obligatorios sin elegir. */
  readonly gruposPendientes = computed<GrupoOpciones[]>(() => {
    const p = this.producto();
    if (!p) return [];
    const sel = this.seleccion();
    return p.gruposOpciones.filter((g) => g.obligatorio && (sel[g.id] ?? []).length === 0);
  });

  readonly puedeAgregar = computed(() => this.gruposPendientes().length === 0);

  constructor() {
    effect(() => {
      const id = this.productoId();
      if (id === null) return;
      const producto = this.carta.obtenerProducto(id) ?? null;
      this.producto.set(producto);
      this.cantidad.set(1);
      this.notas.set('');
      this.seleccion.set(this.seleccionInicial(producto));
    });
  }

  estaElegida(grupoId: string, opcionId: string): boolean {
    return (this.seleccion()[grupoId] ?? []).includes(opcionId);
  }

  cantidadElegida(grupoId: string): number {
    return (this.seleccion()[grupoId] ?? []).length;
  }

  /** Para grupos múltiples con máximo: deshabilita el resto al llegar al tope. */
  estaBloqueada(grupo: GrupoOpciones, opcion: OpcionProducto): boolean {
    if (grupo.tipo !== 'multiple' || !grupo.maximo) return false;
    return !this.estaElegida(grupo.id, opcion.id) && this.cantidadElegida(grupo.id) >= grupo.maximo;
  }

  alternarOpcion(grupo: GrupoOpciones, opcion: OpcionProducto): void {
    this.seleccion.update((sel) => {
      const actuales = sel[grupo.id] ?? [];
      if (grupo.tipo === 'unica') {
        return { ...sel, [grupo.id]: [opcion.id] };
      }
      if (actuales.includes(opcion.id)) {
        return { ...sel, [grupo.id]: actuales.filter((id) => id !== opcion.id) };
      }
      if (grupo.maximo && actuales.length >= grupo.maximo) return sel;
      return { ...sel, [grupo.id]: [...actuales, opcion.id] };
    });
  }

  textoAyuda(grupo: GrupoOpciones): string {
    if (grupo.tipo === 'unica') return grupo.obligatorio ? 'Elegí una opción' : 'Opcional · elegí una';
    const max = grupo.maximo ? `hasta ${grupo.maximo}` : 'las que quieras';
    return grupo.obligatorio ? `Elegí ${max}` : `Opcional · ${max}`;
  }

  incrementar(): void {
    this.cantidad.update((c) => Math.min(99, c + 1));
  }

  decrementar(): void {
    this.cantidad.update((c) => Math.max(1, c - 1));
  }

  alEscribirNotas(event: Event): void {
    this.notas.set((event.target as HTMLTextAreaElement).value);
  }

  agregarAlCarrito(): void {
    const p = this.producto();
    if (!p || !this.puedeAgregar()) return;
    this.carrito.agregar(p, {
      productoId: p.id,
      cantidad: this.cantidad(),
      opciones: this.opcionesElegidas(),
      notas: this.notas(),
    });
    this.notificaciones.mostrar(`${this.cantidad()}x ${p.nombre} agregado a tu pedido`);
    this.cerrar();
  }

  cerrar(): void {
    this.cerrado.emit();
  }

  private seleccionInicial(producto: Producto | null): Record<string, string[]> {
    const inicial: Record<string, string[]> = {};
    for (const g of producto?.gruposOpciones ?? []) {
      const porDefecto = g.opciones.filter((o) => o.porDefecto).map((o) => o.id);
      inicial[g.id] = g.tipo === 'unica' ? porDefecto.slice(0, 1) : porDefecto.slice(0, g.maximo ?? porDefecto.length);
    }
    return inicial;
  }
}
