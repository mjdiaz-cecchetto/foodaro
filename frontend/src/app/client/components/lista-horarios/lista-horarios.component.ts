import { Component, computed, input } from '@angular/core';

import { Horarios } from '../../../shared/models';
import { NOMBRES_DIA, diaSemanaIso, formatearFechaCorta, formatearFranjas } from '../../../shared/utils/horarios';

/** Horarios del local para el cliente: los 7 días (resaltando hoy) y los próximos días especiales. */
@Component({
  selector: 'app-lista-horarios',
  standalone: true,
  templateUrl: './lista-horarios.component.html',
  styleUrl: './lista-horarios.component.scss',
})
export class ListaHorariosComponente {
  readonly horarios = input.required<Horarios>();
  /** 'compacta' usa textos más chicos (modal); 'normal' para la portada. */
  readonly densidad = input<'normal' | 'compacta'>('normal');

  readonly hoy = diaSemanaIso(new Date());
  readonly NOMBRES = NOMBRES_DIA;
  readonly formatearFranjas = formatearFranjas;
  readonly formatearFechaCorta = formatearFechaCorta;

  readonly semana = computed(() => this.horarios().semana);
  readonly proximasExcepciones = computed(() => this.horarios().excepciones.slice(0, 4));
}
