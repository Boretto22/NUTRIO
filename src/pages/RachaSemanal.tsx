import { ChevronLeft, ChevronRight, Flame, Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { GRUPOS, GRUPOS_ORDEN } from '@/data/grupos';
import {
  calcularRacha,
  consumidoDelDia,
  estadoDelDia,
  formatearBloques,
  gruposFueraDeTolerancia,
  objetivosDelDia,
  redondear,
} from '@/lib/bloques';
import { DIAS_SEMANA_CORTO, desdeISO, formatoLargo, hoyISO, rangoSemanaTexto, semanaDe, sumarDias } from '@/lib/fechas';
import { useApp } from '@/store/useApp';
import type { EstadoDia, GrupoId } from '@/types';

const COLOR_ESTADO: Record<EstadoDia, string> = {
  cumplido: '#27AE60',
  parcial: '#E8A33D',
  incumplido: '#E5534B',
  sin_datos: '#9CA3AF',
};

const ETIQUETA_ESTADO: Record<EstadoDia, string> = {
  cumplido: 'Cumplido',
  parcial: 'Parcial',
  incumplido: 'No cumplido',
  sin_datos: 'Sin registrar',
};

export function RachaSemanal() {
  const { estado, alimentos, hoy, setFechaActiva } = useApp();
  const [ancla, setAncla] = useState(hoy);
  const tolerancia = estado.ajustes.toleranciaBloques;

  const semana = useMemo(
    () => semanaDe(ancla, estado.ajustes.primerDiaSemana),
    [ancla, estado.ajustes.primerDiaSemana],
  );

  const racha = useMemo(
    () => calcularRacha(estado.dias, estado.ajustes, alimentos, hoyISO()),
    [estado.dias, estado.ajustes, alimentos],
  );

  const diasSemana = useMemo(
    () =>
      semana.map((fecha) => {
        const dia = estado.dias[fecha];
        return {
          fecha,
          dia,
          estado: dia ? estadoDelDia(dia, alimentos, tolerancia) : ('sin_datos' as EstadoDia),
        };
      }),
    [semana, estado.dias, alimentos, tolerancia],
  );

  const conDatos = diasSemana.filter((d) => d.dia && d.dia.platos.length > 0);

  const datosGrafica = useMemo(() => {
    if (conDatos.length === 0) return [];
    const acumConsumido = {} as Record<GrupoId, number>;
    const acumObjetivo = {} as Record<GrupoId, number>;
    for (const g of GRUPOS_ORDEN) {
      acumConsumido[g] = 0;
      acumObjetivo[g] = 0;
    }
    for (const { dia } of conDatos) {
      if (!dia) continue;
      const c = consumidoDelDia(dia, alimentos);
      const o = objetivosDelDia(dia);
      for (const g of GRUPOS_ORDEN) {
        acumConsumido[g] += c[g];
        acumObjetivo[g] += o[g];
      }
    }
    return GRUPOS_ORDEN.filter((g) => acumObjetivo[g] > 0 || acumConsumido[g] > 0).map((g) => ({
      grupo: GRUPOS[g].nombreCorto,
      color: GRUPOS[g].color,
      Objetivo: redondear(acumObjetivo[g] / conDatos.length, 1),
      Consumido: redondear(acumConsumido[g] / conDatos.length, 1),
    }));
  }, [conDatos, alimentos]);

  const resumen = useMemo(() => {
    const tipoA = conDatos.filter((d) => d.dia?.planId === 'A').length;
    const tipoB = conDatos.filter((d) => d.dia?.planId === 'B').length;
    const platos = conDatos.flatMap((d) => d.dia?.platos ?? []);

    const cuentaNombres = new Map<string, number>();
    for (const p of platos) {
      cuentaNombres.set(p.nombre, (cuentaNombres.get(p.nombre) ?? 0) + 1);
    }
    const masRepetido = [...cuentaNombres.entries()].sort((a, b) => b[1] - a[1])[0];

    const cuentaFallos = new Map<GrupoId, number>();
    for (const { dia } of conDatos) {
      if (!dia) continue;
      for (const g of gruposFueraDeTolerancia(dia, alimentos, tolerancia)) {
        cuentaFallos.set(g, (cuentaFallos.get(g) ?? 0) + 1);
      }
    }
    const peorGrupo = [...cuentaFallos.entries()].sort((a, b) => b[1] - a[1])[0];

    return { tipoA, tipoB, platos: platos.length, masRepetido, peorGrupo };
  }, [conDatos, alimentos, tolerancia]);

  return (
    <div className="space-y-4 px-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <h1 className="text-[17px] font-bold">Racha semanal</h1>

      <div className="grid grid-cols-2 gap-3">
        <div className="tarjeta flex flex-col items-center gap-1 p-4">
          <Flame size={22} className="text-orange-500" aria-hidden />
          <p className="text-3xl font-extrabold leading-none tabular-nums">{racha.actual}</p>
          <p className="text-center text-[12px] font-medium text-neutral-600 dark:text-neutral-400">
            Racha actual
            <br />
            {racha.actual === 1 ? 'día' : 'días'} seguidos
          </p>
        </div>
        <div className="tarjeta flex flex-col items-center gap-1 p-4">
          <Trophy size={22} className="text-amber-500" aria-hidden />
          <p className="text-3xl font-extrabold leading-none tabular-nums">{racha.mejor}</p>
          <p className="text-center text-[12px] font-medium text-neutral-600 dark:text-neutral-400">
            Mejor racha
            <br />
            histórica
          </p>
        </div>
      </div>

      <section className="tarjeta p-3">
        <div className="mb-3 flex items-center gap-1">
          <button
            type="button"
            className="icono-btn !h-9 !w-9"
            onClick={() => setAncla(sumarDias(ancla, -7))}
            aria-label="Semana anterior"
          >
            <ChevronLeft size={18} aria-hidden />
          </button>
          <p className="flex-1 text-center text-[13.5px] font-bold">{rangoSemanaTexto(semana)}</p>
          <button
            type="button"
            className="icono-btn !h-9 !w-9 disabled:opacity-30"
            onClick={() => setAncla(sumarDias(ancla, 7))}
            disabled={semana[6] >= hoy}
            aria-label="Semana siguiente"
          >
            <ChevronRight size={18} aria-hidden />
          </button>
        </div>

        <ul className="flex justify-between gap-1">
          {diasSemana.map(({ fecha, dia, estado: estadoDia }) => {
            const esHoy = fecha === hoy;
            const futuro = fecha > hoy;
            return (
              <li key={fecha} className="flex-1">
                <button
                  type="button"
                  disabled={futuro}
                  onClick={() => setFechaActiva(fecha)}
                  className="flex w-full flex-col items-center gap-1 disabled:opacity-35"
                  title={`${formatoLargo(fecha)} — ${ETIQUETA_ESTADO[estadoDia]}`}
                >
                  <span className="text-[10px] font-bold uppercase text-neutral-500 dark:text-neutral-400">
                    {DIAS_SEMANA_CORTO[desdeISO(fecha).getDay()]}
                  </span>
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-bold text-white ${
                      esHoy ? 'ring-2 ring-neutral-900 ring-offset-2 dark:ring-white dark:ring-offset-neutral-900' : ''
                    }`}
                    style={{ backgroundColor: COLOR_ESTADO[estadoDia] }}
                  >
                    {desdeISO(fecha).getDate()}
                  </span>
                  <span className="h-4 text-[10px] font-bold text-neutral-500 dark:text-neutral-400">
                    {dia ? dia.planId : ''}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <ul className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 border-t border-neutral-100 pt-2.5 dark:border-neutral-800">
          {(Object.keys(COLOR_ESTADO) as EstadoDia[]).map((e) => (
            <li key={e} className="flex items-center gap-1.5 text-[11px] text-neutral-600 dark:text-neutral-400">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLOR_ESTADO[e] }}
                aria-hidden
              />
              {ETIQUETA_ESTADO[e]}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-center text-[11.5px] leading-snug text-neutral-500 dark:text-neutral-400">
          Un día se considera cumplido cuando todos los grupos quedan dentro de ±
          {formatearBloques(tolerancia)} bloques del objetivo.
        </p>
      </section>

      {datosGrafica.length > 0 && (
        <section className="tarjeta p-3">
          <h2 className="mb-2 text-[14px] font-bold">Media de la semana por grupo</h2>
          <div className="h-56 w-full" aria-hidden>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosGrafica} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="grupo" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #e5e7eb' }}
                  formatter={(v: number) => [`${formatearBloques(v)} bloques`, '']}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Objetivo" fill="#D1D5DB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Consumido" radius={[4, 4, 0, 0]}>
                  {datosGrafica.map((d) => (
                    <Cell key={d.grupo} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="sr-only">
            {datosGrafica
              .map(
                (d) =>
                  `${d.grupo}: consumido ${formatearBloques(d.Consumido)} de ${formatearBloques(d.Objetivo)} bloques de media.`,
              )
              .join(' ')}
          </p>
        </section>
      )}

      <section className="tarjeta overflow-hidden">
        <header className="border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">
          <h2 className="text-[14px] font-bold">Resumen de la semana</h2>
        </header>
        {conDatos.length === 0 ? (
          <p className="px-3 py-4 text-center text-[13px] text-neutral-600 dark:text-neutral-400">
            No hay días registrados en esta semana.
          </p>
        ) : (
          <dl className="divide-y divide-neutral-100 text-[13.5px] dark:divide-neutral-800/70">
            <Dato termino="Días tipo A / tipo B" valor={`${resumen.tipoA} / ${resumen.tipoB}`} />
            <Dato termino="Platos registrados" valor={String(resumen.platos)} />
            <Dato
              termino="Plato más repetido"
              valor={
                resumen.masRepetido
                  ? `${resumen.masRepetido[0]} (×${resumen.masRepetido[1]})`
                  : '—'
              }
            />
            <Dato
              termino="Grupo que más se incumple"
              valor={
                resumen.peorGrupo
                  ? `${GRUPOS[resumen.peorGrupo[0]].nombre} (${resumen.peorGrupo[1]} ${resumen.peorGrupo[1] === 1 ? 'día' : 'días'})`
                  : 'Ninguno 🎉'
              }
            />
            {datosGrafica.map((d) => (
              <Dato
                key={d.grupo}
                termino={`Media ${d.grupo}`}
                valor={`${formatearBloques(d.Consumido)} / ${formatearBloques(d.Objetivo)} bloques`}
              />
            ))}
          </dl>
        )}
      </section>

      <section>
        <h2 className="mb-2 titulo-seccion">Platos de la semana</h2>
        {conDatos.length === 0 ? (
          <p className="tarjeta p-4 text-center text-[13px] text-neutral-600 dark:text-neutral-400">
            Todavía no hay platos registrados esta semana.
          </p>
        ) : (
          <div className="space-y-3">
            {conDatos.map(({ fecha, dia }) => (
              <div key={fecha} className="tarjeta overflow-hidden">
                <header className="flex items-center gap-2 border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">
                  <h3 className="flex-1 text-[13px] font-bold first-letter:uppercase">
                    {formatoLargo(fecha)}
                  </h3>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-bold dark:bg-neutral-800">
                    {dia?.planId}
                  </span>
                </header>
                <ul className="divide-y divide-neutral-100 dark:divide-neutral-800/70">
                  {dia?.platos
                    .slice()
                    .sort((a, b) => a.hora.localeCompare(b.hora))
                    .map((p) => (
                      <li key={p.id} className="flex items-baseline gap-2 px-3 py-1.5 text-[13px]">
                        <span className="shrink-0 tabular-nums text-neutral-500 dark:text-neutral-400">
                          {p.hora}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{p.nombre}</span>
                        <span className="shrink-0 text-[11px] uppercase text-neutral-400">
                          {dia.objetivosSnapshot.comidas.find((c) => c.id === p.comidaId)?.nombre ??
                            'Extra'}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Dato({ termino, valor }: { termino: string; valor: string }) {
  return (
    <div className="flex items-baseline gap-3 px-3 py-2">
      <dt className="min-w-0 flex-1 text-neutral-600 dark:text-neutral-400">{termino}</dt>
      <dd className="shrink-0 text-right font-semibold">{valor}</dd>
    </div>
  );
}
