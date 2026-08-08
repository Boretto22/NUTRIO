import { Check } from 'lucide-react';

import { GRUPOS } from '@/data/grupos';
import { formatearBloques, redondear } from '@/lib/bloques';
import type { GrupoId } from '@/types';

interface FilaGrupoProps {
  grupo: GrupoId;
  objetivo: number;
  consumido: number;
  /** Objetivo antes del ajuste por yogur, si difiere. */
  objetivoOriginal?: number;
  /**
   * Bloques de platos planificados aún sin confirmar. Se pintan como segmento
   * rayado y NUNCA entran en `consumido` ni en `restante`.
   */
  pendiente?: number;
}

export function FilaGrupo({
  grupo,
  objetivo,
  consumido,
  objetivoOriginal,
  pendiente = 0,
}: FilaGrupoProps) {
  const meta = GRUPOS[grupo];
  const restante = redondear(objetivo - consumido, 2);
  const completo = objetivo > 0 && Math.abs(restante) <= 0.25;
  const exceso = restante < -0.001;
  const porcentaje = objetivo > 0 ? Math.min(100, (consumido / objetivo) * 100) : 0;
  const porcentajeExceso =
    objetivo > 0 && consumido > objetivo
      ? Math.min(100, ((consumido - objetivo) / objetivo) * 100)
      : 0;
  const porcentajePendiente =
    objetivo > 0 && pendiente > 0.001
      ? Math.max(0, Math.min(100 - porcentaje, (pendiente / objetivo) * 100))
      : 0;

  const ajustado = objetivoOriginal !== undefined && objetivoOriginal !== objetivo;

  return (
    <div className="px-4 py-2.5">
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: meta.color }}
            aria-hidden
          />
          <span className="truncate text-[14px] font-semibold">{meta.nombre}</span>
          {completo && (
            <Check
              size={15}
              className="shrink-0 text-marca-600 dark:text-marca-400"
              aria-label="Objetivo cumplido"
            />
          )}
        </div>

        <div className="flex shrink-0 items-baseline gap-1 text-[14px] tabular-nums">
          <span className="font-bold">{formatearBloques(consumido)}</span>
          <span className="text-neutral-400">/</span>
          <span className="text-neutral-600 dark:text-neutral-400">
            {formatearBloques(objetivo)}
          </span>
          {ajustado && (
            <span
              className="ml-1 text-[11px] text-neutral-400 line-through"
              title={`Objetivo del plan sin yogur: ${formatearBloques(objetivoOriginal!)}`}
            >
              {formatearBloques(objetivoOriginal!)}
            </span>
          )}
        </div>

        <div className="w-[62px] shrink-0 text-right text-[13px] font-bold tabular-nums">
          <span className={exceso ? 'text-red-600 dark:text-red-400' : 'text-marca-600 dark:text-marca-400'}>
            {restante > 0 ? '+' : ''}
            {formatearBloques(restante)}
          </span>
        </div>
      </div>

      <div
        className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"
        role="progressbar"
        aria-valuenow={Math.round(porcentaje)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${meta.nombre}: ${formatearBloques(consumido)} de ${formatearBloques(objetivo)} bloques${
          porcentajePendiente > 0 ? ` (+${formatearBloques(pendiente)} pendientes de confirmar)` : ''
        }`}
      >
        <div className="flex h-full">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${porcentaje}%`, backgroundColor: meta.color }}
          />
          {porcentajePendiente > 0 && (
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${porcentajePendiente}%`,
                backgroundImage: `repeating-linear-gradient(45deg, ${meta.color}66 0 3px, transparent 3px 6px)`,
              }}
            />
          )}
          {porcentajeExceso > 0 && (
            <div
              className="h-full bg-red-500 transition-all duration-300"
              style={{ width: `${porcentajeExceso}%` }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

interface FilaLecheProps {
  ml: number;
  objetivoMl: number;
  onCambiar?: (ml: number) => void;
  editable?: boolean;
}

const PASOS_LECHE = [0, 50, 100, 150, 200];

export function FilaLeche({ ml, objetivoMl, onCambiar, editable = true }: FilaLecheProps) {
  const porcentaje = objetivoMl > 0 ? Math.min(100, (ml / objetivoMl) * 100) : 0;
  const completo = ml >= objetivoMl && objetivoMl > 0;
  const pasos = PASOS_LECHE.filter((p) => p <= objetivoMl);
  if (!pasos.includes(objetivoMl)) pasos.push(objetivoMl);

  return (
    <div className="px-4 py-2.5">
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-sky-400" aria-hidden />
          <span className="truncate text-[14px] font-semibold">Leche semi</span>
          {completo && (
            <Check size={15} className="shrink-0 text-marca-600 dark:text-marca-400" aria-label="Completo" />
          )}
        </div>
        <div className="shrink-0 text-[14px] tabular-nums">
          <span className="font-bold">{ml}</span>
          <span className="text-neutral-400"> / </span>
          <span className="text-neutral-600 dark:text-neutral-400">{objetivoMl} ml</span>
        </div>
      </div>

      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div
          className="h-full rounded-full bg-sky-400 transition-all duration-300"
          style={{ width: `${porcentaje}%` }}
        />
      </div>

      {editable && onCambiar && (
        <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Leche semi consumida">
          {pasos.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={ml === p}
              onClick={() => onCambiar(p)}
              className={`min-h-[32px] rounded-lg px-2.5 text-[12px] font-semibold transition-colors ${
                ml === p
                  ? 'bg-sky-500 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
              }`}
            >
              {p} ml
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
