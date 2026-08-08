import { describe, expect, it } from 'vitest';

import { ALIMENTOS_POR_ID } from '@/data/alimentos';
import { planSeed } from '@/data/planSeed';
import { calcularRacha, consumidoDelDia, estadoDelDia, objetivosDelDia } from '@/lib/bloques';
import {
  aplicarPlantilla,
  bloquesPlanificadosDelDia,
  comparaPlanVsObjetivo,
  confirmarPlanificado,
  copiarDia,
  descartarPlanificado,
  guardarComoPlantilla,
  limpiarPlanificacionAnterior,
  matrizMes,
  moverPlanificado,
  planificadosPendientes,
  repetirSemanal,
} from '@/lib/planificacion';
import { estadoInicial, migrar, SCHEMA_VERSION } from '@/lib/storage';
import type { AppState, DiaPlanificado, DiaRegistro, PlatoPlanificado } from '@/types';

function platoPlanificado(
  id: string,
  comidaId: string,
  ingredientes: { alimentoId: string; gramos: number; bloques: number }[],
): PlatoPlanificado {
  return { id, nombre: `Plato ${id}`, comidaId, ingredientes };
}

function diaPlan(fecha: string, platos: PlatoPlanificado[], planId?: 'A' | 'B'): DiaPlanificado {
  return { fecha, planId, platos };
}

function estadoCon(planificacion: Record<string, DiaPlanificado>, dias: Record<string, DiaRegistro> = {}): AppState {
  return { ...estadoInicial(), planificacion, dias };
}

function diaRegistro(fecha: string, planId: 'A' | 'B' = 'A'): DiaRegistro {
  const base = estadoInicial();
  return {
    fecha,
    planId,
    objetivosSnapshot: base.planes[planId],
    yogur: false,
    lecheMl: 0,
    platos: [],
  };
}

describe('bloquesPlanificadosDelDia', () => {
  it('suma los bloques de todos los platos previstos', () => {
    const dia = diaPlan('2026-08-10', [
      platoPlanificado('p1', 'comida', [{ alimentoId: 'ch-arroz', gramos: 100, bloques: 5 }]),
      platoPlanificado('p2', 'cena', [{ alimentoId: 'p1-pollo-pechuga', gramos: 100, bloques: 2 }]),
    ]);

    const bloques = bloquesPlanificadosDelDia(dia, ALIMENTOS_POR_ID);
    expect(bloques.carbohidratos).toBe(5);
    expect(bloques.proteicos1).toBe(2);
  });

  it('aplica el doble cómputo de las legumbres', () => {
    const dia = diaPlan('2026-08-10', [
      platoPlanificado('p1', 'comida', [{ alimentoId: 'ch-legumbre-cruda', gramos: 60, bloques: 2 }]),
    ]);

    const bloques = bloquesPlanificadosDelDia(dia, ALIMENTOS_POR_ID);
    expect(bloques.carbohidratos).toBe(2);
    expect(bloques.proteicos1).toBe(2);
  });

  it('devuelve ceros si no hay nada planificado', () => {
    const bloques = bloquesPlanificadosDelDia(undefined, ALIMENTOS_POR_ID);
    expect(bloques.carbohidratos).toBe(0);
    expect(bloques.grasas).toBe(0);
  });
});

describe('comparaPlanVsObjetivo', () => {
  it('devuelve objetivo, planificado y diferencia por grupo', () => {
    const planes = planSeed();
    const dia = diaPlan('2026-08-10', [
      platoPlanificado('p1', 'comida', [{ alimentoId: 'ch-arroz', gramos: 100, bloques: 5 }]),
    ]);

    const comparativa = comparaPlanVsObjetivo(dia, planes.A, ALIMENTOS_POR_ID);
    expect(comparativa.carbohidratos.objetivo).toBe(8);
    expect(comparativa.carbohidratos.planificado).toBe(5);
    expect(comparativa.carbohidratos.diff).toBe(-3);
    expect(comparativa.frutas.planificado).toBe(0);
  });

  it('marca en positivo lo que se pasa del objetivo', () => {
    const planes = planSeed();
    const dia = diaPlan('2026-08-10', [
      platoPlanificado('p1', 'comida', [{ alimentoId: 'ch-arroz', gramos: 200, bloques: 10 }]),
    ]);

    const comparativa = comparaPlanVsObjetivo(dia, planes.A, ALIMENTOS_POR_ID);
    expect(comparativa.carbohidratos.diff).toBe(2);
  });
});

