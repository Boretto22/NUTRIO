import '@testing-library/jest-dom/vitest';

// jsdom no implementa matchMedia y la app lo consulta para el tema del sistema.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((consulta: string) => ({
    matches: false,
    media: consulta,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

if (typeof window !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

/**
 * Los tests montan la app sin el servidor de licencias. Si algún test acaba
 * pasando por LicenciaGate, la dejamos activa por defecto.
 */
const fetchOriginal = globalThis.fetch?.bind(globalThis);
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (url.includes('/api/check-license')) {
    return new Response(JSON.stringify({ active: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (fetchOriginal) return fetchOriginal(input, init);
  throw new Error(`fetch no mockeado para ${url}`);
}) as typeof fetch;
