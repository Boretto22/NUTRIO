import { obtenerOCrearDeviceId } from '@/lib/dispositivo';
import { formatoCorto, hoyISO } from '@/lib/fechas';
import { normalizarEstado, migrar } from '@/lib/storage';
import type { AppState, DiaPlanificado, DiaRegistro } from '@/types';

export interface ResumenBackup {
  dias: number;
  platos: number;
  diasPlanificados: number;
  plantillas: number;
  desde: string | null;
  hasta: string | null;
  nombre: string;
  schemaVersion: number;
  texto: string;
}

export interface ValidacionBackup {
  ok: boolean;
  error?: string;
  estado?: AppState;
  resumen?: ResumenBackup;
  deviceId?: string;
}

export function nombreArchivoBackup(fecha: string = hoyISO()): string {
  return `nutrio-backup-${fecha}.json`;
}

export function serializarBackup(estado: AppState): string {
  return JSON.stringify({ ...estado, deviceId: obtenerOCrearDeviceId() }, null, 2);
}

export function extraerDeviceIdBackup(bruto: Record<string, unknown>): string | undefined {
  return typeof bruto.deviceId === 'string' && bruto.deviceId.length > 0 ? bruto.deviceId : undefined;
}

export function descargarBackup(estado: AppState): void {
  const blob = new Blob([serializarBackup(estado)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivoBackup();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function resumirEstado(estado: AppState): ResumenBackup {
  const fechas = Object.keys(estado.dias).sort();
  const platos = Object.values(estado.dias).reduce(
    (n, dia: DiaRegistro) => n + (dia.platos?.length ?? 0),
    0,
  );
  const desde = fechas[0] ?? null;
  const hasta = fechas[fechas.length - 1] ?? null;
  const diasPlanificados = Object.keys(estado.planificacion ?? {}).length;
  const plantillas = estado.plantillasMenu?.length ?? 0;

  const partes: string[] = [];
  if (fechas.length > 0) {
    partes.push(
      `${fechas.length} ${fechas.length === 1 ? 'día' : 'días'} y ${platos} ${
        platos === 1 ? 'plato' : 'platos'
      }, del ${formatoCorto(desde!)} al ${formatoCorto(hasta!)}`,
    );
  }
  if (diasPlanificados > 0) {
    partes.push(
      `${diasPlanificados} ${diasPlanificados === 1 ? 'día planificado' : 'días planificados'}`,
    );
  }
  if (plantillas > 0) {
    partes.push(`${plantillas} ${plantillas === 1 ? 'plantilla' : 'plantillas'}`);
  }

  const texto =
    partes.length === 0 ? 'No contiene días registrados.' : `Contiene ${partes.join(', ')}.`;

  return {
    dias: fechas.length,
    platos,
    diasPlanificados,
    plantillas,
    desde,
    hasta,
    nombre: estado.perfil?.nombre ?? '',
    schemaVersion: estado.schemaVersion,
    texto,
  };
}

export function validarBackup(json: string): ValidacionBackup {
  let bruto: unknown;
  try {
    bruto = JSON.parse(json);
  } catch {
    return { ok: false, error: 'El archivo no es un JSON válido.' };
  }

  if (typeof bruto !== 'object' || bruto === null || Array.isArray(bruto)) {
    return { ok: false, error: 'El archivo no tiene la estructura esperada.' };
  }

  const obj = bruto as Record<string, unknown>;
  if (!('dias' in obj) || !('planes' in obj)) {
    return {
      ok: false,
      error: 'No parece un backup de Nutrio: faltan los campos "dias" y/o "planes".',
    };
  }
  if (typeof obj.dias !== 'object' || obj.dias === null || Array.isArray(obj.dias)) {
    return { ok: false, error: 'El campo "dias" está corrupto.' };
  }

  for (const [fecha, dia] of Object.entries(obj.dias as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return { ok: false, error: `Fecha inválida en el backup: "${fecha}".` };
    }
    const d = dia as Partial<DiaRegistro>;
    if (d?.planId !== 'A' && d?.planId !== 'B') {
      return { ok: false, error: `El día ${fecha} no tiene un plan válido (A/B).` };
    }
    if (!Array.isArray(d.platos)) {
      return { ok: false, error: `El día ${fecha} no tiene una lista de platos válida.` };
    }
    if (!d.objetivosSnapshot || typeof d.objetivosSnapshot !== 'object') {
      return { ok: false, error: `El día ${fecha} no conserva su snapshot de objetivos.` };
    }
  }

  const estado = migrar(obj);
  return {
    ok: true,
    estado,
    resumen: resumirEstado(estado),
    deviceId: extraerDeviceIdBackup(obj),
  };
}

/**
 * Fusión: se conservan los días de ambos estados. Ante conflicto de fecha gana
 * el día con la modificación más reciente (último plato creado).
 */
export function fusionarEstados(actual: AppState, entrante: AppState): AppState {
  const dias: Record<string, DiaRegistro> = { ...actual.dias };

  for (const [fecha, diaEntrante] of Object.entries(entrante.dias)) {
    const diaActual = dias[fecha];
    if (!diaActual) {
      dias[fecha] = diaEntrante;
      continue;
    }
    dias[fecha] = marcaTiempo(diaEntrante) >= marcaTiempo(diaActual) ? diaEntrante : diaActual;
  }

  const favoritos = [...actual.platosFavoritos];
  for (const fav of entrante.platosFavoritos) {
    if (!favoritos.some((f) => f.id === fav.id)) favoritos.push(fav);
  }

  // La planificación no tiene marca de tiempo: gana la del backup entrante solo
  // en las fechas que el estado actual no tenga previstas.
  const planificacion: Record<string, DiaPlanificado> = { ...(entrante.planificacion ?? {}) };
  for (const [fecha, dia] of Object.entries(actual.planificacion ?? {})) {
    planificacion[fecha] = dia;
  }

  const plantillas = [...(actual.plantillasMenu ?? [])];
  for (const plantilla of entrante.plantillasMenu ?? []) {
    if (!plantillas.some((p) => p.id === plantilla.id)) plantillas.push(plantilla);
  }

  return normalizarEstado({
    ...actual,
    perfil: actual.perfil.nombre ? actual.perfil : entrante.perfil,
    dias,
    planificacion,
    plantillasMenu: plantillas,
    platosFavoritos: favoritos,
  } satisfies AppState as unknown as Record<string, unknown>);
}

function marcaTiempo(dia: DiaRegistro): number {
  let max = 0;
  for (const plato of dia.platos ?? []) {
    const t = Date.parse(plato.creadoEn);
    if (!Number.isNaN(t) && t > max) max = t;
  }
  return max;
}
