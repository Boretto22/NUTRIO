import { planSeed } from '@/data/planSeed';
import type { AppState, DiaPlanificado, ModoCalendario, PlantillaMenu } from '@/types';

export const CLAVE_STORAGE = 'nutrio:estado';
export const SCHEMA_VERSION = 2;

export function estadoInicial(): AppState {
  return {
    schemaVersion: SCHEMA_VERSION,
    perfil: { nombre: '' },
    planes: planSeed(),
    dias: {},
    planificacion: {},
    plantillasMenu: [],
    platosFavoritos: [],
    ajustes: {
      toleranciaBloques: 0.5,
      primerDiaSemana: 1,
      tema: 'sistema',
      modoCalendario: 'agenda',
    },
  };
}

type Migracion = (estado: Record<string, unknown>) => Record<string, unknown>;

/**
 * Migraciones acumulativas: la clave N transforma un estado de versión N a N+1.
 * Al añadir campos nuevos, sube SCHEMA_VERSION y registra aquí la migración.
 */
const MIGRACIONES: Record<number, Migracion> = {
  /** v1 → v2: aparece el calendario de menús. */
  1: (estado) => {
    const ajustes = (estado.ajustes ?? {}) as Record<string, unknown>;
    return {
      ...estado,
      planificacion: estado.planificacion ?? {},
      plantillasMenu: estado.plantillasMenu ?? [],
      ajustes: { ...ajustes, modoCalendario: ajustes.modoCalendario ?? 'agenda' },
    };
  },
};

export function migrar(bruto: Record<string, unknown>): AppState {
  let estado = bruto;
  // Un backup sin schemaVersion se trata como v1 (el primer esquema publicado).
  let version = typeof estado.schemaVersion === 'number' ? estado.schemaVersion : 1;

  while (version < SCHEMA_VERSION) {
    const migracion = MIGRACIONES[version];
    if (!migracion) break;
    estado = migracion(estado);
    version += 1;
  }

  estado.schemaVersion = SCHEMA_VERSION;
  return normalizarEstado(estado);
}

/** Rellena huecos para que un estado parcial o antiguo siga siendo utilizable. */
export function normalizarEstado(bruto: Record<string, unknown>): AppState {
  const base = estadoInicial();
  const estado = bruto as Partial<AppState>;

  const modo = estado.ajustes?.modoCalendario;

  return {
    schemaVersion: SCHEMA_VERSION,
    perfil: { nombre: estado.perfil?.nombre ?? base.perfil.nombre },
    planes: {
      A: estado.planes?.A ?? base.planes.A,
      B: estado.planes?.B ?? base.planes.B,
    },
    dias: estado.dias ?? {},
    planificacion: normalizarPlanificacion(estado.planificacion),
    plantillasMenu: Array.isArray(estado.plantillasMenu)
      ? (estado.plantillasMenu as PlantillaMenu[])
      : [],
    platosFavoritos: estado.platosFavoritos ?? [],
    ajustes: {
      toleranciaBloques:
        typeof estado.ajustes?.toleranciaBloques === 'number'
          ? estado.ajustes.toleranciaBloques
          : base.ajustes.toleranciaBloques,
      primerDiaSemana: estado.ajustes?.primerDiaSemana === 0 ? 0 : 1,
      tema:
        estado.ajustes?.tema === 'claro' || estado.ajustes?.tema === 'oscuro'
          ? estado.ajustes.tema
          : 'sistema',
      modoCalendario: (modo === 'programar' ? 'programar' : 'agenda') as ModoCalendario,
    },
  };
}

function normalizarPlanificacion(
  bruto: Record<string, DiaPlanificado> | undefined,
): Record<string, DiaPlanificado> {
  if (!bruto || typeof bruto !== 'object') return {};
  const salida: Record<string, DiaPlanificado> = {};
  for (const [fecha, dia] of Object.entries(bruto)) {
    if (!dia || !Array.isArray(dia.platos)) continue;
    salida[fecha] = { fecha, planId: dia.planId, platos: dia.platos };
  }
  return salida;
}

export function cargarEstado(): AppState {
  if (typeof localStorage === 'undefined') return estadoInicial();
  try {
    const bruto = localStorage.getItem(CLAVE_STORAGE);
    if (!bruto) return estadoInicial();
    const parseado = JSON.parse(bruto) as Record<string, unknown>;
    return migrar(parseado);
  } catch (error) {
    console.error('Nutrio: no se pudo leer el estado guardado', error);
    return estadoInicial();
  }
}

export function guardarEstado(estado: AppState): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(estado));
  } catch (error) {
    console.error('Nutrio: no se pudo guardar el estado', error);
  }
}

export function borrarEstado(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(CLAVE_STORAGE);
}
