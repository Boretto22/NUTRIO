import { Analytics } from '@vercel/analytics/react';
import posthog from 'posthog-js';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';

import App from '@/App';
import { LicenciaGate } from '@/components/LicenciaGate';
import { Splash } from '@/components/Splash';
import { ToastProvider } from '@/components/Toast';
import { AppProvider } from '@/store/AppContext';
import '@/index.css';

if (import.meta.env.MODE !== 'test') {
  posthog.init('phc_mRPBy6Set8D6tYo7RGjNRW6FwsyU7QnY7xJjrmWDbyEj', {
    api_host: 'https://eu.i.posthog.com',
    // Crea un perfil por visitante anónimo para contar usuarios únicos.
    person_profiles: 'always',
    persistence: 'localStorage+cookie',
  });
}

const contenedor = document.getElementById('root');
if (!contenedor) throw new Error('No se encontró el elemento #root');

createRoot(contenedor).render(
  <StrictMode>
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
  </StrictMode>,
);
