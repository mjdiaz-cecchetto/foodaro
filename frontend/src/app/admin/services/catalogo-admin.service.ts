import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Categoria, GrupoOpciones, Producto } from '../../shared/models';
import { RespuestaApi } from '../../shared/utils/api';
import { LocalServicio } from '../../core/services/local.service';
import { ValorFormularioCategoria, ValorFormularioProducto } from '../interfaces';

/**
 * ABM de categorías, productos y plantillas de opciones del local activo contra el API.
 * Cada operación actualiza las señales del LocalServicio (misma fuente que la carta).
 */
@Injectable({ providedIn: 'root' })
export class CatalogoAdminServicio {
  private readonly http = inject(HttpClient);
  private readonly local = inject(LocalServicio);
  private readonly api = `${environment.apiUrl}/admin`;

  readonly categorias = this.local.categorias;
  readonly productos = this.local.productos;
  readonly plantillasOpciones = this.local.plantillasOpciones;

  readonly cantidadCategorias = computed(() => this.categorias().length);
  readonly cantidadProductos = computed(() => this.productos().length);

  /* ------------------------------ Categorías ------------------------------ */

  cantidadProductosPorCategoria(categoriaId: number): number {
    return this.productos().filter((p) => p.categoriaId === categoriaId).length;
  }

  nombreCategoria(categoriaId: number): string {
    return this.categorias().find((c) => c.id === categoriaId)?.nombre ?? '—';
  }

  crearCategoria(valor: ValorFormularioCategoria): Observable<Categoria> {
    return this.http.post<RespuestaApi<Categoria>>(`${this.api}/categorias`, valor).pipe(
      map((r) => r.data),
      tap((categoria) => this.categorias.update((lista) => [...lista, categoria])),
    );
  }

  actualizarCategoria(id: number, valor: ValorFormularioCategoria): Observable<Categoria> {
    return this.http.put<RespuestaApi<Categoria>>(`${this.api}/categorias/${id}`, valor).pipe(
      map((r) => r.data),
      tap((categoria) => this.categorias.update((lista) => lista.map((c) => (c.id === id ? categoria : c)))),
    );
  }

  /** El API responde 409 si la categoría tiene productos. */
  eliminarCategoria(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/categorias/${id}`).pipe(
      tap(() => this.categorias.update((lista) => lista.filter((c) => c.id !== id))),
    );
  }

  /** Actualiza el orden de las categorías (optimista + API). */
  reordenarCategorias(ids: number[]): Observable<Categoria[]> {
    this.categorias.update((lista) => {
      const porId = new Map(lista.map((c) => [c.id, c]));
      return ids.map((id, i) => ({ ...porId.get(id)!, orden: i })).filter(Boolean);
    });
    return this.http.patch<RespuestaApi<Categoria[]>>(`${this.api}/categorias/reordenar`, { ids }).pipe(
      map((r) => r.data),
      tap((categorias) => this.categorias.set(categorias)),
    );
  }

  /* ------------------------------- Productos ------------------------------ */

  filtrarProductos(busqueda: string, categoriaId: number | 'todas'): Producto[] {
    const texto = busqueda.trim().toLowerCase();
    return this.productos().filter((p) => {
      const coincideTexto = p.nombre.toLowerCase().includes(texto) || p.descripcion.toLowerCase().includes(texto);
      const coincideCategoria = categoriaId === 'todas' || p.categoriaId === categoriaId;
      return coincideTexto && coincideCategoria;
    });
  }

  crearProducto(valor: ValorFormularioProducto): Observable<Producto> {
    return this.http.post<RespuestaApi<Producto>>(`${this.api}/productos`, valor).pipe(
      map((r) => r.data),
      tap((producto) => this.productos.update((lista) => [producto, ...lista])),
    );
  }

  actualizarProducto(id: number, valor: ValorFormularioProducto): Observable<Producto> {
    return this.http.put<RespuestaApi<Producto>>(`${this.api}/productos/${id}`, valor).pipe(
      map((r) => r.data),
      tap((producto) => this.productos.update((lista) => lista.map((p) => (p.id === id ? producto : p)))),
    );
  }

  alternarDisponibilidad(id: number): Observable<Producto> {
    return this.http.patch<RespuestaApi<Producto>>(`${this.api}/productos/${id}/disponibilidad`, {}).pipe(
      map((r) => r.data),
      tap((producto) => this.productos.update((lista) => lista.map((p) => (p.id === id ? producto : p)))),
    );
  }

  eliminarProducto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/productos/${id}`).pipe(
      tap(() => this.productos.update((lista) => lista.filter((p) => p.id !== id))),
    );
  }

  /** Actualiza el orden de los productos (optimista + API). */
  reordenarProductos(ids: number[]): Observable<Producto[]> {
    this.productos.update((lista) => {
      const porId = new Map(lista.map((p) => [p.id, p]));
      return ids.map((id, i) => ({ ...porId.get(id)!, orden: i })).filter(Boolean);
    });
    return this.http.patch<RespuestaApi<Producto[]>>(`${this.api}/productos/reordenar`, { ids }).pipe(
      map((r) => r.data),
      tap((productos) => this.productos.set(productos)),
    );
  }

  /* ------------------------- Plantillas de opciones ----------------------- */

  /** Crea o actualiza una plantilla del local a partir de un grupo (se compara por nombre). */
  guardarPlantilla(grupo: GrupoOpciones): Observable<GrupoOpciones> {
    const existente = this.plantillasOpciones().find((p) => p.nombre.trim().toLowerCase() === grupo.nombre.trim().toLowerCase());
    const cuerpo = { nombre: grupo.nombre, tipo: grupo.tipo, obligatorio: grupo.obligatorio, maximo: grupo.maximo ?? null, opciones: grupo.opciones };

    const peticion = existente
      ? this.http.put<RespuestaApi<GrupoOpciones>>(`${this.api}/plantillas-opciones/${existente.id}`, cuerpo)
      : this.http.post<RespuestaApi<GrupoOpciones>>(`${this.api}/plantillas-opciones`, cuerpo);

    return peticion.pipe(
      map((r) => r.data),
      tap((plantilla) =>
        this.plantillasOpciones.update((lista) =>
          existente ? lista.map((p) => (p.id === existente.id ? plantilla : p)) : [...lista, plantilla],
        ),
      ),
    );
  }

  eliminarPlantilla(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/plantillas-opciones/${id}`).pipe(
      tap(() => this.plantillasOpciones.update((lista) => lista.filter((p) => p.id !== id))),
    );
  }
}
