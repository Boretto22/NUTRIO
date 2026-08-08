import { useContext } from 'react';

import { AppContext, type AppContextValor } from '@/store/AppContext';

export function useApp(): AppContextValor {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>');
  return ctx;
}
