import { describe, expect, it } from 'vitest';

import { ALIMENTOS, ALIMENTOS_POR_ID, getAlimento } from '@/data/alimentos';
import { clonar, planSeed } from '@/data/planSeed';
import {
  bloquesAGramos,
  bloquesDePlato,
  calcularRacha,
  cocidoDesdeCrudo,
  consumidoDeComida,
  consumidoDelDia,
  crudoDesdeCocido,
  estadoDelDia,
  formatearBloques,
  gramosABloques,
  objetivosDelDia,
  restanteDelDia,
  totalesDelPlan,
} from '@/lib/bloques';
import { buscarAlimentos, normalizar } from '@/lib/search';
import type { DiaRegistro, Ingrediente, Plato } from '@/types';

const alimento = (id: string) => {
  const a = getAlimento(id);
  if (!a) throw new Error(`Alimento no encontrado: ${id}`);
  return a;
};

function ingrediente(id: string, gramos: number): Ingrediente {
  return { alimentoId: id, gramos, bloques: gramosABloques(alimento(id), gramos) };
}

function plato(comidaId: string, ingredientes: Ingrediente[], nombre = 'Plato'): Plato {
  return {
    id: `p-${Math.random().toString(36).slice(2)}`,
    nombre,
    comidaId,
    hora: '13:00',
    ingredientes,
    creadoEn: '2026-08-08T13:00:00.000Z',
  };
}

function dia(
  fecha: string,
  planId: 'A' | 'B',
  platos: Plato[],
  extra: Partial<DiaRegistro> = {},
): DiaRegistro {
  return {
    fecha,
    planId,
    objetivosSnapshot: clonar(planSeed()[planId]),
    yogur: false,
    lecheMl: 0,
    platos,
    ...extra,
  };
}

describe('conversión gramos ↔ bloques', () => {
  it('convierte gramos a bloques con el gramaje del alimento', () => {
    expect(gramosABloques(alimento('ch-arroz'), 100)).toBe(5);
    expect(gramosABloques(alimento('ch-arroz'), 30)).toBe(1.5);
    expect(gramosABloques(alimento('p1-pollo-pechuga'), 120)).toBe(4);
    expect(gramosABloques(alimento('gr-aceites'), 5)).toBe(1);
  });

  it('convierte bloques a gramos', () => {
    expect(bloquesAGramos(alimento('ch-arroz'), 5)).toBe(100);
    expect(bloquesAGramos(alimento('vd-lechuga'), 1.5)).toBe(225);
    expect(bloquesAGramos(alimento('p2-huevo'), 2)).toBe(2);
  });

  it('el huevo completo se cuenta por unidades: 1 unidad = 1 bloque', () => {
    expect(gramosABloques(alimento('p2-huevo'), 2)).toBe(2);
  });

  it('formatea bloques con un máximo de un decimal', () => {
    expect(formatearBloques(2)).toBe('2');
    expect(formatearBloques(2.5)).toBe('2.5');
    expect(formatearBloques(2.46)).toBe('2.5');
    expect(formatearBloques(0.30000000000000004)).toBe('0.3');
  });
});

describe('conversión crudo ↔ cocido', () => {
  it('convierte de cocido a crudo dividiendo por el factor', () => {
    expect(crudoDesdeCocido(300, 3)).toBe(100);
    expect(crudoDesdeCocido(250, 2.5)).toBe(100);
    expect(crudoDesdeCocido(280, 2.8)).toBe(100);
    expect(crudoDesdeCocido(70, 0.7)).toBe(100);
  });

  it('convierte de crudo a cocido multiplicando por el factor', () => {
    expect(cocidoDesdeCrudo(100, 3)).toBe(300);
    expect(cocidoDesdeCrudo(120, 0.75)).toBe(90);
  });

  it('es una operación reversible', () => {
    expect(cocidoDesdeCrudo(crudoDesdeCocido(255, 0.85), 0.85)).toBe(255);
  });
});

