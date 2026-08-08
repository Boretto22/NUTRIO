import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';

import App from '@/App';
import { Splash } from '@/components/Splash';
import { ToastProvider } from '@/components/Toast';
import { AppProvider } from '@/store/AppContext';
import '@/index.css';

const contenedor = document.getElementById('root');
if (!contenedor) throw new Error('No se encontró el elemento #root');

createRoot(contenedor).render(
  <StrictMode>
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppProvider>
        <ToastProvider>
          <App />
          <Splash />
        </ToastProvider>
      </AppProvider>
    </HashRouter>
  </StrictMode>,
);
