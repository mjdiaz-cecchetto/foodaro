import { Component } from '@angular/core';

/** Pie discreto con la marca del sistema. */
@Component({
  selector: 'app-pie-cliente',
  standalone: true,
  templateUrl: './pie-cliente.component.html',
  styleUrl: './pie-cliente.component.scss',
})
export class PieClienteComponente {
  readonly anio = new Date().getFullYear();
}