describe('bloquesDePlato', () => {
  it('acepta el catálogo como array, mapa o función', () => {
    const p = plato('comida', [ingrediente('ch-arroz', 100)]);
    expect(bloquesDePlato(p, ALIMENTOS).carbohidratos).toBe(5);
    expect(bloquesDePlato(p, ALIMENTOS_POR_ID).carbohidratos).toBe(5);
    expect(bloquesDePlato(p, getAlimento).carbohidratos).toBe(5);
  });

  it('CRITERIO 2 — 100 g de arroz suman exactamente 5 bloques de carbohidratos', () => {
    const p = plato('comida', [ingrediente('ch-arroz', 100)]);
    const b = bloquesDePlato(p, ALIMENTOS);
    expect(b.carbohidratos).toBe(5);
    expect(b.proteicos1).toBe(0);
    expect(b.grasas).toBe(0);
  });

  it('CRITERIO 3 — 60 g de legumbre cruda suman 2 CH y 2 Proteicos I a la vez', () => {
    const p = plato('comida', [ingrediente('ch-legumbre-cruda', 60)]);
    const b = bloquesDePlato(p, ALIMENTOS);
    expect(b.carbohidratos).toBe(2);
    expect(b.proteicos1).toBe(2);
  });

  it('el doble cómputo aplica a todas las pastas de legumbre', () => {
    for (const id of ['ch-legumbre-cocida', 'ch-pasta-lenteja-roja', 'ch-pasta-garbanzo']) {
      const a = alimento(id);
      expect(a.dobleComputo).toBe(true);
      const b = bloquesDePlato(plato('comida', [ingrediente(id, a.gramosPorBloque * 3)]), ALIMENTOS);
      expect(b.carbohidratos).toBe(3);
      expect(b.proteicos1).toBe(3);
    }
  });

  it('suma varios ingredientes de grupos distintos', () => {
    const p = plato('comida', [
      ingrediente('ch-quinoa', 60),
      ingrediente('p1-pollo-pechuga', 120),
      ingrediente('vd-lechuga', 150),
      ingrediente('gr-aceites', 10),
    ]);
    const b = bloquesDePlato(p, ALIMENTOS);
    expect(b.carbohidratos).toBe(3);
    expect(b.proteicos1).toBe(4);
    expect(b.verduras).toBe(1);
    expect(b.grasas).toBe(2);
  });

  it('ignora ingredientes cuyo alimento ya no existe', () => {
    const p = plato('comida', [
      { alimentoId: 'inexistente', gramos: 100, bloques: 3 },
      ingrediente('ch-arroz', 20),
    ]);
    expect(bloquesDePlato(p, ALIMENTOS).carbohidratos).toBe(1);
  });
});

describe('planes y objetivos', () => {
  it('los totales del plan A coinciden con el plan del nutricionista', () => {
    const t = totalesDelPlan(planSeed().A);
    expect(t).toMatchObject({
      carbohidratos: 8,
      proteicos1: 9,
      proteicos2: 0,
      grasas: 6.5,
      verduras: 3,
      frutas: 2,
    });
  });

  it('los totales del plan B coinciden con el plan del nutricionista', () => {
    const t = totalesDelPlan(planSeed().B);
    expect(t).toMatchObject({
      carbohidratos: 8,
      proteicos1: 6,
      proteicos2: 3,
      grasas: 5.5,
      verduras: 3,
      frutas: 2,
    });
  });

  it('CRITERIO 4 — el yogur ajusta el plan A a CH 7.5 / Prot I 8.5 / Grasas 6', () => {
    const d = dia('2026-08-08', 'A', [], { yogur: true });
    expect(objetivosDelDia(d)).toMatchObject({
      carbohidratos: 7.5,
      proteicos1: 8.5,
      grasas: 6,
      verduras: 3,
      frutas: 2,
    });
  });

  it('el yogur ajusta el plan B a CH 7.5 / Prot I 5.5 / Prot II 3 / Grasas 5', () => {
    const d = dia('2026-08-08', 'B', [], { yogur: true });
    expect(objetivosDelDia(d)).toMatchObject({
      carbohidratos: 7.5,
      proteicos1: 5.5,
      proteicos2: 3,
      grasas: 5,
      verduras: 3,
      frutas: 2,
    });
  });

  it('sin yogur los objetivos son los del snapshot', () => {
    const d = dia('2026-08-08', 'A', []);
    expect(objetivosDelDia(d).carbohidratos).toBe(8);
  });

  it('CRITERIO 6 — editar el plan no altera los objetivos de un día ya registrado', () => {
    const planes = planSeed();
    const d = dia('2026-08-01', 'A', []);
    planes.A.bloques.desayuno.carbohidratos = 99;
    expect(objetivosDelDia(d).carbohidratos).toBe(8);
  });
});

