import { Component, input, output } from '@angular/core';

import { GrupoOpciones, ModoPrecioGrupo, OpcionProducto, TipoSeleccion } from '../../../shared/models';

/**
 * Editor inline de los grupos de adicionales y variantes de un producto.
 * Permite configurar por grupo:
 * - Modo de precio:
 *   · 'adicional'   (+$ suma al precio base del producto)
 *   · 'variante'    ($ reemplaza/define el precio según la porción/cantidad)
 *   · 'informativo' (sin precio, ej. punto de cocción o gustos)
 * - Tipo de selección: 'unica' (Radio) o 'multiple' (Check)
 * - Obligatorio: marca siempre el 1° ítem por defecto en la carta cuando es obligatorio.
 */
@Component({
  selector: 'app-editor-grupos-opciones',
  standalone: true,
  templateUrl: './editor-grupos-opciones.component.html',
  styleUrl: './editor-grupos-opciones.component.scss',
})
export class EditorGruposOpcionesComponente {
  readonly grupos = input.required<GrupoOpciones[]>();
  readonly precioBase = input<number>(0);
  readonly cambiado = output<GrupoOpciones[]>();

  /** Ids temporales negativos para registros aún no guardados (el API asigna los definitivos). */
  private idTemporal(): number {
    return -Date.now() - Math.floor(Math.random() * 10000);
  }

  modoPrecioDe(grupo: GrupoOpciones): ModoPrecioGrupo {
    return grupo.modoPrecio ?? 'adicional';
  }

  agregarGrupoNuevo(): void {
    const id = this.idTemporal();
    const nuevo: GrupoOpciones = {
      id,
      nombre: 'Nuevo Grupo de Opciones',
      tipo: 'unica',
      modoPrecio: 'adicional',
      obligatorio: false,
      opciones: [{ id: this.idTemporal(), etiqueta: 'Opción 1', precioAdicional: 0, porDefecto: false }],
    };
    this.emitir([...this.grupos(), nuevo]);
  }

  quitarGrupo(grupoId: number): void {
    this.emitir(this.grupos().filter((g) => g.id !== grupoId));
  }

  actualizarNombreGrupo(grupoId: number, nombre: string): void {
    this.emitir(this.grupos().map((g) => (g.id === grupoId ? { ...g, nombre } : g)));
  }

  cambiarModoPrecio(grupoId: number, modoPrecio: ModoPrecioGrupo): void {
    this.emitir(
      this.grupos().map((g) => {
        if (g.id !== grupoId) return g;
        const opciones =
          modoPrecio === 'informativo' ? g.opciones.map((o) => ({ ...o, precioAdicional: 0 })) : g.opciones;
        return this.normalizarDefecto({
          ...g,
          modoPrecio,
          // Si es variante de precio (ej. 8 o 4 porciones), por naturaleza suele ser selección única
          tipo: modoPrecio === 'variante' ? 'unica' : g.tipo,
          opciones,
        });
      }),
    );
  }

  cambiarTipo(grupoId: number, tipo: TipoSeleccion): void {
    this.emitir(
      this.grupos().map((g) => {
        if (g.id !== grupoId) return g;
        return this.normalizarDefecto({
          ...g,
          tipo,
          maximo: tipo === 'unica' ? undefined : g.maximo,
        });
      }),
    );
  }

  cambiarObligatorio(grupoId: number, obligatorio: boolean): void {
    this.emitir(
      this.grupos().map((g) => {
        if (g.id !== grupoId) return g;
        return this.normalizarDefecto({ ...g, obligatorio });
      }),
    );
  }

  agregarOpcion(grupoId: number): void {
    this.emitir(
      this.grupos().map((g) => {
        if (g.id !== grupoId) return g;
        const nueva: OpcionProducto = {
          id: this.idTemporal(),
          etiqueta: 'Nueva variante',
          precioAdicional: 0,
          porDefecto: false,
        };
        return this.normalizarDefecto({ ...g, opciones: [...g.opciones, nueva] });
      }),
    );
  }

  actualizarOpcion(grupoId: number, opcionId: number, cambios: Partial<OpcionProducto>): void {
    this.emitir(
      this.grupos().map((g) => {
        if (g.id !== grupoId) return g;
        const opciones = g.opciones.map((o) => (o.id === opcionId ? { ...o, ...cambios } : o));
        return this.normalizarDefecto({ ...g, opciones });
      }),
    );
  }

  quitarOpcion(grupoId: number, opcionId: number): void {
    const grupo = this.grupos().find((g) => g.id === grupoId);
    if (!grupo || grupo.opciones.length <= 1) return;
    this.emitir(
      this.grupos().map((g) => {
        if (g.id !== grupoId) return g;
        const opciones = g.opciones.filter((o) => o.id !== opcionId);
        return this.normalizarDefecto({ ...g, opciones });
      }),
    );
  }

  valorTexto(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }

  valorNumero(event: Event): number {
    return Number((event.target as HTMLInputElement).value) || 0;
  }

  valorMarcado(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }

  /**
   * Garantiza que si el grupo es obligatorio, siempre el primer ítem quede marcado
   * por defecto para la carta (y si no es obligatorio, ninguno quede forzado).
   */
  private normalizarDefecto(grupo: GrupoOpciones): GrupoOpciones {
    return {
      ...grupo,
      opciones: grupo.opciones.map((o, idx) => ({
        ...o,
        porDefecto: grupo.obligatorio && idx === 0,
      })),
    };
  }

  private emitir(grupos: GrupoOpciones[]): void {
    this.cambiado.emit(grupos);
  }
}
