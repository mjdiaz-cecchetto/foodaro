import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Cupon } from '../../../shared/models';
import { ModalComponente } from '../../../shared/components/modal/modal.component';
import { NotificacionesServicio } from '../../../core/services/notificaciones.service';
import { CuponesAdminServicio } from '../../services/cupones-admin.service';
import { EncabezadoPaginaComponente } from '../../components/encabezado-pagina/encabezado-pagina.component';
import { mensajeDeError } from '../../../shared/utils/api';

/** Gestión de códigos de descuento aplicables al confirmar cualquier pedido. */
@Component({
  selector: 'app-pagina-cupones',
  standalone: true,
  imports: [ReactiveFormsModule, EncabezadoPaginaComponente, ModalComponente],
  templateUrl: './pagina-cupones.component.html',
})
export class PaginaCuponesComponente {
  private readonly fb = inject(FormBuilder);
  private readonly cuponesAdmin = inject(CuponesAdminServicio);
  private readonly notificaciones = inject(NotificacionesServicio);

  readonly cupones = this.cuponesAdmin.cupones;
  readonly modalAbierto = signal(false);
  readonly editando = signal<Cupon | null>(null);
  readonly esEdicion = computed(() => this.editando() !== null);

  readonly formulario = this.fb.nonNullable.group({
    codigo: ['', [Validators.required, Validators.maxLength(30), Validators.pattern(/^[A-Za-z0-9_-]+$/)]],
    descuento: [15, [Validators.required, Validators.min(1), Validators.max(100)]],
    descripcion: ['', [Validators.maxLength(160)]],
    activo: [true],
  });

  readonly claseCampo =
    'w-full bg-zinc-50 dark:bg-surface-cardDark border border-zinc-200 dark:border-surface-borderDark rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20';

  abrirAlta(): void {
    this.editando.set(null);
    this.formulario.reset({
      codigo: '',
      descuento: 15,
      descripcion: '',
      activo: true,
    });
    this.modalAbierto.set(true);
  }

  abrirEdicion(cupon: Cupon): void {
    this.editando.set(cupon);
    this.formulario.reset({
      codigo: cupon.codigo,
      descuento: cupon.descuento,
      descripcion: cupon.descripcion ?? '',
      activo: cupon.activo,
    });
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.editando.set(null);
  }

  invalido(campo: 'codigo' | 'descuento' | 'descripcion'): boolean {
    const c = this.formulario.controls[campo];
    return c.invalid && c.touched;
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const v = this.formulario.getRawValue();
    const valor = {
      codigo: v.codigo.trim().toUpperCase(),
      descuento: Number(v.descuento),
      descripcion: v.descripcion.trim(),
      activo: Boolean(v.activo),
    };

    const actual = this.editando();
    const peticion$ = actual
      ? this.cuponesAdmin.actualizar(actual.id, valor)
      : this.cuponesAdmin.crear(valor);

    peticion$.subscribe({
      next: () => {
        this.notificaciones.mostrar(actual ? 'Cupón actualizado' : 'Cupón creado');
        this.cerrarModal();
      },
      error: (err: unknown) =>
        this.notificaciones.mostrar(
          mensajeDeError(err, actual ? 'No se pudo actualizar el cupón' : 'No se pudo crear el cupón'),
        ),
    });
  }

  alternarEstado(cupon: Cupon): void {
    this.cuponesAdmin.alternarEstado(cupon.id).subscribe({
      next: (actualizado) => this.notificaciones.mostrar(`Cupón ${actualizado.activo ? 'activado' : 'pausado'}`),
      error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err)),
    });
  }

  eliminar(cupon: Cupon): void {
    if (confirm(`¿Eliminar el cupón "${cupon.codigo}"?`)) {
      this.cuponesAdmin.eliminar(cupon.id).subscribe({
        next: () => this.notificaciones.mostrar('Cupón eliminado'),
        error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo eliminar el cupón')),
      });
    }
  }
}
