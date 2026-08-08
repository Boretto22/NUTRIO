import type { Alimento, GrupoId } from '@/types';

/** Minúsculas y sin acentos, para búsquedas tolerantes. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function indice(a: Alimento): string {
  return normalizar(`${a.nombre} ${a.descripcion ?? ''} ${a.notas ?? ''}`);
}

const CACHE = new WeakMap<Alimento, string>();

function indiceCacheado(a: Alimento): string {
  let v = CACHE.get(a);
  if (v === undefined) {
    v = indice(a);
    CACHE.set(a, v);
  }
  return v;
}

export interface OpcionesBusqueda {
  grupos?: GrupoId[];
  limite?: number;
}

/**
 * Coincidencia parcial sobre nombre + descripción. Todos los términos de la
 * consulta deben aparecer (en cualquier orden).
 */
export function buscarAlimentos(
  alimentos: Alimento[],
  consulta: string,
  opciones: OpcionesBusqueda = {},
): Alimento[] {
  const { grupos, limite } = opciones;
  const terminos = normalizar(consulta).split(/\s+/).filter(Boolean);

  let resultado = alimentos;
  if (grupos && grupos.length > 0) {
    resultado = resultado.filter((a) => grupos.includes(a.grupo));
  }

  if (terminos.length > 0) {
    resultado = resultado
      .map((a) => {
        const texto = indiceCacheado(a);
        if (!terminos.every((t) => texto.includes(t))) return null;
        const nombre = normalizar(a.nombre);
        // Prioriza: empieza por el término > el nombre lo contiene > el resto.
        let puntos = 0;
        if (nombre.startsWith(terminos[0])) puntos += 100;
        else if (nombre.includes(terminos[0])) puntos += 50;
        puntos -= nombre.length * 0.1;
        return { a, puntos };
      })
      .filter((x): x is { a: Alimento; puntos: number } => x !== null)
      .sort((x, y) => y.puntos - x.puntos)
      .map((x) => x.a);
  }

  return limite ? resultado.slice(0, limite) : resultado;
}
