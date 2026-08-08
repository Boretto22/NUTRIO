import { Minus, Plus, Trash2 } from 'lucide-react';

import { SelectorAlimento } from '@/components/SelectorAlimento';
import { AYUDA_FRUTA } from '@/data/alimentos';
import { FACTORES, factorSugerido } from '@/data/factoresConversion';
import { GRUPOS } from '@/data/grupos';
import {
  bloquesAGramos,
  cocidoDesdeCrudo,
  crudoDesdeCocido,
  formatearBloques,
  formatearGramos,
  gramosABloques,
} from '@/lib/bloques';
import type { Alimento, Ingrediente } from '@/types';

export interface BorradorIngrediente {
  uid: string;
  alimento: Alimento | null;
  /** Peso en crudo, como texto para permitir el campo vacío. */
  gramos: string;
  bloques: string;
  cocido: boolean;
  factor: number;
  gramosCocido: string;
}

export function borradorVacio(): BorradorIngrediente {
  return {
    uid: crypto.randomUUID(),
    alimento: null,
    gramos: '',
    bloques: '',
    cocido: false,
    factor: FACTORES[0].factor,
    gramosCocido: '',
  };
}

export function borradorDesde(ingrediente: Ingrediente, alimento: Alimento): BorradorIngrediente {
  return {
    uid: crypto.randomUUID(),
    alimento,
    gramos: formatearGramos(ingrediente.gramos),
    bloques: formatearBloques(ingrediente.bloques),
    cocido: Boolean(ingrediente.pesadoEnCocido),
    factor: ingrediente.factorConversion ?? factorSugerido(alimento.id) ?? FACTORES[0].factor,
    gramosCocido: ingrediente.gramosCocido ? formatearGramos(ingrediente.gramosCocido) : '',
  };
}

export function borradorAIngrediente(b: BorradorIngrediente): Ingrediente | null {
  if (!b.alimento) return null;
  const bloques = Number(b.bloques.replace(',', '.'));
  const gramos = Number(b.gramos.replace(',', '.'));
  if (!Number.isFinite(bloques) || bloques <= 0) return null;
  return {
    alimentoId: b.alimento.id,
    gramos: Number.isFinite(gramos) ? gramos : bloquesAGramos(b.alimento, bloques),
    bloques,
    ...(b.cocido
      ? {
          pesadoEnCocido: true,
          factorConversion: b.factor,
          gramosCocido: Number(b.gramosCocido.replace(',', '.')) || 0,
        }
      : {}),
  };
}

