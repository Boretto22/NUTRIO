export interface SeccionInstrucciones {
  titulo: string;
  puntos: string[];
}

export const INSTRUCCIONES: SeccionInstrucciones[] = [
  {
    titulo: 'Qué es un bloque',
    puntos: [
      'Un bloque es una unidad de medida nutricional. Cada alimento tiene su equivalencia en gramos (la columna «x1» de las tablas).',
      'Tu plan te asigna un número de bloques de cada grupo para cada comida del día.',
      'Ejemplo: si 1 bloque de arroz son 20 g y necesitas 3 bloques, pesa 60 g de arroz.',
    ],
  },
  {
    titulo: 'Intercambio de alimentos',
    puntos: [
      'Los alimentos solo se intercambian dentro de su mismo grupo.',
      'Puedes cambiar 2 bloques de arroz por 2 bloques de patata, pero no por 2 bloques de pollo.',
      'Dentro de una misma comida puedes combinar varios alimentos del mismo grupo mientras sumen los bloques indicados.',
    ],
  },
  {
    titulo: 'Mover bloques entre comidas',
    puntos: [
      'Lo importante es cumplir el total diario de cada grupo.',
      'Si un día desayunas menos, puedes recuperar esos bloques en la comida o en la cena.',
      'Lo que no debes hacer es mezclar la estructura A y la B dentro del mismo día.',
    ],
  },
  {
    titulo: 'Legumbres: doble cómputo',
    puntos: [
      'Las legumbres y las pastas de legumbre restan a la vez de Carbohidratos y de Alimentos Proteicos I.',
      '60 g de legumbre cruda (1 bloque = 30 g) son 2 bloques de CH y 2 bloques de Proteicos I.',
      'Por eso son un plato completo por sí solas: ya llevan su ración de proteína.',
    ],
  },
  {
    titulo: 'Crudo o cocido',
    puntos: [
      'Todas las cantidades de las tablas están en gramos y en crudo.',
      'Si pesas el alimento ya cocinado, divide entre el factor: arroz ×3, pasta ×2,5, legumbres ×2,8, carne roja ×0,7, carne blanca ×0,75, pescado ×0,85.',
      'Ejemplo: 300 g de arroz cocido ÷ 3 = 100 g de arroz crudo = 5 bloques.',
      'La app tiene una calculadora de conversión en el formulario de nueva comida y en la ficha de cada alimento.',
    ],
  },
  {
    titulo: 'Aceite en cocciones y aliños',
    puntos: [
      'Para plancha o aliño usa 5 g (1 cucharada) de AOVE = 1 bloque de grasas.',
      'El aceite que usas para cocinar cuenta igual que el que echas en crudo: contabilízalo siempre.',
    ],
  },
  {
    titulo: 'Huevos',
    puntos: [
      '1 huevo completo de talla M/L (≈ 60 g) equivale a 1 bloque de Alimentos Proteicos II.',
      'Las claras pasteurizadas van en Proteicos I: 80 g = 1 bloque.',
    ],
  },
  {
    titulo: 'Lácteos del plan',
    puntos: [
      'Tienes 200 ml de leche semidesnatada al día («1 vaso») para los cafés. No cuenta como bloques.',
      'Puedes tomar un yogur natural bifidus de 125 g al día. Ese día se descuentan 0,5 bloques de CH, 0,5 de Proteicos I y 0,5 de Grasas del total diario.',
    ],
  },
  {
    titulo: 'Verduras y hortalizas',
    puntos: [
      'Puedes consumirlas en ensaladas, salteadas, sopas o cremas.',
      'Son el grupo con más margen: úsalas para dar volumen y saciedad al plato.',
    ],
  },
  {
    titulo: 'Frutas',
    puntos: [
      '1 bloque de fruta = 1 porción.',
      'Pieza muy grande (melón, sandía, piña): 1 bloque = corte de 120–200 g. Conviene pesar.',
      'Pieza grande (pera, manzana, plátano, kiwi grande, naranja, melocotón): 1 bloque = 1 unidad.',
      'Pieza mediana (mandarina, kiwi, peras baby): 1 bloque = 2 unidades.',
      'Pieza pequeña (fresas, frambuesas, cerezas, arándanos, lichis, uva): 1 bloque = 100–120 g. Conviene pesar.',
    ],
  },
  {
    titulo: 'Hábitos que acompañan al plan',
    puntos: [
      'Hidratación: 2–3 litros de agua al día.',
      'Movimiento: mínimo 7.000 pasos diarios.',
      'Haz la última comida entre 1 h 30 min y 2 h antes de acostarte.',
      'Evita la cafeína a partir de las 16:00–17:00 h.',
    ],
  },
];
