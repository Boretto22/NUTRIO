import { ArrowLeftRight } from 'lucide-react';
import { useState } from 'react';

import { FACTORES } from '@/data/factoresConversion';
import { cocidoDesdeCrudo, crudoDesdeCocido, formatearGramos } from '@/lib/bloques';

/** Utilidad autónoma para la pantalla de consulta de alimentos. */
export function CalculadoraCrudoCocido({ factorInicial }: { factorInicial?: number }) {
  const [factor, setFactor] = useState<number>(factorInicial ?? FACTORES[0].factor);
  const [cocido, setCocido] = useState('');
  const [crudo, setCrudo] = useState('');

  const actualizarDesdeCocido = (v: string) => {
    setCocido(v);
    const n = Number(v.replace(',', '.'));
    setCrudo(v === '' || Number.isNaN(n) ? '' : formatearGramos(crudoDesdeCocido(n, factor)));
  };

  const actualizarDesdeCrudo = (v: string) => {
    setCrudo(v);
    const n = Number(v.replace(',', '.'));
    setCocido(v === '' || Number.isNaN(n) ? '' : formatearGramos(cocidoDesdeCrudo(n, factor)));
  };

  const cambiarFactor = (nuevo: number) => {
    setFactor(nuevo);
    const n = Number(crudo.replace(',', '.'));
    if (crudo !== '' && !Number.isNaN(n)) setCocido(formatearGramos(cocidoDesdeCrudo(n, nuevo)));
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="etiqueta" htmlFor="factor-conversion">
          Tipo de alimento (factor de cocción)
        </label>
        <select
          id="factor-conversion"
          className="campo"
          value={factor}
          onChange={(e) => cambiarFactor(Number(e.target.value))}
        >
          {FACTORES.map((f) => (
            <option key={f.id} value={f.factor}>
              {f.nombre} (×{f.factor})
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="etiqueta" htmlFor="peso-cocido">
            Peso cocido (g)
          </label>
          <input
            id="peso-cocido"
            type="number"
            inputMode="decimal"
            min={0}
            className="campo tabular-nums"
            placeholder="0"
            value={cocido}
            onChange={(e) => actualizarDesdeCocido(e.target.value)}
          />
        </div>
        <ArrowLeftRight size={18} className="mb-3 shrink-0 text-neutral-400" aria-hidden />
        <div className="flex-1">
          <label className="etiqueta" htmlFor="peso-crudo">
            Peso crudo (g)
          </label>
          <input
            id="peso-crudo"
            type="number"
            inputMode="decimal"
            min={0}
            className="campo tabular-nums"
            placeholder="0"
            value={crudo}
            onChange={(e) => actualizarDesdeCrudo(e.target.value)}
          />
        </div>
      </div>

      <p className="text-[12px] leading-snug text-neutral-500 dark:text-neutral-400">
        Las tablas de bloques usan siempre el peso en <strong>crudo</strong>. Fórmula: crudo =
        cocido ÷ factor.
      </p>
    </div>
  );
}
