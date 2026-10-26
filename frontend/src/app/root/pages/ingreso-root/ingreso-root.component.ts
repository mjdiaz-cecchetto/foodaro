import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { LogoComponente } from '../../../shared/components/logo/logo.component';
import { AlternarTemaComponente } from '../../../shared/components/alternar-tema/alternar-tema.component';
import { NotificacionesServicio } from '../../../core/services/notificaciones.service';
import { RootAutenticacionServicio } from '../../services/root-autenticacion.service';
import { mensajeDeError } from '../../../shared/utils/api';

/** Acceso exclusivo para el Superadmin (Root) de la plataforma Foodaro. */
@Component({
  selector: 'app-ingreso-root',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LogoComponente, AlternarTemaComponente],
  templateUrl: './ingreso-root.component.html',
})
export class IngresoRootComponente implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly autenticacion = inject(RootAutenticacionServicio);
  private readonly router = inject(Router);
  private readonly notificaciones = inject(NotificacionesServicio);

  readonly formulario = this.fb.nonNullable.group({
    email: ['root@foodaro.com', [Validators.required, Validators.email]],
    contrasenia: ['', [Validators.required]],
  });

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly mostrarContrasenia = signal(false);

  ngOnInit(): void {
    this.notificaciones.definirPosicion('abajo-derecha');
    if (this.autenticacion.estaAutenticado()) {
      this.router.navigateByUrl('/root');
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
        this.notificaciones.mostrar('¡Bienvenido al Panel Root de Foodaro!');
        this.router.navigateByUrl('/root');
      },
      error: (err: unknown) => {
        this.error.set(mensajeDeError(err, 'Credenciales inválidas'));
        this.cargando.set(false);
      },
    });
  }

  alternarContrasenia(): void {
    this.mostrarContrasenia.update((v) => !v);
  }
}
