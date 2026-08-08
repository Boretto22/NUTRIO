import type { GrupoId, GrupoMeta } from '@/types';

export const GRUPOS_ORDEN: GrupoId[] = [
  'carbohidratos',
  'proteicos1',
  'proteicos2',
  'grasas',
  'verduras',
  'frutas',
];

export const GRUPOS: Record<GrupoId, GrupoMeta> = {
  carbohidratos: {
    id: 'carbohidratos',
    nombre: 'Carbohidratos',
    nombreCorto: 'CH',
    color: '#E8A33D',
    bg: 'bg-[#E8A33D]',
    bgSuave: 'bg-[#E8A33D]/12',
    texto: 'text-[#B77A19] dark:text-[#F0BE73]',
    borde: 'border-[#E8A33D]/40',
  },
  proteicos1: {
    id: 'proteicos1',
    nombre: 'Alim. Proteicos I',
    nombreCorto: 'Prot I',
    color: '#F26D6D',
    bg: 'bg-[#F26D6D]',
    bgSuave: 'bg-[#F26D6D]/12',
    texto: 'text-[#D14A4A] dark:text-[#F79A9A]',
    borde: 'border-[#F26D6D]/40',
  },
  proteicos2: {
    id: 'proteicos2',
    nombre: 'Alim. Proteicos II',
    nombreCorto: 'Prot II',
    color: '#C0392B',
    bg: 'bg-[#C0392B]',
    bgSuave: 'bg-[#C0392B]/12',
    texto: 'text-[#A32E22] dark:text-[#E08379]',
    borde: 'border-[#C0392B]/40',
  },
  grasas: {
    id: 'grasas',
    nombre: 'Grasas',
    nombreCorto: 'Grasas',
    color: '#6B7280',
    bg: 'bg-[#6B7280]',
    bgSuave: 'bg-[#6B7280]/12',
    texto: 'text-[#4B5563] dark:text-[#A6ADBA]',
    borde: 'border-[#6B7280]/40',
  },
  verduras: {
    id: 'verduras',
    nombre: 'Verduras y hortalizas',
    nombreCorto: 'Verduras',
    color: '#27AE60',
    bg: 'bg-[#27AE60]',
    bgSuave: 'bg-[#27AE60]/12',
    texto: 'text-[#1F8C4D] dark:text-[#6FD09E]',
    borde: 'border-[#27AE60]/40',
  },
  frutas: {
    id: 'frutas',
    nombre: 'Frutas',
    nombreCorto: 'Frutas',
    color: '#8E44AD',
    bg: 'bg-[#8E44AD]',
    bgSuave: 'bg-[#8E44AD]/12',
    texto: 'text-[#7A3796] dark:text-[#C08FD6]',
    borde: 'border-[#8E44AD]/40',
  },
};

export const DESCRIPCION_GRUPO: Record<GrupoId, string> = {
  carbohidratos: 'Cereales, tubérculos, pan, legumbres y azúcares.',
  proteicos1: 'Proteína magra: pollo, pescado blanco, claras, lácteos 0%.',
  proteicos2: 'Proteína con grasa: huevo, pescado azul, quesos, carnes grasas.',
  grasas: 'Aceites, frutos secos, aguacate, quesos grasos y salsas.',
  verduras: 'Verduras y hortalizas. En ensalada, salteadas, sopas o cremas.',
  frutas: 'Frutas. 1 bloque = 1 porción.',
};

export function grupoMeta(id: GrupoId): GrupoMeta {
  return GRUPOS[id];
}
