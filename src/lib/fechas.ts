export function fechaLocalISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function hoyISO(): string {
  return fechaLocalISO(new Date());
}

export function desdeISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function sumarDias(iso: string, dias: number): string {
  const f = desdeISO(iso);
  f.setDate(f.getDate() + dias);
  return fechaLocalISO(f);
}

const FMT_LARGO = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const FMT_CORTO = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit' });
const FMT_MEDIO = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' });

/** 'sábado, 8 de agosto' */
export function formatoLargo(iso: string): string {
  return FMT_LARGO.format(desdeISO(iso));
}

/** '08/08' */
export function formatoCorto(iso: string): string {
  return FMT_CORTO.format(desdeISO(iso));
}

/** '8 ago' */
export function formatoMedio(iso: string): string {
  return FMT_MEDIO.format(desdeISO(iso));
}

export function etiquetaRelativa(iso: string): string | null {
  const hoy = hoyISO();
  if (iso === hoy) return 'Hoy';
  if (iso === sumarDias(hoy, -1)) return 'Ayer';
  if (iso === sumarDias(hoy, 1)) return 'Mañana';
  return null;
}

export const DIAS_SEMANA_CORTO = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
export const DIAS_SEMANA_LARGO = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
];

/** Devuelve las 7 fechas ISO de la semana que contiene `iso`. */
export function semanaDe(iso: string, primerDiaSemana: 0 | 1 = 1): string[] {
  const f = desdeISO(iso);
  const dow = f.getDay();
  const offset = (dow - primerDiaSemana + 7) % 7;
  const inicio = sumarDias(iso, -offset);
  return Array.from({ length: 7 }, (_, i) => sumarDias(inicio, i));
}

/** Pone en mayúscula solo la primera letra ('sábado, 8…' → 'Sábado, 8…'). */
export function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** 'Agosto 2026' — sin el «de» que añade Intl con month + year juntos. */
export function etiquetaMesAnio(anio: number, mes: number): string {
  const nombre = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(anio, mes, 1));
  return `${capitalizar(nombre)} ${anio}`;
}

export function horaActual(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function rangoSemanaTexto(semana: string[]): string {
  return `${formatoMedio(semana[0])} – ${formatoMedio(semana[6])}`;
}
