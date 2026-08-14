import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { ALIMENTOS, ALIMENTOS_POR_ID } from '@/data/alimentos';
import { COMIDA_EXTRA, clonar, planSeed } from '@/data/planSeed';
import { track } from '@/lib/analytics';
import { estadoDelDia } from '@/lib/bloques';
import { hoyISO } from '@/lib/fechas';
import * as plan from '@/lib/planificacion';
import { cargarEstado, estadoInicial, guardarEstado } from '@/lib/storage';
import type {
  Ajustes,
  Alimento,
  AppState,
  ComidaDef,
  DiaPlanificado,
  DiaRegistro,
  EstructuraPlan,
  Plato,
  PlatoPlanificado,
} from '@/types';

export interface AppContextValor {
  estado: AppState;
  alimentos: Alimento[];
  alimentosPorId: Record<string, Alimento>;
  hoy: string;
  /** Día seleccionado en la navegación de la pantalla Hoy. */
  fechaActiva: string;
  setFechaActiva: (fecha: string) => void;
  dia: (fecha: string) => DiaRegistro | undefined;
  /** Comidas del día (las del plan + Extra). */
  comidasDe: (fecha: string) => ComidaDef[];
  temaEfectivo: 'claro' | 'oscuro';

  elegirPlanDelDia: (fecha: string, planId: 'A' | 'B') => void;
  setYogur: (fecha: string, valor: boolean) => void;
  setLecheMl: (fecha: string, ml: number) => void;
  guardarPlato: (fecha: string, plato: Plato) => void;
  eliminarPlato: (fecha: string, platoId: string) => void;
  duplicarPlato: (fecha: string, platoId: string) => void;

  guardarFavorito: (plato: Plato) => void;
  eliminarFavorito: (platoId: string) => void;

  /* Planificación (calendario) */
  planificacionDe: (fecha: string) => DiaPlanificado | undefined;
  pendientesDe: (fecha: string) => PlatoPlanificado[];
  guardarPlanificado: (fecha: string, plato: PlatoPlanificado) => void;
  eliminarPlanificado: (fecha: string, platoId: string) => void;
  moverPlanificado: (fechaOrigen: string, platoId: string, fechaDestino: string) => void;
  setPlanPrevisto: (fecha: string, planId: 'A' | 'B' | undefined) => void;
  vaciarDiaPlanificado: (fecha: string) => void;
  confirmarPlanificado: (fecha: string, platoId: string) => void;
  deshacerConfirmacion: (fecha: string, platoId: string) => void;
  descartarPlanificado: (fecha: string, platoId: string) => void;
  copiarDia: (fechaOrigen: string, fechasDestino: string[]) => void;
  repetirSemanal: (fechaOrigen: string, semanas: number) => void;
  guardarComoPlantilla: (fecha: string, nombre: string) => void;
  aplicarPlantilla: (plantillaId: string, fecha: string) => void;
  renombrarPlantilla: (plantillaId: string, nombre: string) => void;
  eliminarPlantilla: (plantillaId: string) => void;
  limpiarPlanificacionAnterior: () => void;

  setNombre: (nombre: string) => void;
  guardarPlanes: (planes: { A: EstructuraPlan; B: EstructuraPlan }) => void;
  restaurarPlanes: () => void;
  setAjustes: (parcial: Partial<Ajustes>) => void;
  reemplazarEstado: (nuevo: AppState) => void;
  borrarTodo: () => void;
}

export const AppContext = createContext<AppContextValor | null>(null);

