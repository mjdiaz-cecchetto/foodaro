import { Component, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

import { PerfilLocal } from '../../../compartido/modelos';
import { NotificacionesServicio } from '../../../nucleo/servicios/notificaciones.servicio';
import { LocalAdminServicio } from '../../servicios/local-admin.servicio';
import { EncabezadoPaginaComponente } from '../../componentes/encabezado-pagina/encabezado-pagina.componente';
import { VistaPreviaCabeceraComponente } from '../../componentes/vista-previa-cabecera/vista-previa-cabecera.componente';

/** Datos del local: identidad, imágenes, ubicación, horarios y contacto. */
@Component({
  selector: 'app-pagina-perfil-local',
  standalone: true,
  imports: [ReactiveFormsModule, EncabezadoPaginaComponente, VistaPreviaCabeceraComponente],
  templateUrl: './pagina-perfil-local.componente.html',
  styleUrl: './pagina-perfil-local.componente.scss',
})
export class PaginaPerfilLocalComponente {
  private readonly fb = inject(FormBuilder);
  private readonly localAdmin = inject(LocalAdminServicio);
  private readonly notificaciones = inject(NotificacionesServicio);

  private readonly inicial = this.localAdmin.perfil();

  readonly formulario = this.fb.nonNullable.group({
    nombre: [this.inicial.nombre, Validators.required],
    eslogan: [this.inicial.eslogan],
    rubro: [this.inicial.rubro],
    logoUrl: [this.inicial.logoUrl],
    portadaUrl: [this.inicial.portadaUrl],
    direccion: [this.inicial.direccion],
    referenciaDireccion: [this.inicial.referenciaDireccion],
    mapsUrl: [this.inicial.mapsUrl],
    lunesAJueves: [this.inicial.horarios.lunesAJueves],
    viernesYSabado: [this.inicial.horarios.viernesYSabado],
    domingo: [this.inicial.horarios.domingo],
    whatsapp: [this.inicial.contacto.whatsapp, Validators.required],
    instagram: [this.inicial.contacto.instagram],
    tiktok: [this.inicial.contacto.tiktok],
    telefono: [this.inicial.contacto.telefono],
  });

  /** Valor del formulario como señal para alimentar la vista previa. */
  private readonly valorFormulario = toSignal(this.formulario.valueChanges, { initialValue: this.formulario.getRawValue() });

  readonly vistaPrevia = computed<PerfilLocal>(() => this.aPerfil());

  readonly claseCampo =
    'w-full bg-zinc-50 dark:bg-surface-cardDark border border-zinc-200 dark:border-surface-borderDark rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500';

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.notificaciones.mostrar('Revisá los campos obligatorios');
      return;
    }
    this.localAdmin.guardar(this.aPerfil());
    this.notificaciones.mostrar('Datos del local actualizados');
  }

  private aPerfil(): PerfilLocal {
    this.valorFormulario();
    const v = this.formulario.getRawValue();
    const base = this.localAdmin.perfil();
    return {
      ...base,
      nombre: v.nombre,
      eslogan: v.eslogan,
      rubro: v.rubro,
      logoUrl: v.logoUrl || base.logoUrl,
      portadaUrl: v.portadaUrl || base.portadaUrl,
      direccion: v.direccion,
      referenciaDireccion: v.referenciaDireccion,
      mapsUrl: v.mapsUrl,
      horarios: { lunesAJueves: v.lunesAJueves, viernesYSabado: v.viernesYSabado, domingo: v.domingo },
      contacto: { whatsapp: v.whatsapp, instagram: v.instagram, tiktok: v.tiktok, telefono: v.telefono },
    };
  }
}
