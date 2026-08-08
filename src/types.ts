export type GrupoId =
  | 'carbohidratos'
  | 'proteicos1'
  | 'proteicos2'
  | 'grasas'
  | 'verduras'
  | 'frutas';

export type CategoriaFruta = 'muy_grande' | 'grande' | 'mediana' | 'pequena';

export interface Alimento {
  id: string;
  nombre: string;
  descripcion?: string;
  grupo: GrupoId;
  gramosPorBloque: number;
  dobleComputo?: boolean;
  unidad?: 'g' | 'ml' | 'unidad' | 'porcion';
  categoriaFruta?: CategoriaFruta;
  notas?: string;
}

export interface ComidaDef {
  id: string;
  nombre: string;
  orden: number;
}

export interface EstructuraPlan {
  id: 'A' | 'B';
  nombre: string;
  descripcion: string;
  comidas: ComidaDef[];
  /** bloques[comidaId][grupoId] = nº de bloques */
  bloques: Record<string, Partial<Record<GrupoId, number>>>;
  lecheSemiMl: number;
}

export interface Ingrediente {
  alimentoId: string;
  /** SIEMPRE en crudo */
  gramos: number;
  bloques: number;
  pesadoEnCocido?: boolean;
  factorConversion?: number;
  gramosCocido?: number;
}

export interface Plato {
  id: string;
  nombre: string;
  comidaId: string;
  /** 'HH:mm' */
  hora: string;
  ingredientes: Ingrediente[];
  /** ISO */
  creadoEn: string;
  /** id del PlatoPlanificado del que proviene, si se confirmó desde el calendario */
  planificadoId?: string;
}

export interface DiaRegistro {
  /** 'YYYY-MM-DD' */
  fecha: string;
  planId: 'A' | 'B';
  /** inmutable: copia del plan en el momento de crear el día */
  objetivosSnapshot: EstructuraPlan;
  yogur: boolean;
  lecheMl: number;
  platos: Plato[];
  /** ids de planificados descartados o ya confirmados, para no re-sugerirlos */
  planificadosDescartados?: string[];
}

/* ---------- Planificación (calendario mensual de menús) ---------- */

/**
 * Un plato previsto para una fecha. NUNCA suma bloques por sí solo:
 * solo cuenta cuando se confirma y se convierte en un `Plato`.
 */
export interface PlatoPlanificado {
  id: string;
  nombre: string;
  comidaId: string;
  ingredientes: Ingrediente[];
  origenPlantillaId?: string;
  notas?: string;
}

export interface DiaPlanificado {
  /** 'YYYY-MM-DD' */
  fecha: string;
  planId?: 'A' | 'B';
  platos: PlatoPlanificado[];
}

export interface PlantillaMenu {
  id: string;
  nombre: string;
  planId?: 'A' | 'B';
  platos: PlatoPlanificado[];
  /** ISO */
  creadaEn: string;
}

/**
 * 'agenda'    → el calendario es solo referencia; nada aparece en Hoy salvo que se registre.
 * 'programar' → al llegar el día los platos aparecen en Hoy como pendientes de confirmar.
 */
export type ModoCalendario = 'agenda' | 'programar';

export interface Ajustes {
  toleranciaBloques: number;
  primerDiaSemana: 1 | 0;
  tema: 'claro' | 'oscuro' | 'sistema';
  modoCalendario: ModoCalendario;
}

export interface AppState {
  schemaVersion: number;
  perfil: { nombre: string };
  planes: { A: EstructuraPlan; B: EstructuraPlan };
  dias: Record<string, DiaRegistro>;
  planificacion: Record<string, DiaPlanificado>;
  plantillasMenu: PlantillaMenu[];
  platosFavoritos: Plato[];
  ajustes: Ajustes;
}

export type EstadoDia = 'cumplido' | 'parcial' | 'incumplido' | 'sin_datos';

export interface GrupoMeta {
  id: GrupoId;
  nombre: string;
  nombreCorto: string;
  color: string;
  /** clases tailwind pre-generadas (Tailwind necesita strings literales) */
  bg: string;
  bgSuave: string;
  texto: string;
  borde: string;
}
