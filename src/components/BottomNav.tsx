import { Apple, CalendarDays, Flame, Home, Plus, Settings, Utensils } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

const ITEMS = [
  { to: '/', icono: Home, etiqueta: 'Hoy', exacto: true },
  { to: '/calendario', icono: CalendarDays, etiqueta: 'Calendario', exacto: false },
  { to: '/racha', icono: Flame, etiqueta: 'Racha', exacto: false },
  { to: '/alimentos', icono: Apple, etiqueta: 'Alimentos', exacto: false },
  { to: '/plan', icono: Utensils, etiqueta: 'Plan', exacto: false },
  { to: '/usuario', icono: Settings, etiqueta: 'Usuario', exacto: false },
];

/** Rutas que ocupan toda la pantalla y ocultan el botón flotante. */
const RUTAS_PANTALLA_COMPLETA = ['/nueva', '/planificar'];

export function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const pantallaCompleta = RUTAS_PANTALLA_COMPLETA.some((r) => pathname.startsWith(r));

  return (
    <>
      {!pantallaCompleta && (
        <button
          type="button"
          onClick={() => navigate('/nueva')}
          aria-label="Registrar nueva comida"
          className="fixed left-1/2 z-50 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-marca-600 text-white shadow-lg shadow-marca-600/30 transition-transform hover:bg-marca-700 active:scale-95"
          style={{ bottom: 'calc(var(--nav-total) + 0.75rem)' }}
        >
          <Plus size={26} aria-hidden />
        </button>
      )}

      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="mx-auto flex max-w-md">
          {ITEMS.map(({ to, icono: Icono, etiqueta, exacto }) => (
            <li key={to} className="min-w-0 flex-1">
              <NavLink
                to={to}
                end={exacto}
                className={({ isActive }) =>
                  `flex h-[var(--nav-h)] w-full flex-col items-center justify-center gap-0.5 px-0.5 transition-colors ${
                    isActive
                      ? 'text-marca-600 dark:text-marca-400'
                      : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icono size={19} strokeWidth={isActive ? 2.4 : 1.9} aria-hidden />
                    <span className="w-full truncate text-center text-[9.5px] font-semibold leading-none">
                      {etiqueta}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
