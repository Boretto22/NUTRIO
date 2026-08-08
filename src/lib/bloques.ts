import { YOGUR_AJUSTE } from '@/data/alimentos';
import { GRUPOS_ORDEN } from '@/data/grupos';
import type {
  Ajustes,
  Alimento,
  DiaRegistro,
  EstadoDia,
  EstructuraPlan,
  GrupoId,
  Plato,
} from '@/types';

export type MapaGrupos = Record<GrupoId, number>;

export function mapaVacio(): MapaGrupos {
  return {
    carbohidratos: 0,
    proteicos1: 0,
    proteicos2: 0,
    grasas: 0,
    verduras: 0,
    frutas: 0,
  };
}

/** Evita los artefactos de coma flotante (0.30000000000000004). */
export function redondear(valor: number, decimales = 2): number {
  const f = 10 ** decimales;
  return Math.round((valor + Number.EPSILON) * f) / f;
}

/** Los bloques se muestran siempre con 1 decimal como máximo. */
export function formatearBloques(valor: number): string {
  const v = redondear(valor, 1);
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

export function formatearGramos(valor: number): string {
  return String(Math.round(valor));
}

export function gramosABloques(alimento: Alimento, gramos: number): number {
  if (!alimento.gramosPorBloque) return 0;
  return redondear(gramos / alimento.gramosPorBloque, 3);
}

export function bloquesAGramos(alimento: Alimento, bloques: number): number {
  return redondear(bloques * alimento.gramosPorBloque, 2);
}

export function crudoDesdeCocido(gramosCocido: number, factor: number): number {
  if (!factor) return gramosCocido;
  return redondear(gramosCocido / factor, 2);
}

export function cocidoDesdeCrudo(gramosCrudo: number, factor: number): number {
  return redondear(gramosCrudo * factor, 2);
}

type ResolverAlimento = Alimento[] | Record<string, Alimento> | ((id: string) => Alimento | undefined);

function resolver(fuente: ResolverAlimento): (id: string) => Alimento | undefined {
  if (typeof fuente === 'function') return fuente;
  if (Array.isArray(fuente)) {
    const mapa = new Map(fuente.map((a) => [a.id, a]));
    return (id) => mapa.get(id);
  }
  return (id) => fuente[id];
}

/**
 * Bloques que aporta un plato por grupo.
 * Los alimentos con `dobleComputo` (legumbres) restan a la vez de
 * Carbohidratos y de Alimentos Proteicos I.
 */
export function bloquesDePlato(plato: Plato, alimentos: ResolverAlimento): MapaGrupos {
  const get = resolver(alimentos);
  const total = mapaVacio();
  for (const ing of plato.ingredientes) {
    const alimento = get(ing.alimentoId);
    if (!alimento) continue;
    const bloques = ing.bloques ?? gramosABloques(alimento, ing.gramos);
    total[alimento.grupo] += bloques;
    if (alimento.dobleComputo && alimento.grupo === 'carbohidratos') {
      total.proteicos1 += bloques;
    }
  }
  for (const g of GRUPOS_ORDEN) total[g] = redondear(total[g], 3);
  return total;
}

/** Totales diarios de una estructura de plan (suma de todas sus comidas). */
export function totalesDelPlan(plan: EstructuraPlan): MapaGrupos {
  const total = mapaVacio();
  for (const comida of plan.comidas) {
    const fila = plan.bloques[comida.id] ?? {};
    for (const g of GRUPOS_ORDEN) total[g] += fila[g] ?? 0;
  }
  for (const g of GRUPOS_ORDEN) total[g] = redondear(total[g], 3);
  return total;
}

/** Objetivos por grupo de una comida concreta del día. */
export function objetivosDeComida(dia: DiaRegistro, comidaId: string): MapaGrupos {
  const fila = dia.objetivosSnapshot.bloques[comidaId] ?? {};
  const total = mapaVacio();
  for (const g of GRUPOS_ORDEN) total[g] = redondear(fila[g] ?? 0, 3);
  return total;
}

/**
 * Objetivos diarios efectivos: totales del snapshot del plan
 * menos el ajuste por yogur bifidus (−0.5 CH, −0.5 Prot I, −0.5 Grasas).
 */
export function objetivosDelDia(dia: DiaRegistro): MapaGrupos {
  const total = totalesDelPlan(dia.objetivosSnapshot);
  if (dia.yogur) {
    for (const [grupo, resta] of Object.entries(YOGUR_AJUSTE) as [GrupoId, number][]) {
      total[grupo] = redondear(Math.max(0, total[grupo] - resta), 3);
    }
  }
  return total;
}

export function consumidoDelDia(dia: DiaRegistro, alimentos: ResolverAlimento): MapaGrupos {
  const total = mapaVacio();
  for (const plato of dia.platos) {
    const parcial = bloquesDePlato(plato, alimentos);
    for (const g of GRUPOS_ORDEN) total[g] += parcial[g];
  }
  for (const g of GRUPOS_ORDEN) total[g] = redondear(total[g], 3);
  return total;
}

export function consumidoDeComida(
  dia: DiaRegistro,
  comidaId: string,
  alimentos: ResolverAlimento,
): MapaGrupos {
  const total = mapaVacio();
  for (const plato of dia.platos.filter((p) => p.comidaId === comidaId)) {
    const parcial = bloquesDePlato(plato, alimentos);
    for (const g of GRUPOS_ORDEN) total[g] += parcial[g];
  }
  for (const g of GRUPOS_ORDEN) total[g] = redondear(total[g], 3);
  return total;
}

export function restanteDelDia(dia: DiaRegistro, alimentos: ResolverAlimento): MapaGrupos {
  const objetivo = objetivosDelDia(dia);
  const consumido = consumidoDelDia(dia, alimentos);
  const resto = mapaVacio();
  for (const g of GRUPOS_ORDEN) resto[g] = redondear(objetivo[g] - consumido[g], 3);
  return resto;
}

/**
 * 'cumplido'   → todos los grupos con objetivo > 0 dentro de la tolerancia
 * 'parcial'    → 1 o 2 grupos fuera de tolerancia
 * 'incumplido' → 3 o más grupos fuera, o día con objetivos pero sin platos
 * 'sin_datos'  → día sin platos y sin objetivos
 */
export function estadoDelDia(
  dia: DiaRegistro,
  alimentos: ResolverAlimento,
  tolerancia: number,
): EstadoDia {
  const objetivo = objetivosDelDia(dia);
  const gruposActivos = GRUPOS_ORDEN.filter((g) => objetivo[g] > 0);
  if (gruposActivos.length === 0) return 'sin_datos';
  if (dia.platos.length === 0) return 'sin_datos';

  const consumido = consumidoDelDia(dia, alimentos);
  const fuera = gruposActivos.filter(
    (g) => Math.abs(consumido[g] - objetivo[g]) > tolerancia + 1e-9,
  ).length;

  if (fuera === 0) return 'cumplido';
  if (fuera <= 2) return 'parcial';
  return 'incumplido';
}

/** Grupos fuera de tolerancia en un día (para el resumen semanal). */
export function gruposFueraDeTolerancia(
  dia: DiaRegistro,
  alimentos: ResolverAlimento,
  tolerancia: number,
): GrupoId[] {
  const objetivo = objetivosDelDia(dia);
  const consumido = consumidoDelDia(dia, alimentos);
  return GRUPOS_ORDEN.filter(
    (g) => objetivo[g] > 0 && Math.abs(consumido[g] - objetivo[g]) > tolerancia + 1e-9,
  );
}

/**
 * Racha de días consecutivos cumplidos.
 * `actual` cuenta hacia atrás desde hoy (se permite que hoy aún no esté cumplido
 * sin romper la racha, porque el día está en curso).
 */
export function calcularRacha(
  dias: Record<string, DiaRegistro>,
  ajustes: Pick<Ajustes, 'toleranciaBloques'>,
  alimentos: ResolverAlimento,
  hoy: string = fechaLocalISO(new Date()),
): { actual: number; mejor: number } {
  const tolerancia = ajustes.toleranciaBloques;
  const fechas = Object.keys(dias).sort();
  if (fechas.length === 0) return { actual: 0, mejor: 0 };

  const cumplido = (fecha: string): boolean => {
    const dia = dias[fecha];
    if (!dia) return false;
    return estadoDelDia(dia, alimentos, tolerancia) === 'cumplido';
  };

  // Mejor racha histórica: recorrido por fechas consecutivas del calendario.
  let mejor = 0;
  let corriendo = 0;
  let cursor = fechas[0];
  const ultima = fechas[fechas.length - 1];
  while (cursor <= ultima) {
    if (cumplido(cursor)) {
      corriendo += 1;
      if (corriendo > mejor) mejor = corriendo;
    } else {
      corriendo = 0;
    }
    cursor = sumarDiasISO(cursor, 1);
  }

  // Racha actual: hacia atrás desde hoy. Si hoy no está cumplido pero está en
  // curso, la racha se cuenta desde ayer.
  let actual = 0;
  let dia = hoy;
  if (!cumplido(hoy)) dia = sumarDiasISO(hoy, -1);
  while (cumplido(dia)) {
    actual += 1;
    dia = sumarDiasISO(dia, -1);
  }
  if (cumplido(hoy) && actual > mejor) mejor = actual;

  return { actual, mejor };
}

/** Duplicado ligero de fechas.ts para mantener bloques.ts autocontenido. */
function fechaLocalISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function sumarDiasISO(iso: string, dias: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const fecha = new Date(y, m - 1, d);
  fecha.setDate(fecha.getDate() + dias);
  return fechaLocalISO(fecha);
}
