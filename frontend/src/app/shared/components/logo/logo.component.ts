import { Component, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

/** 'isotipo' = solo la "f" en cuadro coral · 'completo' = isotipo + palabra "foodaro". */
export type VarianteLogo = 'isotipo' | 'completo';
export type TamanioLogo = 'sm' | 'md' | 'lg';

/**
 * Logotipo oficial de Foodaro (brand kit: estilos_logos/foodaro.html).
 * En los encabezados de cada local se usa solo el isotipo para no competir
 * con el nombre del local.
 */
@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './logo.component.html',
  styleUrl: './logo.component.scss',
})
export class LogoComponente {
  readonly variante = input<VarianteLogo>('completo');
  readonly tamanio = input<TamanioLogo>('md');
  /** Destino del enlace; `null` lo renderiza sin enlace. */
  readonly href = input<string | null>('/');
  /** Fuerza la palabra en blanco (fondos oscuros). */
  readonly claro = input<boolean>(false);

  readonly clasesCuadro: Record<TamanioLogo, string> = {
    sm: 'w-8 h-8 rounded-xl text-2xl',
    md: 'w-9 h-9 sm:w-10 sm:h-10 rounded-2xl text-2xl sm:text-3xl',
    lg: 'w-12 h-12 rounded-2xl text-3xl',
  };

  readonly clasesPalabra: Record<TamanioLogo, string> = {
    sm: 'text-2xl',
    md: 'text-2xl sm:text-3xl',
    lg: 'text-4xl',
  };
}
