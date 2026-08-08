/**
 * Genera todos los assets de marca de Nutrio a partir de `logo.png` (1024×1024).
 *
 * El original es un lockup monocromo: trazo verde sobre un crema con textura, sin
 * canal alfa. En vez de recortar el fondo por igualdad de color (imposible con ruido),
 * se extrae una MÁSCARA DE COBERTURA por luminancia y se rellena con el verde plano.
 * Así los trazos finos conservan su antialiasing, no queda halo crema y podemos emitir
 * la misma pieza en otro verde para el modo oscuro sin volver a tocar el original.
 *
 *   npm run icons
 */
import { Buffer } from 'node:buffer';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const ORIGEN = 'logo.png';
const DIR_BASE = 'assets-marca'; // piezas base auditables (fuera del bundle)
const DIR_APP = 'src/assets'; // lo que importa la interfaz
const DIR_PUBLICO = 'public'; // iconos servidos tal cual

/** Crema de fondo del tema. El original mide ~#F5F5F5; usamos el token del diseño. */
const CREMA = '#F4F4F1';
/** Verde para superficies oscuras: el de marca no se lee sobre negro. */
const VERDE_CLARO = '#4FB397';

/** Margen alrededor de la tinta, en proporción al lado mayor de la pieza. */
const MARGEN = { emblema: 0.08, wordmark: 0.06, lockup: 0.05 };

const hex = ([r, g, b]) =>
  '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
const aRgb = (h) => ({
  r: parseInt(h.slice(1, 3), 16),
  g: parseInt(h.slice(3, 5), 16),
  b: parseInt(h.slice(5, 7), 16),
});
const luminancia = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

for (const dir of [DIR_BASE, DIR_APP, DIR_PUBLICO]) mkdirSync(dir, { recursive: true });

// ---------------------------------------------------------------------------
// 1. Leer el original y construir el mapa de luminancia
// ---------------------------------------------------------------------------

const { data, info } = await sharp(ORIGEN)
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;

const lum = new Float32Array(W * H);
for (let i = 0, p = 0; p < W * H; p += 1, i += C) {
  lum[p] = luminancia(data[i], data[i + 1], data[i + 2]);
}

console.log(`Original: ${W}×${H}`);

// ---------------------------------------------------------------------------
// 2. Muestrear la paleta real
// ---------------------------------------------------------------------------

/** Color modal del núcleo del trazo: el verde de marca exacto, no el estimado. */
function muestrearVerde() {
  const cuenta = new Map();
  for (let p = 0; p < W * H; p += 1) {
    if (lum[p] > 135) continue;
    const i = p * C;
    // Cuantizar a pasos de 4 absorbe el ruido de la textura sin desplazar el tono.
    const k = [data[i], data[i + 1], data[i + 2]].map((v) => (v >> 2) << 2).join(',');
    cuenta.set(k, (cuenta.get(k) ?? 0) + 1);
  }
  const [mejor] = [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0];
  return mejor.split(',').map(Number);
}

const VERDE_MARCA_RGB = muestrearVerde();
const VERDE_MARCA = hex(VERDE_MARCA_RGB);

/**
 * Umbrales de la máscara. `alto` es la luminancia por encima de la cual todo es
 * fondo; se calcula desde el propio archivo para que la textura no deje neblina.
 */
function umbrales() {
  const fondo = [];
  for (let p = 0; p < W * H; p += 1) if (lum[p] > 200) fondo.push(lum[p]);
  fondo.sort((a, b) => a - b);
  const minimoFondo = fondo[Math.floor(fondo.length * 0.001)];
  return {
    alto: minimoFondo - 2,
    bajo: luminancia(...VERDE_MARCA_RGB) + 8,
  };
}

const { alto: L_FONDO, bajo: L_TINTA } = umbrales();

console.log(`Verde de marca muestreado: ${VERDE_MARCA}  ·  claro: ${VERDE_CLARO}`);
console.log(`Umbrales de máscara: fondo ≥ ${L_FONDO.toFixed(1)} · tinta ≤ ${L_TINTA.toFixed(1)}`);

// ---------------------------------------------------------------------------
// 3. Localizar las piezas base midiendo la tinta, no a ojo
// ---------------------------------------------------------------------------

const UMBRAL_BBOX = 200;

