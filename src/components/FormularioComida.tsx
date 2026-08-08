import { AlertTriangle, ArrowLeft, CalendarClock, Droplet, Plus, Star } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  FilaIngrediente,
  borradorAIngrediente,
  borradorDesde,
  borradorVacio,
  type BorradorIngrediente,
} from '@/components/FilaIngrediente';
import { Confirmar } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { ID_ACEITE, getAlimento } from '@/data/alimentos';
import { GRUPOS, GRUPOS_ORDEN } from '@/data/grupos';
import {
  formatearBloques,
  gramosABloques,
  mapaVacio,
  redondear,
  type MapaGrupos,
} from '@/lib/bloques';
import { nombreAutomatico } from '@/lib/nombres';
import { normalizar } from '@/lib/search';
import type { Alimento, ComidaDef, Ingrediente } from '@/types';

export type ModoFormulario = 'registro' | 'planificacion';

export interface DatosComida {
  nombre: string;
  comidaId: string;
  hora: string;
  ingredientes: Ingrediente[];
  guardarComoFavorito: boolean;
}

export interface ValoresIniciales {
  nombre?: string;
  comidaId?: string;
  hora?: string;
  ingredientes?: Ingrediente[];
  /** Alimento preseleccionado en la primera fila (desde consulta de alimentos). */
  alimentoId?: string;
}

interface FormularioComidaProps {
  modo: ModoFormulario;
  titulo: string;
  /** Texto bajo el título: fecha, comida… */
  subtitulo?: string;
  comidas: ComidaDef[];
  alimentos: Alimento[];
  alimentosPorId: Record<string, Alimento>;
  inicial?: ValoresIniciales;
  esEdicion?: boolean;
  /** Nombres de platos ya usados, para el autocompletado. */
  nombresPrevios?: string[];
  /** Objetivos del día, para el resumen «te quedarán». Omitir si no aplica. */
  objetivosDia?: MapaGrupos | null;
  /** Bloques ya consumidos/planificados del día, sin contar este plato. */
  consumidoBase?: MapaGrupos | null;
  /** Etiqueta del bloque de restante. */
  etiquetaRestante?: string;
  /** Oculta la opción de guardar como favorito. */
  ocultarFavorito?: boolean;
  onGuardar: (datos: DatosComida) => void;
  onCancelar: () => void;
}

