import type { Alimento, Ingrediente } from '@/types';

type ResolverAlimento = Record<string, Alimento> | ((id: string) => Alimento | undefined);

function resolver(fuente: ResolverAlimento): (id: string) => Alimento | undefined {
  return typeof fuente === 'function' ? fuente : (id) => fuente[id];
}

/**
 * Nombre sugerido a partir de los ingredientes con más bloques.
 * 'Pollo y arroz', 'Merluza, patata y aceite'…
 */
export function nombreAutomatico(
  ingredientes: Ingrediente[],
  alimentos: ResolverAlimento,
  maximo = 3,
): string {
  const get = resolver(alimentos);

  const nombres: string[] = [];
  for (const ing of [...ingredientes].sort((a, b) => b.bloques - a.bloques)) {
    const alimento = get(ing.alimentoId);
    if (!alimento) continue;
    const nombre = alimento.nombre.trim();
    if (!nombres.some((n) => n.toLowerCase() === nombre.toLowerCase())) nombres.push(nombre);
    if (nombres.length === maximo) break;
  }

  if (nombres.length === 0) return '';

  const [primero, ...resto] = nombres;
  const capitalizado = primero.charAt(0).toUpperCase() + primero.slice(1);
  const enMinuscula = resto.map((n) => n.charAt(0).toLowerCase() + n.slice(1));

  if (enMinuscula.length === 0) return capitalizado;
  if (enMinuscula.length === 1) return `${capitalizado} y ${enMinuscula[0]}`;
  return `${capitalizado}, ${enMinuscula.slice(0, -1).join(', ')} y ${enMinuscula[enMinuscula.length - 1]}`;
}