/** Bandas horizontales con tinta, separadas por el hueco entre emblema y texto. */
function bandasConTinta() {
  const bandas = [];
  let inicio = null;
  for (let y = 0; y < H; y += 1) {
    let n = 0;
    for (let x = 0; x < W; x += 1) if (lum[y * W + x] < UMBRAL_BBOX) n += 1;
    const hay = n > 2;
    if (hay && inicio === null) inicio = y;
    if (!hay && inicio !== null) {
      if (y - inicio > 8) bandas.push([inicio, y - 1]);
      inicio = null;
    }
  }
  if (inicio !== null && H - inicio > 8) bandas.push([inicio, H - 1]);
  return bandas;
}

function bbox(y0, y1) {
  let x0 = W;
  let x1 = 0;
  for (let y = y0; y <= y1; y += 1) {
    for (let x = 0; x < W; x += 1) {
      if (lum[y * W + x] >= UMBRAL_BBOX) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
    }
  }
  return { x0, y0, x1, y1, ancho: x1 - x0 + 1, alto: y1 - y0 + 1 };
}

const bandas = bandasConTinta();
if (bandas.length < 2) {
  throw new Error(
    `Se esperaban 2 bandas de tinta (emblema y wordmark) y se encontraron ${bandas.length}.`,
  );
}

const cajaEmblema = bbox(...bandas[0]);
const cajaWordmark = bbox(...bandas[bandas.length - 1]);
const cajaLockup = {
  x0: Math.min(cajaEmblema.x0, cajaWordmark.x0),
  y0: cajaEmblema.y0,
  x1: Math.max(cajaEmblema.x1, cajaWordmark.x1),
  y1: cajaWordmark.y1,
};
cajaLockup.ancho = cajaLockup.x1 - cajaLockup.x0 + 1;
cajaLockup.alto = cajaLockup.y1 - cajaLockup.y0 + 1;

/** Expande una caja a cuadrado (si se pide) y le añade margen, sin salirse del lienzo. */
function conMargen(caja, margen, cuadrada) {
  const cx = (caja.x0 + caja.x1) / 2;
  const cy = (caja.y0 + caja.y1) / 2;
  let ancho = caja.ancho;
  let alto = caja.alto;
  if (cuadrada) ancho = alto = Math.max(ancho, alto);
  const pad = Math.max(ancho, alto) * margen;
  ancho += pad * 2;
  alto += pad * 2;
  const left = Math.round(cx - ancho / 2);
  const top = Math.round(cy - alto / 2);
  return {
    left: Math.max(0, left),
    top: Math.max(0, top),
    width: Math.min(W - Math.max(0, left), Math.round(ancho)),
    height: Math.min(H - Math.max(0, top), Math.round(alto)),
  };
}

const REGIONES = {
  emblema: conMargen(cajaEmblema, MARGEN.emblema, true),
  wordmark: conMargen(cajaWordmark, MARGEN.wordmark, false),
  lockup: conMargen(cajaLockup, MARGEN.lockup, false),
};

console.log('\nPiezas base (tinta medida → recorte con margen):');
for (const [nombre, r] of Object.entries(REGIONES)) {
  const caja = { emblema: cajaEmblema, wordmark: cajaWordmark, lockup: cajaLockup }[nombre];
  console.log(
    `  ${nombre.padEnd(9)} tinta x ${caja.x0}–${caja.x1} y ${caja.y0}–${caja.y1}` +
      `  →  recorte ${r.width}×${r.height} en (${r.left}, ${r.top})`,
  );
}

// Comprobación explícita: el emblema debe quedar centrado y con aire por los cuatro lados.
const holguras = {
  izq: cajaEmblema.x0 - REGIONES.emblema.left,
  der: REGIONES.emblema.left + REGIONES.emblema.width - cajaEmblema.x1,
  arr: cajaEmblema.y0 - REGIONES.emblema.top,
  aba: REGIONES.emblema.top + REGIONES.emblema.height - cajaEmblema.y1,
};
if (Object.values(holguras).some((v) => v < 4)) {
  throw new Error(`El emblema se corta: holguras ${JSON.stringify(holguras)}`);
}
console.log(`  holguras del emblema (px): ${JSON.stringify(holguras)}`);

// ---------------------------------------------------------------------------
// 4. Piezas base: RGBA con la tinta plana y el alfa como cobertura
// ---------------------------------------------------------------------------

/**
 * Recorta una región y devuelve un PNG con fondo transparente.
 * El alfa interpola entre `L_FONDO` (nada) y `L_TINTA` (opaco), de modo que los
 * trazos de 1–2 px sobreviven como semitransparentes en lugar de desaparecer.
 */