describe('confirmarPlanificado', () => {
  const fecha = '2026-08-10';
  const planificado = platoPlanificado('p1', 'comida', [
    { alimentoId: 'ch-arroz', gramos: 100, bloques: 5 },
  ]);

  it('convierte el planificado en un plato real que sí suma bloques', () => {
    const estado = estadoCon({ [fecha]: diaPlan(fecha, [planificado]) }, { [fecha]: diaRegistro(fecha) });

    expect(consumidoDelDia(estado.dias[fecha], ALIMENTOS_POR_ID).carbohidratos).toBe(0);

    const siguiente = confirmarPlanificado(estado, fecha, 'p1', '13:30');
    const dia = siguiente.dias[fecha];

    expect(dia.platos).toHaveLength(1);
    expect(dia.platos[0].planificadoId).toBe('p1');
    expect(dia.platos[0].hora).toBe('13:30');
    expect(consumidoDelDia(dia, ALIMENTOS_POR_ID).carbohidratos).toBe(5);
  });

  it('no muta el estado original', () => {
    const estado = estadoCon({ [fecha]: diaPlan(fecha, [planificado]) }, { [fecha]: diaRegistro(fecha) });
    const siguiente = confirmarPlanificado(estado, fecha, 'p1');

    expect(estado.dias[fecha].platos).toHaveLength(0);
    expect(siguiente).not.toBe(estado);
  });

  it('crea el día si todavía no existía, usando el plan previsto', () => {
    const estado = estadoCon({ [fecha]: diaPlan(fecha, [planificado], 'B') });
    const siguiente = confirmarPlanificado(estado, fecha, 'p1');

    expect(siguiente.dias[fecha].planId).toBe('B');
    expect(siguiente.dias[fecha].platos).toHaveLength(1);
  });

  it('es idempotente: confirmar dos veces no duplica', () => {
    const estado = estadoCon({ [fecha]: diaPlan(fecha, [planificado]) }, { [fecha]: diaRegistro(fecha) });
    const unaVez = confirmarPlanificado(estado, fecha, 'p1');
    const dosVeces = confirmarPlanificado(unaVez, fecha, 'p1');

    expect(dosVeces.dias[fecha].platos).toHaveLength(1);
  });
});

describe('planificadosPendientes y descartar', () => {
  const fecha = '2026-08-10';
  const platos = [
    platoPlanificado('p1', 'comida', [{ alimentoId: 'ch-arroz', gramos: 100, bloques: 5 }]),
    platoPlanificado('p2', 'cena', [{ alimentoId: 'p1-pollo-pechuga', gramos: 100, bloques: 2 }]),
  ];

  it('lista lo que aún no se ha confirmado ni descartado', () => {
    const estado = estadoCon({ [fecha]: diaPlan(fecha, platos) }, { [fecha]: diaRegistro(fecha) });
    expect(planificadosPendientes(estado, fecha).map((p) => p.id)).toEqual(['p1', 'p2']);
  });

  it('CRITERIO 8 — un planificado descartado no reaparece', () => {
    const estado = estadoCon({ [fecha]: diaPlan(fecha, platos) }, { [fecha]: diaRegistro(fecha) });
    const siguiente = descartarPlanificado(estado, fecha, 'p1');

    expect(siguiente.dias[fecha].planificadosDescartados).toContain('p1');
    expect(planificadosPendientes(siguiente, fecha).map((p) => p.id)).toEqual(['p2']);

    // Y sobrevive a un ciclo de guardado/carga.
    const rehidratado = migrar(JSON.parse(JSON.stringify(siguiente)));
    expect(planificadosPendientes(rehidratado, fecha).map((p) => p.id)).toEqual(['p2']);
  });

  it('un planificado ya confirmado deja de estar pendiente', () => {
    const estado = estadoCon({ [fecha]: diaPlan(fecha, platos) }, { [fecha]: diaRegistro(fecha) });
    const siguiente = confirmarPlanificado(estado, fecha, 'p1');
    expect(planificadosPendientes(siguiente, fecha).map((p) => p.id)).toEqual(['p2']);
  });
});

