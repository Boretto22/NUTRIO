import type { ComidaDef, EstructuraPlan } from '@/types';

export const COMIDAS_SEED: ComidaDef[] = [
  { id: 'desayuno', nombre: 'Desayuno', orden: 1 },
  { id: 'comida', nombre: 'Comida', orden: 2 },
  { id: 'cena', nombre: 'Cena', orden: 3 },
];

/** Comida especial siempre disponible para registrar platos fuera de plan. */
export const COMIDA_EXTRA: ComidaDef = { id: 'extra', nombre: 'Extra', orden: 99 };

const PLAN_A: EstructuraPlan = {
  id: 'A',
  nombre: 'Tipo A',
  descripcion: 'Solo proteína magra, más bloques de grasa',
  comidas: COMIDAS_SEED,
  bloques: {
    desayuno: { carbohidratos: 3, proteicos1: 2, grasas: 2.5 },
    comida: { carbohidratos: 3, proteicos1: 4, grasas: 2, verduras: 1.5, frutas: 1 },
    cena: { carbohidratos: 2, proteicos1: 3, grasas: 2, verduras: 1.5, frutas: 1 },
  },
  lecheSemiMl: 200,
};

const PLAN_B: EstructuraPlan = {
  id: 'B',
  nombre: 'Tipo B',
  descripcion: 'Proteína magra + proteína grasa, menos bloques de grasa',
  comidas: COMIDAS_SEED,
  bloques: {
    desayuno: { carbohidratos: 3, proteicos1: 2, grasas: 1.5 },
    comida: { carbohidratos: 3, proteicos1: 4, grasas: 2, verduras: 1.5, frutas: 1 },
    cena: { carbohidratos: 2, proteicos2: 3, grasas: 2, verduras: 1.5, frutas: 1 },
  },
  lecheSemiMl: 200,
};

export function planSeed(): { A: EstructuraPlan; B: EstructuraPlan } {
  return clonar({ A: PLAN_A, B: PLAN_B });
}

export function clonar<T>(valor: T): T {
  return JSON.parse(JSON.stringify(valor)) as T;
}
