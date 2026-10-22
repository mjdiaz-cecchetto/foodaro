import { Component, computed, input, output, signal } from '@angular/core';

import { ExcepcionHorario, FranjaHoraria, HorarioDia } from '../../../shared/models';
import {
  MESES,
  NOMBRES_DIA_CORTOS,
  DIAS_SEMANA,
  desdeIso,
  diaSemanaIso,
  excepcionDe,
  fechaIso,
  formatearFechaCorta,
  formatearFranjas,
} from '../../../shared/utils/horarios';

interface CeldaCalendario {
  iso: string;
  dia: number;
  delMes: boolean;
  pasado: boolean;
  hoy: boolean;
  /** Cerrado por el horario semanal habitual. */
  cerradoHabitual: boolean;
  excepcion?: ExcepcionHorario;
}

/**
 * Calendario mensual para marcar días puntuales: cerrado (feriado, vacaciones)
 * u horario especial. Tocar un día abre el editor de esa fecha.
 */
@Component({
  selector: 'app-calendario-excepciones',
  standalone: true,
  templateUrl: './calendario-excepciones.component.html',
  styleUrl: './calendario-excepciones.component.scss',
})
export class CalendarioExcepcionesComponente {
  readonly excepciones = input.required<ExcepcionHorario[]>();
  readonly semana = input.required<HorarioDia[]>();
  readonly cambiado = output<ExcepcionHorario[]>();

  readonly ENCABEZADOS = DIAS_SEMANA.map((d) => NOMBRES_DIA_CORTOS[d]);
  readonly MESES = MESES;
  readonly formatearFechaCorta = formatearFechaCorta;
  readonly formatearFranjas = formatearFranjas;

  private readonly hoy = fechaIso(new Date());
  readonly mesVisible = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  readonly seleccionada = signal<string | null>(null);

  readonly tituloMes = computed(() => `${MESES[this.mesVisible().getMonth()]} ${this.mesVisible().getFullYear()}`);

  readonly celdas = computed<CeldaCalendario[]>(() => {
    const inicioMes = this.mesVisible();
    const primerDia = new Date(inicioMes);
    primerDia.setDate(1 - (diaSemanaIso(inicioMes) - 1)); // retrocede hasta el lunes
    const celdas: CeldaCalendario[] = [];
    for (let i = 0; i < 42; i++) {
      const fecha = new Date(primerDia);
      fecha.setDate(primerDia.getDate() + i);
      const iso = fechaIso(fecha);
      const habitual = this.semana().find((d) => d.dia === diaSemanaIso(fecha));
      celdas.push({
        iso,
        dia: fecha.getDate(),
        delMes: fecha.getMonth() === inicioMes.getMonth(),
        pasado: iso < this.hoy,
        hoy: iso === this.hoy,
        cerradoHabitual: !habitual?.abierto,
        excepcion: excepcionDe(this.excepciones(), iso),
      });
    }
    return celdas;
  });

  /** Excepción en edición para la fecha seleccionada (borrador si aún no existe). */
  readonly borrador = computed<ExcepcionHorario | null>(() => {
    const iso = this.seleccionada();
    if (!iso) return null;
    return excepcionDe(this.excepciones(), iso) ?? { fecha: iso, cerrado: true, motivo: null, franjas: [] };
  });

  readonly existe = computed(() => !!this.seleccionada() && !!excepcionDe(this.excepciones(), this.seleccionada()!));

  readonly proximas = computed(() =>
    [...this.excepciones()].filter((e) => e.fecha >= this.hoy).sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 8),
  );

  mesAnterior(): void {
    this.mesVisible.update((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }

  mesSiguiente(): void {
    this.mesVisible.update((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }

  seleccionar(celda: CeldaCalendario): void {
    if (celda.pasado) return;
    this.seleccionada.set(this.seleccionada() === celda.iso ? null : celda.iso);
    if (!celda.delMes) {
      const f = desdeIso(celda.iso);
      this.mesVisible.set(new Date(f.getFullYear(), f.getMonth(), 1));
    }
  }

  irA(iso: string): void {
    const f = desdeIso(iso);
    this.mesVisible.set(new Date(f.getFullYear(), f.getMonth(), 1));
    this.seleccionada.set(iso);
  }

  definirCerrado(cerrado: boolean): void {
    const b = this.borrador();
    if (!b) return;
    this.guardarBorrador({ ...b, cerrado, franjas: cerrado ? [] : b.franjas.length ? b.franjas : [{ desde: '12:00', hasta: '16:00' }] });
  }

  cambiarMotivo(event: Event): void {
    const b = this.borrador();
    if (!b) return;
    const motivo = (event.target as HTMLInputElement).value.trim();
    this.guardarBorrador({ ...b, motivo: motivo || null });
  }

  agregarFranja(): void {
    const b = this.borrador();
    if (!b) return;
    this.guardarBorrador({ ...b, franjas: [...b.franjas, { desde: '20:00', hasta: '00:00' }] });
  }

  quitarFranja(i: number): void {
    const b = this.borrador();
    if (!b) return;
    const franjas = b.franjas.filter((_, idx) => idx !== i);
    this.guardarBorrador({ ...b, franjas, cerrado: franjas.length === 0 ? true : b.cerrado });
  }

  cambiarHora(i: number, campo: keyof FranjaHoraria, event: Event): void {
    const b = this.borrador();
    if (!b) return;
    const valor = (event.target as HTMLInputElement).value;
    this.guardarBorrador({ ...b, franjas: b.franjas.map((f, idx) => (idx === i ? { ...f, [campo]: valor } : f)) });
  }

  quitarExcepcion(): void {
    const iso = this.seleccionada();
    if (!iso) return;
    this.cambiado.emit(this.excepciones().filter((e) => e.fecha !== iso));
    this.seleccionada.set(null);
  }

  /** Inserta o reemplaza la excepción de la fecha seleccionada. */
  private guardarBorrador(exc: ExcepcionHorario): void {
    const resto = this.excepciones().filter((e) => e.fecha !== exc.fecha);
    this.cambiado.emit([...resto, exc].sort((a, b) => a.fecha.localeCompare(b.fecha)));
  }

  claseCelda(c: CeldaCalendario): string {
    if (!c.delMes) return 'text-zinc-300 dark:text-zinc-700';
    if (c.pasado) return 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed';
    if (c.excepcion?.cerrado) return 'bg-red-50 dark:bg-red-500/15 text-red-600 font-black ring-1 ring-red-200 dark:ring-red-500/30';
    if (c.excepcion) return 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 font-black ring-1 ring-amber-200 dark:ring-amber-500/30';
    if (c.cerradoHabitual) return 'text-zinc-400 bg-zinc-50 dark:bg-surface-cardDark/60';
    return 'text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-surface-cardDark';
  }
}
