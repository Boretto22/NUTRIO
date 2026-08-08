import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

import { BottomNav } from '@/components/BottomNav';
import { SelectorPlanDia } from '@/components/SelectorPlanDia';
import { useToast } from '@/components/Toast';
import { Calendario } from '@/pages/Calendario';
import { ConsultaAlimentos } from '@/pages/ConsultaAlimentos';
import { EditarPlan } from '@/pages/EditarPlan';
import { Hoy } from '@/pages/Hoy';
import { NuevaComida } from '@/pages/NuevaComida';
import { PlanificarComida } from '@/pages/PlanificarComida';
import { Usuario } from '@/pages/Usuario';
import { useApp } from '@/store/useApp';

// Las gráficas (recharts) solo se descargan al abrir la pantalla de racha.
const RachaSemanal = lazy(() =>
  import('@/pages/RachaSemanal').then((m) => ({ default: m.RachaSemanal })),
);

export default function App() {
  const { estado, hoy, elegirPlanDelDia } = useApp();
  const { toast } = useToast();
  const necesitaElegirPlan = !estado.dias[hoy];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <main className="flex-1 pb-28">
        <Suspense fallback={<Cargando />}>
          <Routes>
            <Route path="/" element={<Hoy />} />
            <Route path="/nueva" element={<NuevaComida />} />
            <Route path="/calendario" element={<Calendario />} />
            <Route path="/planificar" element={<PlanificarComida />} />
            <Route path="/racha" element={<RachaSemanal />} />
            <Route path="/plan" element={<EditarPlan />} />
            <Route path="/alimentos" element={<ConsultaAlimentos />} />
            <Route path="/usuario" element={<Usuario />} />
            <Route path="*" element={<Hoy />} />
          </Routes>
        </Suspense>
      </main>

      <BottomNav />

      <SelectorPlanDia
        abierto={necesitaElegirPlan}
        fecha={hoy}
        planes={estado.planes}
        onElegir={(planId) => {
          elegirPlanDelDia(hoy, planId);
          toast(`Día iniciado con ${estado.planes[planId].nombre}`);
        }}
      />
    </div>
  );
}

function Cargando() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
      <span className="h-7 w-7 animate-spin rounded-full border-2 border-neutral-300 border-t-marca-500 dark:border-neutral-700 dark:border-t-marca-400" />
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
