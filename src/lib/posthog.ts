import { posthog as posthogNamed } from 'posthog-js';
import * as PostHogLib from 'posthog-js';
import type { PostHog, PostHogConfig } from 'posthog-js';

export const POSTHOG_TOKEN = 'phc_mRPBy6Set8D6tYo7RGjNRW6FwsyU7QnY7xJjrmWDbyEj';

const OPCIONES: Partial<PostHogConfig> & { defaults?: string } = {
  api_host: 'https://eu.i.posthog.com',
  ui_host: 'https://eu.posthog.com',
  defaults: '2026-05-30',
  person_profiles: 'always',
  persistence: 'localStorage+cookie',
  capture_pageview: false,
  capture_pageleave: true,
  autocapture: true,
};

declare global {
  interface Window {
    posthog: PostHog;
  }
}

/**
 * En Vite/Node el `import default` de posthog-js es un namespace sin `.init`.
 * El cliente real es el named export `posthog` (o `default.default` en CJS).
 */
function resolverSdk(): PostHog {
  const candidatos: unknown[] = [
    posthogNamed,
    (PostHogLib as { posthog?: PostHog }).posthog,
    (PostHogLib as { default?: PostHog }).default,
    (PostHogLib as { default?: { default?: PostHog } }).default?.default,
  ];
  for (const candidato of candidatos) {
    if (candidato && typeof (candidato as PostHog).init === 'function') {
      return candidato as PostHog;
    }
  }
  throw new Error('PostHog SDK no expone init()');
}

const posthog = resolverSdk();

if (typeof window !== 'undefined') {
  window.posthog = posthog;
  try {
    if (!posthog.__loaded) {
      posthog.init(POSTHOG_TOKEN, {
        ...OPCIONES,
        loaded: () => {
          window.posthog = posthog;
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
              /* URL malformada */
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

export { posthog };
export default posthog;
