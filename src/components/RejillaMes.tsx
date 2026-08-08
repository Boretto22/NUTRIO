import { Clock } from 'lucide-react';
import { useMemo, useRef } from 'react';

import { GRUPOS } from '@/data/grupos';
import { estadoDelDia } from '@/lib/bloques';
import { fechaLocalISO } from '@/lib/fechas';
import { matrizMes, planificadosPendientes } from '@/lib/planificacion';
import type { Alimento, AppState, EstadoDia } from '@/types';

const DIAS_LUNES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DIAS_DOMINGO = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

/** Anillo de estado del día, reutilizando `estadoDelDia`. */
const ANILLO: Record<EstadoDia, string> = {
  cumplido: 'ring-2 ring-emerald-500',
  parcial: 'ring-2 ring-amber-500',
  incumplido: 'ring-2 ring-red-500',
  sin_datos: '',
};

/** Colores de los puntos por comida, en el orden habitual del día. */
const COLOR_COMIDA: Record<string, string> = {
  desayuno: GRUPOS.carbohidratos.color,
  comida: GRUPOS.proteicos1.color,
  cena: GRUPOS.verduras.color,
  extra: GRUPOS.frutas.color,
};

interface RejillaMesProps {
  anio: number;
  mes: number;
  estado: AppState;
  alimentos: Record<string, Alimento>;
  hoy: string;
  seleccionada: string | null;
  onSeleccionar: (fecha: string) => void;
  onCambiarMes: (delta: number) => void;
}

export function RejillaMes({
  anio,
  mes,
  estado,
  alimentos,
  hoy,
  seleccionada,
  onSeleccionar,
  onCambiarMes,
}: RejillaMesProps) {
  const primerDia = estado.ajustes.primerDiaSemana;
  const cabecera = primerDia === 1 ? DIAS_LUNES : DIAS_DOMINGO;
  const semanas = useMemo(() => matrizMes(anio, mes, primerDia), [anio, mes, primerDia]);

  // Deslizar horizontalmente cambia de mes.
  const inicioTactil = useRef<{ x: number; y: number } | null>(null);

  return (
    <div
      onTouchStart={(e) => {
        const t = e.touches[0];
        inicioTactil.current = { x: t.clientX, y: t.clientY };
      }}
      onTouchEnd={(e) => {
        const inicio = inicioTactil.current;
        inicioTactil.current = null;
        if (!inicio) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - inicio.x;
        const dy = t.clientY - inicio.y;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          onCambiarMes(dx < 0 ? 1 : -1);
        }
      }}
    >
      <div className="mb-1 grid grid-cols-7" aria-hidden>
        {cabecera.map((d, i) => (
          <span
            key={`${d}-${i}`}
            className="py-1 text-center text-[11px] font-bold uppercase text-neutral-400"
          >
            {d}
          </span>
        ))}
      </div>

      <div role="grid" aria-label="Calendario mensual" className="grid grid-cols-7 gap-1">
        {semanas.flat().map((fechaObj, i) => {
          if (!fechaObj) return <div key={`vacio-${i}`} className="min-h-[52px]" aria-hidden />;

          const iso = fechaLocalISO(fechaObj);
          const dia = estado.dias[iso];
          const planificado = estado.planificacion[iso];
          const pendientes = planificadosPendientes(estado, iso);
          const esHoy = iso === hoy;
          const esFuturo = iso > hoy;

          const situacion: EstadoDia = dia
            ? estadoDelDia(dia, alimentos, estado.ajustes.toleranciaBloques)
            : 'sin_datos';
          const anillo = esFuturo ? '' : ANILLO[situacion];

          const planBadge = dia?.planId ?? planificado?.planId;
          const comidasConPlato = [
            ...new Set((planificado?.platos ?? []).map((p) => p.comidaId)),
          ].slice(0, 4);

          const resumen = [
            planBadge ? `plan ${planBadge}` : null,
            planificado?.platos.length
              ? `${planificado.platos.length} planificados`
              : null,
            dia?.platos.length ? `${dia.platos.length} registrados` : null,
          ]
            .filter(Boolean)
            .join(', ');

          return (
            <button
              key={iso}
              type="button"
              role="gridcell"
              aria-label={`${fechaObj.getDate()} — ${resumen || 'sin nada previsto'}`}
              aria-selected={seleccionada === iso}
              onClick={() => onSeleccionar(iso)}
              className={`relative flex min-h-[52px] flex-col items-center justify-start gap-1 rounded-xl border px-0.5 pb-1 pt-1.5 transition-colors ${anillo} ${
                seleccionada === iso
                  ? 'border-marca-500 bg-marca-500/10'
                  : 'border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800/60'
              }`}
            >
              <span
                className={`flex h-[22px] w-[22px] items-center justify-center rounded-full text-[12.5px] font-bold tabular-nums ${
                  esHoy
                    ? 'bg-marca-600 text-white'
                    : 'text-neutral-700 dark:text-neutral-200'
                }`}
              >
                {fechaObj.getDate()}
              </span>

              {planBadge && (
                <span className="absolute right-1 top-1 text-[8.5px] font-black leading-none text-marca-600 dark:text-marca-400">
                  {planBadge}
                </span>
              )}

              <span className="flex h-[6px] items-center gap-[3px]">
                {comidasConPlato.map((comidaId) => (
                  <span
                    key={comidaId}
                    className="h-[5px] w-[5px] rounded-full"
                    style={{ backgroundColor: COLOR_COMIDA[comidaId] ?? GRUPOS.grasas.color }}
                    aria-hidden
                  />
                ))}
              </span>

              {pendientes.length > 0 && !esFuturo && (
                <Clock
                  size={9}
                  className="absolute bottom-0.5 left-1 text-neutral-400"
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
