import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ModalComponente } from '../../../shared/components/modal/modal.component';
import { NotificacionesServicio } from '../../../core/services/notificaciones.service';
import { CatalogoAdminServicio } from '../../services/catalogo-admin.service';
import { InicioAdminServicio } from '../../services/inicio-admin.service';
import { Producto } from '../../../shared/models';
import { mensajeDeError } from '../../../shared/utils/api';

export type DestinoQr = 'pedido' | 'menu' | 'portada';

/** Panel principal del admin: estado de la carta, puesta a punto, accesos rápidos y cartel QR imprimible. */
@Component({
  selector: 'app-pagina-inicio',
  standalone: true,
  imports: [RouterLink, FormsModule, ModalComponente],
  templateUrl: './pagina-inicio.component.html',
  styleUrl: './pagina-inicio.component.scss',
})
export class PaginaInicioComponente {
  private readonly notificaciones = inject(NotificacionesServicio);
  private readonly catalogo = inject(CatalogoAdminServicio);
  readonly inicio = inject(InicioAdminServicio);

  readonly saludo = this.calcularSaludo();

  /** Configuración del cartel QR imprimible. */
  readonly modalCartelAbierto = signal(false);
  readonly destinoQr = signal<DestinoQr>('pedido');
  readonly tituloCartel = signal('¡Bienvenido a tu mesa!');
  readonly subtituloCartel = signal(
    'Escaneá con tu celular para ver las opciones, fotos de los platos y hacer tu pedido sin esperas.',
  );

  readonly urlQrActual = computed(() => this.inicio.urlImagenQr(340, this.destinoQr()));
  readonly urlDestinoActual = computed(() => this.inicio.urlPorDestino(this.destinoQr()));

  abrirModalCartel(): void {
    this.modalCartelAbierto.set(true);
  }

  cerrarModalCartel(): void {
    this.modalCartelAbierto.set(false);
  }

  async copiar(url: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(url);
      this.notificaciones.mostrar('Enlace copiado al portapapeles');
    } catch {
      this.notificaciones.mostrar('No se pudo copiar el enlace');
    }
  }

  /** Vuelve a poner en carta un producto agotado desde el inicio. */
  reponer(producto: Producto): void {
    this.catalogo.alternarDisponibilidad(producto.id).subscribe({
      next: () => this.notificaciones.mostrar(`${producto.nombre} vuelve a estar disponible`),
      error: (err: unknown) => this.notificaciones.mostrar(mensajeDeError(err)),
    });
  }

  /** Abre una ventana limpia lista para imprimir el cartel QR en alta calidad o guardar como PDF. */
  imprimirCartel(): void {
    const perfil = this.inicio.perfil();
    const nombreLocal = this.escaparHtml(perfil?.nombre || 'Nuestro Local');
    const rubroLocal = this.escaparHtml(perfil?.rubro || 'CARTA DIGITAL & PEDIDOS');
    const logoUrl = perfil?.logoUrl ? this.escaparHtml(perfil.logoUrl) : '';
    const qrUrl = this.inicio.urlImagenQr(600, this.destinoQr());
    const titulo = this.escaparHtml(this.tituloCartel().trim() || '¡Bienvenido a tu mesa!');
    const subtitulo = this.escaparHtml(
      this.subtituloCartel().trim() ||
        'Escaneá con tu celular para ver las opciones, fotos de los platos y hacer tu pedido sin esperas.',
    );

    const ventana = window.open('', '_blank', 'width=820,height=980');
    if (!ventana) {
      this.notificaciones.mostrar('Habilitá las ventanas emergentes para imprimir el cartel');
      return;
    }

    const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Cartel QR · ${nombreLocal}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Plus+Jakarta+Sans:wght@500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      background: #f4f4f5;
      color: #18181b;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .cartel {
      width: 100%;
      max-width: 460px;
      background: #ffffff;
      border: 2.5px dashed #d4d4d8;
      border-radius: 36px;
      padding: 40px 36px 32px;
      text-align: center;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.06);
    }
    .sistema-top {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }
    .isotipo {
      width: 34px;
      height: 34px;
      border-radius: 11px;
      background: linear-gradient(135deg, #e11d48, #ff4d4d);
      color: #ffffff;
      font-family: 'Caveat', cursive;
      font-size: 26px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6px 16px rgba(225, 29, 72, 0.28);
      line-height: 1;
    }
    .marca-foodaro {
      font-family: 'Caveat', cursive;
      font-size: 30px;
      font-weight: 700;
      color: #ef4444;
      line-height: 1;
    }
    .local-bloque {
      margin-bottom: 22px;
    }
    .local-logo {
      width: 68px;
      height: 68px;
      border-radius: 18px;
      object-fit: cover;
      margin: 0 auto 10px;
      display: block;
      border: 2px solid #f4f4f5;
      box-shadow: 0 6px 18px rgba(0,0,0,0.08);
    }
    .local-nombre {
      font-size: 32px;
      font-weight: 900;
      color: #09090b;
      letter-spacing: -0.03em;
      line-height: 1.1;
    }
    .local-sub {
      margin-top: 6px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #a1a1aa;
    }
    .qr-marco {
      margin: 0 auto 26px;
      padding: 20px;
      border-radius: 28px;
      background: #fafafa;
      border: 1.5px solid #e4e4e7;
      display: inline-block;
      box-shadow: inset 0 2px 6px rgba(0,0,0,0.03);
    }
    .qr-img {
      width: 270px;
      height: 270px;
      display: block;
      border-radius: 12px;
    }
    .cta-titulo {
      font-size: 22px;
      font-weight: 800;
      color: #09090b;
      letter-spacing: -0.02em;
      margin-bottom: 8px;
    }
    .cta-texto {
      font-size: 13.5px;
      font-weight: 500;
      color: #71717a;
      line-height: 1.5;
      max-width: 320px;
      margin: 0 auto 24px;
    }
    .pie {
      border-top: 1px solid #f4f4f5;
      padding-top: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 24px;
      font-size: 12px;
      font-weight: 700;
      color: #71717a;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .cartel { box-shadow: none; margin: 0 auto; }
    }
  </style>
</head>
<body>
  <div class="cartel">
    <div class="sistema-top">
      <span class="isotipo">f</span>
      <span class="marca-foodaro">foodaro</span>
    </div>

    <div class="local-bloque">
      ${logoUrl ? `<img src="${logoUrl}" alt="" class="local-logo" />` : ''}
      <h1 class="local-nombre">${nombreLocal}</h1>
      <p class="local-sub">${rubroLocal} · CARTA DIGITAL &amp; PEDIDOS</p>
    </div>

    <div class="qr-marco">
      <img src="${qrUrl}" alt="QR" class="qr-img" onload="setTimeout(() => window.print(), 250)" />
    </div>

    <h2 class="cta-titulo">${titulo}</h2>
    <p class="cta-texto">${subtitulo}</p>

    <div class="pie">
      <span>📶 Wi-Fi Libre</span>
      <span>📱 Sin Apps</span>
    </div>
  </div>
</body>
</html>`;

    ventana.document.open();
    ventana.document.write(html);
    ventana.document.close();
  }

  private escaparHtml(texto: string): string {
    return texto
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private calcularSaludo(): string {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buen día';
    if (hora < 20) return 'Buenas tardes';
    return 'Buenas noches';
  }
}
