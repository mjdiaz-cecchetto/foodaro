import { DiaSemana, ExcepcionHorario, FranjaHoraria, HorarioDia, Horarios } from '../models';

export const NOMBRES_DIA: Record<DiaSemana, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo',
};

export const NOMBRES_DIA_CORTOS: Record<DiaSemana, string> = {
  1: 'Lun',
  2: 'Mar',
  3: 'Mié',
  4: 'Jue',
  5: 'Vie',
  6: 'Sáb',
  7: 'Dom',
};

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const DIAS_SEMANA: DiaSemana[] = [1, 2, 3, 4, 5, 6, 7];

/** Semana con los 7 días cerrados (base para locales sin horarios cargados). */
export function semanaVacia(): HorarioDia[] {
  return DIAS_SEMANA.map((dia) => ({ dia, abierto: false, franjas: [] }));
}

/** Garantiza que haya exactamente 7 días en orden lunes→domingo. */
export function normalizarSemana(semana: HorarioDia[] | undefined): HorarioDia[] {
  return DIAS_SEMANA.map((dia) => {
    const encontrado = semana?.find((d) => d.dia === dia);
    return encontrado
      ? { dia, abierto: encontrado.abierto && encontrado.franjas.length > 0, franjas: encontrado.franjas.map((f) => ({ ...f })) }
      : { dia, abierto: false, franjas: [] };
  });
}

export function clonarHorarios(horarios: Horarios | undefined): Horarios {
  return {
    semana: normalizarSemana(horarios?.semana),
    excepciones: (horarios?.excepciones ?? []).map((e) => ({ ...e, franjas: e.franjas.map((f) => ({ ...f })) })),
  };
}

/** "12:00–15:00 · 20:00–00:00" */
export function formatearFranjas(franjas: FranjaHoraria[]): string {
  return franjas.map((f) => `${f.desde}–${f.hasta}`).join(' · ');
}

/** Día ISO (1 = lunes … 7 = domingo) de una fecha local. */
export function diaSemanaIso(fecha: Date): DiaSemana {
  const js = fecha.getDay(); // 0 = domingo
  return (js === 0 ? 7 : js) as DiaSemana;
}

/** Fecha local en formato YYYY-MM-DD (sin desfase por zona horaria). */
export function fechaIso(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parsea YYYY-MM-DD como fecha local. */
export function desdeIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** "jue 25 dic" */
export function formatearFechaCorta(iso: string): string {
  return desdeIso(iso).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function excepcionDe(excepciones: ExcepcionHorario[], iso: string): ExcepcionHorario | undefined {
  return excepciones.find((e) => e.fecha === iso);
}
