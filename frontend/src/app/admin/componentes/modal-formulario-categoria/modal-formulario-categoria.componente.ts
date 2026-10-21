import { Component, computed, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Categoria } from '../../../compartido/modelos';
import { ModalComponente } from '../../../compartido/componentes/modal/modal.componente';
import { ValorFormularioCategoria } from '../../interfaces';

/** Alta/edición de categoría. */
@Component({
  selector: 'app-modal-formulario-categoria',
  standalone: true,
  imports: [ReactiveFormsModule, ModalComponente],
  templateUrl: './modal-formulario-categoria.componente.html',
  styleUrl: './modal-formulario-categoria.componente.scss',
})
export class ModalFormularioCategoriaComponente {
  private readonly fb = inject(FormBuilder);

  readonly abierto = input.required<boolean>();
  /** Categoría a editar; `null` = alta. */
  readonly categoria = input<Categoria | null>(null);
  readonly cerrado = output<void>();
  readonly guardado = output<ValorFormularioCategoria>();

  readonly esEdicion = computed(() => this.categoria() !== null);

  readonly formulario = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    imagen: ['', Validators.required],
  });

  readonly claseCampo =
    'w-full bg-zinc-50 dark:bg-surface-cardDark border border-zinc-200 dark:border-surface-borderDark rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20';

  constructor() {
    effect(() => {
      if (!this.abierto()) return;
      const c = this.categoria();
      this.formulario.reset({ nombre: c?.nombre ?? '', imagen: c?.imagen ?? '' });
    });
  }

  invalido(campo: 'nombre' | 'imagen'): boolean {
    const c = this.formulario.controls[campo];
    return c.invalid && c.touched;
  }

  enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.guardado.emit(this.formulario.getRawValue());
  }
}
