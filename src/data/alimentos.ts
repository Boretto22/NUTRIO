import type { Alimento } from '@/types';

/**
 * Todas las cantidades están expresadas en GRAMOS y en CRUDO.
 * `gramosPorBloque` corresponde a la columna "x1" de las tablas del nutricionista.
 */

const CARBOHIDRATOS: Alimento[] = [
  { id: 'ch-arroz', nombre: 'Arroz', descripcion: 'Blanco, integral, harina, cremas, noodles', grupo: 'carbohidratos', gramosPorBloque: 20 },
  { id: 'ch-avena-copos', nombre: 'Avena', descripcion: 'Copos, harinas, molida', grupo: 'carbohidratos', gramosPorBloque: 20 },
  { id: 'ch-avena-cereales', nombre: 'Avena', descripcion: 'Cereales', grupo: 'carbohidratos', gramosPorBloque: 18 },
  { id: 'ch-azucar', nombre: 'Azúcar', descripcion: 'Blanco, moreno', grupo: 'carbohidratos', gramosPorBloque: 10 },
  { id: 'ch-bebida-almendras', nombre: 'Bebida vegetal', descripcion: 'Almendras', grupo: 'carbohidratos', gramosPorBloque: 220, unidad: 'ml' },
  { id: 'ch-bebida-arroz', nombre: 'Bebida vegetal', descripcion: 'Arroz', grupo: 'carbohidratos', gramosPorBloque: 150, unidad: 'ml' },
  { id: 'ch-bebida-arroz-sa', nombre: 'Bebida vegetal', descripcion: 'Arroz s/azúcar', grupo: 'carbohidratos', gramosPorBloque: 175, unidad: 'ml' },
  { id: 'ch-bebida-arroz-coco', nombre: 'Bebida vegetal', descripcion: 'Arroz + coco', grupo: 'carbohidratos', gramosPorBloque: 125, unidad: 'ml' },
  { id: 'ch-bebida-avena', nombre: 'Bebida vegetal', descripcion: 'Avena / Avena s/azúcar', grupo: 'carbohidratos', gramosPorBloque: 160, unidad: 'ml' },
  { id: 'ch-bebida-coco', nombre: 'Bebida vegetal', descripcion: 'Coco', grupo: 'carbohidratos', gramosPorBloque: 330, unidad: 'ml' },
  { id: 'ch-boniato', nombre: 'Boniato', grupo: 'carbohidratos', gramosPorBloque: 70 },
  { id: 'ch-castanas', nombre: 'Castañas', grupo: 'carbohidratos', gramosPorBloque: 40 },
  { id: 'ch-cereales-maiz', nombre: 'Cereales maíz', descripcion: 'Copos, Corn Flakes', grupo: 'carbohidratos', gramosPorBloque: 18 },
  { id: 'ch-cereales-fibra', nombre: 'Cereales fibra', descripcion: 'All Bran, Fibra sticks', grupo: 'carbohidratos', gramosPorBloque: 25 },
  { id: 'ch-cereales-trigo', nombre: 'Cereales trigo', descripcion: 'Trigo hinchado', grupo: 'carbohidratos', gramosPorBloque: 20 },
  { id: 'ch-gofio', nombre: 'Gofio', descripcion: 'Canario tostado', grupo: 'carbohidratos', gramosPorBloque: 20 },
  { id: 'ch-cacao-polvo', nombre: 'Cacao en polvo', descripcion: 'Colacao 0% s/azúcar', grupo: 'carbohidratos', gramosPorBloque: 15 },
  { id: 'ch-cuscus', nombre: 'Cuscús', grupo: 'carbohidratos', gramosPorBloque: 20 },
  { id: 'ch-gnocchi', nombre: 'Gnocchi', descripcion: 'De patata', grupo: 'carbohidratos', gramosPorBloque: 40 },
  { id: 'ch-granola', nombre: 'Granola', grupo: 'carbohidratos', gramosPorBloque: 15 },
  { id: 'ch-maiz', nombre: 'Maíz', descripcion: 'Hervido en lata', grupo: 'carbohidratos', gramosPorBloque: 80 },
  { id: 'ch-mermelada', nombre: 'Mermelada', descripcion: 'De frutas', grupo: 'carbohidratos', gramosPorBloque: 35 },
  { id: 'ch-mermelada-light', nombre: 'Mermelada', descripcion: 'De frutas light', grupo: 'carbohidratos', gramosPorBloque: 150 },
  { id: 'ch-miel', nombre: 'Miel', grupo: 'carbohidratos', gramosPorBloque: 20 },
  { id: 'ch-muesli', nombre: 'Muesli', grupo: 'carbohidratos', gramosPorBloque: 16 },
  { id: 'ch-tortitas', nombre: 'Tortitas', descripcion: 'Arroz, maíz', grupo: 'carbohidratos', gramosPorBloque: 18 },
  { id: 'ch-trigo', nombre: 'Trigo', descripcion: 'Fajitas, harinas, molida, masa madre', grupo: 'carbohidratos', gramosPorBloque: 20 },
  { id: 'ch-pan-barra', nombre: 'Pan', descripcion: 'Barra: blanco, integral, cereales…', grupo: 'carbohidratos', gramosPorBloque: 26 },
  { id: 'ch-pan-molde', nombre: 'Pan', descripcion: 'Molde: blanco, integral, multicereal…', grupo: 'carbohidratos', gramosPorBloque: 30 },
  { id: 'ch-pan-semillas', nombre: 'Pan', descripcion: 'Semillas', grupo: 'carbohidratos', gramosPorBloque: 18 },
  { id: 'ch-pan-centeno', nombre: 'Pan', descripcion: 'Centeno', grupo: 'carbohidratos', gramosPorBloque: 30 },
  { id: 'ch-pan-rallado', nombre: 'Pan', descripcion: 'Rallado, tostado en biscotes, Wasa', grupo: 'carbohidratos', gramosPorBloque: 20 },
  { id: 'ch-pasta', nombre: 'Pasta', descripcion: 'Blanca, integral', grupo: 'carbohidratos', gramosPorBloque: 20 },
  { id: 'ch-pasta-huevo', nombre: 'Pasta', descripcion: 'Al huevo', grupo: 'carbohidratos', gramosPorBloque: 18 },
  { id: 'ch-patata', nombre: 'Patata', grupo: 'carbohidratos', gramosPorBloque: 100 },
  { id: 'ch-quinoa', nombre: 'Quinoa', grupo: 'carbohidratos', gramosPorBloque: 20 },
  { id: 'ch-legumbre-cruda', nombre: 'Legumbre cruda', descripcion: 'Garbanzo, lenteja, judía', grupo: 'carbohidratos', gramosPorBloque: 30, dobleComputo: true },
  { id: 'ch-legumbre-cocida', nombre: 'Legumbre cocida', descripcion: 'Garbanzo, lenteja, judía', grupo: 'carbohidratos', gramosPorBloque: 85, dobleComputo: true },
  { id: 'ch-pasta-lenteja-roja', nombre: 'Pasta de lenteja roja', grupo: 'carbohidratos', gramosPorBloque: 28, dobleComputo: true },
  { id: 'ch-pasta-garbanzo', nombre: 'Pasta de garbanzo', grupo: 'carbohidratos', gramosPorBloque: 25, dobleComputo: true },
];

