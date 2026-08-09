import { useEffect, useState, type ReactNode } from 'react';

import { Logo } from '@/components/Logo';
import { comprobarLicencia } from '@/lib/licencia';

const MENSAJE_PAUSA =
  'La suscripción de este plan se encuentra temporalmente pausada. Ponte en contacto con tu nutricionista para restablecer el acceso.';

type Estado = 'comprobando' | 'activa' | 'suspendida';

/**
 * Bloquea el resto de la app hasta confirmar LICENSE_ACTIVE en el servidor.
 * Si la verificación falla (403, red, JSON inválido), se muestra la pantalla
 * de pausa: nunca se abre la app “por si acaso”.
 */
export function LicenciaGate({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>('comprobando');

  useEffect(() => {
    let vivo = true;

    void (async () => {
      const resultado = await comprobarLicencia();
      if (!vivo) return;
      setEstado(resultado.active ? 'activa' : 'suspendida');
    })();

    return () => {
      vivo = false;
    };
  }, []);

  if (estado === 'comprobando') {
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-crema px-6 dark:bg-neutral-950"
        role="status"
        aria-live="polite"
      >
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-marca-500 dark:border-neutral-700 dark:border-t-marca-400" />
        <span className="sr-only">Comprobando acceso…</span>
      </div>
    );
  }

  if (estado === 'suspendida') {
    return <PantallaSuspendida />;
  }

  return <>{children}</>;
}

function PantallaSuspendida() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-crema px-6 py-10 dark:bg-neutral-950">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center text-center">
        <Logo variant="emblema" size="md" decorativo />
        <h1 className="mt-6 text-[20px] font-bold leading-tight text-neutral-900 dark:text-neutral-100">
          Acceso pausado
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          {MENSAJE_PAUSA}
        </p>
      </div>
    </div>
  );
}
