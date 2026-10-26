import { Component, inject, input, output } from '@angular/core';

import { Producto } from '../../../shared/models';
import { PrecioPipe } from '../../../shared/pipes/precio.pipe';
import { UiClienteServicio } from '../../services/ui-cliente.service';

/** Tarjeta de producto en la grilla. Al tocarla abre el detalle. */
@Component({
  selector: 'app-tarjeta-producto',
  standalone: true,
  imports: [PrecioPipe],
  templateUrl: './tarjeta-producto.component.html',
  styleUrl: './tarjeta-producto.component.scss',
})
export class TarjetaProductoComponente {
  readonly ui = inject(UiClienteServicio);

  readonly producto = input.required<Producto>();
  readonly seleccionado = output<number>();

  abrir(): void {
    this.seleccionado.emit(this.producto().id);
  }
}