const PROTEICOS_1: Alimento[] = [
  { id: 'p1-cerdo-lomo-embuchado', nombre: 'Cerdo', descripcion: 'Lomo embuchado', grupo: 'proteicos1', gramosPorBloque: 20 },
  { id: 'p1-cerdo-lomo-magro', nombre: 'Cerdo', descripcion: 'Lomo de cerdo magro', grupo: 'proteicos1', gramosPorBloque: 30 },
  { id: 'p1-claras-huevo', nombre: 'Claras de huevo', descripcion: 'Pasteurizada', grupo: 'proteicos1', gramosPorBloque: 80 },
  { id: 'p1-atun-natural', nombre: 'Conservas: Atún', descripcion: 'Al natural', grupo: 'proteicos1', gramosPorBloque: 40 },
  { id: 'p1-salmon-natural', nombre: 'Conservas: Salmón', descripcion: 'Al natural', grupo: 'proteicos1', gramosPorBloque: 25 },
  { id: 'p1-heura', nombre: 'Heura', grupo: 'proteicos1', gramosPorBloque: 35 },
  { id: 'p1-jamon-cocido', nombre: 'Jamón cocido', descripcion: 'Magro / York', grupo: 'proteicos1', gramosPorBloque: 30 },
  { id: 'p1-marisco-gamba', nombre: 'Marisco', descripcion: 'Gamba, langostino, langosta, cigala, pulpo, calamar', grupo: 'proteicos1', gramosPorBloque: 40 },
  { id: 'p1-marisco-almeja', nombre: 'Marisco', descripcion: 'Almejas, berberechos, cangrejo, ostras, vieira', grupo: 'proteicos1', gramosPorBloque: 50 },
  { id: 'p1-pavo', nombre: 'Pavo', descripcion: 'Muslo s/piel, fiambre de pavo', grupo: 'proteicos1', gramosPorBloque: 30 },
  { id: 'p1-pollo-pechuga', nombre: 'Pollo', descripcion: 'Pechuga s/piel, fiambre de pollo', grupo: 'proteicos1', gramosPorBloque: 30 },
  { id: 'p1-pescado-blanco', nombre: 'Pescado blanco', descripcion: 'Merluza, lubina, gallo, bacalao, dorada', grupo: 'proteicos1', gramosPorBloque: 40 },
  { id: 'p1-rape', nombre: 'Pescado blanco', descripcion: 'Rape', grupo: 'proteicos1', gramosPorBloque: 45 },
  { id: 'p1-proteina-isolate', nombre: 'Proteína en polvo', descripcion: 'Isolate', grupo: 'proteicos1', gramosPorBloque: 10 },
  { id: 'p1-proteina-whey', nombre: 'Proteína en polvo', descripcion: 'Whey', grupo: 'proteicos1', gramosPorBloque: 8 },
  { id: 'p1-queso-blanco-0', nombre: 'Queso blanco', descripcion: 'Desnatado 0%', grupo: 'proteicos1', gramosPorBloque: 80 },
  { id: 'p1-queso-fresco-batido', nombre: 'Queso fresco', descripcion: 'Batido 0%', grupo: 'proteicos1', gramosPorBloque: 80 },
  { id: 'p1-seitan', nombre: 'Seitán', grupo: 'proteicos1', gramosPorBloque: 30 },
  { id: 'p1-soja-texturizada', nombre: 'Soja texturizada', grupo: 'proteicos1', gramosPorBloque: 15 },
  { id: 'p1-ternera-magra', nombre: 'Ternera', descripcion: 'Corte limpio s/grasa: entrecot, solomillo', grupo: 'proteicos1', gramosPorBloque: 30 },
];