describe('copiarDia', () => {
  it('copia el menú en varias fechas destino con ids nuevos', () => {
    const origen = '2026-08-10';
    const estado = estadoCon({
      [origen]: diaPlan(origen, [
        platoPlanificado('p1', 'comida', [{ alimentoId: 'ch-arroz', gramos: 100, bloques: 5 }]),
      ], 'B'),
    });

    const siguiente = copiarDia(estado, origen, ['2026-08-12', '2026-08-14']);

    expect(siguiente.planificacion['2026-08-12'].platos).toHaveLength(1);
    expect(siguiente.planificacion['2026-08-14'].platos).toHaveLength(1);
    expect(siguiente.planificacion['2026-08-12'].planId).toBe('B');
    expect(siguiente.planificacion['2026-08-12'].platos[0].id).not.toBe('p1');
    expect(siguiente.planificacion['2026-08-12'].platos[0].ingredientes[0].bloques).toBe(5);
    // El origen se mantiene intacto.
    expect(siguiente.planificacion[origen].platos[0].id).toBe('p1');
  });

  it('ignora la fecha origen si aparece entre los destinos', () => {
    const origen = '2026-08-10';
    const estado = estadoCon({ [origen]: diaPlan(origen, [platoPlanificado('p1', 'comida', [])]) });
    const siguiente = copiarDia(estado, origen, [origen]);
    expect(siguiente.planificacion[origen].platos[0].id).toBe('p1');
  });
});

describe('repetirSemanal', () => {
  it('CRITERIO 9 — repetir ×4 planifica los 4 mismos días de la semana siguientes', () => {
    const origen = '2026-08-03'; // lunes
    const estado = estadoCon({
      [origen]: diaPlan(origen, [
        platoPlanificado('p1', 'comida', [{ alimentoId: 'ch-arroz', gramos: 100, bloques: 5 }]),
      ]),
    });

    const siguiente = repetirSemanal(estado, origen, 4);

    expect(Object.keys(siguiente.planificacion).sort()).toEqual([
      '2026-08-03',
      '2026-08-10',
      '2026-08-17',
      '2026-08-24',
      '2026-08-31',
    ]);
    for (const fecha of ['2026-08-10', '2026-08-17', '2026-08-24', '2026-08-31']) {
      expect(siguiente.planificacion[fecha].platos).toHaveLength(1);
    }
  });

  it('acota el número de semanas a 8 y no hace nada con 0', () => {
    const origen = '2026-08-03';
    const estado = estadoCon({ [origen]: diaPlan(origen, [platoPlanificado('p1', 'comida', [])]) });

    expect(Object.keys(repetirSemanal(estado, origen, 0).planificacion)).toHaveLength(1);
    expect(Object.keys(repetirSemanal(estado, origen, 20).planificacion)).toHaveLength(9);
  });
});

