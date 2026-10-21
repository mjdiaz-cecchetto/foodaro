import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';

import { NotificacionesServicio } from '../../../core/services/notificaciones.service';
import { UiClienteServicio } from '../../services/ui-cliente.service';
import { ModoCliente } from '../../interfaces';
import { EncabezadoClienteComponente } from '../../components/encabezado-cliente/encabezado-cliente.component';
import { PieClienteComponente } from '../../components/pie-cliente/pie-cliente.component';
import { HojaCarritoComponente } from '../../components/hoja-carrito/hoja-carrito.component';
import { BarraCarritoMovilComponente } from '../../components/barra-carrito-movil/barra-carrito-movil.component';
import { ModalPerfilLocalComponente } from '../../components/modal-perfil-local/modal-perfil-local.component';
import { ModalCompartirQrComponente } from '../../components/modal-compartir-qr/modal-compartir-qr.component';
import { ModalConfirmarPedidoComponente } from '../../components/modal-confirmar-pedido/modal-confirmar-pedido.component';

/**
 * Layout de la carta pública. El modo viene de la ruta (`data.modo`):
 * 'menu' = solo lectura, 'pedido' = con carrito, confirmación y envío del pedido.
 */
@Component({
  selector: 'app-layout-cliente',
  standalone: true,
  imports: [
    RouterOutlet,
    EncabezadoClienteComponente,
    PieClienteComponente,
    HojaCarritoComponente,
    BarraCarritoMovilComponente,
    ModalPerfilLocalComponente,
    ModalCompartirQrComponente,
    ModalConfirmarPedidoComponente,
  ],
  templateUrl: './layout-cliente.component.html',
  styleUrl: './layout-cliente.component.scss',
})
export class LayoutClienteComponente implements OnInit {
  private readonly notificaciones = inject(NotificacionesServicio);
  private readonly ruta = inject(ActivatedRoute);
  readonly ui = inject(UiClienteServicio);

  ngOnInit(): void {
    this.notificaciones.definirPosicion('arriba');
    const modo = (this.ruta.snapshot.data['modo'] as ModoCliente | undefined) ?? 'pedido';
    this.ui.definirModo(modo);
  }
}