const PROTEICOS_2: Alimento[] = [
  { id: 'p2-bebida-soja', nombre: 'Bebida de soja', descripcion: 'S/azúcar', grupo: 'proteicos2', gramosPorBloque: 200, unidad: 'ml' },
  { id: 'p2-picada-cerdo', nombre: 'Carne picada', descripcion: 'Cerdo', grupo: 'proteicos2', gramosPorBloque: 35 },
  { id: 'p2-picada-pollo-pavo', nombre: 'Carne picada', descripcion: 'Pollo, pavo', grupo: 'proteicos2', gramosPorBloque: 50 },
  { id: 'p2-picada-ternera', nombre: 'Carne picada', descripcion: 'Ternera', grupo: 'proteicos2', gramosPorBloque: 40 },
  { id: 'p2-cerdo-chuletas', nombre: 'Cerdo', descripcion: 'Chuletas c/grasa', grupo: 'proteicos2', gramosPorBloque: 30 },
  { id: 'p2-cerdo-lomo-graso', nombre: 'Cerdo', descripcion: 'Lomo c/grasa', grupo: 'proteicos2', gramosPorBloque: 45 },
  { id: 'p2-conejo', nombre: 'Conejo', grupo: 'proteicos2', gramosPorBloque: 45 },
  { id: 'p2-anchoas', nombre: 'Conservas: Anchoas', grupo: 'proteicos2', gramosPorBloque: 40 },
  { id: 'p2-atun-aceite', nombre: 'Conservas: Atún', descripcion: 'En aceite de oliva', grupo: 'proteicos2', gramosPorBloque: 40 },
  { id: 'p2-sardinas-lata', nombre: 'Conservas: Sardinas', grupo: 'proteicos2', gramosPorBloque: 30 },
  { id: 'p2-cordero', nombre: 'Cordero', descripcion: 'S/grasa', grupo: 'proteicos2', gramosPorBloque: 30 },
  { id: 'p2-higado', nombre: 'Hígado', descripcion: 'Cordero, pollo', grupo: 'proteicos2', gramosPorBloque: 60 },
  {
    id: 'p2-huevo',
    nombre: 'Huevo completo',
    descripcion: 'Talla M/L ≈ 60 g/unidad',
    grupo: 'proteicos2',
    gramosPorBloque: 1,
    unidad: 'unidad',
    notas: '1 unidad = 1 bloque. Introduce el nº de huevos, no los gramos.',
  },
  { id: 'p2-jamon-serrano-limpio', nombre: 'Jamón serrano', descripcion: 'Corte limpio s/grasa', grupo: 'proteicos2', gramosPorBloque: 40 },
  { id: 'p2-jamon-serrano-graso', nombre: 'Jamón serrano', descripcion: 'Corte graso', grupo: 'proteicos2', gramosPorBloque: 30 },
  { id: 'p2-pato', nombre: 'Pato', descripcion: 'S/piel', grupo: 'proteicos2', gramosPorBloque: 45 },
  { id: 'p2-pescado-azul', nombre: 'Pescado azul fresco', descripcion: 'Atún, salmón, sardinas, caballa', grupo: 'proteicos2', gramosPorBloque: 60 },
  { id: 'p2-pollo-muslo', nombre: 'Pollo', descripcion: 'Muslo s/piel', grupo: 'proteicos2', gramosPorBloque: 45 },
  { id: 'p2-queso-cottage', nombre: 'Queso', descripcion: 'Cottage / Requesón', grupo: 'proteicos2', gramosPorBloque: 80 },
  { id: 'p2-mozzarella-light', nombre: 'Queso', descripcion: 'Mozzarella fresca light', grupo: 'proteicos2', gramosPorBloque: 48 },
  { id: 'p2-lonchas-tierno-light', nombre: 'Queso en lonchas', descripcion: 'Tierno light', grupo: 'proteicos2', gramosPorBloque: 25 },
  { id: 'p2-lonchas-havarti-light', nombre: 'Queso en lonchas', descripcion: 'Havarti light', grupo: 'proteicos2', gramosPorBloque: 28 },
  { id: 'p2-salmon-ahumado', nombre: 'Salmón', descripcion: 'Ahumado', grupo: 'proteicos2', gramosPorBloque: 35 },
  { id: 'p2-tempeh', nombre: 'Tempeh', grupo: 'proteicos2', gramosPorBloque: 40 },
  { id: 'p2-ternera-grasa', nombre: 'Ternera', descripcion: 'Corte graso: lomo, entrecot, costilla…', grupo: 'proteicos2', gramosPorBloque: 45 },
  { id: 'p2-tofu', nombre: 'Tofu', grupo: 'proteicos2', gramosPorBloque: 55 },
];

