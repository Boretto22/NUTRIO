/** Identidad anónima del dispositivo. Vive fuera del estado nutricional. */
export const CLAVE_DEVICE_ID = 'nutrio_device_id';

export function leerDeviceId(): string | null {
  if (typeof localStorage === 'undefined') return null;
  const valor = localStorage.getItem(CLAVE_DEVICE_ID);
  return valor && valor.length > 0 ? valor : null;
}

export function guardarDeviceId(id: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(CLAVE_DEVICE_ID, id);
}

export function obtenerOCrearDeviceId(): string {
  const existente = leerDeviceId();
  if (existente) return existente;
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  guardarDeviceId(id);
  return id;
}
