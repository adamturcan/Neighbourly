/** Approximate distance in km between two coordinates (equirectangular) */
export function km(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const x =
    (b.lng - a.lng) * Math.cos(((a.lat + b.lat) / 2) * (Math.PI / 180));
  const y = b.lat - a.lat;
  return Math.sqrt(x * x + y * y) * (Math.PI / 180) * R;
}
