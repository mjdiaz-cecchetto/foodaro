/** Formatea un importe en formato es-AR para usos fuera de templates (ej. mensaje de WhatsApp). */
export function formatearMoneda(valor: number, moneda: string): string {
  const sinDecimales = moneda === 'ARS';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: moneda,
    minimumFractionDigits: sinDecimales ? 0 : 2,
    maximumFractionDigits: sinDecimales ? 0 : 2,
  }).format(valor);
}
