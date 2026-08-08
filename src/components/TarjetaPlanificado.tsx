import {
  Check,
  ChevronDown,
  Clock,
  MoveRight,
  Pencil,
  PlusCircle,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';

import { ChipGrupo } from '@/components/ChipGrupo';
import { ListaIngredientes } from '@/components/TarjetaPlato';
import { GRUPOS_ORDEN } from '@/data/grupos';
import { bloquesPlanificadosDelDia } from '@/lib/planificacion';
import type { Alimento, PlatoPlanificado } from '@/types';

interface TarjetaPlanificadoProps {
  plato: PlatoPlanificado;
  alimentos: Record<string, Alimento>;
  /**
   * 'calendario' → gestión del menú previsto.
   * 'pendiente'  → esperando confirmación en la pantalla Hoy (modo programar).
   * 'agenda'     → sugerencia del día en modo agenda, con acción Registrar.
   */
  variante: 'calendario' | 'pendiente' | 'agenda';
  onConfirmar?: () => void;
  onRegistrar?: () => void;
  onEditar?: () => void;
  onDescartar?: () => void;
  onEliminar?: () => void;
  onMover?: () => void;
}

export function TarjetaPlanificado({
  plato,
  alimentos,
  variante,
  onConfirmar,
  onRegistrar,
  onEditar,
  onDescartar,
  onEliminar,
  onMover,
}: TarjetaPlanificadoProps) {
  const [abierto, setAbierto] = useState(false);

  const bloques = bloquesPlanificadosDelDia({ fecha: '', platos: [plato] }, alimentos);
  const gruposConValor = GRUPOS_ORDEN.filter((g) => bloques[g] > 0.001);
  const pendiente = variante === 'pendiente';

  return (
    <article
      className={`overflow-hidden rounded-2xl border-2 border-dashed bg-white dark:bg-neutral-900 ${
        pendiente
          ? 'border-neutral-300 opacity-60 dark:border-neutral-700'
          : 'border-marca-500/40'
      }`}
    >
      {pendiente && onConfirmar && (
        <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 border-b border-dashed border-neutral-200 px-3 py-2 dark:border-neutral-800">
          <input
            type="checkbox"
            checked={false}
            onChange={onConfirmar}
            className="h-5 w-5 shrink-0 rounded border-neutral-300 text-marca-500 focus:ring-marca-500 dark:border-neutral-600 dark:bg-neutral-800"
            aria-label={`Lo he comido: ${plato.nombre}`}
          />
          <span className="text-[13.5px] font-semibold">Lo he comido</span>
        </label>
      )}

      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="flex w-full items-start gap-3 p-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Clock size={14} className="shrink-0 text-neutral-400" aria-hidden />
            <h3 className="min-w-0 flex-1 truncate text-[15px] font-semibold leading-tight">
              {plato.nombre}
            </h3>
            <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
              Planificado
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {gruposConValor.length > 0 ? (
              gruposConValor.map((g) => <ChipGrupo key={g} grupo={g} bloques={bloques[g]} />)
            ) : (
              <span className="text-[12px] text-neutral-400">Sin ingredientes</span>
            )}
          </div>
          {pendiente && (
            <p className="mt-1 text-[11.5px] italic text-neutral-500 dark:text-neutral-400">
              0 bloques contabilizados hasta que lo confirmes
            </p>
          )}
        </div>
        <ChevronDown
          size={18}
          className={`mt-0.5 shrink-0 text-neutral-400 transition-transform ${abierto ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {abierto && (
        <div className="border-t border-dashed border-neutral-200 dark:border-neutral-800">
          <ListaIngredientes ingredientes={plato.ingredientes} alimentos={alimentos} />
          {plato.notas && (
            <p className="border-t border-neutral-100 px-3 py-2 text-[12.5px] italic text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
              {plato.notas}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-1 border-t border-dashed border-neutral-200 p-2 dark:border-neutral-800">
        {onRegistrar && (
          <button
            type="button"
            className="btn-fantasma flex-1 !px-2 text-[13px] !text-marca-700 dark:!text-marca-400"
            onClick={onRegistrar}
            aria-label={`Registrar ${plato.nombre}`}
          >
            <PlusCircle size={15} aria-hidden />
            Registrar
          </button>
        )}
        {onConfirmar && !pendiente && (
          <button
            type="button"
            className="btn-fantasma flex-1 !px-2 text-[13px]"
            onClick={onConfirmar}
            aria-label={`Confirmar ${plato.nombre}`}
          >
            <Check size={15} aria-hidden />
            Confirmar
          </button>
        )}
        {onEditar && (
          <button
            type="button"
            className="btn-fantasma flex-1 !px-2 text-[13px]"
            onClick={onEditar}
            aria-label={`Editar ${plato.nombre}`}
          >
            <Pencil size={15} aria-hidden />
            Editar
          </button>
        )}
        {onMover && (
          <button
            type="button"
            className="btn-fantasma !px-3 text-[13px]"
            onClick={onMover}
            aria-label={`Mover ${plato.nombre} a otro día`}
            title="Mover a…"
          >
            <MoveRight size={15} aria-hidden />
          </button>
        )}
        {onDescartar && (
          <button
            type="button"
            className="btn-fantasma !px-3 text-[13px]"
            onClick={onDescartar}
            aria-label={`Descartar ${plato.nombre}`}
            title="Descartar"
          >
            <X size={15} aria-hidden />
          </button>
        )}
        {onEliminar && (
          <button
            type="button"
            className="btn-fantasma !px-3 text-[13px] !text-red-600 hover:!bg-red-50 dark:!text-red-400 dark:hover:!bg-red-500/10"
            onClick={onEliminar}
            aria-label={`Quitar ${plato.nombre} del plan`}
            title="Quitar del plan"
          >
            <Trash2 size={15} aria-hidden />
          </button>
        )}
      </div>
    </article>
  );
}
