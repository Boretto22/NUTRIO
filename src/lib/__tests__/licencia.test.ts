import { describe, expect, it, vi } from 'vitest';

import { comprobarLicencia } from '@/lib/licencia';

function respuesta(status: number, cuerpo: unknown) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('comprobarLicencia', () => {
  it('permite el acceso cuando el servidor responde active: true', async () => {
    const fetchMock = vi.fn().mockResolvedValue(respuesta(200, { active: true }));
    await expect(comprobarLicencia(fetchMock)).resolves.toEqual({ active: true });
  });

  it('bloquea ante un 403 con mensaje del servidor', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(respuesta(403, { active: false, message: 'Suscripción temporalmente pausada' }));

    await expect(comprobarLicencia(fetchMock)).resolves.toEqual({
      active: false,
      message: 'Suscripción temporalmente pausada',
    });
  });

  it('falla cerrado ante un error de red', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('offline'));
    await expect(comprobarLicencia(fetchMock)).resolves.toMatchObject({ active: false });
  });

  it('falla cerrado si el JSON dice active pero el status no es ok', async () => {
    const fetchMock = vi.fn().mockResolvedValue(respuesta(500, { active: true }));
    await expect(comprobarLicencia(fetchMock)).resolves.toMatchObject({ active: false });
  });
});
