import { useEffect, useState } from 'react';

import { Logo } from '@/components/Logo';

/** Con animación: 600 ms de entrada. Sin ella no hay nada que esperar, solo un respiro. */
const ESPERA = { normal: 900, reducido: 450 };
const SALIDA = 300;

/**
 * Pantalla de arranque con el lockup centrado. Vive en `main.tsx`, fuera de `App`,
 * porque es cosa del arranque real y no debe aparecer al montar la app en tests.
 */
export function Splash() {
  const [fase, setFase] = useState<'entrando' | 'saliendo' | 'fuera'>('entrando');

  useEffect(() => {
    const reducido =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const salir = window.setTimeout(
      () => setFase('saliendo'),
      reducido ? ESPERA.reducido : ESPERA.normal,
    );
    return () => window.clearTimeout(salir);
  }, []);

  useEffect(() => {
    if (fase !== 'saliendo') return;
    // Red de seguridad: si el navegador no emite transitionend, desmontamos igual.
    const fuera = window.setTimeout(() => setFase('fuera'), SALIDA + 200);
    return () => window.clearTimeout(fuera);
  }, [fase]);

  if (fase === 'fuera') return null;

  return (
    <div
      aria-hidden
      onTransitionEnd={() => setFase('fuera')}
      className={`fixed inset-x-0 top-0 z-[100] flex h-dvh items-center justify-center bg-crema transition-opacity dark:bg-neutral-950 ${
        fase === 'saliendo' ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ transitionDuration: `${SALIDA}ms` }}
    >
      <div className="splash-logo">
        <Logo variant="lockup" size="lg" decorativo />
      </div>
    </div>
  );
}