describe('consumido y restante', () => {
  const diaCompleto = () =>
    dia('2026-08-08', 'A', [
      plato('desayuno', [
        ingrediente('ch-avena-copos', 60),
        ingrediente('p1-claras-huevo', 160),
        ingrediente('gr-frutos-secos', 20),
      ]),
      plato('comida', [
        ingrediente('ch-arroz', 60),
        ingrediente('p1-pollo-pechuga', 120),
        ingrediente('vd-lechuga', 225),
        ingrediente('gr-aceites', 10),
        { alimentoId: 'fr-manzana', gramos: 160, bloques: 1 },
      ]),
      plato('cena', [
        ingrediente('ch-patata', 200),
        ingrediente('p1-pescado-blanco', 120),
        ingrediente('vd-calabacin', 225),
        ingrediente('gr-aceites', 10),
        { alimentoId: 'fr-kiwi', gramos: 125, bloques: 1 },
      ]),
    ]);

  it('suma el consumido de todo el día', () => {
    const c = consumidoDelDia(diaCompleto(), ALIMENTOS);
    expect(c.carbohidratos).toBe(8);
    expect(c.proteicos1).toBe(9);
    expect(c.verduras).toBe(3);
    expect(c.frutas).toBe(2);
    expect(c.grasas).toBe(6.5);
  });

  it('suma el consumido de una comida concreta', () => {
    const c = consumidoDeComida(diaCompleto(), 'desayuno', ALIMENTOS);
    expect(c.carbohidratos).toBe(3);
    expect(c.proteicos1).toBe(2);
    expect(c.grasas).toBe(2.5);
  });

  it('el restante es negativo cuando hay exceso', () => {
    const d = dia('2026-08-08', 'A', [plato('comida', [ingrediente('ch-arroz', 200)])]);
    expect(restanteDelDia(d, ALIMENTOS).carbohidratos).toBe(-2);
  });

  it('un día vacío tiene restante igual al objetivo', () => {
    expect(restanteDelDia(dia('2026-08-08', 'A', []), ALIMENTOS).proteicos1).toBe(9);
  });
});

describe('estadoDelDia', () => {
  const diaPerfecto = (fecha: string) =>
    dia(fecha, 'A', [
      plato('desayuno', [
        ingrediente('ch-arroz', 160),
        ingrediente('p1-pollo-pechuga', 270),
        ingrediente('gr-aceites', 32.5),
        ingrediente('vd-lechuga', 450),
        { alimentoId: 'fr-manzana', gramos: 320, bloques: 2 },
      ]),
    ]);

  it('un día sin platos es sin_datos', () => {
    expect(estadoDelDia(dia('2026-08-08', 'A', []), ALIMENTOS, 0.5)).toBe('sin_datos');
  });

  it('un día que cuadra en todos los grupos es cumplido', () => {
    expect(estadoDelDia(diaPerfecto('2026-08-08'), ALIMENTOS, 0.5)).toBe('cumplido');
  });

  it('con un grupo fuera de tolerancia es parcial', () => {
    const d = diaPerfecto('2026-08-08');
    d.platos[0].ingredientes.push(ingrediente('ch-arroz', 40));
    expect(estadoDelDia(d, ALIMENTOS, 0.5)).toBe('parcial');
  });

  it('con tres grupos fuera de tolerancia es incumplido', () => {
    const d = dia('2026-08-08', 'A', [plato('comida', [ingrediente('ch-arroz', 20)])]);
    expect(estadoDelDia(d, ALIMENTOS, 0.5)).toBe('incumplido');
  });

  it('respeta la tolerancia configurada', () => {
    const d = diaPerfecto('2026-08-08');
    d.platos[0].ingredientes.push(ingrediente('ch-arroz', 14)); // +0.7 CH
    expect(estadoDelDia(d, ALIMENTOS, 0.5)).toBe('parcial');
    expect(estadoDelDia(d, ALIMENTOS, 1)).toBe('cumplido');
  });

  it('los grupos con objetivo 0 no se evalúan', () => {
    const d = diaPerfecto('2026-08-08');
    expect(objetivosDelDia(d).proteicos2).toBe(0);
    expect(estadoDelDia(d, ALIMENTOS, 0.5)).toBe('cumplido');
  });
});

