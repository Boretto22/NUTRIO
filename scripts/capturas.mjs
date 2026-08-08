/**
 * Capturas de verificación de layout sobre el build de producción.
 * Uso: node scripts/capturas.mjs  (requiere `npm run build` previo)
 */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const SALIDA = 'capturas';

const VIEWPORTS = [
  { nombre: '375x667', width: 375, height: 667 },
  { nombre: '320x568', width: 320, height: 568 },
];

const ahora = new Date();
const HOY = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;

const ESTADO_SEMILLA = ((hoy) => ({
  schemaVersion: 2,
  perfil: { nombre: 'Ana' },
  dias: {},
  planificacion: {
    [hoy]: {
      fecha: hoy,
      planId: 'A',
      platos: [
        {
          id: 'plan-1',
          nombre: 'Arroz con pollo',
          comidaId: 'comida',
          ingredientes: [
            { alimentoId: 'ch-arroz', gramos: 100, bloques: 5 },
            { alimentoId: 'p1-pollo-pechuga', gramos: 150, bloques: 3 },
          ],
        },
        {
          id: 'plan-2',
          nombre: 'Merluza a la plancha',
          comidaId: 'cena',
          ingredientes: [{ alimentoId: 'p1-pescado-blanco', gramos: 150, bloques: 2 }],
        },
      ],
    },
  },
  plantillasMenu: [],
  platosFavoritos: [],
  ajustes: {
    toleranciaBloques: 0.5,
    primerDiaSemana: 1,
    tema: 'claro',
    modoCalendario: 'programar',
  },
}))(HOY);

mkdirSync(SALIDA, { recursive: true });

const navegador = await chromium.launch();

for (const vp of VIEWPORTS) {
  const contexto = await navegador.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  // La semilla debe existir antes de que monte la app, no después.
  await contexto.addInitScript((semilla) => {
    localStorage.setItem('nutrio:estado', JSON.stringify(semilla));
  }, ESTADO_SEMILLA);

  const pagina = await contexto.newPage();

  await pagina.goto(`${BASE}/#/`);
  await pagina.getByRole('button', { name: /Empezar el día con Tipo A/i }).click();
  await pagina.waitForTimeout(1600);
  await pagina.screenshot({ path: `${SALIDA}/hoy-${vp.nombre}.png` });

  // El segmento fantasma debe ocupar exactamente la proporción pendiente.
  const barras = await pagina.evaluate(() =>
    [...document.querySelectorAll('[role="progressbar"]')]
      .filter((b) => b.getAttribute('aria-label')?.includes('pendientes'))
      .map((b) => ({
        etiqueta: b.getAttribute('aria-label'),
        total: Math.round(b.getBoundingClientRect().width),
        segmentos: [...b.firstElementChild.children].map((s) =>
          Math.round(s.getBoundingClientRect().width),
        ),
      })),
  );
  console.log(`${vp.nombre}  barras=${JSON.stringify(barras)}`);

  // Nueva comida: la barra de acciones no puede quedar tapada por la nav.
  await pagina.goto(`${BASE}/#/nueva`);
  await pagina.waitForTimeout(400);
  await pagina.screenshot({ path: `${SALIDA}/nueva-${vp.nombre}.png` });

  const guardar = pagina.getByRole('button', { name: /Guardar comida/ });
  const nav = pagina.getByRole('navigation', { name: 'Navegación principal' });
  const cajaGuardar = await guardar.boundingBox();
  const cajaNav = await nav.boundingBox();
  const solapa = cajaGuardar.y + cajaGuardar.height > cajaNav.y + 0.5;
  const visible = cajaGuardar.y + cajaGuardar.height <= vp.height;

  console.log(
    `${vp.nombre}  guardar=${JSON.stringify(cajaGuardar)}  nav.y=${cajaNav.y}  solapa=${solapa}  dentroDelViewport=${visible}`,
  );

  await pagina.goto(`${BASE}/#/calendario`);
  await pagina.waitForTimeout(400);
  await pagina.screenshot({ path: `${SALIDA}/calendario-${vp.nombre}.png` });

  await pagina.getByRole('gridcell', { name: new RegExp(`^${new Date().getDate()} —`) }).click();
  await pagina.waitForTimeout(400);
  await pagina.screenshot({ path: `${SALIDA}/detalle-dia-${vp.nombre}.png` });

  await contexto.close();
}

await navegador.close();
