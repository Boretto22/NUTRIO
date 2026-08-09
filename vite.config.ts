import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';

const { version } = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version: string };

/**
 * Replica `/api/check-license` en `npm run dev` leyendo LICENSE_ACTIVE del .env.
 * En producción lo sirve la Serverless Function de Vercel.
 */
function licenciaLocal(activa: boolean): Plugin {
  return {
    name: 'nutrio-licencia-local',
    configureServer(server) {
      server.middlewares.use('/api/check-license', (req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
          next();
          return;
        }

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (activa) {
          res.statusCode = 200;
          res.end(JSON.stringify({ active: true }));
          return;
        }

        res.statusCode = 403;
        res.end(
          JSON.stringify({
            active: false,
            message: 'Suscripción temporalmente pausada',
          }),
        );
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Cadena vacía: también carga LICENSE_ACTIVE (sin prefijo VITE_).
  const env = loadEnv(mode, process.cwd(), '');
  const licenciaActiva = env.LICENSE_ACTIVE === 'true';

  return {
    base: './',
    define: { __VERSION_APP__: JSON.stringify(version) },
    plugins: [
      react(),
      licenciaLocal(licenciaActiva),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'og-image.png'],
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
          navigateFallback: 'index.html',
        },
        manifest: {
          name: 'Nutrio',
          short_name: 'Nutrio',
          description: 'Seguimiento diario de tu plan nutricional por bloques',
          lang: 'es',
          start_url: './',
          scope: './',
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#F4F4F1',
          theme_color: '#408C7C',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            {
              src: 'maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  };
});
