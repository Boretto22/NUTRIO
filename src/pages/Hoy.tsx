import {
  CalendarClock,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Plus,
  Star,
  UtensilsCrossed,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Logo } from '@/components/Logo';
import { Confirmar } from '@/components/Modal';
import { SelectorPlanDia } from '@/components/SelectorPlanDia';
import { TablaSeguimiento } from '@/components/TablaSeguimiento';
import { TarjetaPlanificado } from '@/components/TarjetaPlanificado';
import { TarjetaPlato } from '@/components/TarjetaPlato';
import { useToast } from '@/components/Toast';
import { formatoLargo, etiquetaRelativa, sumarDias } from '@/lib/fechas';
import { bloquesPlanificadosDelDia } from '@/lib/planificacion';
import { useApp } from '@/store/useApp';
import type { Plato, PlatoPlanificado } from '@/types';

export function Hoy() {
  const {
    estado,
    alimentos,
    alimentosPorId,
    hoy,
    fechaActiva,
    setFechaActiva,
    comidasDe,
    elegirPlanDelDia,
    setYogur,
    setLecheMl,
    guardarPlato,
    eliminarPlato,
    duplicarPlato,
    guardarFavorito,
    pendientesDe,
    confirmarPlanificado,
    deshacerConfirmacion,
    descartarPlanificado,
  } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [cambiandoPlan, setCambiandoPlan] = useState(false);
  const [porEliminar, setPorEliminar] = useState<Plato | null>(null);
  const [resaltado, setResaltado] = useState<string | null>(null);
  const [agendaAbierta, setAgendaAbierta] = useState(false);

  // El formulario vuelve aquí indicando qué plato acaba de guardarse.
  const navState = location.state as { resaltarPlatoId?: string; fecha?: string } | null;
  useEffect(() => {
    if (!navState?.resaltarPlatoId) return;
    if (navState.fecha) setFechaActiva(navState.fecha);
    setResaltado(navState.resaltarPlatoId);
    navigate('.', { replace: true, state: null });
    const id = window.setTimeout(() => setResaltado(null), 2000);
    return () => window.clearTimeout(id);
  }, [navState, navigate, setFechaActiva]);

  const dia = estado.dias[fechaActiva];
  const comidas = comidasDe(fechaActiva);
  const etiqueta = etiquetaRelativa(fechaActiva);

  const platosPorComida = useMemo(() => {
    const mapa = new Map<string, Plato[]>();
    for (const comida of comidas) mapa.set(comida.id, []);
    for (const plato of dia?.platos ?? []) {
      const lista = mapa.get(plato.comidaId);
      if (lista) lista.push(plato);
      else mapa.set(plato.comidaId, [plato]);
    }
    for (const lista of mapa.values()) lista.sort((a, b) => a.hora.localeCompare(b.hora));
    return mapa;
  }, [dia, comidas]);

  const modoCalendario = estado.ajustes.modoCalendario;
  const pendientes = pendientesDe(fechaActiva);
  const modoProgramar = modoCalendario === 'programar';

  /** Bloques de los planificados sin confirmar: se pintan en fantasma, nunca cuentan. */
  const bloquesPendientes = useMemo(() => {
    if (!modoProgramar || pendientes.length === 0) return null;
    return bloquesPlanificadosDelDia({ fecha: fechaActiva, platos: pendientes }, alimentosPorId);
  }, [modoProgramar, pendientes, fechaActiva, alimentosPorId]);

  const pendientesPorComida = useMemo(() => {
    const mapa = new Map<string, PlatoPlanificado[]>();
    if (!modoProgramar) return mapa;
    for (const p of pendientes) {
      const lista = mapa.get(p.comidaId);
      if (lista) lista.push(p);
      else mapa.set(p.comidaId, [p]);
    }
    return mapa;
  }, [modoProgramar, pendientes]);

  const registrarPlanificado = (plato: PlatoPlanificado) => {
    navigate('/nueva', {
      state: { fecha: fechaActiva, desdePlanificadoId: plato.id, comidaId: plato.comidaId },
    });
  };

  const saludo = estado.perfil.nombre ? `Hola, ${estado.perfil.nombre}` : 'Tu día';

  return (
    <div className="space-y-4 px-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <header>
        <div className="flex items-center gap-2">
          <Logo variant="emblema" size="sm" decorativo />
          <p className="text-[13px] font-semibold text-marca-600 dark:text-marca-400">{saludo}</p>
        </div>

        <div className="mt-1 flex items-center gap-1">
          <button
            type="button"
            className="icono-btn -ml-2"
            onClick={() => setFechaActiva(sumarDias(fechaActiva, -1))}
            aria-label="Día anterior"
          >
            <ChevronLeft size={20} aria-hidden />
          </button>

          <div className="min-w-0 flex-1 text-center">
            <h1 className="truncate text-[17px] font-bold leading-tight first-letter:uppercase">
              {formatoLargo(fechaActiva)}
            </h1>
            {etiqueta && (
              <p className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
                {etiqueta}
              </p>
            )}
          </div>

          <button
            type="button"
            className="icono-btn -mr-2 disabled:opacity-30"
            onClick={() => setFechaActiva(sumarDias(fechaActiva, 1))}
            disabled={fechaActiva >= hoy}
            aria-label="Día siguiente"
          >
            <ChevronRight size={20} aria-hidden />
          </button>
        </div>

        {dia && (
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-marca-500/12 px-3 py-1 text-[13px] font-bold text-marca-700 dark:text-marca-400">
              Plan {dia.planId}
              <span className="font-medium text-marca-600/80 dark:text-marca-400/80">
                · {dia.objetivosSnapshot.descripcion.split(',')[0]}
              </span>
            </span>
            <button
              type="button"
              className="text-[13px] font-semibold text-neutral-500 underline underline-offset-2 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              onClick={() => setCambiandoPlan(true)}
            >
              Cambiar
            </button>
          </div>
        )}
      </header>

      {!dia ? (
        <DiaSinPlan
          fecha={fechaActiva}
          onCrear={(planId) => {
            elegirPlanDelDia(fechaActiva, planId);
            toast(`Día registrado con Tipo ${planId}`);
          }}
          planes={estado.planes}
        />
      ) : (
        <>
          <section className="tarjeta space-y-3 p-3" aria-label="Opciones del día">
            <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={dia.yogur}
                onChange={(e) => setYogur(fechaActiva, e.target.checked)}
                className="h-5 w-5 shrink-0 rounded border-neutral-300 text-marca-500 focus:ring-marca-500 dark:border-neutral-600 dark:bg-neutral-800"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold leading-tight">
                  Hoy tomo yogur bifidus (125 g)
                </span>
                <span className="block text-[12px] text-neutral-500 dark:text-neutral-400">
                  Ajusta los objetivos: −0.5 CH · −0.5 Prot I · −0.5 Grasas
                </span>
              </span>
            </label>

            <div className="border-t border-neutral-100 pt-3 dark:border-neutral-800">
              <p className="mb-2 text-[14px] font-semibold">
                Leche semi para los cafés
                <span className="ml-1.5 font-normal text-neutral-500 dark:text-neutral-400">
                  ({dia.lecheMl} de {dia.objetivosSnapshot.lecheSemiMl} ml)
                </span>
              </p>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Leche semi consumida">
                {[0, 50, 100, 150, 200]
                  .filter((ml) => ml <= dia.objetivosSnapshot.lecheSemiMl)
                  .map((ml) => (
                    <button
                      key={ml}
                      type="button"
                      aria-pressed={dia.lecheMl === ml}
                      onClick={() => setLecheMl(fechaActiva, ml)}
                      className={`min-h-[36px] rounded-lg px-3 text-[13px] font-semibold transition-colors ${
                        dia.lecheMl === ml
                          ? 'bg-sky-500 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                      }`}
                    >
                      {ml} ml
                    </button>
                  ))}
              </div>
            </div>
          </section>

          {!modoProgramar && pendientes.length > 0 && (
            <section
              className="tarjeta p-3"
              aria-label={`${pendientes.length} platos planificados para este día`}
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-marca-500/12 text-marca-600 dark:text-marca-400">
                  <CalendarClock size={18} aria-hidden />
                </span>
                <p className="min-w-0 flex-1 text-[13.5px] font-semibold leading-snug">
                  Tienes {pendientes.length}{' '}
                  {pendientes.length === 1 ? 'plato planificado' : 'platos planificados'} para{' '}
                  {fechaActiva === hoy ? 'hoy' : 'este día'}
                </p>
                <button
                  type="button"
                  className="btn-secundario shrink-0 !min-h-[36px] !px-3 text-[13px]"
                  onClick={() => setAgendaAbierta((v) => !v)}
                  aria-expanded={agendaAbierta}
                >
                  {agendaAbierta ? 'Ocultar' : 'Ver'}
                </button>
              </div>

              {agendaAbierta && (
                <div className="mt-3 space-y-2">
                  {pendientes.map((p) => (
                    <TarjetaPlanificado
                      key={p.id}
                      plato={p}
                      alimentos={alimentosPorId}
                      variante="agenda"
                      onRegistrar={() => registrarPlanificado(p)}
                      onDescartar={() => {
                        descartarPlanificado(fechaActiva, p.id);
                        toast('Planificado descartado', 'info');
                      }}
                    />
                  ))}
                  <p className="text-[11.5px] leading-snug text-neutral-500 dark:text-neutral-400">
                    En modo agenda nada se registra solo: pulsa «Registrar» para ajustar los gramos
                    y confirmar.
                  </p>
                </div>
              )}
            </section>
          )}

          <TablaSeguimiento
            dia={dia}
            alimentos={alimentos}
            comidas={comidas}
            editable={false}
            pendiente={bloquesPendientes}
          />

          {estado.platosFavoritos.length > 0 && (
            <section aria-label="Platos favoritos">
              <h2 className="mb-2 flex items-center gap-1.5 titulo-seccion">
                <Star size={12} aria-hidden />
                Favoritos
              </h2>
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sin-scrollbar">
                {estado.platosFavoritos.map((fav) => (
                  <button
                    key={fav.id}
                    type="button"
                    onClick={() => {
                      guardarPlato(fechaActiva, {
                        ...fav,
                        id: crypto.randomUUID(),
                        ingredientes: fav.ingredientes.map((i) => ({ ...i })),
                        hora: new Date().toTimeString().slice(0, 5),
                        creadoEn: new Date().toISOString(),
                      });
                      toast(`"${fav.nombre}" añadido`);
                    }}
                    className="shrink-0 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-[13px] font-semibold shadow-suave transition-colors hover:border-marca-400 dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    <Plus size={13} className="mr-1 inline" aria-hidden />
                    {fav.nombre}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section aria-label="Comidas del día" className="space-y-4">
            {dia.platos.length === 0 && pendientes.length === 0 && (
              <EstadoVacio onRegistrar={() => navigate('/nueva')} />
            )}

            {comidas.map((comida) => {
              const platos = platosPorComida.get(comida.id) ?? [];
              const planificados = pendientesPorComida.get(comida.id) ?? [];
              if (platos.length === 0 && planificados.length === 0) return null;
              return (
                <div key={comida.id}>
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="titulo-seccion">{comida.nombre}</h2>
                    <button
                      type="button"
                      onClick={() =>
                        navigate('/nueva', { state: { fecha: fechaActiva, comidaId: comida.id } })
                      }
                      className="text-[12px] font-semibold text-marca-600 hover:underline dark:text-marca-400"
                    >
                      + Añadir
                    </button>
                  </div>
                  <div className="space-y-2">
                    {platos.map((plato) => (
                      <TarjetaPlato
                        key={plato.id}
                        plato={plato}
                        alimentos={alimentosPorId}
                        resaltado={resaltado === plato.id}
                        onEditar={() =>
                          navigate('/nueva', {
                            state: { fecha: fechaActiva, platoId: plato.id },
                          })
                        }
                        onDuplicar={() => {
                          duplicarPlato(fechaActiva, plato.id);
                          toast('Plato duplicado');
                        }}
                        onEliminar={() => setPorEliminar(plato)}
                        onGuardarFavorito={() => {
                          guardarFavorito(plato);
                          toast(`"${plato.nombre}" guardado en favoritos`);
                        }}
                      />
                    ))}

                    {planificados.map((p) => (
                      <TarjetaPlanificado
                        key={p.id}
                        plato={p}
                        alimentos={alimentosPorId}
                        variante="pendiente"
                        onConfirmar={() => {
                          confirmarPlanificado(fechaActiva, p.id);
                          toast(`"${p.nombre}" confirmado`, {
                            accion: {
                              etiqueta: 'Deshacer',
                              onAccion: () => {
                                deshacerConfirmacion(fechaActiva, p.id);
                                toast('Confirmación deshecha', 'info');
                              },
                            },
                          });
                        }}
                        onEditar={() => registrarPlanificado(p)}
                        onDescartar={() => {
                          descartarPlanificado(fechaActiva, p.id);
                          toast('Planificado descartado', 'info');
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        </>
      )}

      {dia && cambiandoPlan && (
        <SelectorPlanDia
          abierto
          fecha={fechaActiva}
          planes={estado.planes}
          planActual={dia.planId}
          onCerrar={() => setCambiandoPlan(false)}
          onElegir={(planId) => {
            setCambiandoPlan(false);
            if (planId === dia.planId) return;
            elegirPlanDelDia(fechaActiva, planId);
            toast(`Plan cambiado a Tipo ${planId}. Seguimiento recalculado.`);
          }}
        />
      )}

      <Confirmar
        abierto={porEliminar !== null}
        titulo="Eliminar plato"
        mensaje={
          <>
            ¿Seguro que quieres eliminar <strong>{porEliminar?.nombre}</strong>? Esta acción no se
            puede deshacer.
          </>
        }
        textoConfirmar="Eliminar"
        peligro
        onCancelar={() => setPorEliminar(null)}
        onConfirmar={() => {
          if (porEliminar) {
            eliminarPlato(fechaActiva, porEliminar.id);
            toast('Plato eliminado', 'info');
          }
          setPorEliminar(null);
        }}
      />
    </div>
  );
}

function EstadoVacio({ onRegistrar }: { onRegistrar: () => void }) {
  return (
    <div className="tarjeta relative overflow-hidden px-6 py-8 text-center">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10">
        <Logo variant="emblema" size="lg" decorativo />
      </div>

      <div className="relative flex flex-col items-center gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-marca-500/12 text-marca-600 dark:text-marca-400">
          <UtensilsCrossed size={26} aria-hidden />
        </span>
        <div>
          <p className="text-[15px] font-semibold">Aún no has registrado nada</p>
          <p className="mt-1 text-[13px] leading-snug text-neutral-600 dark:text-neutral-400">
            Añade tu primera comida y verás cómo se van descontando los bloques de cada grupo.
          </p>
        </div>
        <button type="button" className="btn-primario" onClick={onRegistrar}>
          <Plus size={18} aria-hidden />
          Registrar comida
        </button>
      </div>
    </div>
  );
}

function DiaSinPlan({
  fecha,
  planes,
  onCrear,
}: {
  fecha: string;
  planes: { A: { nombre: string }; B: { nombre: string } };
  onCrear: (planId: 'A' | 'B') => void;
}) {
  return (
    <div className="tarjeta flex flex-col items-center gap-3 px-6 py-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
        <CalendarPlus size={26} aria-hidden />
      </span>
      <div>
        <p className="text-[15px] font-semibold">Este día no está registrado</p>
        <p className="mt-1 text-[13px] leading-snug text-neutral-600 dark:text-neutral-400">
          Elige con qué estructura quieres registrar el {formatoLargo(fecha)}.
        </p>
      </div>
      <div className="flex w-full gap-2">
        <button type="button" className="btn-secundario flex-1" onClick={() => onCrear('A')}>
          {planes.A.nombre}
        </button>
        <button type="button" className="btn-secundario flex-1" onClick={() => onCrear('B')}>
          {planes.B.nombre}
        </button>
      </div>
    </div>
  );
}