function nuevoDia(fecha: string, planId: 'A' | 'B', estructura: EstructuraPlan): DiaRegistro {
  return {
    fecha,
    planId,
    objetivosSnapshot: clonar(estructura),
    yogur: false,
    lecheMl: 0,
    platos: [],
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<AppState>(() => cargarEstado());
  const [hoy, setHoy] = useState<string>(() => hoyISO());
  const [fechaActiva, setFechaActiva] = useState<string>(hoy);
  const [temaSistema, setTemaSistema] = useState<'claro' | 'oscuro'>(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'oscuro'
      : 'claro',
  );
  const primeraCarga = useRef(true);

  // Persistencia
  useEffect(() => {
    if (primeraCarga.current) {
      primeraCarga.current = false;
      return;
    }
    guardarEstado(estado);
  }, [estado]);

  // Cambio de día natural (app abierta a medianoche) y al volver del segundo plano.
  useEffect(() => {
    const revisar = () => {
      const actual = hoyISO();
      setHoy((prev) => {
        if (prev === actual) return prev;
        setFechaActiva(actual);
        return actual;
      });
    };
    const id = window.setInterval(revisar, 60_000);
    document.addEventListener('visibilitychange', revisar);
    window.addEventListener('focus', revisar);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', revisar);
      window.removeEventListener('focus', revisar);
    };
  }, []);

  // Tema
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const escuchar = (e: MediaQueryListEvent) => setTemaSistema(e.matches ? 'oscuro' : 'claro');
    mq.addEventListener('change', escuchar);
    return () => mq.removeEventListener('change', escuchar);
  }, []);

  const temaEfectivo: 'claro' | 'oscuro' =
    estado.ajustes.tema === 'sistema' ? temaSistema : estado.ajustes.tema;

  useEffect(() => {
    const raiz = document.documentElement;
    raiz.classList.toggle('dark', temaEfectivo === 'oscuro');
    // index.html declara dos metas con media query para el primer pintado. En cuanto
    // hay JS mandamos nosotros (el usuario puede forzar un tema), así que se igualan
    // las dos al color que toca en vez de tocar solo la primera que casa.
    const color = temaEfectivo === 'oscuro' ? '#0A0A0A' : '#F4F4F1';
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((meta) => meta.setAttribute('content', color));
  }, [temaEfectivo]);

  const actualizarDia = useCallback(
    (fecha: string, fn: (dia: DiaRegistro) => DiaRegistro) => {
      setEstado((prev) => {
        const dia = prev.dias[fecha];
        if (!dia) return prev;
        return { ...prev, dias: { ...prev.dias, [fecha]: fn(dia) } };
      });
    },
    [],
  );

  const elegirPlanDelDia = useCallback((fecha: string, planId: 'A' | 'B') => {
    setEstado((prev) => {
      const existente = prev.dias[fecha];
      if (existente) {
        // Cambiar de plan conserva los platos, pero renueva el snapshot de objetivos.
        return {
          ...prev,
          dias: {
            ...prev.dias,
            [fecha]: {
              ...existente,
              planId,
              objetivosSnapshot: clonar(prev.planes[planId]),
            },
          },
        };
      }
      return {
        ...prev,
        dias: { ...prev.dias, [fecha]: nuevoDia(fecha, planId, prev.planes[planId]) },
      };
    });
    track('plan_dia_elegido', { planId });
  }, []);

  const setYogur = useCallback(
    (fecha: string, valor: boolean) => actualizarDia(fecha, (d) => ({ ...d, yogur: valor })),
    [actualizarDia],
  );

  const setLecheMl = useCallback(
    (fecha: string, ml: number) =>
      actualizarDia(fecha, (d) => ({ ...d, lecheMl: Math.max(0, Math.round(ml)) })),
    [actualizarDia],
  );

  const guardarPlato = useCallback((fecha: string, plato: Plato) => {
    setEstado((prev) => {
      const dia = prev.dias[fecha];
      if (!dia) return prev;
      const existe = dia.platos.some((p) => p.id === plato.id);
      const platos = existe
        ? dia.platos.map((p) => (p.id === plato.id ? plato : p))
        : [...dia.platos, plato];
      const siguienteDia = { ...dia, platos };
      const siguiente = { ...prev, dias: { ...prev.dias, [fecha]: siguienteDia } };
      const tolerancia = prev.ajustes.toleranciaBloques;
      const antes = estadoDelDia(dia, ALIMENTOS_POR_ID, tolerancia);
      const despues = estadoDelDia(siguienteDia, ALIMENTOS_POR_ID, tolerancia);
      if (antes !== 'cumplido' && despues === 'cumplido') {
        track('dia_completado');
      }
      return siguiente;
    });
    track('comida_guardada', {
      comidaId: plato.comidaId,
      nIngredientes: plato.ingredientes.length,
    });
  }, []);

  const eliminarPlato = useCallback(
    (fecha: string, platoId: string) =>
      actualizarDia(fecha, (d) => ({ ...d, platos: d.platos.filter((p) => p.id !== platoId) })),
    [actualizarDia],
  );

  const duplicarPlato = useCallback(
    (fecha: string, platoId: string) =>
      actualizarDia(fecha, (d) => {
        const original = d.platos.find((p) => p.id === platoId);
        if (!original) return d;
        const copia: Plato = {
          ...original,
          id: crypto.randomUUID(),
          ingredientes: original.ingredientes.map((i) => ({ ...i })),
          creadoEn: new Date().toISOString(),
        };
        return { ...d, platos: [...d.platos, copia] };
      }),
    [actualizarDia],
  );

  const guardarFavorito = useCallback((plato: Plato) => {
    setEstado((prev) => {
      const favorito: Plato = {
        ...plato,
        id: `fav-${crypto.randomUUID()}`,
        ingredientes: plato.ingredientes.map((i) => ({ ...i })),
      };
      const sinDuplicado = prev.platosFavoritos.filter(
        (f) => f.nombre.trim().toLowerCase() !== plato.nombre.trim().toLowerCase(),
      );
      return { ...prev, platosFavoritos: [favorito, ...sinDuplicado].slice(0, 60) };
    });
  }, []);

  const eliminarFavorito = useCallback((platoId: string) => {
    setEstado((prev) => ({
      ...prev,
      platosFavoritos: prev.platosFavoritos.filter((f) => f.id !== platoId),
    }));
  }, []);

  /* ---------------- Planificación ---------------- */

  const actualizarPlanificado = useCallback(
    (fecha: string, fn: (dia: DiaPlanificado) => DiaPlanificado) => {
      setEstado((prev) => {
        const actual = prev.planificacion[fecha] ?? plan.diaPlanificadoVacio(fecha);
        return { ...prev, planificacion: { ...prev.planificacion, [fecha]: fn(actual) } };
      });
    },
    [],
  );

  const planificacionDe = useCallback(
    (fecha: string) => estado.planificacion[fecha],
    [estado.planificacion],
  );

  const pendientesDe = useCallback(
    (fecha: string) => plan.planificadosPendientes(estado, fecha),
    [estado],
  );

  const guardarPlanificado = useCallback(
    (fecha: string, plato: PlatoPlanificado) => {
      actualizarPlanificado(fecha, (d) => {
        const existe = d.platos.some((p) => p.id === plato.id);
        return {
          ...d,
          platos: existe
            ? d.platos.map((p) => (p.id === plato.id ? plato : p))
            : [...d.platos, plato],
        };
      });
      track('plato_planificado', {
        comidaId: plato.comidaId,
        nIngredientes: plato.ingredientes.length,
      });
    },
    [actualizarPlanificado],
  );

  const eliminarPlanificado = useCallback(
    (fecha: string, platoId: string) =>
      actualizarPlanificado(fecha, (d) => ({
        ...d,
        platos: d.platos.filter((p) => p.id !== platoId),
      })),
    [actualizarPlanificado],
  );

  const moverPlanificado = useCallback(
    (fechaOrigen: string, platoId: string, fechaDestino: string) =>
      setEstado((prev) => plan.moverPlanificado(prev, fechaOrigen, platoId, fechaDestino)),
    [],
  );

  const setPlanPrevisto = useCallback(
    (fecha: string, planId: 'A' | 'B' | undefined) =>
      actualizarPlanificado(fecha, (d) => ({ ...d, planId })),
    [actualizarPlanificado],
  );

  const vaciarDiaPlanificado = useCallback((fecha: string) => {
    setEstado((prev) => {
      const planificacion = { ...prev.planificacion };
      delete planificacion[fecha];
      return { ...prev, planificacion };
    });
  }, []);

  const confirmarPlanificado = useCallback((fecha: string, platoId: string) => {
    setEstado((prev) => {
      const previsto = prev.planificacion[fecha]?.platos.find((p) => p.id === platoId);
      const yaConfirmado = prev.dias[fecha]?.platos.some((p) => p.planificadoId === platoId);
      const siguiente = plan.confirmarPlanificado(prev, fecha, platoId);
      if (previsto && !yaConfirmado && siguiente !== prev) {
        track('planificado_confirmado', { comidaId: previsto.comidaId });
      }
      return siguiente;
    });
  }, []);

  const deshacerConfirmacion = useCallback(
    (fecha: string, platoId: string) =>
      setEstado((prev) => plan.deshacerConfirmacion(prev, fecha, platoId)),
    [],
  );

  const descartarPlanificado = useCallback(
    (fecha: string, platoId: string) =>
      setEstado((prev) => plan.descartarPlanificado(prev, fecha, platoId)),
    [],
  );

  const copiarDia = useCallback(
    (fechaOrigen: string, fechasDestino: string[]) =>
      setEstado((prev) => plan.copiarDia(prev, fechaOrigen, fechasDestino)),
    [],
  );

  const repetirSemanal = useCallback(
    (fechaOrigen: string, semanas: number) =>
      setEstado((prev) => plan.repetirSemanal(prev, fechaOrigen, semanas)),
    [],
  );

  const guardarComoPlantilla = useCallback(
    (fecha: string, nombre: string) =>
      setEstado((prev) => plan.guardarComoPlantilla(prev, fecha, nombre)),
    [],
  );

  const aplicarPlantilla = useCallback(
    (plantillaId: string, fecha: string) =>
      setEstado((prev) => plan.aplicarPlantilla(prev, plantillaId, fecha)),
    [],
  );

  const renombrarPlantilla = useCallback((plantillaId: string, nombre: string) => {
    setEstado((prev) => ({
      ...prev,
      plantillasMenu: prev.plantillasMenu.map((p) =>
        p.id === plantillaId ? { ...p, nombre } : p,
      ),
    }));
  }, []);

  const eliminarPlantilla = useCallback((plantillaId: string) => {
    setEstado((prev) => ({
      ...prev,
      plantillasMenu: prev.plantillasMenu.filter((p) => p.id !== plantillaId),
    }));
  }, []);

  const limpiarPlanificacionAnterior = useCallback(() => {
    setEstado((prev) => plan.limpiarPlanificacionAnterior(prev, hoyISO()));
  }, []);

  const setNombre = useCallback((nombre: string) => {
    setEstado((prev) => ({ ...prev, perfil: { ...prev.perfil, nombre } }));
  }, []);

  const guardarPlanes = useCallback((planes: { A: EstructuraPlan; B: EstructuraPlan }) => {
    setEstado((prev) => {
      const hoyStr = hoyISO();
      const dias = { ...prev.dias };
      // El día en curso adopta el plan editado; los días cerrados no se tocan.
      const diaHoy = dias[hoyStr];
      if (diaHoy) {
        dias[hoyStr] = { ...diaHoy, objetivosSnapshot: clonar(planes[diaHoy.planId]) };
      }
      return { ...prev, planes: clonar(planes), dias };
    });
  }, []);

  const restaurarPlanes = useCallback(() => {
    guardarPlanes(planSeed());
  }, [guardarPlanes]);

  const setAjustes = useCallback((parcial: Partial<Ajustes>) => {
    setEstado((prev) => ({ ...prev, ajustes: { ...prev.ajustes, ...parcial } }));
  }, []);

  const reemplazarEstado = useCallback((nuevo: AppState) => setEstado(nuevo), []);

  const borrarTodo = useCallback(() => {
    setEstado(estadoInicial());
    setFechaActiva(hoyISO());
  }, []);

  const dia = useCallback((fecha: string) => estado.dias[fecha], [estado.dias]);

  const comidasDe = useCallback(
    (fecha: string): ComidaDef[] => {
      const registro = estado.dias[fecha];
      const base = registro
        ? registro.objetivosSnapshot.comidas
        : estado.planes.A.comidas;
      const ordenadas = [...base].sort((a, b) => a.orden - b.orden);
      return [...ordenadas, COMIDA_EXTRA];
    },
    [estado.dias, estado.planes.A.comidas],
  );

  const valor = useMemo<AppContextValor>(
    () => ({
      estado,
      alimentos: ALIMENTOS,
      alimentosPorId: ALIMENTOS_POR_ID,
      hoy,
      fechaActiva,
      setFechaActiva,
      dia,
      comidasDe,
      temaEfectivo,
      elegirPlanDelDia,
      setYogur,
      setLecheMl,
      guardarPlato,
      eliminarPlato,
      duplicarPlato,
      guardarFavorito,
      eliminarFavorito,
      planificacionDe,
      pendientesDe,
      guardarPlanificado,
      eliminarPlanificado,
      moverPlanificado,
      setPlanPrevisto,
      vaciarDiaPlanificado,
      confirmarPlanificado,
      deshacerConfirmacion,
      descartarPlanificado,
      copiarDia,
      repetirSemanal,
      guardarComoPlantilla,
      aplicarPlantilla,
      renombrarPlantilla,
      eliminarPlantilla,
      limpiarPlanificacionAnterior,
      setNombre,
      guardarPlanes,
      restaurarPlanes,
      setAjustes,
      reemplazarEstado,
      borrarTodo,
    }),
    [
      estado,
      hoy,
      fechaActiva,
      dia,
      comidasDe,
      temaEfectivo,
      elegirPlanDelDia,
      setYogur,
      setLecheMl,
      guardarPlato,
      eliminarPlato,
      duplicarPlato,
      guardarFavorito,
      eliminarFavorito,
      planificacionDe,
      pendientesDe,
      guardarPlanificado,
      eliminarPlanificado,
      moverPlanificado,
      setPlanPrevisto,
      vaciarDiaPlanificado,
      confirmarPlanificado,
      deshacerConfirmacion,
      descartarPlanificado,
      copiarDia,
      repetirSemanal,
      guardarComoPlantilla,
      aplicarPlantilla,
      renombrarPlantilla,
      eliminarPlantilla,
      limpiarPlanificacionAnterior,
      setNombre,
      guardarPlanes,
      restaurarPlanes,
      setAjustes,
      reemplazarEstado,
      borrarTodo,
    ],
  );

  return <AppContext.Provider value={valor}>{children}</AppContext.Provider>;
}
