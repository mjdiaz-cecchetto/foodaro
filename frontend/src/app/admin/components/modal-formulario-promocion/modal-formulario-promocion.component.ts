import { Component, computed, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Promocion } from '../../../shared/models';
import { ModalComponente } from '../../../shared/components/modal/modal.component';
import { ValorFormularioPromocion } from '../../interfaces';

/** Alta y edición de promoción / cupón. */
@Component({
  selector: 'app-modal-formulario-promocion',
  standalone: true,
  imports: [ReactiveFormsModule, ModalComponente],
  templateUrl: './modal-formulario-promocion.component.html',
  styleUrl: './modal-formulario-promocion.component.scss',
})
export class ModalFormularioPromocionComponente {
  private readonly fb = inject(FormBuilder);

  readonly abierto = input.required<boolean>();
  readonly promocion = input<Promocion | null>(null);
  readonly cerrado = output<void>();
  readonly guardado = output<ValorFormularioPromocion>();

  readonly esEdicion = computed(() => this.promocion() !== null);

  readonly formulario = this.fb.nonNullable.group({
    titulo: ['', Validators.required],
    precio: [0, [Validators.required, Validators.min(0)]],
    descuento: [0, [Validators.min(0), Validators.max(100)]],
    imagen: ['', Validators.required],
    activa: [true],
  });

  readonly claseCampo =
    'w-full bg-zinc-50 dark:bg-surface-cardDark border border-zinc-200 dark:border-surface-borderDark rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20';

  constructor() {
    effect(() => {
      if (!this.abierto()) return;
      const p = this.promocion();
      if (p) {
        this.formulario.reset({
          titulo: p.titulo,
          precio: p.precio ?? 0,
          descuento: p.descuento ?? 0,
          imagen: p.imagen,
          activa: p.activa,
        });
      } else {
        this.formulario.reset({
          titulo: '',
          precio: 0,
          descuento: 0,
          imagen: '',
          activa: true,
        });
      }
    });
  }

  invalido(campo: 'titulo' | 'precio' | 'descuento' | 'imagen'): boolean {
    const c = this.formulario.controls[campo];
    return c.invalid && c.touched;
  }

  enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const v = this.formulario.getRawValue();
    this.guardado.emit({
      titulo: v.titulo.trim(),
      precio: Number(v.precio) || 0,
      descuento: Number(v.descuento) || 0,
      imagen: v.imagen.trim(),
      activa: Boolean(v.activa),
    });
  }
}
