import { Check, Info } from 'lucide-react';
import { useState } from 'react';

import { GRUPOS, GRUPOS_ORDEN } from '@/data/grupos';
import { formatearBloques, totalesDelPlan } from '@/lib/bloques';
import { formatoLargo } from '@/lib/fechas';
import { Logo } from '@/components/Logo';
import { Modal } from '@/components/Modal';
import type { EstructuraPlan } from '@/types';

interface SelectorPlanDiaProps {
  abierto: boolean;
  fecha: string;
  planes: { A: EstructuraPlan; B: EstructuraPlan };
  /** Plan ya elegido (modo "cambiar plan"); si existe, el modal es descartable. */
  planActual?: 'A' | 'B';
  onElegir: (planId: 'A' | 'B') => void;
  onCerrar?: () => void;
}

export function SelectorPlanDia({
  abierto,
  fecha,
  planes,
  planActual,
  onElegir,
  onCerrar,
}: SelectorPlanDiaProps) {
  const [seleccion, setSeleccion] = useState<'A' | 'B'>(planActual ?? 'A');

  return (
    <Modal
      abierto={abierto}
      titulo={planActual ? 'Cambiar el plan de hoy' : '¿Qué estructura sigues hoy?'}
      descripcion={formatoLargo(fecha)}
      icono={<Logo variant="emblema" size="sm" decorativo />}
      onCerrar={onCerrar}
      pie={
        <div className="space-y-2">
          <button
            type="button"
            className="btn-primario w-full"
            onClick={() => onElegir(seleccion)}
          >
            {planActual
              ? `Cambiar a ${planes[seleccion].nombre}`
              : `Empezar el día con ${planes[seleccion].nombre}`}
          </button>
          {planActual && onCerrar && (
            <button type="button" className="btn-secundario w-full" onClick={onCerrar}>
              Cancelar
            </button>
          )}
        </div>
      }
    >
      <div
        className="space-y-3"
        role="radiogroup"
        aria-label="Estructura del plan para hoy"
      >
        {(['A', 'B'] as const).map((id) => {
          const plan = planes[id];
          const totales = totalesDelPlan(plan);
          const activo = seleccion === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={activo}
              onClick={() => setSeleccion(id)}
              className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${
                activo
                  ? 'border-marca-500 bg-marca-50 dark:bg-marca-500/10'
                  : 'border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-950'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-extrabold ${
                    activo
                      ? 'bg-marca-600 text-white'
                      : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                  }`}
                >
                  {id}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold leading-tight">
                    {plan.nombre.toUpperCase()}
                  </p>
                  <p className="text-[13px] leading-snug text-neutral-600 dark:text-neutral-400">
                    {plan.descripcion}
                  </p>
                </div>
                {activo && (
                  <Check size={20} className="shrink-0 text-marca-600 dark:text-marca-400" aria-hidden />
                )}
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-neutral-200/80 pt-3 dark:border-neutral-800">
                {GRUPOS_ORDEN.filter((g) => totales[g] > 0).map((g) => (
                  <div key={g} className="flex items-center justify-between gap-2">
                    <dt className="flex min-w-0 items-center gap-1.5 text-[12px] text-neutral-600 dark:text-neutral-400">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: GRUPOS[g].color }}
                        aria-hidden
                      />
                      <span className="truncate">{GRUPOS[g].nombreCorto}</span>
                    </dt>
                    <dd className="shrink-0 text-[13px] font-bold tabular-nums">
                      {formatearBloques(totales[g])}
                    </dd>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-2">
                  <dt className="flex min-w-0 items-center gap-1.5 text-[12px] text-neutral-600 dark:text-neutral-400">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full bg-sky-400"
                      aria-hidden
                    />
                    <span className="truncate">Leche</span>
                  </dt>
                  <dd className="shrink-0 text-[13px] font-bold tabular-nums">
                    {plan.lecheSemiMl} ml
                  </dd>
                </div>
              </dl>
            </button>
          );
        })}

        <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-[13px] leading-snug text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
          {planActual && seleccion !== planActual ? (
            <span>
              <strong>¿Seguro que quieres cambiar el plan de hoy?</strong> Se recalculará el
              seguimiento del día con los objetivos del {planes[seleccion].nombre}. Tus platos
              registrados se conservan.
            </span>
          ) : (
            <span>
              Si empiezas el día con TIPO A, sigue con A hasta el final del día. No mezcles
              estructuras dentro del mismo día.
            </span>
          )}
        </p>
      </div>
    </Modal>
  );
}
