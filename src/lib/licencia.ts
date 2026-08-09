export interface EstadoLicencia {
  active: boolean;
  message?: string;
}

/** URL relativa: en Vercel la sirve `/api`, en local el middleware de Vite. */
export const RUTA_LICENCIA = '/api/check-license';

/**
 * Consulta el estado de la licencia. Ante cualquier fallo (red, 5xx, JSON
 * inválido) se considera suspendida: fallamos cerrados.
 */
export async function comprobarLicencia(
  fetchImpl: typeof fetch = fetch,
): Promise<EstadoLicencia> {
  try {
    const respuesta = await fetchImpl(RUTA_LICENCIA, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    let cuerpo: unknown = null;
    try {
      cuerpo = await respuesta.json();
    } catch {
      cuerpo = null;
    }

    const active =
      respuesta.ok &&
      typeof cuerpo === 'object' &&
      cuerpo !== null &&
      (cuerpo as { active?: unknown }).active === true;

    if (active) return { active: true };

    const message =
      typeof cuerpo === 'object' &&
      cuerpo !== null &&
      typeof (cuerpo as { message?: unknown }).message === 'string'
        ? (cuerpo as { message: string }).message
        : 'Suscripción temporalmente pausada';

    return { active: false, message };
  } catch {
    return {
      active: false,
      message: 'Suscripción temporalmente pausada',
    };
  }
}
