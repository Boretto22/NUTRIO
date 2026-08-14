import posthogDefault from 'posthog-js';
import { posthog as posthogNamed } from 'posthog-js';
import * as PostHogLib from 'posthog-js';
import type { PostHog, PostHogConfig } from 'posthog-js';

import { guardarDeviceId, obtenerOCrearDeviceId } from '@/lib/dispositivo';

const KEY = import.meta.env.VITE_POSTHOG_KEY ?? '';
const HOST = import.meta.env.VITE_POSTHOG_HOST ?? 'https://eu.i.posthog.com';
const ES_TEST = import.meta.env.MODE === 'test';

const MENSAJE_SIN_KEY = 'PostHog no se ha inicializado: falta VITE_POSTHOG_KEY';

export type EventoNutrio =
  | '$pageview'
  | 'comida_guardada'
  | 'plan_dia_elegido'
  | 'dia_completado'
  | 'plato_planificado'
  | 'planificado_confirmado'
  | 'backup_exportado'
  | 'backup_importado'
  | 'alimento_consultado';

export type PropsEvento = Record<string, string | number | boolean>;

declare global {
  interface Window {
    posthog: PostHog;
  }
}

/**
 * En Vite el `import default` de posthog-js es un namespace sin `.init()`.
 * El cliente real es el named export `posthog`.
 */
function resolverSdk(): PostHog {
  const candidatos: unknown[] = [
    posthogNamed,
    (PostHogLib as { posthog?: PostHog }).posthog,
    posthogDefault,
    (posthogDefault as unknown as { default?: PostHog })?.default,
  ];
  for (const candidato of candidatos) {
    if (candidato && typeof (candidato as PostHog).init === 'function') {
      return candidato as PostHog;
    }
  }
  throw new Error('PostHog SDK no expone init()');
}

export const posthog = resolverSdk();

let inicializado = false;

function arrancar(): void {
  if (ES_TEST) return;

  if (!KEY) {
    console.error(MENSAJE_SIN_KEY);
    return;
  }

  if (typeof window === 'undefined' || posthog.__loaded) {
    inicializado = Boolean(posthog.__loaded);
    return;
  }

  window.posthog = posthog;

  const opciones: Partial<PostHogConfig> & { defaults?: string } = {
    api_host: HOST,
    ui_host: 'https://eu.posthog.com',
    defaults: '2026-05-30',
    capture_pageview: true,
    person_profiles: 'always',
    persistence: 'localStorage+cookie',
    loaded: () => {
      window.posthog = posthog;
    },
  };

  try {
    posthog.init(KEY, opciones);
    inicializado = true;
  } catch (error) {
    console.error('[PostHog] No se pudo inicializar', error);
  }
}

arrancar();

export function track(evento: EventoNutrio, props?: PropsEvento): void {
  if (!inicializado) return;
  posthog.capture(evento, props);
}

export function identifyDispositivo(): string {
  const deviceId = obtenerOCrearDeviceId();
  if (inicializado) posthog.identify(deviceId);
  return deviceId;
}

/** Restaura el deviceId de un backup para no crear un usuario nuevo en PostHog. */
export function restaurarDeviceId(deviceId: string): void {
  guardarDeviceId(deviceId);
  if (inicializado) posthog.identify(deviceId);
}

export default posthog;
