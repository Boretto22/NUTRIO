import {
  Copy,
  FileStack,
  ListChecks,
  Plus,
  Repeat,
  Save,
  Star,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Confirmar, Modal } from '@/components/Modal';
import { SelectorFechas } from '@/components/SelectorFechas';
import { TarjetaPlanificado } from '@/components/TarjetaPlanificado';
import { TarjetaPlato } from '@/components/TarjetaPlato';
import { useToast } from '@/components/Toast';
import { GRUPOS, GRUPOS_ORDEN } from '@/data/grupos';
import { formatearBloques } from '@/lib/bloques';
import { capitalizar, formatoLargo } from '@/lib/fechas';
import { comparaPlanVsObjetivo } from '@/lib/planificacion';
import { useApp } from '@/store/useApp';
import type { PlatoPlanificado } from '@/types';

interface DetalleDiaProps {
  fecha: string;
  onCerrar: () => void;
  onAnadirPlato: (comidaId: string) => void;
  onEditarPlato: (plato: PlatoPlanificado) => void;
}

export function DetalleDiaPlanificado({
  fecha,
  onCerrar,
  onAnadirPlato,
  onEditarPlato,
}: DetalleDiaProps) {
  const {
    estado,
    alimentosPorId,
    hoy,
    comidasDe,
    planificacionDe,
    guardarPlanificado,
    eliminarPlanificado,
    moverPlanificado,
    setPlanPrevisto,
    vaciarDiaPlanificado,
    confirmarPlanificado,
    copiarDia,
    repetirSemanal,
    guardarComoPlantilla,
    aplicarPlantilla,
    eliminarPlantilla,
    renombrarPlantilla,
  } = useApp();
  const { toast } = useToast();

  const [duplicando, setDuplicando] = useState(false);
  const [moviendo, setMoviendo] = useState<PlatoPlanificado | null>(null);
  const [repitiendo, setRepitiendo] = useState(false);
  const [semanas, setSemanas] = useState(4);
  const [guardandoPlantilla, setGuardandoPlantilla] = useState(false);
  const [nombrePlantilla, setNombrePlantilla] = useState('');
  const [gestionandoPlantillas, setGestionandoPlantillas] = useState(false);
  const [anadiendoFavorito, setAnadiendoFavorito] = useState(false);
  const [vaciando, setVaciando] = useState(false);

  const planificado = planificacionDe(fecha);
  const registrado = estado.dias[fecha];
  const comidas = comidasDe(fecha);
  const planPrevisto = planificado?.planId ?? registrado?.planId;
  const platos = planificado?.platos ?? [];

  const estructura = estado.planes[planPrevisto ?? 'A'];
  const comparativa = useMemo(
    () => comparaPlanVsObjetivo(planificado, estructura, alimentosPorId),
    [planificado, estructura, alimentosPorId],
  );

  const platosPorComida = useMemo(() => {
    const mapa = new Map<string, PlatoPlanificado[]>();
    for (const c of comidas) mapa.set(c.id, []);
    for (const p of platos) {
      const lista = mapa.get(p.comidaId);
      if (lista) lista.push(p);
      else mapa.set(p.comidaId, [p]);
    }
    return mapa;
  }, [comidas, platos]);

  const gruposConAlgo = GRUPOS_ORDEN.filter(
    (g) => comparativa[g].objetivo > 0 || comparativa[g].planificado > 0,
  );

  return (
    <>
      <Modal
        abierto
        titulo={capitalizar(formatoLargo(fecha))}
        descripcion={fecha === hoy ? 'Hoy' : undefined}
        onCerrar={onCerrar}
      >
        <div className="space-y-4">
          <div>
            <span className="etiqueta">Plan previsto para este día</span>
            <div
              className="flex gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800"
              role="group"
              aria-label="Plan previsto"
            >
              {(['A', 'B'] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={planPrevisto === id}
                  onClick={() => setPlanPrevisto(fecha, planPrevisto === id ? undefined : id)}
                  className={`min-h-[38px] flex-1 rounded-lg text-[13px] font-semibold transition-colors ${
                    planPrevisto === id
                      ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-950 dark:text-neutral-100'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {estado.planes[id].nombre}
                </button>
              ))}
            </div>
          </div>

          <section aria-label="Menú planificado" className="space-y-3">
            <h3 className="titulo-seccion">Planificado</h3>
            {comidas.map((comida) => {
              const lista = platosPorComida.get(comida.id) ?? [];
              return (
                <div key={comida.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <h4 className="text-[13px] font-bold">{comida.nombre}</h4>
                    <button
                      type="button"
                      className="text-[12px] font-semibold text-marca-600 hover:underline dark:text-marca-400"
                      onClick={() => onAnadirPlato(comida.id)}
                    >
                      + Añadir plato
                    </button>
                  </div>
                  {lista.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-neutral-200 px-3 py-2 text-[12.5px] text-neutral-400 dark:border-neutral-800">
                      Sin nada previsto
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {lista.map((p) => (
                        <TarjetaPlanificado
                          key={p.id}
                          plato={p}
                          alimentos={alimentosPorId}
                          variante="calendario"
                          onEditar={() => onEditarPlato(p)}
                          onMover={() => setMoviendo(p)}
                          onEliminar={() => {
                            eliminarPlanificado(fecha, p.id);
                            toast('Plato quitado del plan', 'info');
                          }}
                          onConfirmar={
                            fecha <= hoy
                              ? () => {
                                  confirmarPlanificado(fecha, p.id);
                                  toast(`"${p.nombre}" registrado`);
                                }
                              : undefined
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {estado.platosFavoritos.length > 0 && (
              <button
                type="button"
                className="btn-secundario w-full"
                onClick={() => setAnadiendoFavorito(true)}
              >
                <Star size={16} aria-hidden />
                Añadir desde favoritos
              </button>
            )}
          </section>

          <section aria-label="Objetivo frente a planificado" className="tarjeta overflow-hidden">
            <header className="flex items-center gap-2 border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">
              <h3 className="flex-1 titulo-seccion">Grupo</h3>
              <span className="titulo-seccion shrink-0">Planificado / Objetivo</span>
            </header>
            {gruposConAlgo.length === 0 ? (
              <p className="px-3 py-3 text-[13px] text-neutral-500 dark:text-neutral-400">
                Añade platos para cuadrar el menú con los objetivos del plan.
              </p>
            ) : (
              <ul className="divide-y divide-neutral-100 dark:divide-neutral-800/70">
                {gruposConAlgo.map((g) => {
                  const { objetivo, planificado: prev, diff } = comparativa[g];
                  const cuadra = Math.abs(diff) <= estado.ajustes.toleranciaBloques + 1e-9;
                  return (
                    <li key={g} className="flex items-center gap-2 px-3 py-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: GRUPOS[g].color }}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">
                        {GRUPOS[g].nombre}
                      </span>
                      <span className="shrink-0 text-[13.5px] tabular-nums">
                        <span className="font-bold">{formatearBloques(prev)}</span>
                        <span className="text-neutral-400"> / </span>
                        <span className="text-neutral-600 dark:text-neutral-400">
                          {formatearBloques(objetivo)}
                        </span>
                      </span>
                      <span
                        className={`w-[52px] shrink-0 text-right text-[12.5px] font-bold tabular-nums ${
                          cuadra
                            ? 'text-marca-600 dark:text-marca-400'
                            : diff > 0
                              ? 'text-orange-600 dark:text-orange-400'
                              : 'text-neutral-400'
                        }`}
                      >
                        {diff > 0 ? '+' : ''}
                        {formatearBloques(diff)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="border-t border-neutral-100 px-3 py-2 text-[11.5px] leading-snug text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
              Comparativa solo informativa: lo planificado no suma bloques hasta que lo registras.
            </p>
          </section>

          {registrado && registrado.platos.length > 0 && (
            <section aria-label="Comidas registradas" className="space-y-2">
              <h3 className="flex items-center gap-1.5 titulo-seccion">
                <ListChecks size={13} aria-hidden />
                Registrado ({registrado.platos.length})
              </h3>
              {registrado.platos.map((p) => (
                <TarjetaPlato key={p.id} plato={p} alimentos={alimentosPorId} />
              ))}
            </section>
          )}

          <section aria-label="Acciones del día" className="space-y-2">
            <h3 className="titulo-seccion">Acciones del día</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="btn-secundario"
                disabled={platos.length === 0}
                onClick={() => setDuplicando(true)}
              >
                <Copy size={16} aria-hidden />
                Duplicar en…
              </button>
              <button
                type="button"
                className="btn-secundario"
                disabled={platos.length === 0}
                onClick={() => setRepitiendo(true)}
              >
                <Repeat size={16} aria-hidden />
                Repetir semanal
              </button>
              <button
                type="button"
                className="btn-secundario"
                disabled={platos.length === 0}
                onClick={() => {
                  setNombrePlantilla('');
                  setGuardandoPlantilla(true);
                }}
              >
                <Save size={16} aria-hidden />
                Guardar plantilla
              </button>
              <button
                type="button"
                className="btn-secundario"
                onClick={() => setGestionandoPlantillas(true)}
              >
                <FileStack size={16} aria-hidden />
                Plantillas ({estado.plantillasMenu.length})
              </button>
            </div>
            <button
              type="button"
              className="btn-secundario w-full !text-red-600 dark:!text-red-400"
              disabled={platos.length === 0}
              onClick={() => setVaciando(true)}
            >
              <Trash2 size={16} aria-hidden />
              Vaciar día
            </button>
          </section>
        </div>
      </Modal>

      <SelectorFechas
        abierto={duplicando}
        titulo="Duplicar día en…"
        descripcion="Elige una o varias fechas destino. Se sustituirá su menú planificado."
        fechaBase={fecha}
        primerDiaSemana={estado.ajustes.primerDiaSemana}
        textoConfirmar="Duplicar"
        onCerrar={() => setDuplicando(false)}
        onConfirmar={(fechas) => {
          copiarDia(fecha, fechas);
          setDuplicando(false);
          toast(`Menú copiado a ${fechas.length} ${fechas.length === 1 ? 'fecha' : 'fechas'}`);
        }}
      />

      <SelectorFechas
        abierto={moviendo !== null}
        titulo={`Mover «${moviendo?.nombre ?? ''}» a…`}
        fechaBase={fecha}
        primerDiaSemana={estado.ajustes.primerDiaSemana}
        multiple={false}
        textoConfirmar="Mover"
        onCerrar={() => setMoviendo(null)}
        onConfirmar={(fechas) => {
          if (moviendo && fechas[0]) {
            moverPlanificado(fecha, moviendo.id, fechas[0]);
            toast('Plato movido');
          }
          setMoviendo(null);
        }}
      />

      <Modal
        abierto={repitiendo}
        titulo="Repetir cada semana"
        descripcion="Copia este menú al mismo día de la semana durante las próximas semanas."
        onCerrar={() => setRepitiendo(false)}
        pie={
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-secundario flex-1"
              onClick={() => setRepitiendo(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn-primario flex-1"
              onClick={() => {
                repetirSemanal(fecha, semanas);
                setRepitiendo(false);
                toast(`Menú repetido durante ${semanas} semanas`);
              }}
            >
              Repetir
            </button>
          </div>
        }
      >
        <label className="etiqueta" htmlFor="semanas-repetir">
          Número de semanas
        </label>
        <div className="grid grid-cols-4 gap-2" id="semanas-repetir" role="group">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={semanas === n}
              onClick={() => setSemanas(n)}
              className={`min-h-[44px] rounded-xl text-[14px] font-bold transition-colors ${
                semanas === n
                  ? 'bg-marca-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        abierto={guardandoPlantilla}
        titulo="Guardar como plantilla"
        onCerrar={() => setGuardandoPlantilla(false)}
        pie={
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-secundario flex-1"
              onClick={() => setGuardandoPlantilla(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn-primario flex-1"
              disabled={nombrePlantilla.trim().length === 0}
              onClick={() => {
                guardarComoPlantilla(fecha, nombrePlantilla);
                setGuardandoPlantilla(false);
                toast('Plantilla guardada');
              }}
            >
              Guardar
            </button>
          </div>
        }
      >
        <label className="etiqueta" htmlFor="nombre-plantilla">
          Nombre de la plantilla
        </label>
        <input
          id="nombre-plantilla"
          type="text"
          className="campo"
          placeholder="Ej. Día alto en proteína"
          value={nombrePlantilla}
          onChange={(e) => setNombrePlantilla(e.target.value)}
        />
      </Modal>

      <Modal
        abierto={gestionandoPlantillas}
        titulo="Plantillas de menú"
        descripcion="Aplica una plantilla a este día o gestiona las guardadas."
        onCerrar={() => setGestionandoPlantillas(false)}
      >
        {estado.plantillasMenu.length === 0 ? (
          <p className="text-[14px] text-neutral-600 dark:text-neutral-400">
            Todavía no tienes plantillas. Planifica un día y pulsa «Guardar plantilla».
          </p>
        ) : (
          <ul className="space-y-2">
            {estado.plantillasMenu.map((p) => (
              <li key={p.id} className="tarjeta p-3">
                <div className="flex items-center gap-2">
                  <input
                    className="campo min-w-0 flex-1 !py-1.5 text-[14px] font-semibold"
                    value={p.nombre}
                    aria-label={`Nombre de la plantilla ${p.nombre}`}
                    onChange={(e) => renombrarPlantilla(p.id, e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-fantasma !px-2 !text-red-600 dark:!text-red-400"
                    aria-label={`Eliminar plantilla ${p.nombre}`}
                    onClick={() => eliminarPlantilla(p.id)}
                  >
                    <Trash2 size={16} aria-hidden />
                  </button>
                </div>
                <p className="mt-1 text-[12px] text-neutral-500 dark:text-neutral-400">
                  {p.platos.length} {p.platos.length === 1 ? 'plato' : 'platos'}
                  {p.planId ? ` · Tipo ${p.planId}` : ''}
                </p>
                <button
                  type="button"
                  className="btn-secundario mt-2 w-full"
                  onClick={() => {
                    aplicarPlantilla(p.id, fecha);
                    setGestionandoPlantillas(false);
                    toast(`Plantilla «${p.nombre}» aplicada`);
                  }}
                >
                  Aplicar a este día
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <Modal
        abierto={anadiendoFavorito}
        titulo="Añadir desde favoritos"
        onCerrar={() => setAnadiendoFavorito(false)}
      >
        <ul className="space-y-2">
          {estado.platosFavoritos.map((fav) => (
            <li key={fav.id}>
              <button
                type="button"
                className="tarjeta flex w-full items-center gap-2 p-3 text-left"
                onClick={() => {
                  guardarPlanificado(fecha, {
                    id: crypto.randomUUID(),
                    nombre: fav.nombre,
                    comidaId: fav.comidaId,
                    ingredientes: fav.ingredientes.map((i) => ({ ...i })),
                  });
                  setAnadiendoFavorito(false);
                  toast(`"${fav.nombre}" añadido al plan`);
                }}
              >
                <Plus size={16} className="shrink-0 text-marca-600 dark:text-marca-400" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">
                  {fav.nombre}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Modal>

      <Confirmar
        abierto={vaciando}
        titulo="Vaciar día"
        mensaje="Se eliminará todo el menú planificado de este día. Las comidas ya registradas no se tocan."
        textoConfirmar="Vaciar"
        peligro
        onCancelar={() => setVaciando(false)}
        onConfirmar={() => {
          vaciarDiaPlanificado(fecha);
          setVaciando(false);
          toast('Día vaciado', 'info');
        }}
      />
    </>
  );
}