const num = (v: string): number => {
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

interface FilaIngredienteProps {
  borrador: BorradorIngrediente;
  alimentos: Alimento[];
  onCambiar: (b: BorradorIngrediente) => void;
  onEliminar: () => void;
  puedeEliminar: boolean;
  indice: number;
}

export function FilaIngrediente({
  borrador,
  alimentos,
  onCambiar,
  onEliminar,
  puedeEliminar,
  indice,
}: FilaIngredienteProps) {
  const { alimento } = borrador;
  const esFruta = alimento?.grupo === 'frutas';
  const esUnidad = alimento?.unidad === 'unidad';
  const unidadPeso = alimento?.unidad === 'ml' ? 'ml' : 'g';

  const seleccionar = (nuevo: Alimento) => {
    const sugerido = factorSugerido(nuevo.id);
    onCambiar({
      ...borrador,
      alimento: nuevo,
      gramos: '',
      bloques: '',
      gramosCocido: '',
      cocido: false,
      factor: sugerido ?? borrador.factor,
    });
  };

  const setGramos = (valor: string) => {
    if (!alimento) return;
    const bloques = valor === '' ? '' : formatearBloques(gramosABloques(alimento, num(valor)));
    onCambiar({ ...borrador, gramos: valor, bloques });
  };

  const setBloques = (valor: string) => {
    if (!alimento) return;
    const gramos = valor === '' ? '' : formatearGramos(bloquesAGramos(alimento, num(valor)));
    onCambiar({ ...borrador, bloques: valor, gramos });
  };

  const setCocido = (valor: string) => {
    if (!alimento) return;
    if (valor === '') {
      onCambiar({ ...borrador, gramosCocido: '', gramos: '', bloques: '' });
      return;
    }
    const crudo = crudoDesdeCocido(num(valor), borrador.factor);
    onCambiar({
      ...borrador,
      gramosCocido: valor,
      gramos: formatearGramos(crudo),
      bloques: formatearBloques(gramosABloques(alimento, crudo)),
    });
  };

  const setFactor = (factor: number) => {
    if (!alimento) {
      onCambiar({ ...borrador, factor });
      return;
    }
    if (borrador.gramosCocido === '') {
      onCambiar({ ...borrador, factor });
      return;
    }
    const crudo = crudoDesdeCocido(num(borrador.gramosCocido), factor);
    onCambiar({
      ...borrador,
      factor,
      gramos: formatearGramos(crudo),
      bloques: formatearBloques(gramosABloques(alimento, crudo)),
    });
  };

  const alternarCocido = (activo: boolean) => {
    if (!activo) {
      onCambiar({ ...borrador, cocido: false, gramosCocido: '' });
      return;
    }
    const gramos = num(borrador.gramos);
    onCambiar({
      ...borrador,
      cocido: true,
      gramosCocido: gramos > 0 ? formatearGramos(cocidoDesdeCrudo(gramos, borrador.factor)) : '',
    });
  };

  const pasoBloques = (delta: number) => {
    const actual = num(borrador.bloques);
    const siguiente = Math.max(0, Math.round((actual + delta) * 2) / 2);
    setBloques(siguiente === 0 ? '' : formatearBloques(siguiente));
  };

  const meta = alimento ? GRUPOS[alimento.grupo] : null;
  const bloquesNum = num(borrador.bloques);

  return (
    <li className="rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-2 flex items-center justify-between">
        <span className="titulo-seccion">Ingrediente {indice + 1}</span>
        {puedeEliminar && (
          <button
            type="button"
            className="icono-btn !h-8 !w-8 !text-red-600 hover:!bg-red-50 dark:!text-red-400 dark:hover:!bg-red-500/10"
            onClick={onEliminar}
            aria-label={`Eliminar ingrediente ${indice + 1}`}
          >
            <Trash2 size={15} aria-hidden />
          </button>
        )}
      </div>

      <SelectorAlimento
        alimentos={alimentos}
        valor={alimento}
        onSeleccionar={seleccionar}
        onLimpiar={() => onCambiar({ ...borradorVacio(), uid: borrador.uid })}
      />

      {alimento && (
        <div className="mt-3 space-y-2.5">
          {esFruta ? (
            <div>
              <span className="etiqueta">Porciones (bloques)</span>
              <Stepper
                valor={borrador.bloques}
                onPaso={pasoBloques}
                onEscribir={setBloques}
                etiqueta={`Porciones de ${alimento.nombre}`}
              />
              {alimento.categoriaFruta && (
                <p className="mt-1.5 rounded-lg bg-neutral-100 px-2.5 py-1.5 text-[12px] leading-snug text-neutral-600 dark:bg-neutral-800/70 dark:text-neutral-400">
                  <strong>{AYUDA_FRUTA[alimento.categoriaFruta].titulo}:</strong>{' '}
                  {AYUDA_FRUTA[alimento.categoriaFruta].equivalencia}.{' '}
                  {AYUDA_FRUTA[alimento.categoriaFruta].pesar
                    ? 'Conviene pesar.'
                    : 'No hace falta pesar.'}
                </p>
              )}
            </div>
          ) : esUnidad ? (
            <div>
              <span className="etiqueta">Unidades (1 unidad = 1 bloque)</span>
              <Stepper
                valor={borrador.bloques}
                onPaso={pasoBloques}
                onEscribir={setBloques}
                etiqueta={`Unidades de ${alimento.nombre}`}
              />
              {alimento.notas && (
                <p className="mt-1.5 text-[12px] text-neutral-500 dark:text-neutral-400">
                  {alimento.notas}
                </p>
              )}
            </div>
          ) : (
            <>
              {borrador.cocido ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="etiqueta" htmlFor={`cocido-${borrador.uid}`}>
                        Peso cocido ({unidadPeso})
                      </label>
                      <input
                        id={`cocido-${borrador.uid}`}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        className="campo tabular-nums"
                        placeholder="0"
                        value={borrador.gramosCocido}
                        onChange={(e) => setCocido(e.target.value)}
                      />
                    </div>
                    <div className="w-[42%]">
                      <label className="etiqueta" htmlFor={`factor-${borrador.uid}`}>
                        Factor
                      </label>
                      <select
                        id={`factor-${borrador.uid}`}
                        className="campo"
                        value={borrador.factor}
                        onChange={(e) => setFactor(Number(e.target.value))}
                      >
                        {FACTORES.map((f) => (
                          <option key={f.id} value={f.factor}>
                            {f.nombre} ×{f.factor}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="rounded-lg bg-neutral-100 px-2.5 py-1.5 text-[12.5px] text-neutral-700 dark:bg-neutral-800/70 dark:text-neutral-300">
                    ={' '}
                    <strong className="tabular-nums">
                      {borrador.gramos || 0} {unidadPeso}
                    </strong>{' '}
                    en crudo
                  </p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="etiqueta" htmlFor={`gramos-${borrador.uid}`}>
                      Peso crudo ({unidadPeso})
                    </label>
                    <input
                      id={`gramos-${borrador.uid}`}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      className="campo tabular-nums"
                      placeholder="0"
                      value={borrador.gramos}
                      onChange={(e) => setGramos(e.target.value)}
                    />
                  </div>
                  <div className="w-[42%]">
                    <label className="etiqueta" htmlFor={`bloques-${borrador.uid}`}>
                      Bloques
                    </label>
                    <input
                      id={`bloques-${borrador.uid}`}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step={0.5}
                      className="campo tabular-nums"
                      placeholder="0"
                      value={borrador.bloques}
                      onChange={(e) => setBloques(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <label className="flex min-h-[36px] cursor-pointer items-center gap-2 text-[13px] text-neutral-600 dark:text-neutral-400">
                <input
                  type="checkbox"
                  checked={borrador.cocido}
                  onChange={(e) => alternarCocido(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-marca-500 focus:ring-marca-500 dark:border-neutral-600 dark:bg-neutral-800"
                />
                He pesado en cocido
              </label>
            </>
          )}

          {bloquesNum > 0 && meta && (
            <p className="text-[13px] font-semibold" style={{ color: meta.color }}>
              = {formatearBloques(bloquesNum)}{' '}
              {bloquesNum === 1 ? 'bloque' : 'bloques'} de {meta.nombre}
              {alimento.dobleComputo && (
                <span className="text-neutral-600 dark:text-neutral-400">
                  {' '}
                  + {formatearBloques(bloquesNum)} de {GRUPOS.proteicos1.nombre}
                </span>
              )}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

function Stepper({
  valor,
  onPaso,
  onEscribir,
  etiqueta,
}: {
  valor: string;
  onPaso: (delta: number) => void;
  onEscribir: (v: string) => void;
  etiqueta: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="icono-btn shrink-0 border border-neutral-300 dark:border-neutral-700"
        onClick={() => onPaso(-0.5)}
        aria-label={`Quitar 0,5 — ${etiqueta}`}
      >
        <Minus size={17} aria-hidden />
      </button>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step={0.5}
        className="campo text-center tabular-nums"
        placeholder="0"
        value={valor}
        aria-label={etiqueta}
        onChange={(e) => onEscribir(e.target.value)}
      />
      <button
        type="button"
        className="icono-btn shrink-0 border border-neutral-300 dark:border-neutral-700"
        onClick={() => onPaso(0.5)}
        aria-label={`Añadir 0,5 — ${etiqueta}`}
      >
        <Plus size={17} aria-hidden />
      </button>
    </div>
  );
}
