import { Component, computed, effect, HostListener, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Categoria, GrupoOpciones, Producto } from '../../../shared/models';
import { ValorFormularioProducto } from '../../interfaces';
import { EditorGruposOpcionesComponente } from '../editor-grupos-opciones/editor-grupos-opciones.component';

/**
 * Slide-over lateral para alta y edición de producto junto con sus grupos
 * de adicionales/variantes y estado de publicación en carta.
 */
@Component({
  selector: 'app-modal-formulario-producto',
  standalone: true,
  imports: [ReactiveFormsModule, EditorGruposOpcionesComponente],
  templateUrl: './modal-formulario-producto.component.html',
  styleUrl: './modal-formulario-producto.component.scss',
})
export class ModalFormularioProductoComponente {
  private readonly fb = inject(FormBuilder);

  readonly abierto = input.required<boolean>();
  readonly categorias = input.required<Categoria[]>();
  /** Producto a editar; `null` = alta. */
  readonly producto = input<Producto | null>(null);
  readonly cerrado = output<void>();
  readonly guardado = output<ValorFormularioProducto>();

  readonly esEdicion = computed(() => (this.producto()?.id ?? 0) > 0);
  readonly gruposOpciones = signal<GrupoOpciones[]>([]);
  readonly intentoEnvio = signal(false);

  /** Estado de montaje y transición del slide-over lateral. */
  readonly renderizado = signal(false);
  readonly visible = signal(false);

  readonly formulario = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    categoriaId: [0, [Validators.required, Validators.min(1)]],
    precio: [0, [Validators.required, Validators.min(0)]],
    tiempoPreparacion: [''],
    etiqueta: [''],
    imagen: [''],
    descripcion: [''],
    disponible: [true],
  });

  readonly claseCampo =
    'w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-500';

  constructor() {
    effect(() => {
      const estaAbierto = this.abierto();
      if (estaAbierto) {
        const p = this.producto();
        this.intentoEnvio.set(false);
        this.gruposOpciones.set(structuredClone(p?.gruposOpciones ?? []));
        this.formulario.reset({
          nombre: p?.nombre ?? '',
          categoriaId: p?.categoriaId ?? this.categorias()[0]?.id ?? 0,
          precio: p?.precio ?? 0,
          tiempoPreparacion: p?.tiempoPreparacion ?? '',
          etiqueta: p?.etiqueta ?? '',
          imagen: p?.imagen ?? '',
          descripcion: p?.descripcion ?? '',
          disponible: p?.disponible ?? true,
        });
        this.renderizado.set(true);
        setTimeout(() => this.visible.set(true), 10);
      } else {
        this.visible.set(false);
        setTimeout(() => this.renderizado.set(false), 200);
      }
    });
  }

  @HostListener('document:keydown.escape')
  alPresionarEscape(): void {
    if (this.abierto()) this.cerrado.emit();
  }

  invalido(campo: 'nombre' | 'precio' | 'categoriaId'): boolean {
    const c = this.formulario.controls[campo];
    return c.invalid && (c.touched || this.intentoEnvio());
  }

  /** Los grupos deben tener nombre y opciones con etiqueta para poder guardar. */
  gruposValidos(): boolean {
    return this.gruposOpciones().every(
      (g) => g.nombre.trim().length > 0 && g.opciones.length > 0 && g.opciones.every((o) => o.etiqueta.trim().length > 0),
    );
  }

  enviar(): void {
    this.intentoEnvio.set(true);
    if (this.formulario.invalid || !this.gruposValidos()) {
      this.formulario.markAllAsTouched();
      return;
    }
    const v = this.formulario.getRawValue();
    this.guardado.emit({
      ...v,
      nombre: v.nombre.trim(),
      categoriaId: Number(v.categoriaId),
      precio: Number(v.precio),
      imagen: v.imagen.trim(),
      descripcion: v.descripcion.trim(),
      disponible: Boolean(v.disponible),
      gruposOpciones: this.gruposOpciones().map((g) => ({
        ...g,
        nombre: g.nombre.trim(),
        modoPrecio: g.modoPrecio ?? 'adicional',
        opciones: g.opciones.map((o, idx) => ({
          ...o,
          etiqueta: o.etiqueta.trim(),
          precioAdicional: (g.modoPrecio ?? 'adicional') === 'informativo' ? 0 : Number(o.precioAdicional) || 0,
          porDefecto: g.obligatorio && idx === 0,
        })),
      })),
    });
  }
}
