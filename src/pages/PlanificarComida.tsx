import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { FormularioComida, type DatosComida } from '@/components/FormularioComida';
import { useToast } from '@/components/Toast';
import { totalesDelPlan } from '@/lib/bloques';
import { capitalizar, formatoLargo } from '@/lib/fechas';
import { bloquesPlanificadosDelDia } from '@/lib/planificacion';
import { useApp } from '@/store/useApp';
import type { PlatoPlanificado } from '@/types';

export interface EstadoPlanificarComida {
  fecha: string;
  comidaId?: string;
  platoPlanificadoId?: string;
  volverA?: string;
}

export function PlanificarComida() {
  const {
    estado,
    alimentos,
    alimentosPorId,
    hoy,
    comidasDe,
    planificacionDe,
    guardarPlanificado,
    eliminarPlanificado,
  } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const nav = (location.state ?? {}) as Partial<EstadoPlanificarComida>;

  const fecha = nav.fecha ?? hoy;
  const volverA = nav.volverA ?? '/calendario';
  const comidas = comidasDe(fecha);
  const diaPlanificado = planificacionDe(fecha);

  const existente = nav.platoPlanificadoId
    ? diaPlanificado?.platos.find((p) => p.id === nav.platoPlanificadoId)
    : undefined;

  const planId = diaPlanificado?.planId ?? estado.dias[fecha]?.planId ?? 'A';
  const objetivos = useMemo(() => totalesDelPlan(estado.planes[planId]), [estado.planes, planId]);

  /** Bloques ya planificados del día, sin contar el plato en edición. */
  const planificadoBase = useMemo(() => {
    const sinEste = diaPlanificado && {
      ...diaPlanificado,
      platos: existente
        ? diaPlanificado.platos.filter((p) => p.id !== existente.id)
        : diaPlanificado.platos,
    };
    return bloquesPlanificadosDelDia(sinEste, alimentosPorId);
  }, [diaPlanificado, existente, alimentosPorId]);

  const nombresPrevios = useMemo(() => {
    const set = new Set<string>();
    for (const d of Object.values(estado.planificacion)) {
      for (const p of d.platos) set.add(p.nombre);
    }
    for (const f of estado.platosFavoritos) set.add(f.nombre);
    return [...set];
  }, [estado.planificacion, estado.platosFavoritos]);

  const onGuardar = (datos: DatosComida) => {
    const anterior = existente;
    const plato: PlatoPlanificado = {
      id: anterior?.id ?? crypto.randomUUID(),
      nombre: datos.nombre,
      comidaId: datos.comidaId,
      ingredientes: datos.ingredientes,
      ...(anterior?.origenPlantillaId ? { origenPlantillaId: anterior.origenPlantillaId } : {}),
      ...(anterior?.notas ? { notas: anterior.notas } : {}),
    };

    guardarPlanificado(fecha, plato);

    toast(anterior ? 'Plato actualizado en el plan' : 'Plato añadido al plan', {
      accion: {
        etiqueta: 'Deshacer',
        onAccion: () => {
          if (anterior) guardarPlanificado(fecha, anterior);
          else eliminarPlanificado(fecha, plato.id);
          toast('Cambio deshecho', 'info');
        },
      },
    });

    navigate(volverA);
  };

  return (
    <FormularioComida
      modo="planificacion"
      titulo={existente ? 'Editar plato previsto' : 'Planificar plato'}
      subtitulo={capitalizar(formatoLargo(fecha))}
      comidas={comidas}
      alimentos={alimentos}
      alimentosPorId={alimentosPorId}
      esEdicion={Boolean(existente)}
      nombresPrevios={nombresPrevios}
      objetivosDia={objetivos}
      consumidoBase={planificadoBase}
      etiquetaRestante="Quedará por planificar"
      ocultarFavorito
      inicial={{
        nombre: existente?.nombre,
        comidaId: existente?.comidaId ?? nav.comidaId,
        ingredientes: existente?.ingredientes,
      }}
      onGuardar={onGuardar}
      onCancelar={() => navigate(volverA)}
    />
  );
}