const GRASAS: Alimento[] = [
  { id: 'gr-aceites', nombre: 'Aceites', descripcion: 'Oliva virgen, maíz, soja, girasol, hígado de bacalao', grupo: 'grasas', gramosPorBloque: 5, notas: '1 cucharada ≈ 5 g = 1 bloque.' },
  { id: 'gr-aceituna-verde', nombre: 'Aceituna', descripcion: 'Verde', grupo: 'grasas', gramosPorBloque: 50 },
  { id: 'gr-aceituna-negra', nombre: 'Aceituna', descripcion: 'Negra', grupo: 'grasas', gramosPorBloque: 20 },
  { id: 'gr-aguacate', nombre: 'Aguacate', grupo: 'grasas', gramosPorBloque: 40 },
  { id: 'gr-alioli', nombre: 'Alioli', grupo: 'grasas', gramosPorBloque: 5 },
  { id: 'gr-bebida-coco-sa', nombre: 'Bebida vegetal', descripcion: 'Coco s/azúcar', grupo: 'grasas', gramosPorBloque: 300, unidad: 'ml' },
  { id: 'gr-bebida-almendras-sa', nombre: 'Bebida vegetal', descripcion: 'Almendras s/azúcar', grupo: 'grasas', gramosPorBloque: 250, unidad: 'ml' },
  { id: 'gr-cacao-desgrasado', nombre: 'Cacao desgrasado', descripcion: 'Puro 0%', grupo: 'grasas', gramosPorBloque: 15 },
  { id: 'gr-chocolate-85', nombre: 'Chocolate', descripcion: 'Negro 85%', grupo: 'grasas', gramosPorBloque: 10 },
  { id: 'gr-coco-fresco', nombre: 'Coco', descripcion: 'Fresco', grupo: 'grasas', gramosPorBloque: 15 },
  { id: 'gr-coco-seco', nombre: 'Coco', descripcion: 'Seco', grupo: 'grasas', gramosPorBloque: 8 },
  { id: 'gr-cremas-frutos-secos', nombre: 'Cremas', descripcion: 'De frutos secos', grupo: 'grasas', gramosPorBloque: 10 },
  { id: 'gr-frutos-secos', nombre: 'Frutos secos', grupo: 'grasas', gramosPorBloque: 8 },
  { id: 'gr-mantequilla', nombre: 'Mantequilla', grupo: 'grasas', gramosPorBloque: 5 },
  { id: 'gr-margarina-light', nombre: 'Margarina', descripcion: 'Light', grupo: 'grasas', gramosPorBloque: 10 },
  { id: 'gr-margarina-vegetal', nombre: 'Margarina', descripcion: 'Vegetal', grupo: 'grasas', gramosPorBloque: 5 },
  { id: 'gr-mayonesa', nombre: 'Mayonesa', descripcion: 'Comercial', grupo: 'grasas', gramosPorBloque: 5 },
  { id: 'gr-mayonesa-light', nombre: 'Mayonesa', descripcion: 'Light', grupo: 'grasas', gramosPorBloque: 15 },
  { id: 'gr-nata', nombre: 'Nata', descripcion: 'Líquida para cocinar', grupo: 'grasas', gramosPorBloque: 15 },
  { id: 'gr-queso-edam', nombre: 'Queso', descripcion: 'Edam lonchas', grupo: 'grasas', gramosPorBloque: 15 },
  { id: 'gr-queso-emmental', nombre: 'Queso', descripcion: 'Emmental rallado', grupo: 'grasas', gramosPorBloque: 12 },
  { id: 'gr-queso-feta', nombre: 'Queso', descripcion: 'Feta', grupo: 'grasas', gramosPorBloque: 18 },
  { id: 'gr-queso-gouda', nombre: 'Queso', descripcion: 'Gouda lonchas', grupo: 'grasas', gramosPorBloque: 12 },
  { id: 'gr-queso-havarti', nombre: 'Queso', descripcion: 'Havarti lonchas', grupo: 'grasas', gramosPorBloque: 12 },
  { id: 'gr-mozzarella-fresca', nombre: 'Queso', descripcion: 'Mozzarella fresca', grupo: 'grasas', gramosPorBloque: 25 },
  { id: 'gr-mozzarella-rallada', nombre: 'Queso', descripcion: 'Mozzarella rallada', grupo: 'grasas', gramosPorBloque: 18 },
  { id: 'gr-parmesano', nombre: 'Queso', descripcion: 'Parmesano rallado', grupo: 'grasas', gramosPorBloque: 12 },
  { id: 'gr-untar-light', nombre: 'Queso untar', descripcion: 'Light "tipo Philadelphia"', grupo: 'grasas', gramosPorBloque: 80 },
  { id: 'gr-untar', nombre: 'Queso untar', descripcion: '"Tipo Philadelphia"', grupo: 'grasas', gramosPorBloque: 40 },
  { id: 'gr-queso-polvo', nombre: 'Queso', descripcion: 'En polvo', grupo: 'grasas', gramosPorBloque: 20 },
  { id: 'gr-queso-4-quesos', nombre: 'Queso', descripcion: '4 quesos rallado', grupo: 'grasas', gramosPorBloque: 12 },
  { id: 'gr-salsa-pesto', nombre: 'Salsa', descripcion: 'Pesto', grupo: 'grasas', gramosPorBloque: 10 },
  { id: 'gr-salsa-trufa', nombre: 'Salsa', descripcion: 'Trufa', grupo: 'grasas', gramosPorBloque: 30 },
  { id: 'gr-salsa-queso', nombre: 'Salsa', descripcion: 'Queso', grupo: 'grasas', gramosPorBloque: 35 },
  { id: 'gr-semillas', nombre: 'Semillas', descripcion: 'Calabaza, chía, lino', grupo: 'grasas', gramosPorBloque: 10 },
  { id: 'gr-semillas-sesamo', nombre: 'Semillas', descripcion: 'Sésamo', grupo: 'grasas', gramosPorBloque: 8 },
];

