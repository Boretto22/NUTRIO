// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';

import { extraerDeviceIdBackup, serializarBackup, validarBackup } from '@/lib/backup';
import { CLAVE_DEVICE_ID, guardarDeviceId, obtenerOCrearDeviceId } from '@/lib/dispositivo';
import { estadoInicial } from '@/lib/storage';

describe('deviceId anónimo', () => {
  beforeEach(() => {
    localStorage.removeItem(CLAVE_DEVICE_ID);
  });

  it('crea un UUID la primera vez y lo reutiliza', () => {
    const primero = obtenerOCrearDeviceId();
    const segundo = obtenerOCrearDeviceId();
    expect(primero.length).toBeGreaterThan(8);
    expect(segundo).toBe(primero);
    expect(localStorage.getItem(CLAVE_DEVICE_ID)).toBe(primero);
  });
});

describe('backup con deviceId', () => {
  it('incluye deviceId al serializar y lo recupera al validar', () => {
    guardarDeviceId('device-de-prueba');
    const json = serializarBackup(estadoInicial());
    const bruto = JSON.parse(json) as Record<string, unknown>;
    expect(extraerDeviceIdBackup(bruto)).toBe('device-de-prueba');

    const validacion = validarBackup(json);
    expect(validacion.ok).toBe(true);
    expect(validacion.deviceId).toBe('device-de-prueba');
    expect(validacion.estado).not.toHaveProperty('deviceId');
  });

  it('un backup antiguo sin deviceId sigue siendo válido', () => {
    const validacion = validarBackup(JSON.stringify(estadoInicial()));
    expect(validacion.ok).toBe(true);
    expect(validacion.deviceId).toBeUndefined();
  });
});
