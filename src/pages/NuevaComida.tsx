import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { FormularioComida, type DatosComida } from '@/components/FormularioComida';
import { useToast } from '@/components/Toast';
import { consumidoDelDia, objetivosDelDia } from '@/lib/bloques';
import { capitalizar, formatoLargo } from '@/lib/fechas';
import { useApp } from '@/store/useApp';
import type { Plato } from '@/types';

export interface EstadoNuevaComida {
  fecha?: string;
  comidaId?: string;
  /** Editar un plato ya registrado. */
  platoId?: string;
  /** Preselección desde la consulta de alimentos. */
  alimentoId?: string;
  /** Registrar un plato planificado: prerrellena y marca su origen. */
  desdePlanificadoId?: string;
  /** Ruta a la que volver al guardar o cancelar. */
  volverA?: string;
}

export function NuevaComida() {
  const {
    estado,
    alimentos,
    alimentosPorId,
    hoy,
    fechaActiva,
    comidasDe,
    guardarPlato,
    eliminarPlato,
    guardarFavorito,
    descartarPlanificado,
  } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const nav = (location.state ?? {}) as EstadoNuevaComida;

  const fecha = nav.fecha ?? (estado.dias[fechaActiva] ? fechaActiva : hoy);
  const dia = estado.dias[fecha];
  const comidas = comidasDe(fecha);
  const volverA = nav.volverA ?? '/';

  const platoExistente = nav.platoId ? dia?.platos.find((p) => p.id === nav.platoId) : undefined;

  const planificado = nav.desdePlanificadoId
    ? estado.planificacion[fecha]?.platos.find((p) => p.id === nav.desdePlanificadoId)
    : undefined;

  const objetivos = useMemo(() => (dia ? objetivosDelDia(dia) : null), [dia]);

  /** Consumido del día sin contar el plato que se está editando. */
  const consumidoBase = useMemo(() => {
    if (!dia) return null;
    const sinEste = platoExistente
      ? { ...dia, platos: dia.platos.filter((p) => p.id !== platoExistente.id) }
      : dia;
    return consumidoDelDia(sinEste, alimentos);
  }, [dia, platoExistente, alimentos]);

  const nombresPrevios = useMemo(() => {
    const set = new Set<string>();
    for (const d of Object.values(estado.dias)) {
      for (const p of d.platos) set.add(p.nombre);
    }
    for (const f of estado.platosFavoritos) set.add(f.nombre);
    return [...set];
  }, [estado.dias, estado.platosFavoritos]);

  if (!dia) {
    return (
      <div className="px-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <div className="tarjeta p-6 text-center">
          <p className="text-[15px] font-semibold">Todavía no has elegido el plan del día</p>
          <p className="mt-1 text-[13px] text-neutral-600 dark:text-neutral-400">
            Elige TIPO A o TIPO B en la pantalla de inicio para poder registrar comidas.
          </p>
          <button type="button" className="btn-primario mt-4 w-full" onClick={() => navigate('/')}>
            Ir a Hoy
          </button>
        </div>
      </div>
    );
  }

  const onGuardar = (datos: DatosComida) => {
    const anterior = platoExistente;
    const plato: Plato = {
      id: anterior?.id ?? crypto.randomUUID(),
      nombre: datos.nombre,
      comidaId: datos.comidaId,
      hora: datos.hora,
      ingredientes: datos.ingredientes,
      creadoEn: anterior?.creadoEn ?? new Date().toISOString(),
      ...(planificado ? { planificadoId: planificado.id } : {}),
      ...(anterior?.planificadoId ? { planificadoId: anterior.planificadoId } : {}),
    };

    guardarPlato(fecha, plato);
    if (datos.guardarComoFavorito) guardarFavorito(plato);
    if (planificado) descartarPlanificado(fecha, planificado.id);

    toast(anterior ? 'Cambios guardados' : 'Comida guardada', {
      accion: {
        etiqueta: 'Deshacer',
        onAccion: () => {
          if (anterior) guardarPlato(fecha, anterior);
          else eliminarPlato(fecha, plato.id);
          toast('Cambio deshecho', 'info');
        },
      },
    });

    navigate(volverA, { state: { resaltarPlatoId: plato.id, fecha } });
  };

  return (
    <FormularioComida
      modo="registro"
      titulo={platoExistente ? 'Editar plato' : 'Nueva comida'}
      subtitulo={capitalizar(formatoLargo(fecha))}
      comidas={comidas}
      alimentos={alimentos}
      alimentosPorId={alimentosPorId}
      esEdicion={Boolean(platoExistente)}
      nombresPrevios={nombresPrevios}
      objetivosDia={objetivos}
      consumidoBase={consumidoBase}
      inicial={{
        nombre: platoExistente?.nombre ?? planificado?.nombre,
        comidaId: platoExistente?.comidaId ?? planificado?.comidaId ?? nav.comidaId,
        hora: platoExistente?.hora,
        ingredientes: platoExistente?.ingredientes ?? planificado?.ingredientes,
        alimentoId: nav.alimentoId,
      }}
      onGuardar={onGuardar}
      onCancelar={() => navigate(volverA)}
    />
  );
}