const VERDURAS: Alimento[] = [
  { id: 'vd-acelga', nombre: 'Acelga', grupo: 'verduras', gramosPorBloque: 150 },
  { id: 'vd-alcachofas', nombre: 'Alcachofas', grupo: 'verduras', gramosPorBloque: 150 },
  { id: 'vd-apio', nombre: 'Apio', grupo: 'verduras', gramosPorBloque: 150 },
  { id: 'vd-berenjena', nombre: 'Berenjena', grupo: 'verduras', gramosPorBloque: 150 },
  { id: 'vd-brocoli', nombre: 'Brócoli', grupo: 'verduras', gramosPorBloque: 150 },
  { id: 'vd-calabacin', nombre: 'Calabacín', grupo: 'verduras', gramosPorBloque: 150 },
  { id: 'vd-calabaza', nombre: 'Calabaza', grupo: 'verduras', gramosPorBloque: 100 },
  { id: 'vd-cardo', nombre: 'Cardo', grupo: 'verduras', gramosPorBloque: 150 },
  { id: 'vd-cebolla', nombre: 'Cebolla', grupo: 'verduras', gramosPorBloque: 100 },
  { id: 'vd-champinones', nombre: 'Champiñones', grupo: 'verduras', gramosPorBloque: 100 },
  { id: 'vd-chirivia', nombre: 'Chirivía', grupo: 'verduras', gramosPorBloque: 50 },
  { id: 'vd-col-lombarda', nombre: 'Col lombarda', grupo: 'verduras', gramosPorBloque: 150 },
  { id: 'vd-col-repollo', nombre: 'Col repollo', grupo: 'verduras', gramosPorBloque: 150 },
  { id: 'vd-coles-bruselas', nombre: 'Coles de Bruselas', grupo: 'verduras', gramosPorBloque: 50 },
  { id: 'vd-coliflor', nombre: 'Coliflor', grupo: 'verduras', gramosPorBloque: 150 },
  { id: 'vd-coliflor-congelada', nombre: 'Coliflor congelada', grupo: 'verduras', gramosPorBloque: 150 },
  { id: 'vd-endibia', nombre: 'Endibia', grupo: 'verduras', gramosPorBloque: 150 },
  { id: 'vd-escarola', nombre: 'Escarola', grupo: 'verduras', gramosPorBloque: 150 },
  { id: 'vd-esparrago-blanco', nombre: 'Espárrago blanco en conserva', grupo: 'verduras', gramosPorBloque: 150 },
  { id: 'vd-esparrago-fresco', nombre: 'Espárrago fresco pelado', grupo: 'verduras', gramosPorBloque: 150 },
  { id: 'vd-espinacas', nombre: 'Espinacas', grupo: 'verduras', gramosPorBloque: 150 },
  { id: 'vd-guisante-congelado', nombre: 'Guisante congelado', grupo: 'verduras', gramosPorBloque: 50 },
  { id: 'vd-guisantes-conserva', nombre: 'Guisantes en conserva', grupo: 'verduras', gramosPorBloque: 50 },
  { id: 'vd-guisante-fresco', nombre: 'Guisante fresco', grupo: 'verduras', gramosPorBloque: 50 },
  { id: 'vd-judia-verde', nombre: 'Judía verde', descripcion: 'Conserva, congelada', grupo: 'verduras', gramosPorBloque: 150 },
  { id: 'vd-lechuga', nombre: 'Lechuga', grupo: 'verduras', gramosPorBloque: 150 },
  { id: 'vd-nabos', nombre: 'Nabos', grupo: 'verduras', gramosPorBloque: 150 },
  { id: 'vd-palmito', nombre: 'Palmito en conserva', grupo: 'verduras', gramosPorBloque: 50 },
  { id: 'vd-pepino', nombre: 'Pepino', grupo: 'verduras', gramosPorBloque: 150 },
  { id: 'vd-pimientos', nombre: 'Pimientos', descripcion: 'Verde, rojo, amarillo', grupo: 'verduras', gramosPorBloque: 150 },
  { id: 'vd-puerro', nombre: 'Puerro', grupo: 'verduras', gramosPorBloque: 150 },
  { id: 'vd-rabano', nombre: 'Rábano', grupo: 'verduras', gramosPorBloque: 150 },
  { id: 'vd-tomate-frito', nombre: 'Salsa de tomate frito', grupo: 'verduras', gramosPorBloque: 20 },
  { id: 'vd-tomate-triturado', nombre: 'Salsa de tomate triturado natural', grupo: 'verduras', gramosPorBloque: 150 },
  { id: 'vd-soja-germinada', nombre: 'Soja germinada en conserva', grupo: 'verduras', gramosPorBloque: 150 },
  { id: 'vd-tomate', nombre: 'Tomate', grupo: 'verduras', gramosPorBloque: 150 },
  { id: 'vd-zanahoria', nombre: 'Zanahoria', grupo: 'verduras', gramosPorBloque: 100 },
];