export function FormularioComida({
  modo,
  titulo,
  subtitulo,
  comidas,
  alimentos,
  alimentosPorId,
  inicial,
  esEdicion = false,
  nombresPrevios = [],
  objetivosDia = null,
  consumidoBase = null,
  etiquetaRestante = 'Te quedarán',
  ocultarFavorito = false,
  onGuardar,
  onCancelar,
}: FormularioComidaProps) {
  const { toast } = useToast();

  const [nombre, setNombre] = useState(inicial?.nombre ?? '');
  const [comidaId, setComidaId] = useState(
    inicial?.comidaId ?? comidaSugerida(comidas.map((c) => c.id)),
  );
  const [hora, setHora] = useState(inicial?.hora ?? horaPorDefecto());
  const [guardarComoFavorito, setGuardarComoFavorito] = useState(false);
  const [sugerenciasAbiertas, setSugerenciasAbiertas] = useState(false);
  const [confirmandoSalida, setConfirmandoSalida] = useState(false);
  const [tocado, setTocado] = useState(false);

  const [borradores, setBorradores] = useState<BorradorIngrediente[]>(() =>
    borradoresIniciales(inicial),
  );

  // Los toasts flotan por encima de la barra de acciones, no sobre ella.
  const barraAcciones = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const raiz = document.documentElement;
    const barra = barraAcciones.current;
    if (!barra) return;

    const ajustar = () => {
      raiz.style.setProperty(
        '--toast-bottom',
        `calc(var(--nav-total) + ${barra.offsetHeight}px + 0.75rem)`,
      );
    };
    ajustar();

    const observador =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(ajustar) : null;
    observador?.observe(barra);

    return () => {
      observador?.disconnect();
      raiz.style.removeProperty('--toast-bottom');
    };
  }, []);

  const marcarTocado = () => setTocado(true);

  const ingredientes = useMemo(
    () => borradores.map(borradorAIngrediente).filter((i): i is Ingrediente => i !== null),
    [borradores],
  );

  const bloquesPlato = useMemo(() => {
    const total = mapaVacio();
    for (const ing of ingredientes) {
      const alimento = alimentosPorId[ing.alimentoId];
      if (!alimento) continue;
      total[alimento.grupo] += ing.bloques;
      if (alimento.dobleComputo && alimento.grupo === 'carbohidratos') {
        total.proteicos1 += ing.bloques;
      }
    }
    for (const g of GRUPOS_ORDEN) total[g] = redondear(total[g], 3);
    return total;
  }, [ingredientes, alimentosPorId]);

  const restante = useMemo(() => {
    if (!objetivosDia || !consumidoBase) return null;
    const resultado = mapaVacio();
    for (const g of GRUPOS_ORDEN) {
      resultado[g] = redondear(objetivosDia[g] - consumidoBase[g] - bloquesPlato[g], 2);
    }
    return resultado;
  }, [objetivosDia, consumidoBase, bloquesPlato]);

  const sugerenciaNombre = useMemo(
    () => nombreAutomatico(ingredientes, alimentosPorId),
    [ingredientes, alimentosPorId],
  );

  const sugerenciasTexto = useMemo(() => {
    const q = normalizar(nombre);
    if (q.length < 1) return [];
    return nombresPrevios
      .filter((n) => normalizar(n).includes(q) && normalizar(n) !== q)
      .slice(0, 5);
  }, [nombre, nombresPrevios]);

  const gruposConValor = GRUPOS_ORDEN.filter((g) => bloquesPlato[g] > 0.001);
  const sinIngredientes = ingredientes.length === 0;
  const nombreFinal = nombre.trim() || sugerenciaNombre;
  const puedeGuardar = !sinIngredientes && nombreFinal.length > 0;

  const motivoBloqueo = sinIngredientes
    ? 'Añade al menos un ingrediente con cantidad mayor que 0.'
    : !nombreFinal
      ? 'Escribe un nombre para el plato.'
      : null;

  const hayCambios =
    tocado || nombre.trim() !== (inicial?.nombre ?? '') || ingredientes.length > 0;

  const actualizarBorrador = (uid: string, siguiente: BorradorIngrediente) => {
    marcarTocado();
    setBorradores((prev) => prev.map((b) => (b.uid === uid ? siguiente : b)));
  };

  const anadirAceite = () => {
    const aceite = getAlimento(ID_ACEITE);
    if (!aceite) return;
    marcarTocado();
    setBorradores((prev) => [
      ...prev.filter((b) => b.alimento !== null),
      {
        ...borradorVacio(),
        alimento: aceite,
        gramos: '5',
        bloques: formatearBloques(gramosABloques(aceite, 5)),
      },
    ]);
    toast('Añadido 1 bloque de grasa (5 g AOVE)');
  };

  const intentarSalir = () => {
    if (hayCambios) setConfirmandoSalida(true);
    else onCancelar();
  };

  const guardar = () => {
    if (!puedeGuardar) return;
    onGuardar({
      nombre: nombreFinal,
      comidaId,
      hora,
      ingredientes,
      guardarComoFavorito,
    });
  };

  return (
    <div className="panel-pantalla">
      <header
        className="flex shrink-0 items-center gap-2 border-b border-neutral-200 px-2 py-2 dark:border-neutral-800"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.5rem)' }}
      >
        <button type="button" className="icono-btn" onClick={intentarSalir} aria-label="Volver">
          <ArrowLeft size={20} aria-hidden />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[16px] font-bold leading-tight">{titulo}</h1>
          {subtitulo && (
            <p className="truncate text-[12px] text-neutral-500 dark:text-neutral-400">
              {subtitulo}
            </p>
          )}
        </div>
        {modo === 'planificacion' && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-marca-500/12 px-2.5 py-1 text-[11px] font-bold text-marca-700 dark:text-marca-400">
            <CalendarClock size={13} aria-hidden />
            Planificando
          </span>
        )}
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <div className="tarjeta space-y-3 p-3">
          <div className="relative">
            <label className="etiqueta" htmlFor="nombre-plato">
              Nombre del plato
            </label>
            <input
              id="nombre-plato"
              type="text"
              className="campo"
              placeholder={sugerenciaNombre || 'Ej. Ensalada de pollo y quinoa'}
              value={nombre}
              autoComplete="off"
              onChange={(e) => {
                marcarTocado();
                setNombre(e.target.value);
                setSugerenciasAbiertas(true);
              }}
              onFocus={() => setSugerenciasAbiertas(true)}
              onBlur={() => window.setTimeout(() => setSugerenciasAbiertas(false), 120)}
            />
            {!nombre.trim() && sugerenciaNombre && (
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] text-neutral-500 dark:text-neutral-400">
                Se guardará como «{sugerenciaNombre}»
                <button
                  type="button"
                  className="font-semibold text-marca-600 underline underline-offset-2 dark:text-marca-400"
                  onClick={() => setNombre(sugerenciaNombre)}
                >
                  Usar y editar
                </button>
              </p>
            )}
            {sugerenciasAbiertas && sugerenciasTexto.length > 0 && (
              <ul className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
                {sugerenciasTexto.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-[14px] hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setNombre(s);
                        setSugerenciasAbiertas(false);
                      }}
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <span className="etiqueta">Tipo de comida</span>
            <div
              className="flex gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800"
              role="group"
              aria-label="Tipo de comida"
            >
              {comidas.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={comidaId === c.id}
                  onClick={() => {
                    marcarTocado();
                    setComidaId(c.id);
                  }}
                  className={`min-h-[38px] min-w-0 flex-1 truncate rounded-lg px-1 text-[12.5px] font-semibold transition-colors ${
                    comidaId === c.id
                      ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-950 dark:text-neutral-100'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {c.nombre}
                </button>
              ))}
            </div>
          </div>

          {modo === 'registro' && (
            <div>
              <label className="etiqueta" htmlFor="hora-plato">
                Hora
              </label>
              <input
                id="hora-plato"
                type="time"
                className="campo tabular-nums"
                value={hora}
                onChange={(e) => {
                  marcarTocado();
                  setHora(e.target.value);
                }}
              />
            </div>
          )}
        </div>

        <section aria-label="Ingredientes">
          <h2 className="mb-2 titulo-seccion">Ingredientes</h2>
          <ul className="space-y-2">
            {borradores.map((b, i) => (
              <FilaIngrediente
                key={b.uid}
                borrador={b}
                indice={i}
                alimentos={alimentos}
                puedeEliminar={borradores.length > 1}
                onCambiar={(siguiente) => actualizarBorrador(b.uid, siguiente)}
                onEliminar={() => {
                  marcarTocado();
                  setBorradores((prev) => prev.filter((x) => x.uid !== b.uid));
                }}
              />
            ))}
          </ul>

          <div className="mt-2 flex flex-col gap-2">
            <button
              type="button"
              className="btn-secundario w-full"
              onClick={() => setBorradores((prev) => [...prev, borradorVacio()])}
            >
              <Plus size={17} aria-hidden />
              Añadir ingrediente
            </button>
            <button type="button" className="btn-secundario w-full" onClick={anadirAceite}>
              <Droplet size={17} aria-hidden />
              +1 bloque de grasa (5 g AOVE)
            </button>
            <p className="text-[12px] leading-snug text-neutral-500 dark:text-neutral-400">
              Para plancha o aliño usa 5 g (1 cucharada) de AOVE = 1 bloque de grasas.
            </p>
          </div>
        </section>

        {!ocultarFavorito && (
          <label className="tarjeta flex min-h-[52px] cursor-pointer items-center gap-3 px-3">
            <input
              type="checkbox"
              checked={guardarComoFavorito}
              onChange={(e) => setGuardarComoFavorito(e.target.checked)}
              className="h-5 w-5 shrink-0 rounded border-neutral-300 text-marca-500 focus:ring-marca-500 dark:border-neutral-600 dark:bg-neutral-800"
            />
            <span className="flex min-w-0 flex-1 items-center gap-1.5 text-[14px] font-medium">
              <Star size={15} className="shrink-0 text-amber-500" aria-hidden />
              Guardar como plato favorito
            </span>
          </label>
        )}
      </div>

      <div
        ref={barraAcciones}
        className="shrink-0 border-t border-neutral-200 bg-white px-4 pb-3 pt-2.5 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className="titulo-seccion">Este plato:</span>
          {gruposConValor.length === 0 ? (
            <span className="text-[12px] text-neutral-400">sin ingredientes todavía</span>
          ) : (
            gruposConValor.map((g) => (
              <span
                key={g}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-bold"
                style={{ backgroundColor: `${GRUPOS[g].color}1f`, color: GRUPOS[g].color }}
              >
                {GRUPOS[g].nombreCorto} {formatearBloques(bloquesPlato[g])}
              </span>
            ))
          )}
        </div>

        {restante && objetivosDia && (
          <div className="mb-2.5">
            <p className="mb-1 titulo-seccion">{etiquetaRestante}</p>
            <div className="flex flex-wrap gap-1.5">
              {GRUPOS_ORDEN.filter((g) => objetivosDia[g] > 0 || bloquesPlato[g] > 0).map((g) => {
                const v = restante[g];
                const pasado = v < -0.001;
                return (
                  <span
                    key={g}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold tabular-nums ${
                      pasado
                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300'
                        : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                    }`}
                  >
                    {pasado && <AlertTriangle size={11} aria-hidden />}
                    {GRUPOS[g].nombreCorto} {formatearBloques(v)}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button type="button" className="btn-secundario flex-1" onClick={intentarSalir}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-primario flex-[1.6]"
            onClick={guardar}
            disabled={!puedeGuardar}
            aria-describedby={motivoBloqueo ? 'motivo-bloqueo' : undefined}
          >
            {textoBotonGuardar(modo, esEdicion)}
          </button>
        </div>

        {motivoBloqueo && (
          <p
            id="motivo-bloqueo"
            className="mt-1.5 text-center text-[12px] font-medium text-orange-700 dark:text-orange-300"
          >
            {motivoBloqueo}
          </p>
        )}
      </div>

      <Confirmar
        abierto={confirmandoSalida}
        titulo="Cambios sin guardar"
        mensaje="Tienes cambios sin guardar, ¿descartarlos?"
        textoConfirmar="Descartar"
        peligro
        onCancelar={() => setConfirmandoSalida(false)}
        onConfirmar={() => {
          setConfirmandoSalida(false);
          onCancelar();
        }}
      />
    </div>
  );
}

function textoBotonGuardar(modo: ModoFormulario, esEdicion: boolean): string {
  if (modo === 'planificacion') return esEdicion ? 'Guardar cambios' : 'Añadir al plan';
  return esEdicion ? 'Guardar cambios' : 'Guardar comida';
}

function borradoresIniciales(inicial?: ValoresIniciales): BorradorIngrediente[] {
  if (inicial?.ingredientes && inicial.ingredientes.length > 0) {
    const lista = inicial.ingredientes
      .map((ing) => {
        const alimento = getAlimento(ing.alimentoId);
        return alimento ? borradorDesde(ing, alimento) : null;
      })
      .filter((b): b is BorradorIngrediente => b !== null);
    if (lista.length > 0) return lista;
  }
  if (inicial?.alimentoId) {
    const alimento = getAlimento(inicial.alimentoId);
    if (alimento) return [{ ...borradorVacio(), alimento }];
  }
  return [borradorVacio()];
}

function comidaSugerida(ids: string[]): string {
  const hora = new Date().getHours();
  const preferida = hora < 12 ? 'desayuno' : hora < 17 ? 'comida' : 'cena';
  return ids.includes(preferida) ? preferida : (ids[0] ?? 'extra');
}

function horaPorDefecto(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
