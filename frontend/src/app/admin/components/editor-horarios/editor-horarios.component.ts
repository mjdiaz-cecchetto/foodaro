import { Component, input, output } from '@angular/core';

import { DiaSemana, FranjaHoraria, HorarioDia } from '../../../shared/models';
import { NOMBRES_DIA } from '../../../shared/utils/horarios';

/**
 * Editor del horario semanal: cada día se puede abrir/cerrar de forma independiente
 * y tener varias franjas (ej. mediodía y noche). Emite la semana completa en cada cambio.
 */
@Component({
  selector: 'app-editor-horarios',
  standalone: true,
  templateUrl: './editor-horarios.component.html',
  styleUrl: './editor-horarios.component.scss',
})
export class EditorHorariosComponente {
  readonly semana = input.required<HorarioDia[]>();
  readonly cambiado = output<HorarioDia[]>();

  readonly NOMBRES = NOMBRES_DIA;

  readonly claseHora =
    'w-[104px] bg-zinc-50 dark:bg-surface-cardDark border border-zinc-200 dark:border-surface-borderDark rounded-xl px-2.5 py-2 text-xs font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500';

  alternarAbierto(dia: DiaSemana): void {
    this.emitir(
      this.semana().map((d) => {
        if (d.dia !== dia) return d;
        const abierto = !d.abierto;
        return { ...d, abierto, franjas: abierto && !d.franjas.length ? [{ desde: '12:00', hasta: '15:00' }] : d.franjas };
      }),
    );
  }

  agregarFranja(dia: DiaSemana): void {
    this.actualizarFranjas(dia, (f) => {
      const ultima = f[f.length - 1];
      const nueva: FranjaHoraria = ultima ? { desde: '20:00', hasta: '00:00' } : { desde: '12:00', hasta: '15:00' };
      return [...f, nueva];
    });
  }

  quitarFranja(dia: DiaSemana, indice: number): void {
    this.actualizarFranjas(dia, (f) => f.filter((_, i) => i !== indice));
  }

  cambiarHora(dia: DiaSemana, indice: number, campo: keyof FranjaHoraria, event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.actualizarFranjas(dia, (f) => f.map((fr, i) => (i === indice ? { ...fr, [campo]: valor } : fr)));
  }

  /** Copia las franjas de un día al resto de los días abiertos. */
  copiarATodos(dia: DiaSemana): void {
    const origen = this.semana().find((d) => d.dia === dia);
    if (!origen) return;
    this.emitir(this.semana().map((d) => (d.abierto ? { ...d, franjas: origen.franjas.map((f) => ({ ...f })) } : d)));
  }

  cruzaMedianoche(f: FranjaHoraria): boolean {
    return !!f.desde && !!f.hasta && f.hasta <= f.desde;
  }

  private actualizarFranjas(dia: DiaSemana, fn: (franjas: FranjaHoraria[]) => FranjaHoraria[]): void {
    this.emitir(
      this.semana().map((d) => {
        if (d.dia !== dia) return d;
        const franjas = fn(d.franjas);
        return { ...d, franjas, abierto: franjas.length > 0 };
      }),
    );
  }

  private emitir(semana: HorarioDia[]): void {
    this.cambiado.emit(semana);
  }
}
