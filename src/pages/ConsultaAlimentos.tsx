import { ArrowLeftRight, Info, Plus, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { CalculadoraCrudoCocido } from '@/components/CalculadoraCrudoCocido';
import { BadgeDobleComputo } from '@/components/ChipGrupo';
import { Modal } from '@/components/Modal';
import { AYUDA_FRUTA } from '@/data/alimentos';
import { factorSugerido } from '@/data/factoresConversion';
import { GRUPOS, GRUPOS_ORDEN } from '@/data/grupos';
import { track } from '@/lib/analytics';
import {
  bloquesAGramos,
  formatearBloques,
  formatearGramos,
  gramosABloques,
} from '@/lib/bloques';
import { buscarAlimentos } from '@/lib/search';
import { useApp } from '@/store/useApp';
import type { Alimento, GrupoId } from '@/types';

const MULTIPLICADORES = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8];

export function ConsultaAlimentos() {
  const { alimentos } = useApp();
  const [consulta, setConsulta] = useState('');
  const [filtros, setFiltros] = useState<GrupoId[]>([]);
  const [detalle, setDetalle] = useState<Alimento | null>(null);

  const resultados = useMemo(
    () => buscarAlimentos(alimentos, consulta, { grupos: filtros }),
    [alimentos, consulta, filtros],
  );

  const alternarFiltro = (g: GrupoId) =>
    setFiltros((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  return (
    <div>
      <header
        className="sticky top-0 z-20 space-y-2 border-b border-neutral-200 bg-neutral-100/95 px-4 pb-2.5 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
      >
        <h1 className="text-[17px] font-bold">Consulta de alimentos</h1>

        <div className="relative">
          <Search
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            aria-hidden
          />
          <input
            type="search"
            className="campo pl-9 pr-9"
            placeholder="Busca por nombre o descripción…"
            value={consulta}
            aria-label="Buscar alimento"
            onChange={(e) => setConsulta(e.target.value)}
          />
          {consulta && (
            <button
              type="button"
              className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-600"
              onClick={() => setConsulta('')}
              aria-label="Limpiar búsqueda"
            >
              <X size={16} aria-hidden />
            </button>
          )}
        </div>

        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5 sin-scrollbar" role="group" aria-label="Filtrar por grupo">
          {GRUPOS_ORDEN.map((g) => {
            const activo = filtros.includes(g);
            return (
              <button
                key={g}
                type="button"
                aria-pressed={activo}
                onClick={() => alternarFiltro(g)}
                className="shrink-0 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-all"
                style={{
                  borderColor: GRUPOS[g].color,
                  backgroundColor: activo ? GRUPOS[g].color : 'transparent',
                  color: activo ? '#fff' : GRUPOS[g].color,
                }}
              >
                {GRUPOS[g].nombreCorto}
              </button>
            );
          })}
          {filtros.length > 0 && (
            <button
              type="button"
              className="shrink-0 rounded-full px-2.5 py-1.5 text-[12.5px] font-semibold text-neutral-500 underline"
              onClick={() => setFiltros([])}
            >
              Quitar
            </button>
          )}
        </div>
      </header>

      <div className="px-4 pt-3">
        <p className="mb-2 text-[12px] text-neutral-500 dark:text-neutral-400">
          {resultados.length} {resultados.length === 1 ? 'alimento' : 'alimentos'}
        </p>

        {resultados.length === 0 ? (
          <div className="tarjeta p-6 text-center text-[14px] text-neutral-600 dark:text-neutral-400">
            No hay alimentos que coincidan con la búsqueda.
          </div>
        ) : (
          <ul className="space-y-1.5">
            {resultados.map((a) => {
              const meta = GRUPOS[a.grupo];
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setDetalle(a);
                      track('alimento_consultado', { alimentoId: a.id });
                    }}
                    className="tarjeta flex w-full items-center gap-2.5 p-3 text-left transition-colors hover:border-neutral-300 dark:hover:border-neutral-700"
                  >
                    <span
                      className="h-8 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: meta.color }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14.5px] font-semibold leading-tight">
                        {a.nombre}
                      </p>
                      {a.descripcion && (
                        <p className="truncate text-[12px] text-neutral-500 dark:text-neutral-400">
                          {a.descripcion}
                        </p>
                      )}
                      <p className="mt-0.5 text-[11.5px] font-semibold" style={{ color: meta.color }}>
                        {meta.nombreCorto}
                      </p>
                    </div>
                    {a.dobleComputo && <BadgeDobleComputo className="shrink-0" />}
                    <span className="shrink-0 text-right text-[12px] leading-tight text-neutral-600 dark:text-neutral-400">
                      1 bloque
                      <br />
                      <strong className="text-[13.5px] text-neutral-900 tabular-nums dark:text-neutral-100">
                        {a.grupo === 'frutas'
                          ? '1 porción'
                          : a.unidad === 'unidad'
                            ? '1 ud'
                            : `${a.gramosPorBloque} ${a.unidad === 'ml' ? 'ml' : 'g'}`}
                      </strong>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-4 rounded-xl bg-neutral-200/60 p-3 text-center text-[12px] font-medium text-neutral-600 dark:bg-neutral-800/60 dark:text-neutral-400">
          Todas las cantidades están expresadas en GRAMOS y en CRUDO.
        </p>
      </div>

      {detalle && (
        <DetalleAlimento alimento={detalle} onCerrar={() => setDetalle(null)} />
      )}
    </div>
  );
}

function DetalleAlimento({ alimento, onCerrar }: { alimento: Alimento; onCerrar: () => void }) {
  const navigate = useNavigate();
  const meta = GRUPOS[alimento.grupo];
  const factor = factorSugerido(alimento.id);
  const unidad = alimento.unidad === 'ml' ? 'ml' : 'g';
  const esFruta = alimento.grupo === 'frutas';
  const esUnidad = alimento.unidad === 'unidad';

  const [gramos, setGramos] = useState('');
  const [bloques, setBloques] = useState('');

  const desdeGramos = (v: string) => {
    setGramos(v);
    const n = Number(v.replace(',', '.'));
    setBloques(v === '' || !Number.isFinite(n) ? '' : formatearBloques(gramosABloques(alimento, n)));
  };

  const desdeBloques = (v: string) => {
    setBloques(v);
    const n = Number(v.replace(',', '.'));
    setGramos(v === '' || !Number.isFinite(n) ? '' : formatearGramos(bloquesAGramos(alimento, n)));
  };

  return (
    <Modal
      abierto
      titulo={alimento.nombre}
      descripcion={alimento.descripcion}
      onCerrar={onCerrar}
      pie={
        <button
          type="button"
          className="btn-primario w-full"
          onClick={() => navigate('/nueva', { state: { alimentoId: alimento.id } })}
        >
          <Plus size={18} aria-hidden />
          Añadir a una comida de hoy
        </button>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-bold"
            style={{ backgroundColor: `${meta.color}1f`, color: meta.color }}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} aria-hidden />
            {meta.nombre}
          </span>
          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[12.5px] font-bold dark:bg-neutral-800">
            1 bloque ={' '}
            {esFruta
              ? '1 porción'
              : esUnidad
                ? '1 unidad'
                : `${alimento.gramosPorBloque} ${unidad}`}
          </span>
          {alimento.dobleComputo && <BadgeDobleComputo />}
        </div>

        {alimento.dobleComputo && (
          <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-[13px] leading-snug text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
            <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
            <span>
              <strong>Doble cómputo:</strong> las legumbres restan a la vez 1 bloque de
              Carbohidratos y 1 bloque de Alimentos Proteicos I.
            </span>
          </p>
        )}

        {esFruta && alimento.categoriaFruta && (
          <p className="rounded-xl bg-neutral-100 p-3 text-[13px] leading-snug text-neutral-700 dark:bg-neutral-800/70 dark:text-neutral-300">
            <strong>{AYUDA_FRUTA[alimento.categoriaFruta].titulo}.</strong>{' '}
            {AYUDA_FRUTA[alimento.categoriaFruta].equivalencia}.{' '}
            {AYUDA_FRUTA[alimento.categoriaFruta].pesar
              ? 'Conviene pesarla.'
              : 'No hace falta pesarla.'}
          </p>
        )}

        {alimento.notas && (
          <p className="text-[13px] text-neutral-600 dark:text-neutral-400">{alimento.notas}</p>
        )}

        <section>
          <h3 className="mb-2 titulo-seccion">Tabla de equivalencias</h3>
          <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
            <table className="w-full text-[13px]">
              <caption className="sr-only">
                Equivalencia entre bloques y {esUnidad ? 'unidades' : `${unidad} de ${alimento.nombre}`}
              </caption>
              <thead>
                <tr className="bg-neutral-100 dark:bg-neutral-800">
                  <th scope="col" className="px-3 py-1.5 text-left font-semibold">
                    Bloques
                  </th>
                  <th scope="col" className="px-3 py-1.5 text-right font-semibold">
                    {esUnidad ? 'Unidades' : `Cantidad (${unidad}, crudo)`}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {MULTIPLICADORES.map((n) => (
                  <tr key={n}>
                    <td className="px-3 py-1.5 tabular-nums">x{formatearBloques(n)}</td>
                    <td className="px-3 py-1.5 text-right font-semibold tabular-nums">
                      {esUnidad
                        ? formatearBloques(n)
                        : `${formatearGramos(alimento.gramosPorBloque * n)} ${unidad}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3 className="mb-2 flex items-center gap-1.5 titulo-seccion">
            <ArrowLeftRight size={12} aria-hidden />
            Calculadora
          </h3>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="etiqueta" htmlFor="calc-gramos">
                {esUnidad ? 'Unidades' : `Cantidad (${unidad})`}
              </label>
              <input
                id="calc-gramos"
                type="number"
                inputMode="decimal"
                min={0}
                className="campo tabular-nums"
                placeholder="0"
                value={gramos}
                onChange={(e) => desdeGramos(e.target.value)}
              />
            </div>
            <ArrowLeftRight size={18} className="mb-3 shrink-0 text-neutral-400" aria-hidden />
            <div className="flex-1">
              <label className="etiqueta" htmlFor="calc-bloques">
                Bloques
              </label>
              <input
                id="calc-bloques"
                type="number"
                inputMode="decimal"
                min={0}
                step={0.5}
                className="campo tabular-nums"
                placeholder="0"
                value={bloques}
                onChange={(e) => desdeBloques(e.target.value)}
              />
            </div>
          </div>
        </section>

        {factor !== undefined && (
          <section>
            <h3 className="mb-2 titulo-seccion">Conversión crudo / cocido</h3>
            <CalculadoraCrudoCocido factorInicial={factor} />
          </section>
        )}
      </div>
    </Modal>
  );
}
