import { clonar } from '@/data/planSeed';
import { GRUPOS_ORDEN } from '@/data/grupos';
import { mapaVacio, redondear, totalesDelPlan, type MapaGrupos } from '@/lib/bloques';
import { fechaLocalISO, sumarDias } from '@/lib/fechas';
import type {
  Alimento,
  AppState,
  DiaPlanificado,
  DiaRegistro,
  EstructuraPlan,
  GrupoId,
  PlantillaMenu,
  Plato,
  PlatoPlanificado,
} from '@/types';

type ResolverAlimento = Alimento[] | Record<string, Alimento> | ((id: string) => Alimento | undefined);

function resolver(fuente: ResolverAlimento): (id: string) => Alimento | undefined {
  if (typeof fuente === 'function') return fuente;
  if (Array.isArray(fuente)) {
    const mapa = new Map(fuente.map((a) => [a.id, a]));
    return (id) => mapa.get(id);
  }
  return (id) => fuente[id];
}

function nuevoId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

export function diaPlanificadoVacio(fecha: string): DiaPlanificado {
  return { fecha, platos: [] };
}

/** Copia profunda de un plato planificado con identidad nueva. */
export function clonarPlatoPlanificado(plato: PlatoPlanificado): PlatoPlanificado {
  return {
    ...plato,
    id: nuevoId(),
    ingredientes: plato.ingredientes.map((i) => ({ ...i })),
  };
}

/**
 * Bloques que aportaría un día planificado si se comiera entero.
 * Aplica el doble cómputo de legumbres igual que `bloquesDePlato`.
 */
export function bloquesPlanificadosDelDia(
  diaPlanificado: DiaPlanificado | undefined,
  alimentos: ResolverAlimento,
): MapaGrupos {
  const get = resolver(alimentos);
  const total = mapaVacio();
  for (const plato of diaPlanificado?.platos ?? []) {
    for (const ing of plato.ingredientes) {
      const alimento = get(ing.alimentoId);
      if (!alimento) continue;
      total[alimento.grupo] += ing.bloques;
      if (alimento.dobleComputo && alimento.grupo === 'carbohidratos') {
        total.proteicos1 += ing.bloques;
      }
    }
  }
  for (const g of GRUPOS_ORDEN) total[g] = redondear(total[g], 3);
  return total;
}

/** Igual que la anterior pero limitado a una comida concreta. */
export function bloquesPlanificadosDeComida(
  diaPlanificado: DiaPlanificado | undefined,
  comidaId: string,
  alimentos: ResolverAlimento,
): MapaGrupos {
  const filtrado: DiaPlanificado | undefined = diaPlanificado && {
    ...diaPlanificado,
    platos: diaPlanificado.platos.filter((p) => p.comidaId === comidaId),
  };
  return bloquesPlanificadosDelDia(filtrado, alimentos);
}

export interface ComparativaGrupo {
  objetivo: number;
  planificado: number;
  diff: number;
}

/** Cuadre del menú previsto frente a los objetivos de la estructura del plan. */
export function comparaPlanVsObjetivo(
  diaPlanificado: DiaPlanificado | undefined,
  estructuraPlan: EstructuraPlan,
  alimentos: ResolverAlimento,
): Record<GrupoId, ComparativaGrupo> {
  const objetivos = totalesDelPlan(estructuraPlan);
  const planificado = bloquesPlanificadosDelDia(diaPlanificado, alimentos);
  const salida = {} as Record<GrupoId, ComparativaGrupo>;
  for (const g of GRUPOS_ORDEN) {
    salida[g] = {
      objetivo: objetivos[g],
      planificado: planificado[g],
      diff: redondear(planificado[g] - objetivos[g], 2),
    };
  }
  return salida;
}

