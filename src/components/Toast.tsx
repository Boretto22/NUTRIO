import { AlertTriangle, CheckCircle2, Info, Undo2 } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type TipoToast = 'exito' | 'error' | 'info';

export interface AccionToast {
  etiqueta: string;
  onAccion: () => void;
}

interface OpcionesToast {
  tipo?: TipoToast;
  accion?: AccionToast;
  /** Milisegundos en pantalla. Por defecto 2800, o 5000 si hay acción. */
  duracion?: number;
}

interface ToastItem {
  id: number;
  mensaje: string;
  tipo: TipoToast;
  accion?: AccionToast;
}

interface ToastContextValor {
  toast: (mensaje: string, tipoUOpciones?: TipoToast | OpcionesToast) => void;
}

const ToastContext = createContext<ToastContextValor | null>(null);

const ICONOS: Record<TipoToast, typeof CheckCircle2> = {
  exito: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

const ESTILOS: Record<TipoToast, string> = {
  exito: 'bg-marca-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-neutral-800 text-white dark:bg-neutral-700',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const cerrar = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback<ToastContextValor['toast']>(
    (mensaje, tipoUOpciones) => {
      const opciones: OpcionesToast =
        typeof tipoUOpciones === 'string' ? { tipo: tipoUOpciones } : (tipoUOpciones ?? {});
      const { tipo = 'exito', accion } = opciones;
      const duracion = opciones.duracion ?? (accion ? 5000 : 2800);
      const id = Date.now() + Math.random();

      setItems((prev) => [...prev, { id, mensaje, tipo, accion }]);
      window.setTimeout(() => cerrar(id), duracion);
    },
    [cerrar],
  );

  const valor = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 z-[70] flex flex-col items-center gap-2 px-4"
        style={{ bottom: 'var(--toast-bottom)' }}
        role="status"
        aria-live="polite"
      >
        {items.map((t) => {
          const Icono = ICONOS[t.tipo];
          return (
            <div
              key={t.id}
              className={`animate-slide-up pointer-events-auto flex w-full max-w-md items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${ESTILOS[t.tipo]}`}
            >
              <Icono size={18} className="shrink-0" aria-hidden />
              <span className="min-w-0 flex-1">{t.mensaje}</span>
              {t.accion && (
                <button
                  type="button"
                  className="-my-1 flex shrink-0 items-center gap-1 rounded-lg bg-white/20 px-2.5 py-1.5 text-[13px] font-bold transition-colors hover:bg-white/30"
                  onClick={() => {
                    t.accion?.onAccion();
                    cerrar(t.id);
                  }}
                >
                  <Undo2 size={14} aria-hidden />
                  {t.accion.etiqueta}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValor {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}
