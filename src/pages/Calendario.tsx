import { CalendarClock, CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { DetalleDiaPlanificado } from '@/components/DetalleDiaPlanificado';
import { RejillaMes } from '@/components/RejillaMes';
import { etiquetaMesAnio, fechaLocalISO } from '@/lib/fechas';
import { useApp } from '@/store/useApp';
import type { ModoCalendario, PlatoPlanificado } from '@/types';

const DESCRIPCION_MODO: Record<ModoCalendario, string> = {
  agenda:
    'Solo referencia: lo planificado no aparece en Hoy hasta que pulses Registrar.',
  programar:
    'Al llegar el día, lo planificado aparece en Hoy como pendiente de confirmar.',
};

export function Calendario() {
  const { estado, alimentosPorId, hoy, setAjustes } = useApp();
  const navigate = useNavigate();

  const base = useMemo(() => new Date(`${hoy}T00:00:00`), [hoy]);
  const [anio, setAnio] = useState(base.getFullYear());
  const [mes, setMes] = useState(base.getMonth());
  const [seleccionada, setSeleccionada] = useState<string | null>(null);

  const modo = estado.ajustes.modoCalendario;

  const etiquetaMes = etiquetaMesAnio(anio, mes);

  const cambiarMes = (delta: number) => {
    const d = new Date(anio, mes + delta, 1);
    setAnio(d.getFullYear());
    setMes(d.getMonth());
  };

  const irAHoy = () => {
    setAnio(base.getFullYear());
    setMes(base.getMonth());
    setSeleccionada(hoy);
  };

  const totalPlanificados = useMemo(() => {
    const primero = fechaLocalISO(new Date(anio, mes, 1));
    const ultimo = fechaLocalISO(new Date(anio, mes + 1, 0));
    return Object.entries(estado.planificacion)
      .filter(([fecha]) => fecha >= primero && fecha <= ultimo)
      .reduce((suma, [, dia]) => suma + dia.platos.length, 0);
  }, [estado.planificacion, anio, mes]);

  const abrirFormulario = (fecha: string, comidaId: string, plato?: PlatoPlanificado) => {
    navigate('/planificar', {
      state: { fecha, comidaId, platoPlanificadoId: plato?.id, volverA: '/calendario' },
    });
  };

  return (
    <div className="space-y-4 px-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <header>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="icono-btn -ml-2"
            onClick={() => cambiarMes(-1)}
            aria-label="Mes anterior"
          >
            <ChevronLeft size={20} aria-hidden />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-center text-[17px] font-bold">
            {etiquetaMes}
          </h1>
          <button
            type="button"
            className="icono-btn"
            onClick={() => cambiarMes(1)}
            aria-label="Mes siguiente"
          >
            <ChevronRight size={20} aria-hidden />
          </button>
          <button
            type="button"
            className="btn-fantasma -mr-2 !px-2.5 text-[13px]"
            onClick={irAHoy}
          >
            Hoy
          </button>
        </div>
        <p className="mt-0.5 text-center text-[12px] text-neutral-500 dark:text-neutral-400">
          {totalPlanificados === 0
            ? 'Sin nada planificado este mes'
            : `${totalPlanificados} ${totalPlanificados === 1 ? 'plato planificado' : 'platos planificados'} este mes`}
        </p>
      </header>

      <section aria-label="Modo del calendario" className="tarjeta p-2.5">
        <div
          className="flex gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800"
          role="group"
          aria-label="Modo del calendario"
        >
          {(['agenda', 'programar'] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={modo === m}
              onClick={() => setAjustes({ modoCalendario: m })}
              className={`flex min-h-[38px] flex-1 items-center justify-center gap-1.5 rounded-lg text-[13px] font-semibold capitalize transition-colors ${
                modo === m
                  ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-950 dark:text-neutral-100'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              {m === 'agenda' ? (
                <CalendarRange size={15} aria-hidden />
              ) : (
                <CalendarClock size={15} aria-hidden />
              )}
              {m}
            </button>
          ))}
        </div>
        <p className="mt-2 px-0.5 text-[12px] leading-snug text-neutral-600 dark:text-neutral-400">
          {DESCRIPCION_MODO[modo]}
        </p>
      </section>

      <RejillaMes
        anio={anio}
        mes={mes}
        estado={estado}
        alimentos={alimentosPorId}
        hoy={hoy}
        seleccionada={seleccionada}
        onSeleccionar={setSeleccionada}
        onCambiarMes={cambiarMes}
      />

      <Leyenda />

      {seleccionada && (
        <DetalleDiaPlanificado
          fecha={seleccionada}
          onCerrar={() => setSeleccionada(null)}
          onAnadirPlato={(comidaId) => abrirFormulario(seleccionada, comidaId)}
          onEditarPlato={(plato) => abrirFormulario(seleccionada, plato.comidaId, plato)}
        />
      )}
    </div>
  );
}

function Leyenda() {
  const items = [
    { clase: 'ring-2 ring-emerald-500', texto: 'Cumplido' },
    { clase: 'ring-2 ring-amber-500', texto: 'Parcial' },
    { clase: 'ring-2 ring-red-500', texto: 'Incumplido' },
    { clase: 'ring-2 ring-neutral-300 dark:ring-neutral-700', texto: 'Sin datos' },
  ];

  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 pb-2 text-[11.5px] text-neutral-500 dark:text-neutral-400">
      {items.map((i) => (
        <li key={i.texto} className="flex items-center gap-1.5">
          <span className={`h-3 w-3 rounded ${i.clase}`} aria-hidden />
          {i.texto}
        </li>
      ))}
    </ul>
  );
}
