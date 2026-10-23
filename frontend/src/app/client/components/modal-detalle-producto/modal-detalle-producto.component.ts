import { Component, computed, effect, inject, input, output, signal } from '@angular/core';

import { GrupoOpciones, OpcionProducto, Producto } from '../../../shared/models';
import { PrecioPipe } from '../../../shared/pipes/precio.pipe';
import { ModalComponente } from '../../../shared/components/modal/modal.component';
import { NotificacionesServicio } from '../../../core/services/notificaciones.service';
import { CartaServicio } from '../../services/carta.service';
import { CarritoServicio } from '../../services/carrito.service';
import { UiClienteServicio } from '../../services/ui-cliente.service';
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
  templateUrl: './modal-detalle-producto.component.html',
  styleUrl: './modal-detalle-producto.component.scss',
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
  readonly seleccion = signal<Record<number, number[]>>({});

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
      const modoPrecio = g.modoPrecio ?? 'adicional';
      for (const id of sel[g.id] ?? []) {
        const o = g.opciones.find((op) => op.id === id);
        if (o) {
          elegidas.push({
            grupoId: g.id,
            grupoNombre: g.nombre,
            opcionId: o.id,
            etiqueta: o.etiqueta,
            precioAdicional: modoPrecio === 'informativo' ? 0 : o.precioAdicional,
            modoPrecio,
          });
        }
      }
    }
    return elegidas;
  });

  readonly precioUnitario = computed(() => {
    const p = this.producto();
    if (!p) return 0;
    let base = p.precio;
    let adicionales = 0;
    for (const o of this.opcionesElegidas()) {
      if (o.modoPrecio === 'variante') {
        base = o.precioAdicional > 0 ? o.precioAdicional : p.precio;
      } else if (o.modoPrecio !== 'informativo') {
        adicionales += o.precioAdicional;
      }
    }
    return base + adicionales;
  });

  readonly total = computed(() => this.precioUnitario() * this.cantidad());

  /** Grupos obligatorios sin elegir. */
  readonly gruposPendientes = computed<GrupoOpciones[]>(() => {
    const p = this.producto();
    if (!p) return [];
    const sel = this.seleccion();
    return p.gruposOpciones.filter((g) => g.obligatorio && (sel[g.id] ?? []).length === 0);
  });

  readonly puedeAgregar = computed(() => !!this.producto()?.disponible && this.gruposPendientes().length === 0);

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

  estaElegida(grupoId: number, opcionId: number): boolean {
    return (this.seleccion()[grupoId] ?? []).includes(opcionId);
  }

  cantidadElegida(grupoId: number): number {
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
        if (!grupo.obligatorio && actuales.includes(opcion.id)) {
          return { ...sel, [grupo.id]: [] };
        }
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

  private seleccionInicial(producto: Producto | null): Record<number, number[]> {
    const inicial: Record<number, number[]> = {};
    for (const g of producto?.gruposOpciones ?? []) {
      // Solo en grupos obligatorios se marca siempre el primer ítem por defecto
      inicial[g.id] = g.obligatorio && g.opciones.length > 0 ? [g.opciones[0].id] : [];
    }
    return inicial;
  }
}
