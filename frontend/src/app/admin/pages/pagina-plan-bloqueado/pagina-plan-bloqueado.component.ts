import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { LocalServicio } from '../../../core/services/local.service';

interface InfoCapacidadBloqueada {
  titulo: string;
  subtitulo: string;
  planRequerido: string;
  icono: string;
  colorIcono: string;
  beneficios: string[];
}

const DICCIONARIO_BLOQUEOS: Record<string, InfoCapacidadBloqueada> = {
  pedidos_en_vivo: {
    titulo: 'Consola de Pedidos en Vivo y Arqueos',
    subtitulo: 'Controlá despachos en tiempo real con alertas sonoras, comanda térmica de cocina y cierre de caja en Excel.',
    planRequerido: 'Control de Pedidos & Stock',
    icono: 'fa-cash-register',
    colorIcono: 'from-brand-500 to-amber-600',
    beneficios: [
      'Auto-refresco cada 15 s y alerta sonora de nuevos pedidos',
      'Tablero Kanban interactivo con arrastre de etapas',
      'Comandas térmicas (58 y 80 mm) para Cocina y Cliente',
      'Arqueo diario, semanal y mensual con exportación a Excel',
      'Productos ilimitados en tu carta digital',
    ],
  },
  promociones_cupones: {
    titulo: 'Promociones y Cupones de Descuento',
    subtitulo: 'Fidelizá a tus clientes con banners rotativos destacados y cupones de descuento configurables.',
    planRequerido: 'Control de Pedidos & Stock',
    icono: 'fa-tags',
    colorIcono: 'from-rose-500 to-pink-600',
    beneficios: [
      'Banners promocionales con botón directo a platos en oferta',
      'Cupones con código único (% o monto fijo de descuento)',
      'Reglas de vigencia por fecha y monto mínimo de compra',
      'Aumento directo del ticket promedio de compra',
    ],
  },
  personal_asistencia: {
    titulo: 'Personal y Control de Asistencia',
    subtitulo: 'Registrá entradas y salidas de tu equipo, calculá horas trabajadas y liquidá jornales diarios en 1 clic.',
    planRequerido: 'Full / Operación Completa',
    icono: 'fa-users-gear',
    colorIcono: 'from-indigo-500 to-purple-600',
    beneficios: [
      'Alta de empleados con rol y tarifa por hora ($/h)',
      'Fichaje de entrada y salida con fecha y hora exacta',
      'Cálculo automático de horas y paga proporcional diaria',
      'Control de jornales Pagados vs. Sin pagar',
    ],
  },
  limite_productos: {
    titulo: 'Catálogo de Productos Ilimitado',
    subtitulo: 'Alcanzaste el límite de 50 productos de tu plan Inicial. Mejorá al Plan Control para cargar todos los platos y bebidas que quieras.',
    planRequerido: 'Control de Pedidos & Stock',
    icono: 'fa-boxes-stacked',
    colorIcono: 'from-amber-500 to-orange-600',
    beneficios: [
      'Productos y categorías 100% ilimitados',
      'Consola de pedidos en vivo con auto-refresco y sonido',
      'Comandas térmicas para cocina (58 y 80 mm) y ticket de cliente',
      'Arqueo de caja y exportación a Excel',
      'Banners promocionales y cupones de descuento',
    ],
  },
};

const BLOQUEO_POR_DEFECTO: InfoCapacidadBloqueada = {
  titulo: 'Función exclusiva de un plan superior',
  subtitulo: 'Mejorá tu plan para desbloquear herramientas avanzadas de gestión y potenciar las ventas de tu local.',
  planRequerido: 'Control de Pedidos & Stock',
  icono: 'fa-lock',
  colorIcono: 'from-brand-500 to-brand-700',
  beneficios: [
    'Herramientas avanzadas de gestión y despacho',
    'Mayor control sobre los cobros y la operación diaria',
    'Soporte prioritario y catálogo sin límites',
  ],
};

@Component({
  selector: 'app-pagina-plan-bloqueado',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './pagina-plan-bloqueado.component.html',
})
export class PaginaPlanBloqueadoComponente {
  private readonly route = inject(ActivatedRoute);
  readonly local = inject(LocalServicio);

  private readonly queryParams = toSignal(this.route.queryParams, {
    initialValue: {} as Record<string, string | undefined>,
  });

  readonly capacidad = computed(() => {
    const params = this.queryParams() as Record<string, string | undefined>;
    return params['capacidad'] || 'pedidos_en_vivo';
  });

  readonly info = computed(() => DICCIONARIO_BLOQUEOS[this.capacidad()] ?? BLOQUEO_POR_DEFECTO);

  readonly enlaceWhatsAppUpgrade = computed(() => {
    const p = this.local.perfil();
    const nombre = p?.nombre || 'Mi Local';
    const slug = this.local.slug() || '';
    const plan = this.info().planRequerido;
    const modulo = this.info().titulo;

    const mensaje = `Hola Foodaro! 👋 Soy de *${nombre}* (foodaro.net/${slug}) y quiero mejorar mi plan a *${plan}* para desbloquear *${modulo}*.`;

    return `https://wa.me/5493853115268?text=${encodeURIComponent(mensaje)}`;
  });
}