describe('plantillas de menú', () => {
  it('CRITERIO 10 — guardar un día como plantilla y aplicarla reproduce los mismos platos', () => {
    const origen = '2026-08-10';
    const estado = estadoCon({
      [origen]: diaPlan(origen, [
        platoPlanificado('p1', 'desayuno', [{ alimentoId: 'ch-arroz', gramos: 40, bloques: 2 }]),
        platoPlanificado('p2', 'comida', [{ alimentoId: 'p1-pollo-pechuga', gramos: 150, bloques: 3 }]),
      ], 'A'),
    });

    const conPlantilla = guardarComoPlantilla(estado, origen, 'Día alto en proteína');
    expect(conPlantilla.plantillasMenu).toHaveLength(1);
    const plantilla = conPlantilla.plantillasMenu[0];
    expect(plantilla.nombre).toBe('Día alto en proteína');

    const aplicado = aplicarPlantilla(conPlantilla, plantilla.id, '2026-09-01');
    const destino = aplicado.planificacion['2026-09-01'];

    expect(destino.platos).toHaveLength(2);
    expect(destino.planId).toBe('A');
    expect(destino.platos.map((p) => p.comidaId)).toEqual(['desayuno', 'comida']);
    expect(destino.platos[1].ingredientes[0]).toMatchObject({ alimentoId: 'p1-pollo-pechuga', bloques: 3 });
    expect(destino.platos[0].origenPlantillaId).toBe(plantilla.id);
    // Ids distintos: editar el destino no toca la plantilla.
    expect(destino.platos[0].id).not.toBe(plantilla.platos[0].id);
  });

  it('no guarda plantillas de días vacíos', () => {
    const estado = estadoCon({});
    expect(guardarComoPlantilla(estado, '2026-08-10', 'Vacío').plantillasMenu).toHaveLength(0);
  });
});

describe('moverPlanificado y limpieza', () => {
  it('mueve un plato de un día a otro', () => {
    const estado = estadoCon({
      '2026-08-10': diaPlan('2026-08-10', [platoPlanificado('p1', 'comida', [])]),
    });
    const siguiente = moverPlanificado(estado, '2026-08-10', 'p1', '2026-08-11');

    expect(siguiente.planificacion['2026-08-10'].platos).toHaveLength(0);
    expect(siguiente.planificacion['2026-08-11'].platos[0].id).toBe('p1');
  });

  it('limpia la planificación anterior a una fecha', () => {
    const estado = estadoCon({
      '2026-08-01': diaPlan('2026-08-01', []),
      '2026-08-09': diaPlan('2026-08-09', []),
      '2026-08-10': diaPlan('2026-08-10', []),
      '2026-08-20': diaPlan('2026-08-20', []),
    });
    const siguiente = limpiarPlanificacionAnterior(estado, '2026-08-10');
    expect(Object.keys(siguiente.planificacion).sort()).toEqual(['2026-08-10', '2026-08-20']);
  });
});

describe('matrizMes', () => {
  it('agosto de 2026 empezando en lunes', () => {
    const semanas = matrizMes(2026, 7, 1);

    expect(semanas).toHaveLength(6);
    expect(semanas[0].every((c, i) => (i < 5 ? c === null : c !== null))).toBe(true);
    expect(semanas[0][5]?.getDate()).toBe(1); // 1 de agosto de 2026 es sábado
    expect(semanas[0][6]?.getDate()).toBe(2);
    expect(semanas.flat().filter(Boolean)).toHaveLength(31);
  });

  it('el mismo mes empezando en domingo desplaza una posición', () => {
    const semanas = matrizMes(2026, 7, 0);
    expect(semanas[0][6]?.getDate()).toBe(1);
  });

  it('febrero de 2027 (28 días empezando en lunes) ocupa exactamente 4 semanas', () => {
    const semanas = matrizMes(2027, 1, 1);
    expect(semanas).toHaveLength(4);
    expect(semanas[0][0]?.getDate()).toBe(1);
    expect(semanas[3][6]?.getDate()).toBe(28);
  });

  it('todas las semanas tienen 7 celdas', () => {
    for (let mes = 0; mes < 12; mes += 1) {
      for (const semana of matrizMes(2026, mes, 1)) expect(semana).toHaveLength(7);
    }
  });
});

