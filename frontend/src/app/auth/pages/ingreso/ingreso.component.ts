import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { LogoComponente } from '../../../shared/components/logo/logo.component';
import { AlternarTemaComponente } from '../../../shared/components/alternar-tema/alternar-tema.component';
import { NotificacionesServicio } from '../../../core/services/notificaciones.service';
import { LocalServicio } from '../../../core/services/local.service';
import { AutenticacionServicio } from '../../services/autenticacion.service';
import { mensajeDeError } from '../../../shared/utils/api';

/** Inicio de sesión del encargado del local contra el API. */
@Component({
  selector: 'app-ingreso',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LogoComponente, AlternarTemaComponente],
  templateUrl: './ingreso.component.html',
  styleUrl: './ingreso.component.scss',
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
    email: ['', [Validators.required, Validators.email]],
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
      error: (err: unknown) => {
        this.error.set(mensajeDeError(err, 'No se pudo iniciar sesión'));
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
