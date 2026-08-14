import posthogJs from 'posthog-js';
import type { PostHog, PostHogConfig } from 'posthog-js';

export const POSTHOG_TOKEN = 'phc_mRPBy6Set8D6tYo7RGjNRW6FwsyU7QnY7xJjrmWDbyEj';

export const POSTHOG_OPTIONS: Partial<PostHogConfig> & { defaults?: string } = {
  api_host: 'https://eu.i.posthog.com',
  ui_host: 'https://eu.posthog.com',
  defaults: '2026-05-30',
  person_profiles: 'always',
  persistence: 'localStorage+cookie',
  // HashRouter no cambia location.pathname; las pageviews van a mano.
  capture_pageview: false,
  capture_pageleave: true,
  autocapture: true,
};

declare global {
  interface Window {
    posthog: PostHog;
  }
}

function clienteActual(): PostHog {
  if (typeof window !== 'undefined' && window.posthog) return window.posthog;
  return posthogJs;
}

function esSnippet(valor: unknown): boolean {
  return Boolean(valor) && typeof valor === 'object' && '__SV' in (valor as object);
}

function arrancarSdkEmpaquetado(): void {
  window.posthog = posthogJs;
  try {
    if (!posthogJs.__loaded) {
      posthogJs.init(POSTHOG_TOKEN, {
        ...POSTHOG_OPTIONS,
        loaded: () => {
          window.posthog = posthogJs;
        },
        before_send: (event) => {
          if (!event) return event;
          const url = event.properties?.$current_url;
          if (typeof url === 'string' && url.includes('#')) {
            try {
              const parsed = new URL(url);
              event.properties = {
                ...event.properties,
                $pathname: `${parsed.pathname}${parsed.hash}`,
              };
            } catch {
              /* URL malformada: se envía igual */
            }
          }
          return event;
        },
      });
    }
  } catch (error) {
    console.error('[PostHog] No se pudo inicializar', error);
  }
}

if (typeof window !== 'undefined') {
  if (!window.posthog?.__loaded) {
    if (esSnippet(window.posthog) && window.posthog !== posthogJs) {
      window.setTimeout(() => {
        if (!window.posthog?.__loaded) arrancarSdkEmpaquetado();
      }, 4000);
    } else {
      arrancarSdkEmpaquetado();
    }
  }
}

/** Siempre apunta al cliente vivo en `window.posthog` (snippet o SDK empaquetado). */
export const posthog: PostHog = new Proxy(posthogJs, {
  get(_objetivo, prop) {
    const cliente = clienteActual();
    const valor = cliente[prop as keyof PostHog];
    return typeof valor === 'function' ? valor.bind(cliente) : valor;
  },
  set(_objetivo, prop, valor) {
    const cliente = clienteActual() as unknown as Record<PropertyKey, unknown>;
    cliente[prop] = valor;
    return true;
  },
});

export default posthog;
