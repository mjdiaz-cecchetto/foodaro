import { Component, inject, input, output, signal } from '@angular/core';

import { GrupoOpciones, OpcionProducto, TipoSeleccion } from '../../../compartido/modelos';
import { CatalogoAdminServicio } from '../../servicios/catalogo-admin.servicio';

/**
 * Editor de los grupos de opciones de un producto (tamaño, extras, cocción...).
 * Permite agregar grupos desde las plantillas del local, crear grupos nuevos,
 * editar sus opciones con precio adicional y guardar un grupo como plantilla.
 * Trabaja sobre una copia: emite `cambiado` con la lista completa en cada edición.
 */
@Component({
  selector: 'app-editor-grupos-opciones',
  standalone: true,
  templateUrl: './editor-grupos-opciones.componente.html',
  styleUrl: './editor-grupos-opciones.componente.scss',
})
export class EditorGruposOpcionesComponente {
  private readonly catalogo = inject(CatalogoAdminServicio);

  readonly grupos = input.required<GrupoOpciones[]>();
  readonly cambiado = output<GrupoOpciones[]>();

  readonly plantillas = this.catalogo.plantillasOpciones;
  /** Id del grupo expandido para editar. */
  readonly expandido = signal<string | null>(null);

  readonly claseCampo =
    'bg-zinc-50 dark:bg-surface-cardDark border border-zinc-200 dark:border-surface-borderDark rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20';

  yaAgregada(plantillaId: string): boolean {
    return this.grupos().some((g) => g.id === plantillaId);
  }

  agregarDesdePlantilla(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const plantilla = this.plantillas().find((p) => p.id === select.value);
    select.value = '';
    if (!plantilla || this.yaAgregada(plantilla.id)) return;
    this.emitir([...this.grupos(), structuredClone(plantilla)]);
    this.expandido.set(plantilla.id);
  }

  agregarGrupoNuevo(): void {
    const id = `grupo-${Date.now()}`;
    const nuevo: GrupoOpciones = {
      id,
      nombre: 'Nuevo grupo',
      tipo: 'unica',
      obligatorio: false,
      opciones: [{ id: `${id}-1`, etiqueta: 'Opción 1', precioAdicional: 0, porDefecto: true }],
    };
    this.emitir([...this.grupos(), nuevo]);
    this.expandido.set(id);
  }

  quitarGrupo(grupoId: string): void {
    this.emitir(this.grupos().filter((g) => g.id !== grupoId));
    if (this.expandido() === grupoId) this.expandido.set(null);
  }

  alternarExpandido(grupoId: string): void {
    this.expandido.update((actual) => (actual === grupoId ? null : grupoId));
  }

  actualizarGrupo(grupoId: string, cambios: Partial<GrupoOpciones>): void {
    this.emitir(this.grupos().map((g) => (g.id === grupoId ? { ...g, ...cambios } : g)));
  }

  cambiarTipo(grupoId: string, tipo: TipoSeleccion): void {
    const grupo = this.grupos().find((g) => g.id === grupoId);
    if (!grupo) return;
    // En selección única solo puede haber una opción por defecto
    let opciones = grupo.opciones;
    if (tipo === 'unica') {
      let encontrada = false;
      opciones = opciones.map((o) => {
        if (o.porDefecto && !encontrada) {
          encontrada = true;
          return o;
        }
        return { ...o, porDefecto: false };
      });
    }
    this.actualizarGrupo(grupoId, { tipo, opciones, maximo: tipo === 'unica' ? undefined : grupo.maximo });
  }

  agregarOpcion(grupoId: string): void {
    const grupo = this.grupos().find((g) => g.id === grupoId);
    if (!grupo) return;
    const opcion: OpcionProducto = { id: `${grupoId}-${Date.now()}`, etiqueta: '', precioAdicional: 0 };
    this.actualizarGrupo(grupoId, { opciones: [...grupo.opciones, opcion] });
  }

  actualizarOpcion(grupoId: string, opcionId: string, cambios: Partial<OpcionProducto>): void {
    const grupo = this.grupos().find((g) => g.id === grupoId);
    if (!grupo) return;
    let opciones = grupo.opciones.map((o) => (o.id === opcionId ? { ...o, ...cambios } : o));
    if (cambios.porDefecto && grupo.tipo === 'unica') {
      opciones = opciones.map((o) => (o.id === opcionId ? o : { ...o, porDefecto: false }));
    }
    this.actualizarGrupo(grupoId, { opciones });
  }

  quitarOpcion(grupoId: string, opcionId: string): void {
    const grupo = this.grupos().find((g) => g.id === grupoId);
    if (!grupo || grupo.opciones.length <= 1) return;
    this.actualizarGrupo(grupoId, { opciones: grupo.opciones.filter((o) => o.id !== opcionId) });
  }

  guardarComoPlantilla(grupoId: string): void {
    const grupo = this.grupos().find((g) => g.id === grupoId);
    if (grupo) this.catalogo.guardarPlantilla(grupo);
  }

  esPlantilla(grupoId: string): boolean {
    return this.plantillas().some((p) => p.id === grupoId);
  }

  valorTexto(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  valorNumero(event: Event): number {
    return Number((event.target as HTMLInputElement).value) || 0;
  }

  valorMarcado(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }

  private emitir(grupos: GrupoOpciones[]): void {
    this.cambiado.emit(grupos);
  }
}
