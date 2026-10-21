import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { LogoComponente } from '../../../compartido/componentes/logo/logo.componente';
import { AlternarTemaComponente } from '../../../compartido/componentes/alternar-tema/alternar-tema.componente';
import { NotificacionesServicio } from '../../../nucleo/servicios/notificaciones.servicio';
import { LocalServicio } from '../../../nucleo/servicios/local.servicio';
import { AutenticacionServicio } from '../../servicios/autenticacion.servicio';

/** Inicio de sesión del encargado del local (mock: cualquier contraseña). */
@Component({
  selector: 'app-ingreso',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LogoComponente, AlternarTemaComponente],
  templateUrl: './ingreso.componente.html',
  styleUrl: './ingreso.componente.scss',
})
export class IngresoComponente implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly autenticacion = inject(AutenticacionServicio);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  private readonly notificaciones = inject(NotificacionesServicio);
  private readonly local = inject(LocalServicio);

  readonly perfil = this.local.perfil;
  readonly enlacePortada = this.local.url();

  readonly formulario = this.fb.nonNullable.group({
    email: ['admin@foodaro.net', [Validators.required, Validators.email]],
    contrasenia: ['', [Validators.required]],
  });

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly mostrarContrasenia = signal(false);

  ngOnInit(): void {
    this.notificaciones.definirPosicion('abajo-derecha');
    if (this.autenticacion.estaAutenticado()) {
      this.router.navigateByUrl(this.urlRetorno());
    }
  }

  enviar(): void {
    if (this.formulario.invalid || this.cargando()) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    this.autenticacion.ingresar(this.formulario.getRawValue()).subscribe({
      next: () => {
        this.notificaciones.mostrar('¡Bienvenido al panel de tu local!');
        this.router.navigateByUrl(this.urlRetorno());
      },
      error: (err: { message?: string }) => {
        this.error.set(err?.message ?? 'No se pudo iniciar sesión');
        this.cargando.set(false);
      },
    });
  }

  alternarContrasenia(): void {
    this.mostrarContrasenia.update((v) => !v);
  }

  tieneError(control: 'email' | 'contrasenia'): boolean {
    const c = this.formulario.controls[control];
    return c.invalid && (c.touched || c.dirty);
  }

  private urlRetorno(): string {
    return this.ruta.snapshot.queryParamMap.get('volverA') ?? this.local.ruta('admin');
  }
}