function pieza({ left, top, width, height }, colorHex) {
  const { r, g, b } = aRgb(colorHex);
  const salida = Buffer.alloc(width * height * 4);
  const rango = L_FONDO - L_TINTA;
  let cobertura = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const l = lum[(top + y) * W + (left + x)];
      const a = Math.round(255 * Math.min(1, Math.max(0, (L_FONDO - l) / rango)));
      const d = (y * width + x) * 4;
      salida[d] = r;
      salida[d + 1] = g;
      salida[d + 2] = b;
      salida[d + 3] = a;
      if (a > 0) cobertura += 1;
    }
  }
  return {
    imagen: sharp(salida, { raw: { width, height, channels: 4 } }).png({ compressionLevel: 9 }),
    cobertura: cobertura / (width * height),
  };
}

/** Aplana una pieza transparente sobre un color sólido (iOS y og:image no admiten alfa). */
const sobreColor = (buffer, fondo) =>
  sharp(buffer).flatten({ background: fondo }).png({ compressionLevel: 9 });

const base = {};
console.log('\nCobertura de tinta por pieza (control de que nada se ha comido):');
for (const [nombre, region] of Object.entries(REGIONES)) {
  const { imagen, cobertura } = pieza(region, VERDE_MARCA);
  const transparente = await imagen.toBuffer();
  const conCrema = await sobreColor(transparente, CREMA).toBuffer();
  const claro = await pieza(region, VERDE_CLARO).imagen.toBuffer();

  base[nombre] = { transparente, conCrema, claro };
  writeFileSync(join(DIR_BASE, `${nombre}.png`), conCrema);
  writeFileSync(join(DIR_BASE, `${nombre}-transparente.png`), transparente);
  console.log(`  ${nombre.padEnd(9)} ${(cobertura * 100).toFixed(1)} % del recorte`);

  if (cobertura < 0.03) throw new Error(`La máscara de "${nombre}" ha borrado el trazo.`);
}

// ---------------------------------------------------------------------------
// 5. Assets para la interfaz (siempre transparentes: funcionan en claro y oscuro)
// ---------------------------------------------------------------------------

const ANCHO_APP = { emblema: 512, wordmark: 768, lockup: 768 };
const escritos = [];

const anotar = (ruta, buffer) => {
  writeFileSync(ruta, buffer);
  escritos.push([ruta.replace(/\\/g, '/'), buffer.length]);
};

// El sufijo `-oscuro` indica DÓNDE se usa (modo oscuro), no de qué color es:
// el archivo lleva el verde claro, que es el que se lee sobre negro.
for (const nombre of ['emblema', 'wordmark', 'lockup']) {
  const ancho = ANCHO_APP[nombre];
  for (const [sufijo, fuente] of [
    ['', base[nombre].transparente],
    ['-oscuro', base[nombre].claro],
  ]) {
    const png = await sharp(fuente)
      .resize({ width: ancho })
      .png({ compressionLevel: 9 })
      .toBuffer();
    const { width, height } = await sharp(png).metadata();
    anotar(join(DIR_APP, `logo-${nombre}${sufijo}.png`), png);
    if (!sufijo) console.log(`  ${nombre}: ${width}×${height} px intrínsecos`);
  }
}

// ---------------------------------------------------------------------------
// 6. Iconos de aplicación — solo el emblema: el wordmark es ilegible a 48 px
// ---------------------------------------------------------------------------

