import { computed, inject, Injectable } from '@angular/core';

import { LocalServicio } from '../../core/services/local.service';
import { AccesoRapido, IndicadorInicio, PasoPuestaAPunto } from '../interfaces';

/**
 * Datos del panel de inicio del admin, derivados del local ya cargado
 * (sin pedidos al API adicionales): indicadores, puesta a punto y enlaces de la carta.
 */
@Injectable({ providedIn: 'root' })
export class InicioAdminServicio {
  private readonly local = inject(LocalServicio);

  readonly perfil = this.local.perfil;

  readonly disponibles = computed(() => this.local.productos().filter((p) => p.disponible).length);
  readonly agotados = computed(() => this.local.productos().filter((p) => !p.disponible));
  readonly promosActivas = computed(() => this.local.promociones().filter((p) => p.activa).length);
  readonly categoriasActivas = computed(() => this.local.categorias().filter((c) => c.activa).length);
  readonly conOpciones = computed(() => this.local.productos().filter((p) => p.gruposOpciones.length > 0).length);

  readonly indicadores = computed<IndicadorInicio[]>(() => [
    {
      etiqueta: 'Productos en carta',
      valor: this.disponibles(),
      detalle: this.agotados().length ? `${this.agotados().length} marcados como agotados` : 'Todos disponibles',
      icono: 'fa-utensils',
      estilo: 'bg-brand-50 dark:bg-brand-500/10 text-brand-600',
      ruta: 'productos',
    },
    {
      etiqueta: 'Categorías',
      valor: this.categoriasActivas(),
      detalle: `${this.local.categorias().length - this.categoriasActivas()} ocultas`,
      icono: 'fa-shapes',
      estilo: 'bg-sky-50 dark:bg-sky-500/10 text-sky-600',
      ruta: 'categorias',
    },
    {
      etiqueta: 'Promociones activas',
      valor: this.promosActivas(),
      detalle: `${this.local.promociones().length} en total`,
      icono: 'fa-tags',
      estilo: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600',
      ruta: 'promociones',
    },
    {
      etiqueta: 'Con opciones',
      valor: this.conOpciones(),
      detalle: `${this.local.plantillasOpciones().length} plantillas del local`,
      icono: 'fa-sliders',
      estilo: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600',
      ruta: 'productos',
    },
  ]);

  /** Checklist de puesta a punto del local (lo que hace falta para que la carta se vea completa). */
  readonly pasos = computed<PasoPuestaAPunto[]>(() => {
    const p = this.perfil();
    return [
      { id: 'logo', titulo: 'Logo y portada', descripcion: 'Son lo primero que ve el cliente en el banner.', completo: !!(p?.logoUrl && p?.portadaUrl), ruta: 'perfil' },
      { id: 'whatsapp', titulo: 'WhatsApp que recibe los pedidos', descripcion: 'A este número llegan los pedidos armados.', completo: !!p?.contacto.whatsappPedidos, ruta: 'perfil' },
      { id: 'horarios', titulo: 'Horarios y dirección', descripcion: 'Se muestran en la info del local.', completo: !!(p?.horarios.semana.some((d) => d.abierto) && p?.direccion), ruta: 'perfil' },
      { id: 'categorias', titulo: 'Al menos una categoría', descripcion: 'Agrupan los productos en la carta.', completo: this.categoriasActivas() > 0, ruta: 'categorias' },
      { id: 'productos', titulo: 'Al menos un producto disponible', descripcion: 'Con foto, precio y descripción.', completo: this.disponibles() > 0, ruta: 'productos' },
      { id: 'promo', titulo: 'Una promoción activa', descripcion: 'Opcional: aparece en el carrusel de la carta.', completo: this.promosActivas() > 0, ruta: 'promociones' },
    ];
  });

  readonly progreso = computed(() => {
    const pasos = this.pasos();
    const hechos = pasos.filter((p) => p.completo).length;
    return { hechos, total: pasos.length, porcentaje: Math.round((hechos / pasos.length) * 100) };
  });

  readonly accesos: AccesoRapido[] = [
    { titulo: 'Agregar producto', descripcion: 'Cargá un plato nuevo con sus opciones', icono: 'fa-plus', ruta: 'productos' },
    { titulo: 'Nueva promoción', descripcion: 'Cupón con % de descuento', icono: 'fa-ticket', ruta: 'promociones' },
    { titulo: 'Editar datos del local', descripcion: 'Banner, horarios, contacto', icono: 'fa-store', ruta: 'perfil' },
  ];

  /* ------------------------------ Enlaces de la carta ------------------------------ */

  readonly urlCarta = computed(() => `${window.location.origin}${this.local.ruta()}`);
  readonly urlMenu = computed(() => `${window.location.origin}${this.local.ruta('menu')}`);
  readonly urlPedido = computed(() => `${window.location.origin}${this.local.ruta('pedido')}`);

  urlImagenQr(tamanio = 220): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${tamanio}x${tamanio}&data=${encodeURIComponent(this.urlCarta())}&margin=10&color=22-25-29`;
  }

  urlDescargaQr(): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=800x800&data=${encodeURIComponent(this.urlCarta())}&margin=20`;
  }
}
