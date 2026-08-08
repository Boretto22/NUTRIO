import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Modal } from '@/components/Modal';
import { etiquetaMesAnio, fechaLocalISO, formatoCorto } from '@/lib/fechas';
import { matrizMes } from '@/lib/planificacion';

const DIAS_LUNES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DIAS_DOMINGO = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

interface SelectorFechasProps {
  abierto: boolean;
  titulo: string;
  descripcion?: string;
  /** Fecha desde la que arranca la vista y que no se puede elegir. */
  fechaBase: string;
  primerDiaSemana: 0 | 1;
  multiple?: boolean;
  textoConfirmar?: string;
  onCerrar: () => void;
  onConfirmar: (fechas: string[]) => void;
}

export function SelectorFechas({
  abierto,
  titulo,
  descripcion,
  fechaBase,
  primerDiaSemana,
  multiple = true,
  textoConfirmar = 'Aplicar',
  onCerrar,
  onConfirmar,
}: SelectorFechasProps) {
  const base = useMemo(() => new Date(`${fechaBase}T00:00:00`), [fechaBase]);
  const [anio, setAnio] = useState(base.getFullYear());
  const [mes, setMes] = useState(base.getMonth());
  const [elegidas, setElegidas] = useState<string[]>([]);

  const semanas = useMemo(() => matrizMes(anio, mes, primerDiaSemana), [anio, mes, primerDiaSemana]);
  const cabecera = primerDiaSemana === 1 ? DIAS_LUNES : DIAS_DOMINGO;
  const etiquetaMes = etiquetaMesAnio(anio, mes);

  const alternar = (iso: string) => {
    setElegidas((prev) => {
      if (!multiple) return prev.includes(iso) ? [] : [iso];
      return prev.includes(iso) ? prev.filter((f) => f !== iso) : [...prev, iso];
    });
  };

  const cambiarMes = (delta: number) => {
    const d = new Date(anio, mes + delta, 1);
    setAnio(d.getFullYear());
    setMes(d.getMonth());
  };

  return (
    <Modal
      abierto={abierto}
      titulo={titulo}
      descripcion={descripcion}
      onCerrar={onCerrar}
      pie={
        <div className="flex gap-2">
          <button type="button" className="btn-secundario flex-1" onClick={onCerrar}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-primario flex-1"
            disabled={elegidas.length === 0}
            onClick={() => {
              onConfirmar(elegidas);
              setElegidas([]);
            }}
          >
            {textoConfirmar}
            {elegidas.length > 0 && ` (${elegidas.length})`}
          </button>
        </div>
      }
    >
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          className="icono-btn"
          onClick={() => cambiarMes(-1)}
          aria-label="Mes anterior"
        >
          <ChevronLeft size={18} aria-hidden />
        </button>
        <span className="text-[14px] font-bold">{etiquetaMes}</span>
        <button
          type="button"
          className="icono-btn"
          onClick={() => cambiarMes(1)}
          aria-label="Mes siguiente"
        >
          <ChevronRight size={18} aria-hidden />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7" aria-hidden>
        {cabecera.map((d, i) => (
          <span
            key={`${d}-${i}`}
            className="text-center text-[11px] font-bold uppercase text-neutral-400"
          >
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {semanas.flat().map((fechaObj, i) => {
          if (!fechaObj) return <span key={`v-${i}`} className="h-11" aria-hidden />;
          const iso = fechaLocalISO(fechaObj);
          const esBase = iso === fechaBase;
          const elegida = elegidas.includes(iso);

          return (
            <button
              key={iso}
              type="button"
              disabled={esBase}
              aria-pressed={elegida}
              aria-label={formatoCorto(iso)}
              onClick={() => alternar(iso)}
              className={`h-11 rounded-lg text-[13px] font-semibold tabular-nums transition-colors ${
                esBase
                  ? 'cursor-not-allowed bg-neutral-100 text-neutral-300 dark:bg-neutral-800 dark:text-neutral-600'
                  : elegida
                    ? 'bg-marca-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {fechaObj.getDate()}
            </button>
          );
        })}
      </div>

      {elegidas.length > 0 && (
        <p className="mt-3 text-[12.5px] text-neutral-600 dark:text-neutral-400">
          {elegidas.length === 1
            ? `Se aplicará al ${formatoCorto(elegidas[0])}.`
            : `Se aplicará a ${elegidas.length} fechas.`}
        </p>
      )}
    </Modal>
  );
}
