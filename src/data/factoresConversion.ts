export interface FactorConversion {
  id: string;
  nombre: string;
  factor: number;
}

/**
 * gramosCrudo = gramosCocido / factor
 * gramosCocido = gramosCrudo * factor
 */
export const FACTORES: FactorConversion[] = [
  { id: 'arroz', nombre: 'Arroz', factor: 3 },
  { id: 'pasta', nombre: 'Pasta', factor: 2.5 },
  { id: 'legumbres', nombre: 'Legumbres', factor: 2.8 },
  { id: 'carne-roja', nombre: 'Carne roja', factor: 0.7 },
  { id: 'carne-blanca', nombre: 'Carne blanca', factor: 0.75 },
  { id: 'pescado', nombre: 'Pescado', factor: 0.85 },
];

/** Factor sugerido a partir del alimento seleccionado, si lo hay. */
export function factorSugerido(alimentoId: string): number | undefined {
  if (alimentoId === 'ch-arroz') return 3;
  if (alimentoId.startsWith('ch-pasta')) return 2.5;
  if (alimentoId.includes('legumbre')) return 2.8;
  if (['p1-ternera-magra', 'p2-ternera-grasa', 'p2-cordero', 'p2-picada-ternera'].includes(alimentoId))
    return 0.7;
  if (['p1-pollo-pechuga', 'p1-pavo', 'p2-pollo-muslo', 'p2-picada-pollo-pavo'].includes(alimentoId))
    return 0.75;
  if (alimentoId.includes('pescado') || alimentoId === 'p1-rape') return 0.85;
  return undefined;
}
