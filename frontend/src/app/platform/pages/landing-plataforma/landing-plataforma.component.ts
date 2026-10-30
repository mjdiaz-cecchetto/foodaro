import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { ModalComponente } from '../../../shared/components/modal/modal.component';
import { LogoComponente } from '../../../shared/components/logo/logo.component';
import { AlternarTemaComponente } from '../../../shared/components/alternar-tema/alternar-tema.component';
import { NotificacionesServicio } from '../../../core/services/notificaciones.service';
import { SLUG_LOCAL_DEMO } from '../../../shared/mocks';
import { RespuestaApi } from '../../../shared/utils/api';
import { ClaveRubro, DemoRubro, Plan } from '../../interfaces';
import {
  DEMOS_RUBRO,
  PLANES,
  PREGUNTAS_FRECUENTES,
  TASA_COMISION_MARKETPLACE,
  WHATSAPP_REGISTRO_FOODARO,
  WHATSAPP_VENTAS_FOODARO,
} from '../../mocks/landing.mock';

/**
 * Landing de foodaro.net (réplica de maquetas/landing-principal.html):
 * navbar flotante, hero con mockup multirrubro, calculadora de ahorro,
 * beneficios, comparativa, planes, FAQ y modal de registro.
 */
@Component({
  selector: 'app-landing-plataforma',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, LogoComponente, AlternarTemaComponente, ModalComponente],
  templateUrl: './landing-plataforma.component.html',
  styleUrl: './landing-plataforma.component.scss',
})
export class LandingPlataformaComponente implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly ruta = inject(ActivatedRoute);
  private readonly notificaciones = inject(NotificacionesServicio);
  private readonly fb = inject(FormBuilder);

  /* ------------------------------ Datos ------------------------------ */
  readonly enlaceDemo = ['/', SLUG_LOCAL_DEMO];
  readonly rubros = DEMOS_RUBRO;
  readonly planesLista = signal<Plan[]>(PLANES);
  get planes(): Plan[] {
    return this.planesLista();
  }
  readonly preguntas = PREGUNTAS_FRECUENTES;
  readonly whatsappVentas = `https://wa.me/${WHATSAPP_VENTAS_FOODARO}?text=${encodeURIComponent('Hola! Quiero conocer Foodaro para mi comercio')}`;
  readonly qrVistaPrevia = 'https://api.qrserver.com/v1/create-qr-code/?size=50x50&data=https://foodaro.net';
  readonly anio = new Date().getFullYear();

  /* ------------------------------ Estado ------------------------------ */
  readonly menuMovilAbierto = signal(false);
  readonly rubro = signal<ClaveRubro>('gastro');
  readonly demo = computed<DemoRubro>(() => this.rubros.find((r) => r.clave === this.rubro()) ?? this.rubros[0]);

  readonly ventas = signal(4_000_000);
  readonly perdidaComision = computed(() => Math.round(this.ventas() * TASA_COMISION_MARKETPLACE));
  readonly ahorroAnual = computed(() => Math.round(Math.max(0, this.perdidaComision() - PLANES[1].mensual) * 12));

  readonly facturacionAnual = signal(false);

  readonly registroAbierto = signal(false);
  readonly formularioRegistro = this.fb.nonNullable.group({
    nombreComercio: ['', [Validators.required, Validators.minLength(2)]],
    ciudad: ['', [Validators.required]],
    whatsapp: ['', [Validators.required, Validators.pattern(/^[\d\s()+-]{6,}$/)]],
    plan: [PLANES[1].id, [Validators.required]],
  });

  /** Slug inexistente con el que llegó el visitante (desde localGuardia). */
  readonly slugFaltante = signal<string | null>(null);

  ngOnInit(): void {
    this.notificaciones.definirPosicion('arriba');
    this.slugFaltante.set(this.ruta.snapshot.queryParamMap.get('local'));
    this.http.get<RespuestaApi<Plan[]>>(`${environment.apiUrl}/planes`).subscribe({
      next: ({ data }) => {
        if (Array.isArray(data)) {
          this.planesLista.set(data.map((p) => ({ ...p, id: String(p.nombre) })));
        }
      },
      error: () => {
        /* mantiene PLANES por defecto */
      },
    });
  }

  /* ------------------------------ Acciones ------------------------------ */

  alternarMenuMovil(): void {
    this.menuMovilAbierto.update((v) => !v);
  }

  cerrarMenuMovil(): void {
    this.menuMovilAbierto.set(false);
  }

  elegirRubro(clave: ClaveRubro): void {
    this.rubro.set(clave);
  }

  alCambiarVentas(event: Event): void {
    this.ventas.set(Number((event.target as HTMLInputElement).value));
  }

  alternarFacturacion(): void {
    this.facturacionAnual.update((v) => !v);
  }

  precioPlan(plan: Plan): number {
    return this.facturacionAnual() ? plan.anual : plan.mensual;
  }

  dinero(valor: number): string {
    return `$ ${new Intl.NumberFormat('es-AR').format(valor)}`;
  }

  abrirRegistro(planId = PLANES[1].id): void {
    this.formularioRegistro.controls.plan.setValue(planId);
    this.registroAbierto.set(true);
  }

  cerrarRegistro(): void {
    this.registroAbierto.set(false);
  }

  invalido(control: 'nombreComercio' | 'ciudad' | 'whatsapp'): boolean {
    const c = this.formularioRegistro.controls[control];
    return c.invalid && (c.touched || c.dirty);
  }

  enviarRegistro(): void {
    if (this.formularioRegistro.invalid) {
      this.formularioRegistro.markAllAsTouched();
      return;
    }
    const v = this.formularioRegistro.getRawValue();
    this.http
      .post(`${environment.apiUrl}/solicitudes`, {
        nombreComercio: v.nombreComercio,
        ciudad: v.ciudad,
        whatsapp: v.whatsapp,
        plan: v.plan,
      })
      .subscribe({
        error: () => {
          /* incluso si el backend no está disponible, abrimos WhatsApp igual */
        },
      });

    const mensaje = encodeURIComponent(
      `Hola! Acabo de registrar "${v.nombreComercio}" (${v.ciudad}) para los 30 días de prueba gratis de Foodaro (${v.plan}). Mi número es ${v.whatsapp}.`,
    );
    this.cerrarRegistro();
    window.open(`https://wa.me/${WHATSAPP_REGISTRO_FOODARO}?text=${mensaje}`, '_blank', 'noopener');
    this.notificaciones.mostrar('¡Solicitud registrada! Te contactamos por WhatsApp para activar tus 30 días gratis.');
  }
}
