/**
 * Convierte un enlace de Google Maps (o una dirección) en una URL embebible
 * sin API key: https://www.google.com/maps?q=<consulta>&output=embed
 */
export function urlMapaEmbebido(mapsUrl: string | null | undefined, direccion = ''): string | null {
  const consulta = consultaDesdeEnlace(mapsUrl) ?? (direccion.trim() || null);
  if (!consulta) return null;
  return `https://www.google.com/maps?q=${encodeURIComponent(consulta)}&z=16&output=embed`;
}

/** Extrae la consulta de distintos formatos de enlace de Google Maps. */
function consultaDesdeEnlace(mapsUrl: string | null | undefined): string | null {
  const texto = (mapsUrl ?? '').trim();
  if (!texto) return null;

  let url: URL;
  try {
    url = new URL(texto);
  } catch {
    return null;
  }

  // ?q=... (maps.google.com/?q=Av.+Belgrano+1850) o ?query=... (maps/search/?api=1&query=...)
  const q = url.searchParams.get('q') ?? url.searchParams.get('query');
  if (q) return q;

  // /maps/place/<nombre>/@lat,lng,17z
  const coordenadas = url.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (coordenadas) return `${coordenadas[1]},${coordenadas[2]}`;

  const lugar = url.pathname.match(/\/maps\/place\/([^/]+)/);
  if (lugar) return decodeURIComponent(lugar[1].replace(/\+/g, ' '));

  // Enlaces cortos (maps.app.goo.gl) no se pueden resolver desde el navegador: se usa la dirección.
  return null;
}