export const AYUDA_FRUTA: Record<
  NonNullable<Alimento['categoriaFruta']>,
  { titulo: string; equivalencia: string; pesar: boolean }
> = {
  muy_grande: {
    titulo: 'Pieza muy grande',
    equivalencia: '1 bloque = corte/rodaja de 120–200 g',
    pesar: true,
  },
  grande: {
    titulo: 'Pieza grande',
    equivalencia: '1 bloque = 1 unidad (120–200 g)',
    pesar: false,
  },
  mediana: {
    titulo: 'Pieza mediana',
    equivalencia: '1 bloque = 2 unidades (50–75 g/ud)',
    pesar: false,
  },
  pequena: {
    titulo: 'Pieza pequeña',
    equivalencia: '1 bloque = 100–120 g',
    pesar: true,
  },
};

/**
 * Las frutas se contabilizan en porciones: 1 bloque = 1 porción.
 * `gramosPorBloque` se fija al gramaje orientativo de referencia de cada categoría
 * únicamente para poder mostrar equivalencias; la UI pide bloques, no gramos.
 */
const FRUTAS: Alimento[] = [
  { id: 'fr-melon', nombre: 'Melón', grupo: 'frutas', gramosPorBloque: 160, unidad: 'porcion', categoriaFruta: 'muy_grande' },
  { id: 'fr-sandia', nombre: 'Sandía', grupo: 'frutas', gramosPorBloque: 160, unidad: 'porcion', categoriaFruta: 'muy_grande' },
  { id: 'fr-pina', nombre: 'Piña', grupo: 'frutas', gramosPorBloque: 160, unidad: 'porcion', categoriaFruta: 'muy_grande' },
  { id: 'fr-otra-muy-grande', nombre: 'Otra fruta muy grande', descripcion: 'Genérica: corte/rodaja de 120–200 g', grupo: 'frutas', gramosPorBloque: 160, unidad: 'porcion', categoriaFruta: 'muy_grande' },

  { id: 'fr-pera', nombre: 'Pera', grupo: 'frutas', gramosPorBloque: 160, unidad: 'porcion', categoriaFruta: 'grande' },
  { id: 'fr-manzana', nombre: 'Manzana', grupo: 'frutas', gramosPorBloque: 160, unidad: 'porcion', categoriaFruta: 'grande' },
  { id: 'fr-platano', nombre: 'Plátano', grupo: 'frutas', gramosPorBloque: 160, unidad: 'porcion', categoriaFruta: 'grande' },
  { id: 'fr-kiwi-grande', nombre: 'Kiwi grande', grupo: 'frutas', gramosPorBloque: 160, unidad: 'porcion', categoriaFruta: 'grande' },
  { id: 'fr-naranja', nombre: 'Naranja', grupo: 'frutas', gramosPorBloque: 160, unidad: 'porcion', categoriaFruta: 'grande' },
  { id: 'fr-melocoton', nombre: 'Melocotón', grupo: 'frutas', gramosPorBloque: 160, unidad: 'porcion', categoriaFruta: 'grande' },
  { id: 'fr-otra-grande', nombre: 'Otra fruta grande', descripcion: 'Genérica: 1 unidad de 120–200 g', grupo: 'frutas', gramosPorBloque: 160, unidad: 'porcion', categoriaFruta: 'grande' },

  { id: 'fr-mandarina', nombre: 'Mandarina', grupo: 'frutas', gramosPorBloque: 125, unidad: 'porcion', categoriaFruta: 'mediana' },
  { id: 'fr-kiwi', nombre: 'Kiwi', grupo: 'frutas', gramosPorBloque: 125, unidad: 'porcion', categoriaFruta: 'mediana' },
  { id: 'fr-pera-baby', nombre: 'Pera baby', grupo: 'frutas', gramosPorBloque: 125, unidad: 'porcion', categoriaFruta: 'mediana' },
  { id: 'fr-otra-mediana', nombre: 'Otra fruta mediana', descripcion: 'Genérica: 2 unidades de 50–75 g', grupo: 'frutas', gramosPorBloque: 125, unidad: 'porcion', categoriaFruta: 'mediana' },

  { id: 'fr-fresas', nombre: 'Fresas', grupo: 'frutas', gramosPorBloque: 110, unidad: 'porcion', categoriaFruta: 'pequena' },
  { id: 'fr-frambuesas', nombre: 'Frambuesas', grupo: 'frutas', gramosPorBloque: 110, unidad: 'porcion', categoriaFruta: 'pequena' },
  { id: 'fr-cerezas', nombre: 'Cerezas', grupo: 'frutas', gramosPorBloque: 110, unidad: 'porcion', categoriaFruta: 'pequena' },
  { id: 'fr-arandanos', nombre: 'Arándanos', grupo: 'frutas', gramosPorBloque: 110, unidad: 'porcion', categoriaFruta: 'pequena' },
  { id: 'fr-lichis', nombre: 'Lichis', grupo: 'frutas', gramosPorBloque: 110, unidad: 'porcion', categoriaFruta: 'pequena' },
  { id: 'fr-uva', nombre: 'Uva', grupo: 'frutas', gramosPorBloque: 110, unidad: 'porcion', categoriaFruta: 'pequena' },
  { id: 'fr-otra-pequena', nombre: 'Otra fruta pequeña', descripcion: 'Genérica: 100–120 g', grupo: 'frutas', gramosPorBloque: 110, unidad: 'porcion', categoriaFruta: 'pequena' },
];

export const ALIMENTOS: Alimento[] = [
  ...CARBOHIDRATOS,
  ...PROTEICOS_1,
  ...PROTEICOS_2,
  ...GRASAS,
  ...VERDURAS,
  ...FRUTAS,
];

export const ALIMENTOS_POR_ID: Record<string, Alimento> = Object.fromEntries(
  ALIMENTOS.map((a) => [a.id, a]),
);

export function getAlimento(id: string): Alimento | undefined {
  return ALIMENTOS_POR_ID[id];
}

/** Aceite de oliva virgen extra, usado por el atajo de cocinado/aliño. */
export const ID_ACEITE = 'gr-aceites';
/** Yogur natural bifidus: no es un alimento del catálogo, ajusta objetivos. */
export const YOGUR_AJUSTE = { carbohidratos: 0.5, proteicos1: 0.5, grasas: 0.5 } as const;
