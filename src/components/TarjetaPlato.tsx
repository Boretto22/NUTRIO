import { ChevronDown, Copy, Pencil, Star, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { BadgeDobleComputo, ChipGrupo } from '@/components/ChipGrupo';
import { GRUPOS, GRUPOS_ORDEN } from '@/data/grupos';
import { bloquesDePlato, formatearBloques, formatearGramos } from '@/lib/bloques';
import type { Alimento, Ingrediente, Plato } from '@/types';

interface TarjetaPlatoProps {
  plato: Plato;
  alimentos: Record<string, Alimento>;
  /** Resalta y hace scroll hasta la tarjeta (plato recién guardado). */
  resaltado?: boolean;
  onEditar?: () => void;
  onDuplicar?: () => void;
  onEliminar?: () => void;
  onGuardarFavorito?: () => void;
}

export function TarjetaPlato({
  plato,
  alimentos,
  resaltado = false,
  onEditar,
  onDuplicar,
  onEliminar,
  onGuardarFavorito,
}: TarjetaPlatoProps) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const bloques = bloquesDePlato(plato, alimentos);
  const gruposConValor = GRUPOS_ORDEN.filter((g) => bloques[g] > 0.001);

  useEffect(() => {
    if (resaltado) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [resaltado]);

  return (
    <article ref={ref} className={`tarjeta overflow-hidden ${resaltado ? 'resaltado' : ''}`}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <h3 className="min-w-0 flex-1 truncate text-[15px] font-semibold leading-tight">
              {plato.nombre}
            </h3>
            <span className="shrink-0 text-[12px] tabular-nums text-neutral-500 dark:text-neutral-400">
              {plato.hora}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {gruposConValor.length > 0 ? (
              gruposConValor.map((g) => <ChipGrupo key={g} grupo={g} bloques={bloques[g]} />)
            ) : (
              <span className="text-[12px] text-neutral-400">Sin ingredientes</span>
            )}
          </div>
        </div>
        <ChevronDown
          size={18}
          className={`mt-0.5 shrink-0 text-neutral-400 transition-transform ${abierto ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {abierto && (
        <div className="border-t border-neutral-100 dark:border-neutral-800">
          <ListaIngredientes ingredientes={plato.ingredientes} alimentos={alimentos} />

          {(onEditar || onDuplicar || onEliminar || onGuardarFavorito) && (
            <div className="flex gap-1 border-t border-neutral-100 p-2 dark:border-neutral-800">
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
              {onDuplicar && (
                <button
                  type="button"
                  className="btn-fantasma flex-1 !px-2 text-[13px]"
                  onClick={onDuplicar}
                  aria-label={`Duplicar ${plato.nombre}`}
                >
                  <Copy size={15} aria-hidden />
                  Duplicar
                </button>
              )}
              {onGuardarFavorito && (
                <button
                  type="button"
                  className="btn-fantasma !px-3 text-[13px]"
                  onClick={onGuardarFavorito}
                  aria-label="Guardar como plato favorito"
                  title="Guardar como plato favorito"
                >
                  <Star size={15} aria-hidden />
                </button>
              )}
              {onEliminar && (
                <button
                  type="button"
                  className="btn-fantasma !px-3 text-[13px] !text-red-600 hover:!bg-red-50 dark:!text-red-400 dark:hover:!bg-red-500/10"
                  onClick={onEliminar}
                  aria-label="Eliminar plato"
                  title="Eliminar plato"
                >
                  <Trash2 size={15} aria-hidden />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

/** Desglose de ingredientes, compartido por platos registrados y planificados. */
export function ListaIngredientes({
  ingredientes,
  alimentos,
}: {
  ingredientes: Ingrediente[];
  alimentos: Record<string, Alimento>;
}) {
  return (
    <ul className="divide-y divide-neutral-100 dark:divide-neutral-800/70">
      {ingredientes.map((ing, i) => {
        const alimento = alimentos[ing.alimentoId];
        if (!alimento) {
          return (
            <li key={i} className="px-3 py-2 text-[13px] text-neutral-400">
              Alimento no disponible ({ing.alimentoId})
            </li>
          );
        }
        const meta = GRUPOS[alimento.grupo];
        const esFruta = alimento.grupo === 'frutas';
        const esUnidad = alimento.unidad === 'unidad';
        const unidad = alimento.unidad === 'ml' ? 'ml' : 'g';

        return (
          <li key={i} className="px-3 py-2">
            <div className="flex items-start gap-2">
              <span
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: meta.color }}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium leading-snug">
                  {alimento.nombre}
                  {alimento.descripcion && (
                    <span className="font-normal text-neutral-500 dark:text-neutral-400">
                      {' '}
                      · {alimento.descripcion}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-[12px] text-neutral-600 dark:text-neutral-400">
                  {esFruta ? (
                    <>
                      {formatearBloques(ing.bloques)} {ing.bloques === 1 ? 'porción' : 'porciones'}
                    </>
                  ) : esUnidad ? (
                    <>
                      {formatearBloques(ing.bloques)} {ing.bloques === 1 ? 'unidad' : 'unidades'}
                    </>
                  ) : (
                    <>
                      {formatearGramos(ing.gramos)} {unidad} crudo
                      {ing.pesadoEnCocido && ing.gramosCocido
                        ? ` (${formatearGramos(ing.gramosCocido)} ${unidad} cocido, ×${ing.factorConversion})`
                        : ''}
                    </>
                  )}
                  {' — '}
                  <span className="font-semibold" style={{ color: meta.color }}>
                    {formatearBloques(ing.bloques)} {ing.bloques === 1 ? 'bloque' : 'bloques'}
                  </span>{' '}
                  <span className="text-neutral-500 dark:text-neutral-400">
                    ({meta.nombreCorto})
                  </span>
                </p>
                {alimento.dobleComputo && (
                  <div className="mt-1">
                    <BadgeDobleComputo />
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
