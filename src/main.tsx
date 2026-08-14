import { identifyDispositivo, posthog } from '@/lib/analytics';
import { Analytics } from '@vercel/analytics/react';
import { PostHogProvider } from 'posthog-js/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';

import App from '@/App';
import { LicenciaGate } from '@/components/LicenciaGate';
import { PostHogPageviews } from '@/components/PostHogPageviews';
import { Splash } from '@/components/Splash';
import { ToastProvider } from '@/components/Toast';
import { AppProvider } from '@/store/AppContext';
import '@/index.css';

identifyDispositivo();
registerSW({ immediate: true });

const contenedor = document.getElementById('root');
if (!contenedor) throw new Error('No se encontró el elemento #root');

createRoot(contenedor).render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <PostHogPageviews />
        <AppProvider>
          <ToastProvider>
            <LicenciaGate>
              <App />
              <Splash />
            </LicenciaGate>
            <Analytics />
          </ToastProvider>
        </AppProvider>
      </HashRouter>
    </PostHogProvider>
  </StrictMode>,
);
