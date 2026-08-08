import { Search, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { BadgeDobleComputo } from '@/components/ChipGrupo';
import { GRUPOS } from '@/data/grupos';
import { buscarAlimentos } from '@/lib/search';
import type { Alimento } from '@/types';

interface SelectorAlimentoProps {
  alimentos: Alimento[];
  valor: Alimento | null;
  onSeleccionar: (alimento: Alimento) => void;
  onLimpiar?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
}

const LIMITE = 40;

export function SelectorAlimento({
  alimentos,
  valor,
  onSeleccionar,
  onLimpiar,
  autoFocus,
  placeholder = 'Busca un alimento…',
}: SelectorAlimentoProps) {
  const [consulta, setConsulta] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [indiceActivo, setIndiceActivo] = useState(0);
  const contenedor = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const lista = useRef<HTMLUListElement>(null);
  const idBase = useId();

  const resultados = useMemo(
    () => buscarAlimentos(alimentos, consulta, { limite: LIMITE }),
    [alimentos, consulta],
  );

  useEffect(() => setIndiceActivo(0), [consulta]);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener('mousedown', fuera);
    return () => document.removeEventListener('mousedown', fuera);
  }, [abierto]);

  useEffect(() => {
    if (!abierto || !lista.current) return;
    lista.current
      .querySelector(`[data-indice="${indiceActivo}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [indiceActivo, abierto]);

  const elegir = (alimento: Alimento) => {
    onSeleccionar(alimento);
    setConsulta('');
    setAbierto(false);
    input.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!abierto) setAbierto(true);
      setIndiceActivo((i) => Math.min(i + 1, resultados.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndiceActivo((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (abierto && resultados[indiceActivo]) {
        e.preventDefault();
        elegir(resultados[indiceActivo]);
      }
    } else if (e.key === 'Escape') {
      setAbierto(false);
    }
  };

  if (valor && !abierto) {
    const meta = GRUPOS[valor.grupo];
    return (
      <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: meta.color }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold leading-tight">{valor.nombre}</p>
          <p className="truncate text-[12px] text-neutral-500 dark:text-neutral-400">
            {valor.descripcion ? `${valor.descripcion} · ` : ''}
            1 bloque = {valor.unidad === 'unidad' ? '1 unidad' : `${valor.gramosPorBloque} ${valor.unidad === 'ml' ? 'ml' : 'g'}`}
          </p>
        </div>
        {valor.dobleComputo && <BadgeDobleComputo className="shrink-0" />}
        <button
          type="button"
          className="icono-btn !h-9 !w-9 shrink-0"
          onClick={() => {
            onLimpiar?.();
            setAbierto(true);
            window.setTimeout(() => input.current?.focus(), 10);
          }}
          aria-label={`Cambiar alimento (${valor.nombre})`}
        >
          <X size={16} aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div ref={contenedor} className="relative">
      <div className="relative">
        <Search
          size={17}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          aria-hidden
        />
        <input
          ref={input}
          type="text"
          role="combobox"
          aria-expanded={abierto}
          aria-controls={`${idBase}-lista`}
          aria-autocomplete="list"
          aria-activedescendant={
            abierto && resultados[indiceActivo] ? `${idBase}-op-${indiceActivo}` : undefined
          }
          aria-label="Buscar alimento"
          autoComplete="off"
          className="campo pl-9"
          placeholder={placeholder}
          value={consulta}
          autoFocus={autoFocus}
          onChange={(e) => {
            setConsulta(e.target.value);
            setAbierto(true);
          }}
          onFocus={() => setAbierto(true)}
          onKeyDown={onKeyDown}
        />
      </div>

      {abierto && (
        <ul
          ref={lista}
          id={`${idBase}-lista`}
          role="listbox"
          aria-label="Resultados de alimentos"
          className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-xl border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
        >
          {resultados.length === 0 && (
            <li className="px-3 py-4 text-center text-[13px] text-neutral-500 dark:text-neutral-400">
              Ningún alimento coincide con «{consulta}»
            </li>
          )}
          {resultados.map((a, i) => {
            const meta = GRUPOS[a.grupo];
            const activo = i === indiceActivo;
            return (
              <li
                key={a.id}
                id={`${idBase}-op-${i}`}
                data-indice={i}
                role="option"
                aria-selected={activo}
                onMouseEnter={() => setIndiceActivo(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => elegir(a)}
                className={`flex cursor-pointer items-center gap-2 px-3 py-2 ${
                  activo ? 'bg-neutral-100 dark:bg-neutral-800' : ''
                }`}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: meta.color }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium leading-tight">
                    {a.nombre}
                    {a.descripcion && (
                      <span className="font-normal text-neutral-500 dark:text-neutral-400">
                        {' '}
                        · {a.descripcion}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-neutral-500 dark:text-neutral-400">
                    <span style={{ color: meta.color }} className="font-semibold">
                      {meta.nombreCorto}
                    </span>
                    ·{' '}
                    {a.grupo === 'frutas'
                      ? '1 bloque = 1 porción'
                      : a.unidad === 'unidad'
                        ? '1 bloque = 1 unidad'
                        : `1 bloque = ${a.gramosPorBloque} ${a.unidad === 'ml' ? 'ml' : 'g'}`}
                  </p>
                </div>
                {a.dobleComputo && <BadgeDobleComputo className="shrink-0" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
