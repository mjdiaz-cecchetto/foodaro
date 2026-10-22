import { Component, inject, input, output, signal } from '@angular/core';

import { NotificacionesServicio } from '../../../core/services/notificaciones.service';
import { mensajeDeError } from '../../../shared/utils/api';

import { GrupoOpciones, OpcionProducto, TipoSeleccion } from '../../../shared/models';
import { CatalogoAdminServicio } from '../../services/catalogo-admin.service';

/**
 * Editor de los grupos de opciones de un producto (tamaño, extras, cocción...).
 * Permite agregar grupos desde las plantillas del local, crear grupos nuevos,
 * editar sus opciones con precio adicional y guardar un grupo como plantilla.
 * Trabaja sobre una copia: emite `cambiado` con la lista completa en cada edición.
 */
@Component({
  selector: 'app-editor-grupos-opciones',
  standalone: true,
  templateUrl: './editor-grupos-opciones.component.html',
  styleUrl: './editor-grupos-opciones.component.scss',
})
export class EditorGruposOpcionesComponente {
  private readonly catalogo = inject(CatalogoAdminServicio);
  private readonly notificaciones = inject(NotificacionesServicio);

  readonly grupos = input.required<GrupoOpciones[]>();
  readonly cambiado = output<GrupoOpciones[]>();

  readonly plantillas = this.catalogo.plantillasOpciones;
  /** Id del grupo expandido para editar. */
  readonly expandido = signal<number | null>(null);

  readonly claseCampo =
    'bg-zinc-50 dark:bg-surface-cardDark border border-zinc-200 dark:border-surface-borderDark rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20';

  /** Una plantilla ya está en el producto si hay un grupo con el mismo nombre. */
  yaAgregada(plantillaId: number): boolean {
    const plantilla = this.plantillas().find((p) => p.id === plantillaId);
    return !!plantilla && this.grupos().some((g) => g.nombre.trim().toLowerCase() === plantilla.nombre.trim().toLowerCase());
  }

  /** Ids temporales negativos para registros aún no guardados (el API asigna los definitivos). */
  private idTemporal(): number {
    return -Date.now() - Math.floor(Math.random() * 1000);
  }

  agregarDesdePlantilla(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const plantilla = this.plantillas().find((p) => p.id === Number(select.value));
    select.value = '';
    if (!plantilla || this.yaAgregada(plantilla.id)) return;
    // Copia con ids temporales: el grupo del producto es independiente de la plantilla
    const copia: GrupoOpciones = {
      ...structuredClone(plantilla),
      id: this.idTemporal(),
      opciones: plantilla.opciones.map((o) => ({ ...o, id: this.idTemporal() })),
    };
    this.emitir([...this.grupos(), copia]);
    this.expandido.set(copia.id);
  }

  agregarGrupoNuevo(): void {
    const id = this.idTemporal();
    const nuevo: GrupoOpciones = {
      id,
      nombre: 'Nuevo grupo',
      tipo: 'unica',
      obligatorio: false,
      opciones: [{ id: this.idTemporal(), etiqueta: 'Opción 1', precioAdicional: 0, porDefecto: true }],
    };
    this.emitir([...this.grupos(), nuevo]);
    this.expandido.set(id);
  }

  quitarGrupo(grupoId: number): void {
    this.emitir(this.grupos().filter((g) => g.id !== grupoId));
    if (this.expandido() === grupoId) this.expandido.set(null);
  }

  alternarExpandido(grupoId: number): void {
    this.expandido.update((actual) => (actual === grupoId ? null : grupoId));
  }

  actualizarGrupo(grupoId: number, cambios: Partial<GrupoOpciones>): void {
    this.emitir(this.grupos().map((g) => (g.id === grupoId ? { ...g, ...cambios } : g)));
  }

  cambiarTipo(grupoId: number, tipo: TipoSeleccion): void {
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

  agregarOpcion(grupoId: number): void {
    const grupo = this.grupos().find((g) => g.id === grupoId);
    if (!grupo) return;
    const opcion: OpcionProducto = { id: this.idTemporal(), etiqueta: '', precioAdicional: 0 };
    this.actualizarGrupo(grupoId, { opciones: [...grupo.opciones, opcion] });
  }

  actualizarOpcion(grupoId: number, opcionId: number, cambios: Partial<OpcionProducto>): void {
    const grupo = this.grupos().find((g) => g.id === grupoId);
    if (!grupo) return;
    let opciones = grupo.opciones.map((o) => (o.id === opcionId ? { ...o, ...cambios } : o));
    if (cambios.porDefecto && grupo.tipo === 'unica') {
      opciones = opciones.map((o) => (o.id === opcionId ? o : { ...o, porDefecto: false }));
    }
    this.actualizarGrupo(grupoId, { opciones });
  }

  quitarOpcion(grupoId: number, opcionId: number): void {
    const grupo = this.grupos().find((g) => g.id === grupoId);
    if (!grupo || grupo.opciones.length <= 1) return;
    this.actualizarGrupo(grupoId, { opciones: grupo.opciones.filter((o) => o.id !== opcionId) });
  }

  guardarComoPlantilla(grupoId: number): void {
    const grupo = this.grupos().find((g) => g.id === grupoId);
    if (!grupo || !grupo.nombre.trim()) return;
    this.catalogo.guardarPlantilla(grupo).subscribe({
      next: (plantilla) => this.notificaciones.mostrar(`Plantilla "${plantilla.nombre}" guardada para el local`),
      error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err, 'No se pudo guardar la plantilla')),
    });
  }

  /** Hay una plantilla del local con el mismo nombre que el grupo. */
  esPlantilla(grupoId: number): boolean {
    const grupo = this.grupos().find((g) => g.id === grupoId);
    return !!grupo && this.plantillas().some((p) => p.nombre.trim().toLowerCase() === grupo.nombre.trim().toLowerCase());
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
