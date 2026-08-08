import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';

interface ModalProps {
  abierto: boolean;
  titulo: string;
  descripcion?: string;
  children: ReactNode;
  /** Adorno a la izquierda del título (el emblema de marca, normalmente). */
  icono?: ReactNode;
  /** Si se omite, el modal no se puede cerrar sin actuar (gate). */
  onCerrar?: () => void;
  pie?: ReactNode;
}

export function Modal({ abierto, titulo, descripcion, children, icono, onCerrar, pie }: ModalProps) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onCerrar) onCerrar();
      if (e.key !== 'Tab' || !panel.current) return;
      const focusables = panel.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const primero = focusables[0];
      const ultimo = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    window.setTimeout(() => {
      panel.current?.querySelector<HTMLElement>('button, input, [tabindex]')?.focus();
    }, 30);

    return () => {
      document.body.style.overflow = anterior;
      document.removeEventListener('keydown', onKey);
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div
        className="animate-fade-in absolute inset-0 bg-neutral-950/50 backdrop-blur-sm"
        onClick={onCerrar}
        aria-hidden
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="animate-slide-up relative flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-neutral-50 shadow-2xl dark:bg-neutral-900 sm:rounded-3xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <header className="flex items-start gap-3 border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          {icono && <span className="mt-0.5 shrink-0">{icono}</span>}
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold leading-tight">{titulo}</h2>
            {descripcion && (
              <p className="mt-1 text-[13px] text-neutral-600 dark:text-neutral-400">
                {descripcion}
              </p>
            )}
          </div>
          {onCerrar && (
            <button type="button" className="icono-btn -mr-2 -mt-1" onClick={onCerrar} aria-label="Cerrar">
              <X size={20} aria-hidden />
            </button>
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {pie && (
          <footer className="border-t border-neutral-200 px-5 py-3 dark:border-neutral-800">
            {pie}
          </footer>
        )}
      </div>
    </div>
  );
}

interface ConfirmarProps {
  abierto: boolean;
  titulo: string;
  mensaje: ReactNode;
  textoConfirmar?: string;
  peligro?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export function Confirmar({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = 'Confirmar',
  peligro,
  onConfirmar,
  onCancelar,
}: ConfirmarProps) {
  return (
    <Modal
      abierto={abierto}
      titulo={titulo}
      onCerrar={onCancelar}
      pie={
        <div className="flex gap-2">
          <button type="button" className="btn-secundario flex-1" onClick={onCancelar}>
            Cancelar
          </button>
          <button
            type="button"
            className={`${peligro ? 'btn-peligro' : 'btn-primario'} flex-1`}
            onClick={onConfirmar}
          >
            {textoConfirmar}
          </button>
        </div>
      }
    >
      <div className="text-[15px] leading-relaxed text-neutral-700 dark:text-neutral-300">
        {mensaje}
      </div>
    </Modal>
  );
}
