import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';

import { NotificacionesServicio } from '../../../nucleo/servicios/notificaciones.servicio';
import { UiClienteServicio } from '../../servicios/ui-cliente.servicio';
import { ModoCliente } from '../../interfaces';
import { EncabezadoClienteComponente } from '../../componentes/encabezado-cliente/encabezado-cliente.componente';
import { PieClienteComponente } from '../../componentes/pie-cliente/pie-cliente.componente';
import { HojaCarritoComponente } from '../../componentes/hoja-carrito/hoja-carrito.componente';
import { BarraCarritoMovilComponente } from '../../componentes/barra-carrito-movil/barra-carrito-movil.componente';
import { ModalPerfilLocalComponente } from '../../componentes/modal-perfil-local/modal-perfil-local.componente';
import { ModalCompartirQrComponente } from '../../componentes/modal-compartir-qr/modal-compartir-qr.componente';
import { ModalConfirmarPedidoComponente } from '../../componentes/modal-confirmar-pedido/modal-confirmar-pedido.componente';

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
  templateUrl: './layout-cliente.componente.html',
  styleUrl: './layout-cliente.componente.scss',
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