describe('calcularRacha', () => {
  const cumplido = (fecha: string): DiaRegistro =>
    dia(fecha, 'A', [
      plato('desayuno', [
        ingrediente('ch-arroz', 160),
        ingrediente('p1-pollo-pechuga', 270),
        ingrediente('gr-aceites', 32.5),
        ingrediente('vd-lechuga', 450),
        { alimentoId: 'fr-manzana', gramos: 320, bloques: 2 },
      ]),
    ]);

  const fallido = (fecha: string): DiaRegistro =>
    dia(fecha, 'A', [plato('comida', [ingrediente('ch-arroz', 20)])]);

  const ajustes = { toleranciaBloques: 0.5 };

  it('sin días la racha es 0', () => {
    expect(calcularRacha({}, ajustes, ALIMENTOS, '2026-08-08')).toEqual({ actual: 0, mejor: 0 });
  });

  it('cuenta días consecutivos hasta hoy', () => {
    const dias = {
      '2026-08-06': cumplido('2026-08-06'),
      '2026-08-07': cumplido('2026-08-07'),
      '2026-08-08': cumplido('2026-08-08'),
    };
    expect(calcularRacha(dias, ajustes, ALIMENTOS, '2026-08-08')).toEqual({ actual: 3, mejor: 3 });
  });

  it('un hueco en el calendario rompe la racha', () => {
    const dias = {
      '2026-08-04': cumplido('2026-08-04'),
      '2026-08-06': cumplido('2026-08-06'),
      '2026-08-07': cumplido('2026-08-07'),
    };
    const r = calcularRacha(dias, ajustes, ALIMENTOS, '2026-08-07');
    expect(r.actual).toBe(2);
    expect(r.mejor).toBe(2);
  });

  it('hoy sin cumplir todavía no rompe la racha de días anteriores', () => {
    const dias = {
      '2026-08-06': cumplido('2026-08-06'),
      '2026-08-07': cumplido('2026-08-07'),
      '2026-08-08': fallido('2026-08-08'),
    };
    expect(calcularRacha(dias, ajustes, ALIMENTOS, '2026-08-08').actual).toBe(2);
  });

  it('recuerda la mejor racha histórica aunque la actual sea menor', () => {
    const dias: Record<string, DiaRegistro> = {};
    for (const f of ['2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04']) dias[f] = cumplido(f);
    dias['2026-07-05'] = fallido('2026-07-05');
    dias['2026-07-06'] = cumplido('2026-07-06');
    const r = calcularRacha(dias, ajustes, ALIMENTOS, '2026-07-06');
    expect(r.mejor).toBe(4);
    expect(r.actual).toBe(1);
  });
});

describe('búsqueda de alimentos', () => {
  it('normaliza acentos y mayúsculas', () => {
    expect(normalizar('PLÁTANO')).toBe('platano');
    expect(normalizar('  Berenjena ')).toBe('berenjena');
  });

  it('CRITERIO 5 — encuentra "platano", "Plátano", "PLATANO" y "berenj"', () => {
    for (const consulta of ['platano', 'Plátano', 'PLATANO', 'plátano']) {
      const r = buscarAlimentos(ALIMENTOS, consulta);
      expect(r[0]?.id).toBe('fr-platano');
    }
    expect(buscarAlimentos(ALIMENTOS, 'berenj')[0]?.id).toBe('vd-berenjena');
  });

  it('busca también en la descripción', () => {
    const r = buscarAlimentos(ALIMENTOS, 'corn flakes');
    expect(r.some((a) => a.id === 'ch-cereales-maiz')).toBe(true);
  });

  it('filtra por grupo', () => {
    const r = buscarAlimentos(ALIMENTOS, 'queso', { grupos: ['grasas'] });
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((a) => a.grupo === 'grasas')).toBe(true);
  });

  it('devuelve todo el catálogo con la consulta vacía', () => {
    expect(buscarAlimentos(ALIMENTOS, '')).toHaveLength(ALIMENTOS.length);
  });
});

describe('integridad del catálogo', () => {
  it('todos los ids son únicos', () => {
    const ids = new Set(ALIMENTOS.map((a) => a.id));
    expect(ids.size).toBe(ALIMENTOS.length);
  });

  it('todos los alimentos tienen un gramaje por bloque positivo', () => {
    expect(ALIMENTOS.every((a) => a.gramosPorBloque > 0)).toBe(true);
  });

  it('solo las legumbres del grupo carbohidratos tienen doble cómputo', () => {
    const dobles = ALIMENTOS.filter((a) => a.dobleComputo);
    expect(dobles).toHaveLength(4);
    expect(dobles.every((a) => a.grupo === 'carbohidratos')).toBe(true);
  });

  it('todas las frutas declaran su categoría', () => {
    const frutas = ALIMENTOS.filter((a) => a.grupo === 'frutas');
    expect(frutas.every((a) => a.categoriaFruta !== undefined)).toBe(true);
    for (const categoria of ['muy_grande', 'grande', 'mediana', 'pequena'] as const) {
      expect(frutas.some((a) => a.categoriaFruta === categoria && a.nombre.startsWith('Otra'))).toBe(
        true,
      );
    }
  });
});
