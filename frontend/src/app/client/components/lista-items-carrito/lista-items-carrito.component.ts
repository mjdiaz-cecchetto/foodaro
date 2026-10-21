import { Component, inject, input } from '@angular/core';

import { PrecioPipe } from '../../../shared/pipes/precio.pipe';
import { CarritoServicio } from '../../services/carrito.service';
import { ItemCarrito } from '../../interfaces';

/** Listado de líneas de la comanda con sus opciones, notas y stepper. Compartido por panel y hoja. */
@Component({
  selector: 'app-lista-items-carrito',
  standalone: true,
  imports: [PrecioPipe],
  templateUrl: './lista-items-carrito.component.html',
  styleUrl: './lista-items-carrito.component.scss',
})
export class ListaItemsCarritoComponente {
  private readonly carrito = inject(CarritoServicio);

  /** 'compacto' reduce la foto y los espacios (hoja móvil). */
  readonly densidad = input<'normal' | 'compacto'>('normal');

  readonly items = this.carrito.items;

  describirOpciones(item: ItemCarrito): string {
    return item.opciones.map((o) => o.etiqueta).join(' · ');
  }

  modificar(clave: string, delta: number): void {
    this.carrito.modificarCantidad(clave, delta);
  }
}
