import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Categoria, GrupoOpciones, Producto } from '../../../compartido/modelos';
import { ModalComponente } from '../../../compartido/componentes/modal/modal.componente';
import { ValorFormularioProducto } from '../../interfaces';
import { EditorGruposOpcionesComponente } from '../editor-grupos-opciones/editor-grupos-opciones.componente';

type Pestania = 'datos' | 'opciones';

/** Alta/edición de producto con pestañas "Datos" y "Opciones" (grupos de opciones). */
@Component({
  selector: 'app-modal-formulario-producto',
  standalone: true,
  imports: [ReactiveFormsModule, ModalComponente, EditorGruposOpcionesComponente],
  templateUrl: './modal-formulario-producto.componente.html',
  styleUrl: './modal-formulario-producto.componente.scss',
})
export class ModalFormularioProductoComponente {
  private readonly fb = inject(FormBuilder);

  readonly abierto = input.required<boolean>();
  readonly categorias = input.required<Categoria[]>();
  /** Producto a editar; `null` = alta. */
  readonly producto = input<Producto | null>(null);
  readonly cerrado = output<void>();
  readonly guardado = output<ValorFormularioProducto>();

  readonly esEdicion = computed(() => this.producto() !== null);
  readonly pestania = signal<Pestania>('datos');
  readonly gruposOpciones = signal<GrupoOpciones[]>([]);

  readonly formulario = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    categoriaId: ['', Validators.required],
    precio: [0, [Validators.required, Validators.min(0)]],
    tiempoPreparacion: [''],
    etiqueta: [''],
    imagen: ['', Validators.required],
    descripcion: ['', Validators.required],
  });

  readonly claseCampo =
    'w-full bg-zinc-50 dark:bg-surface-cardDark border border-zinc-200 dark:border-surface-borderDark rounded-2xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20';

  constructor() {
    effect(() => {
      if (!this.abierto()) return;
      const p = this.producto();
      this.pestania.set('datos');
      this.gruposOpciones.set(structuredClone(p?.gruposOpciones ?? []));
      this.formulario.reset({
        nombre: p?.nombre ?? '',
        categoriaId: p?.categoriaId ?? this.categorias()[0]?.id ?? '',
        precio: p?.precio ?? 0,
        tiempoPreparacion: p?.tiempoPreparacion ?? '',
        etiqueta: p?.etiqueta ?? '',
        imagen: p?.imagen ?? '',
        descripcion: p?.descripcion ?? '',
      });
    });
  }

  invalido(campo: 'nombre' | 'imagen' | 'descripcion' | 'precio'): boolean {
    const c = this.formulario.controls[campo];
    return c.invalid && c.touched;
  }

  /** Los grupos deben tener nombre y opciones con etiqueta para poder guardar. */
  gruposValidos(): boolean {
    return this.gruposOpciones().every((g) => g.nombre.trim() && g.opciones.length && g.opciones.every((o) => o.etiqueta.trim()));
  }

  enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.pestania.set('datos');
      return;
    }
    if (!this.gruposValidos()) {
      this.pestania.set('opciones');
      return;
    }
    const v = this.formulario.getRawValue();
    this.guardado.emit({
      ...v,
      precio: Number(v.precio),
      gruposOpciones: this.gruposOpciones().map((g) => ({
        ...g,
        nombre: g.nombre.trim(),
        opciones: g.opciones.map((o) => ({ ...o, etiqueta: o.etiqueta.trim(), precioAdicional: Number(o.precioAdicional) || 0 })),
      })),
    });
  }
}
