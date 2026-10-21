import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ModalComponente } from '../../../compartido/componentes/modal/modal.componente';
import { ValorFormularioPromocion } from '../../interfaces';

/** Alta de promoción / cupón. */
@Component({
  selector: 'app-modal-formulario-promocion',
  standalone: true,
  imports: [ReactiveFormsModule, ModalComponente],
  templateUrl: './modal-formulario-promocion.componente.html',
  styleUrl: './modal-formulario-promocion.componente.scss',
})
export class ModalFormularioPromocionComponente {
  private readonly fb = inject(FormBuilder);

  readonly abierto = input.required<boolean>();
  readonly cerrado = output<void>();
  readonly guardado = output<ValorFormularioPromocion>();

  readonly formulario = this.fb.nonNullable.group({
    titulo: ['', Validators.required],
    descuento: [20, [Validators.required, Validators.min(5), Validators.max(90)]],
    codigo: ['', Validators.required],
    imagen: ['', Validators.required],
  });

  readonly claseCampo =
    'w-full bg-zinc-50 dark:bg-surface-cardDark border border-zinc-200 dark:border-surface-borderDark rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20';

  constructor() {
    effect(() => {
      if (this.abierto()) this.formulario.reset({ titulo: '', descuento: 20, codigo: '', imagen: '' });
    });
  }

  invalido(campo: 'titulo' | 'descuento' | 'codigo' | 'imagen'): boolean {
    const c = this.formulario.controls[campo];
    return c.invalid && c.touched;
  }

  enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const v = this.formulario.getRawValue();
    this.guardado.emit({ ...v, descuento: Number(v.descuento) });
  }
}