describe('CRITERIO 5 — la planificación no altera bloques ni racha', () => {
  it('planificar 3 platos no cambia consumido, objetivos, estado del día ni racha', () => {
    const fecha = '2026-08-10';
    const base = estadoCon({}, { [fecha]: diaRegistro(fecha) });

    const objetivosAntes = objetivosDelDia(base.dias[fecha]);
    const consumidoAntes = consumidoDelDia(base.dias[fecha], ALIMENTOS_POR_ID);
    const estadoAntes = estadoDelDia(base.dias[fecha], ALIMENTOS_POR_ID, 0.5);
    const rachaAntes = calcularRacha(base.dias, { toleranciaBloques: 0.5 }, ALIMENTOS_POR_ID, fecha);

    const conPlan: AppState = {
      ...base,
      planificacion: {
        [fecha]: diaPlan(fecha, [
          platoPlanificado('p1', 'desayuno', [{ alimentoId: 'ch-arroz', gramos: 100, bloques: 5 }]),
          platoPlanificado('p2', 'comida', [{ alimentoId: 'p1-pollo-pechuga', gramos: 200, bloques: 4 }]),
          platoPlanificado('p3', 'cena', [{ alimentoId: 'gr-aceites', gramos: 15, bloques: 3 }]),
        ]),
      },
    };

    expect(objetivosDelDia(conPlan.dias[fecha])).toEqual(objetivosAntes);
    expect(consumidoDelDia(conPlan.dias[fecha], ALIMENTOS_POR_ID)).toEqual(consumidoAntes);
    expect(estadoDelDia(conPlan.dias[fecha], ALIMENTOS_POR_ID, 0.5)).toEqual(estadoAntes);
    expect(calcularRacha(conPlan.dias, { toleranciaBloques: 0.5 }, ALIMENTOS_POR_ID, fecha)).toEqual(rachaAntes);
  });
});

describe('CRITERIO 11 — migración de un backup v1', () => {
  it('inicializa planificación, plantillas y modo de calendario sin perder datos', () => {
    const v1 = {
      schemaVersion: 1,
      perfil: { nombre: 'Ana' },
      planes: planSeed(),
      dias: { '2026-08-01': diaRegistro('2026-08-01') },
      platosFavoritos: [],
      ajustes: { toleranciaBloques: 0.5, primerDiaSemana: 1, tema: 'claro' },
    };

    const migrado = migrar(JSON.parse(JSON.stringify(v1)));

    expect(migrado.schemaVersion).toBe(SCHEMA_VERSION);
    expect(migrado.planificacion).toEqual({});
    expect(migrado.plantillasMenu).toEqual([]);
    expect(migrado.ajustes.modoCalendario).toBe('agenda');
    expect(migrado.perfil.nombre).toBe('Ana');
    expect(migrado.dias['2026-08-01']).toBeDefined();
    expect(migrado.ajustes.tema).toBe('claro');
  });

  it('un estado v2 conserva su planificación al recargar', () => {
    const fecha = '2026-08-10';
    const v2: AppState = {
      ...estadoInicial(),
      planificacion: { [fecha]: diaPlan(fecha, [platoPlanificado('p1', 'comida', [])], 'B') },
      plantillasMenu: [
        { id: 't1', nombre: 'Plantilla', platos: [], creadaEn: new Date().toISOString() },
      ],
      ajustes: { ...estadoInicial().ajustes, modoCalendario: 'programar' },
    };

    const migrado = migrar(JSON.parse(JSON.stringify(v2)));
    expect(migrado.planificacion[fecha].platos).toHaveLength(1);
    expect(migrado.planificacion[fecha].planId).toBe('B');
    expect(migrado.plantillasMenu).toHaveLength(1);
    expect(migrado.ajustes.modoCalendario).toBe('programar');
  });
});