/** Platos planificados de una fecha que aún no se han confirmado ni descartado. */
export function planificadosPendientes(
  estado: AppState,
  fecha: string,
): PlatoPlanificado[] {
  const planificado = estado.planificacion[fecha];
  if (!planificado) return [];
  const dia = estado.dias[fecha];
  const descartados = new Set(dia?.planificadosDescartados ?? []);
  const confirmados = new Set(
    (dia?.platos ?? []).map((p) => p.planificadoId).filter((id): id is string => Boolean(id)),
  );
  return planificado.platos.filter((p) => !descartados.has(p.id) && !confirmados.has(p.id));
}

function asegurarDia(estado: AppState, fecha: string): DiaRegistro {
  const existente = estado.dias[fecha];
  if (existente) return existente;
  const planId = estado.planificacion[fecha]?.planId ?? 'A';
  return {
    fecha,
    planId,
    objetivosSnapshot: clonar(estado.planes[planId]),
    yogur: false,
    lecheMl: 0,
    platos: [],
  };
}

/**
 * Convierte un plato planificado en un `Plato` real del día.
 * Es a partir de aquí cuando los bloques empiezan a contar.
 */
export function confirmarPlanificado(
  estado: AppState,
  fecha: string,
  platoPlanificadoId: string,
  hora?: string,
): AppState {
  const planificado = estado.planificacion[fecha]?.platos.find(
    (p) => p.id === platoPlanificadoId,
  );
  if (!planificado) return estado;

  const dia = asegurarDia(estado, fecha);
  if (dia.platos.some((p) => p.planificadoId === platoPlanificadoId)) return estado;

  const plato: Plato = {
    id: nuevoId(),
    nombre: planificado.nombre,
    comidaId: planificado.comidaId,
    hora: hora ?? horaActualLocal(),
    ingredientes: planificado.ingredientes.map((i) => ({ ...i })),
    creadoEn: new Date().toISOString(),
    planificadoId: planificado.id,
  };

  return {
    ...estado,
    dias: {
      ...estado.dias,
      [fecha]: { ...dia, platos: [...dia.platos, plato] },
    },
  };
}

/** Revierte una confirmación: quita el plato registrado y devuelve el planificado a pendiente. */
export function deshacerConfirmacion(
  estado: AppState,
  fecha: string,
  platoPlanificadoId: string,
): AppState {
  const dia = estado.dias[fecha];
  if (!dia) return estado;
  return {
    ...estado,
    dias: {
      ...estado.dias,
      [fecha]: {
        ...dia,
        platos: dia.platos.filter((p) => p.planificadoId !== platoPlanificadoId),
        planificadosDescartados: (dia.planificadosDescartados ?? []).filter(
          (id) => id !== platoPlanificadoId,
        ),
      },
    },
  };
}

/** Marca un planificado como descartado para que no vuelva a sugerirse. */
export function descartarPlanificado(
  estado: AppState,
  fecha: string,
  platoPlanificadoId: string,
): AppState {
  const dia = asegurarDia(estado, fecha);
  const descartados = dia.planificadosDescartados ?? [];
  if (descartados.includes(platoPlanificadoId)) return estado;
  return {
    ...estado,
    dias: {
      ...estado.dias,
      [fecha]: { ...dia, planificadosDescartados: [...descartados, platoPlanificadoId] },
    },
  };
}

/** Copia el menú de un día en una o varias fechas destino (sustituye el contenido). */
export function copiarDia(
  estado: AppState,
  fechaOrigen: string,
  fechasDestino: string[],
): AppState {
  const origen = estado.planificacion[fechaOrigen];
  if (!origen) return estado;

  const planificacion = { ...estado.planificacion };
  for (const destino of fechasDestino) {
    if (destino === fechaOrigen) continue;
    planificacion[destino] = {
      fecha: destino,
      planId: origen.planId,
      platos: origen.platos.map(clonarPlatoPlanificado),
    };
  }
  return { ...estado, planificacion };
}

