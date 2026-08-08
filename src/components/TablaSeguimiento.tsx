import { ChevronDown, Info } from 'lucide-react';
import { useMemo, useState } from 'react';

import { FilaGrupo, FilaLeche } from '@/components/FilaGrupo';
import { GRUPOS, GRUPOS_ORDEN } from '@/data/grupos';
import {
  consumidoDeComida,
  consumidoDelDia,
  formatearBloques,
  objetivosDeComida,
  objetivosDelDia,
  totalesDelPlan,
  type MapaGrupos,
} from '@/lib/bloques';
import type { Alimento, ComidaDef, DiaRegistro, GrupoId } from '@/types';

interface TablaSeguimientoProps {
  dia: DiaRegistro;
  alimentos: Alimento[];
  comidas: ComidaDef[];
  onCambiarLeche?: (ml: number) => void;
  editable?: boolean;
  /** Bloques de planificados pendientes de confirmar (modo programar). */
  pendiente?: MapaGrupos | null;
}

export function TablaSeguimiento({
  dia,
  alimentos,
  comidas,
  onCambiarLeche,
  editable = true,
  pendiente = null,
}: TablaSeguimientoProps) {
  const [desgloseAbierto, setDesgloseAbierto] = useState(false);

  const objetivos = useMemo(() => objetivosDelDia(dia), [dia]);
  const objetivosSinYogur = useMemo(
    () => totalesDelPlan(dia.objetivosSnapshot),
    [dia.objetivosSnapshot],
  );
  const consumido = useMemo(() => consumidoDelDia(dia, alimentos), [dia, alimentos]);

  const gruposVisibles = GRUPOS_ORDEN.filter(
    (g) => objetivos[g] > 0 || consumido[g] > 0 || (pendiente?.[g] ?? 0) > 0,
  ) as GrupoId[];

  const hayPendiente = pendiente
    ? GRUPOS_ORDEN.some((g) => pendiente[g] > 0.001)
    : false;

  return (
    <section className="tarjeta overflow-hidden" aria-label="Seguimiento del día">
      <header className="flex items-center gap-2 border-b border-neutral-200 px-4 py-2.5 dark:border-neutral-800">
        <h2 className="flex-1 titulo-seccion">Grupo</h2>
        <span className="titulo-seccion shrink-0">Consumido / Objetivo</span>
        <span className="w-[62px] shrink-0 text-right titulo-seccion">Resta</span>
      </header>

      <div className="divide-y divide-neutral-100 dark:divide-neutral-800/70">
        {gruposVisibles.map((g) => (
          <FilaGrupo
            key={g}
            grupo={g}
            objetivo={objetivos[g]}
            consumido={consumido[g]}
            objetivoOriginal={objetivosSinYogur[g]}
            pendiente={pendiente?.[g] ?? 0}
          />
        ))}

        <FilaLeche
          ml={dia.lecheMl}
          objetivoMl={dia.objetivosSnapshot.lecheSemiMl}
          onCambiar={onCambiarLeche}
          editable={editable}
        />
      </div>

      {hayPendiente && (
        <p className="flex items-center gap-2 border-t border-neutral-100 px-4 py-2 text-[11.5px] text-neutral-500 dark:border-neutral-800/70 dark:text-neutral-400">
          <span
            className="h-1.5 w-6 shrink-0 rounded-full"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, currentColor 0 3px, transparent 3px 6px)',
            }}
            aria-hidden
          />
          — — pendiente de confirmar (no cuenta en Consumido ni en Resta)
        </p>
      )}

      <div className="border-t border-neutral-200 dark:border-neutral-800">
        <button
          type="button"
          onClick={() => setDesgloseAbierto((v) => !v)}
          aria-expanded={desgloseAbierto}
          className="flex min-h-[44px] w-full items-center justify-between px-4 text-[13px] font-semibold text-neutral-600 transition-colors hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800/50"
        >
          Desglose por comida
          <ChevronDown
            size={17}
            className={`transition-transform ${desgloseAbierto ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>

        {desgloseAbierto && (
          <div className="space-y-3 border-t border-neutral-100 px-4 py-3 dark:border-neutral-800/70">
            {comidas.map((comida) => (
              <DesgloseComida key={comida.id} dia={dia} comida={comida} alimentos={alimentos} />
            ))}
            <p className="flex items-start gap-2 rounded-xl bg-neutral-100 p-2.5 text-[12px] leading-snug text-neutral-600 dark:bg-neutral-800/60 dark:text-neutral-400">
              <Info size={14} className="mt-0.5 shrink-0" aria-hidden />
              Puedes mover bloques entre comidas siempre que cumplas el total diario.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function DesgloseComida({
  dia,
  comida,
  alimentos,
}: {
  dia: DiaRegistro;
  comida: ComidaDef;
  alimentos: Alimento[];
}) {
  const objetivo = objetivosDeComida(dia, comida.id);
  const consumido = consumidoDeComida(dia, comida.id, alimentos);
  const grupos = GRUPOS_ORDEN.filter((g) => objetivo[g] > 0 || consumido[g] > 0);

  if (grupos.length === 0) return null;

  return (
    <div>
      <h3 className="mb-1.5 text-[12px] font-bold text-neutral-700 dark:text-neutral-300">
        {comida.nombre}
      </h3>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
        {grupos.map((g) => {
          const ok = objetivo[g] > 0 && Math.abs(consumido[g] - objetivo[g]) <= 0.25;
          return (
            <li key={g} className="flex items-center justify-between gap-2 text-[12px]">
              <span className="flex min-w-0 items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: GRUPOS[g].color }}
                  aria-hidden
                />
                <span className="truncate">{GRUPOS[g].nombreCorto}</span>
              </span>
              <span
                className={`shrink-0 font-semibold tabular-nums ${
                  ok ? 'text-marca-600 dark:text-marca-400' : ''
                }`}
              >
                {formatearBloques(consumido[g])}
                <span className="font-normal text-neutral-400">
                  /{formatearBloques(objetivo[g])}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