const emblemaCuadrado = async (lado, fondo, escala = 1) =>
  sharp({
    create: {
      width: lado,
      height: lado,
      channels: 4,
      background: fondo ?? { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: await sharp(base.emblema.transparente)
          .resize(Math.round(lado * escala), Math.round(lado * escala))
          .png()
          .toBuffer(),
        gravity: 'centre',
      },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();

anotar(join(DIR_PUBLICO, 'pwa-192x192.png'), await emblemaCuadrado(192));
anotar(join(DIR_PUBLICO, 'pwa-512x512.png'), await emblemaCuadrado(512));

// iOS ignora el alfa (lo compone en negro) y redondea las esquinas: crema aplanado
// y un punto de holgura para que la hoja no roce el radio del recorte.
anotar(join(DIR_PUBLICO, 'apple-touch-icon.png'), await emblemaCuadrado(180, CREMA, 0.88));

// Maskable: el emblema al 60 % del lienzo. El 40 % restante es zona de sacrificio
// para el recorte circular o de squircle que aplica cada lanzador de Android.
const LADO_MASKABLE = 512;
const ladoEmblemaMaskable = Math.round(LADO_MASKABLE * 0.6);
anotar(
  join(DIR_PUBLICO, 'maskable-512x512.png'),
  await sharp({
    create: {
      width: LADO_MASKABLE,
      height: LADO_MASKABLE,
      channels: 4,
      background: CREMA,
    },
  })
    .composite([
      {
        input: await sharp(base.emblema.transparente)
          .resize(ladoEmblemaMaskable, ladoEmblemaMaskable, { fit: 'contain' })
          .png()
          .toBuffer(),
        gravity: 'centre',
      },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer(),
);

// og:image — aquí sí va el lockup completo, centrado sobre crema.
const OG = { ancho: 1200, alto: 630 };
anotar(
  join(DIR_PUBLICO, 'og-image.png'),
  await sharp({
    create: { width: OG.ancho, height: OG.alto, channels: 4, background: CREMA },
  })
    .composite([
      {
        input: await sharp(base.lockup.transparente)
          .resize({ height: Math.round(OG.alto * 0.74), fit: 'inside' })
          .png()
          .toBuffer(),
        gravity: 'centre',
      },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer(),
);

// ---------------------------------------------------------------------------
// 7. favicon.ico y favicon.svg
// ---------------------------------------------------------------------------

/** Contenedor ICO con PNG dentro, que es lo que entienden navegadores y Windows. */
function empaquetarIco(imagenes) {
  const cabecera = Buffer.alloc(6);
  cabecera.writeUInt16LE(0, 0); // reservado
  cabecera.writeUInt16LE(1, 2); // tipo: icono
  cabecera.writeUInt16LE(imagenes.length, 4);

  let desplazamiento = 6 + imagenes.length * 16;
  const entradas = imagenes.map(({ lado, png }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(lado >= 256 ? 0 : lado, 0);
    e.writeUInt8(lado >= 256 ? 0 : lado, 1);
    e.writeUInt8(0, 2); // paleta
    e.writeUInt8(0, 3); // reservado
    e.writeUInt16LE(1, 4); // planos
    e.writeUInt16LE(32, 6); // bits por píxel
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(desplazamiento, 12);
    desplazamiento += png.length;
    return e;
  });

  return Buffer.concat([cabecera, ...entradas, ...imagenes.map((i) => i.png)]);
}

const ladosIco = [16, 32, 48];
anotar(
  join(DIR_PUBLICO, 'favicon.ico'),
  empaquetarIco(
    await Promise.all(
      ladosIco.map(async (lado) => ({ lado, png: await emblemaCuadrado(lado) })),
    ),
  ),
);

/**
 * SVG con el emblema dentro. Es un trazado fino: vectorizarlo automáticamente lo
 * dentaría, así que se incrusta la cobertura como MÁSCARA en escala de grises y el
 * color lo pone un `rect`. Pesa la mitad que un RGBA y, sobre todo, permite cambiar
 * el verde según el esquema del navegador, que es lo único que un .ico no puede hacer.
 */
const LADO_SVG = 192;
const mascaraSvg = await sharp(base.emblema.transparente)
  .resize(LADO_SVG, LADO_SVG)
  .extractChannel('alpha') // la cobertura: blanco = trazo, negro = fondo
  .toColourspace('b-w')
  .png({ compressionLevel: 9 })
  .toBuffer();

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LADO_SVG} ${LADO_SVG}" role="img" aria-label="Nutrio">
  <style>
    .trazo { fill: ${VERDE_MARCA} }
    @media (prefers-color-scheme: dark) { .trazo { fill: ${VERDE_CLARO} } }
  </style>
  <mask id="emblema">
    <image width="${LADO_SVG}" height="${LADO_SVG}" href="data:image/png;base64,${mascaraSvg.toString('base64')}"/>
  </mask>
  <rect class="trazo" width="${LADO_SVG}" height="${LADO_SVG}" mask="url(#emblema)"/>
</svg>
`;
anotar(join(DIR_PUBLICO, 'favicon.svg'), Buffer.from(faviconSvg, 'utf8'));

// ---------------------------------------------------------------------------
// 8. Resumen
// ---------------------------------------------------------------------------

console.log('\nAssets generados:');
for (const [ruta, bytes] of escritos) {
  console.log(`  ${ruta.padEnd(36)} ${(bytes / 1024).toFixed(1)} kB`);
}
console.log(`\nPiezas base auditables en ${DIR_BASE}/ (crema y transparente).`);
console.log(`Verde de marca: ${VERDE_MARCA} — úsalo como token del tema.`);