/** Aplica una plantilla guardada a una fecha, sustituyendo lo que hubiera. */
export function aplicarPlantilla(estado: AppState, plantillaId: string, fecha: string): AppState {
  const plantilla = estado.plantillasMenu.find((p) => p.id === plantillaId);
  if (!plantilla) return estado;

  return {
    ...estado,
    planificacion: {
      ...estado.planificacion,
      [fecha]: {
        fecha,
        planId: plantilla.planId,
        platos: plantilla.platos.map((p) => ({
          ...clonarPlatoPlanificado(p),
          origenPlantillaId: plantilla.id,
        })),
      },
    },
  };
}

/** Guarda el menú de un día como plantilla reutilizable. */
export function guardarComoPlantilla(
  estado: AppState,
  fecha: string,
  nombre: string,
): AppState {
  const origen = estado.planificacion[fecha];
  if (!origen || origen.platos.length === 0) return estado;

  const plantilla: PlantillaMenu = {
    id: nuevoId(),
    nombre: nombre.trim() || `Menú del ${fecha}`,
    planId: origen.planId,
    platos: origen.platos.map(clonarPlatoPlanificado),
    creadaEn: new Date().toISOString(),
  };

  return { ...estado, plantillasMenu: [plantilla, ...estado.plantillasMenu] };
}

/**
 * Repite el menú de una fecha en el mismo día de la semana durante N semanas.
 * `semanas` = 4 crea la planificación en +7, +14, +21 y +28 días.
 */
export function repetirSemanal(estado: AppState, fechaOrigen: string, semanas: number): AppState {
  const total = Math.max(0, Math.min(8, Math.round(semanas)));
  if (total === 0) return estado;
  const destinos = Array.from({ length: total }, (_, i) => sumarDias(fechaOrigen, (i + 1) * 7));
  return copiarDia(estado, fechaOrigen, destinos);
}

/** Mueve un plato planificado de una fecha a otra. */
export function moverPlanificado(
  estado: AppState,
  fechaOrigen: string,
  platoId: string,
  fechaDestino: string,
): AppState {
  if (fechaOrigen === fechaDestino) return estado;
  const origen = estado.planificacion[fechaOrigen];
  const plato = origen?.platos.find((p) => p.id === platoId);
  if (!origen || !plato) return estado;

  const destino = estado.planificacion[fechaDestino] ?? diaPlanificadoVacio(fechaDestino);

  return {
    ...estado,
    planificacion: {
      ...estado.planificacion,
      [fechaOrigen]: { ...origen, platos: origen.platos.filter((p) => p.id !== platoId) },
      [fechaDestino]: { ...destino, platos: [...destino.platos, { ...plato }] },
    },
  };
}

/** Elimina la planificación de las fechas anteriores a `fecha`. */
export function limpiarPlanificacionAnterior(estado: AppState, fecha: string): AppState {
  const planificacion: Record<string, DiaPlanificado> = {};
  for (const [clave, valor] of Object.entries(estado.planificacion)) {
    if (clave >= fecha) planificacion[clave] = valor;
  }
  return { ...estado, planificacion };
}

/**
 * Matriz de semanas del mes. Las celdas fuera del mes son `null`.
 * `mes` es 0-indexado (0 = enero), igual que `Date`.
 */
export function matrizMes(anio: number, mes: number, primerDiaSemana: 0 | 1 = 1): (Date | null)[][] {
  const primero = new Date(anio, mes, 1);
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const desplazamiento = (primero.getDay() - primerDiaSemana + 7) % 7;

  const celdas: (Date | null)[] = Array.from({ length: desplazamiento }, () => null);
  for (let d = 1; d <= diasEnMes; d += 1) celdas.push(new Date(anio, mes, d));
  while (celdas.length % 7 !== 0) celdas.push(null);

  const semanas: (Date | null)[][] = [];
  for (let i = 0; i < celdas.length; i += 7) semanas.push(celdas.slice(i, i + 7));
  return semanas;
}

/** Fechas ISO de todas las celdas con día del mes indicado. */
export function fechasDelMes(anio: number, mes: number): string[] {
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  return Array.from({ length: diasEnMes }, (_, i) => fechaLocalISO(new Date(anio, mes, i + 1)));
}

function horaActualLocal(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
