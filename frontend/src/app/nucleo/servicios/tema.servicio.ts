import { Injectable, signal } from '@angular/core';

const CLAVE_ALMACENAMIENTO = 'foodaro_tema';

/**
 * Maneja el modo claro/oscuro aplicando la clase `dark` en <html>.
 * Persiste la elección en localStorage.
 */
@Injectable({ providedIn: 'root' })
export class TemaServicio {
  readonly esOscuro = signal<boolean>(false);

  constructor() {
    this.inicializar();
  }

  private inicializar(): void {
    const guardado = this.leer();
    const prefiereOscuro = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    this.aplicar(guardado === 'dark' || (!guardado && prefiereOscuro));
  }

  alternar(): boolean {
    const siguiente = !this.esOscuro();
    this.aplicar(siguiente);
    this.guardar(siguiente ? 'dark' : 'light');
    return siguiente;
  }

  private aplicar(oscuro: boolean): void {
    document.documentElement.classList.toggle('dark', oscuro);
    this.esOscuro.set(oscuro);
  }

  private leer(): string | null {
    try {
      return localStorage.getItem(CLAVE_ALMACENAMIENTO);
    } catch {
      return null;
    }
  }

  private guardar(valor: string): void {
    try {
      localStorage.setItem(CLAVE_ALMACENAMIENTO, valor);
    } catch {
      /* almacenamiento no disponible: se ignora */
    }
  }
}
