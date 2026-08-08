import emblema from '@/assets/logo-emblema.png';
import emblemaOscuro from '@/assets/logo-emblema-oscuro.png';
import lockup from '@/assets/logo-lockup.png';
import lockupOscuro from '@/assets/logo-lockup-oscuro.png';
import wordmark from '@/assets/logo-wordmark.png';
import wordmarkOscuro from '@/assets/logo-wordmark-oscuro.png';
import { useApp } from '@/store/useApp';

export type VarianteLogo = 'emblema' | 'lockup' | 'wordmark';
export type TamanoLogo = 'sm' | 'md' | 'lg';

/**
 * Cada variante tiene dos archivos con el mismo trazo en distinto verde. Los dos
 * son transparentes: el PNG sobre crema haría un recuadro blanco en modo oscuro, y
 * el verde de marca sobre negro apenas se lee, de ahí la versión aclarada.
 */
const ASSETS: Record<VarianteLogo, { claro: string; oscuro: string; ratio: number }> = {
  emblema: { claro: emblema, oscuro: emblemaOscuro, ratio: 512 / 512 },
  wordmark: { claro: wordmark, oscuro: wordmarkOscuro, ratio: 768 / 215 },
  lockup: { claro: lockup, oscuro: lockupOscuro, ratio: 768 / 725 },
};

/** Altura renderizada en px. El ancho sale del ratio intrínseco de cada pieza. */
const ALTURAS: Record<VarianteLogo, Record<TamanoLogo, number>> = {
  emblema: { sm: 28, md: 44, lg: 96 },
  wordmark: { sm: 16, md: 24, lg: 34 },
  lockup: { sm: 44, md: 78, lg: 132 },
};

interface LogoProps {
  variant: VarianteLogo;
  size: TamanoLogo;
  className?: string;
  /** Marca de agua o adorno: se oculta a los lectores de pantalla. */
  decorativo?: boolean;
}

export function Logo({ variant, size, className, decorativo }: LogoProps) {
  const { temaEfectivo } = useApp();
  const { claro, oscuro, ratio } = ASSETS[variant];
  const alto = ALTURAS[variant][size];
  const ancho = Math.round(alto * ratio);

  return (
    <img
      src={temaEfectivo === 'oscuro' ? oscuro : claro}
      width={ancho}
      height={alto}
      style={{ width: ancho, height: alto }}
      alt={decorativo ? '' : 'Nutrio'}
      aria-hidden={decorativo || undefined}
      decoding="async"
      className={className}
    />
  );
}
