import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

import { ExcepcionHorario, HorarioDia, Horarios, PerfilLocal } from '../../../shared/models';
import { clonarHorarios } from '../../../shared/utils/horarios';
import { mensajeDeError } from '../../../shared/utils/api';
import { NotificacionesServicio } from '../../../core/services/notificaciones.service';
import { LocalAdminServicio } from '../../services/local-admin.service';
import { EncabezadoPaginaComponente } from '../../components/encabezado-pagina/encabezado-pagina.component';
import { VistaPreviaCabeceraComponente } from '../../components/vista-previa-cabecera/vista-previa-cabecera.component';
import { EditorHorariosComponente } from '../../components/editor-horarios/editor-horarios.component';
import { CalendarioExcepcionesComponente } from '../../components/calendario-excepciones/calendario-excepciones.component';
import { MapaUbicacionComponente } from '../../../shared/components/mapa-ubicacion/mapa-ubicacion.component';

type Seccion = 'identidad' | 'ubicacion' | 'horarios' | 'contacto';

/** Datos del local: identidad, ubicación con mapa, horarios (semana + excepciones) y contacto. */
@Component({
  selector: 'app-pagina-perfil-local',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    EncabezadoPaginaComponente,
    VistaPreviaCabeceraComponente,
    EditorHorariosComponente,
    CalendarioExcepcionesComponente,
    MapaUbicacionComponente,
  ],
  templateUrl: './pagina-perfil-local.component.html',
  styleUrl: './pagina-perfil-local.component.scss',
})
export class PaginaPerfilLocalComponente {
  private readonly fb = inject(FormBuilder);
  private readonly localAdmin = inject(LocalAdminServicio);
  private readonly notificaciones = inject(NotificacionesServicio);

  private readonly inicial = this.localAdmin.perfil();

  readonly secciones: { id: Seccion; etiqueta: string; icono: string }[] = [
    { id: 'identidad', etiqueta: 'Identidad', icono: 'fa-store' },
    { id: 'ubicacion', etiqueta: 'Ubicación', icono: 'fa-location-dot' },
    { id: 'horarios', etiqueta: 'Horarios', icono: 'fa-clock' },
    { id: 'contacto', etiqueta: 'Contacto', icono: 'fa-comments' },
  ];
  readonly seccion = signal<Seccion>('identidad');

  readonly formulario = this.fb.nonNullable.group({
    nombre: [this.inicial.nombre, Validators.required],
    eslogan: [this.inicial.eslogan],
    rubro: [this.inicial.rubro],
    logoUrl: [this.inicial.logoUrl],
    portadaUrl: [this.inicial.portadaUrl],
    direccion: [this.inicial.direccion],
    referenciaDireccion: [this.inicial.referenciaDireccion],
    mapsUrl: [this.inicial.mapsUrl],
    whatsapp: [this.inicial.contacto.whatsapp, Validators.required],
    whatsappPedidos: [this.inicial.contacto.whatsappPedidos, [Validators.required, Validators.pattern(/^[\d\s()+-]{6,}$/)]],
    instagram: [this.inicial.contacto.instagram],
    tiktok: [this.inicial.contacto.tiktok],
    telefono: [this.inicial.contacto.telefono],
  });

  /** Horarios se editan fuera del formulario reactivo (estructura anidada con señales). */
  readonly horarios = signal<Horarios>(clonarHorarios(this.inicial.horarios));

  private readonly valorFormulario = toSignal(this.formulario.valueChanges, { initialValue: this.formulario.getRawValue() });

  readonly vistaPrevia = computed<PerfilLocal>(() => this.aPerfil());
  readonly guardando = signal(false);

  readonly diasAbiertos = computed(() => this.horarios().semana.filter((d) => d.abierto).length);
  readonly excepcionesFuturas = computed(() => this.horarios().excepciones.length);

  /** Enlace wa.me para probar el número de pedidos tal como lo usa la carta. */
  readonly enlacePruebaPedidos = computed(() => {
    const digitos = (this.vistaPrevia().contacto.whatsappPedidos || '').replace(/\D/g, '');
    return digitos.length >= 6 ? `https://wa.me/${digitos}?text=${encodeURIComponent('Prueba de Foodaro: a este número llegan los pedidos de ' + this.vistaPrevia().nombre)}` : null;
  });

  readonly claseCampo =
    'w-full bg-zinc-50 dark:bg-surface-cardDark border border-zinc-200 dark:border-surface-borderDark rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500';

  cambiarSemana(semana: HorarioDia[]): void {
    this.horarios.update((h) => ({ ...h, semana }));
  }

  cambiarExcepciones(excepciones: ExcepcionHorario[]): void {
    this.horarios.update((h) => ({ ...h, excepciones }));
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.seccion.set(this.formulario.controls.nombre.invalid ? 'identidad' : 'contacto');
      if (this.formulario.controls.whatsappPedidos.invalid) this.notificaciones.mostrar('Falta el WhatsApp que recibe los pedidos');
      this.notificaciones.mostrar('Revisá los campos obligatorios');
      return;
    }
    const diaSinFranja = this.horarios().semana.find((d) => d.abierto && d.franjas.length === 0);
    if (diaSinFranja) {
      this.seccion.set('horarios');
      this.notificaciones.mostrar('Hay un día abierto sin franja horaria');
      return;
    }

    this.guardando.set(true);
    this.localAdmin.guardar(this.aPerfil()).subscribe({
      next: (perfil) => {
        this.guardando.set(false);
        this.horarios.set(clonarHorarios(perfil.horarios));
        this.notificaciones.mostrar('Datos del local actualizados');
      },
      error: (err: unknown) => {
        this.guardando.set(false);
        this.notificaciones.mostrar(mensajeDeError(err, 'No se pudieron guardar los datos'));
      },
    });
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
      horarios: this.horarios(),
      contacto: { whatsapp: v.whatsapp, whatsappPedidos: v.whatsappPedidos, instagram: v.instagram, tiktok: v.tiktok, telefono: v.telefono },
    };
  }
}
