// @vitest-environment jsdom
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import App from '@/App';
import { ToastProvider } from '@/components/Toast';
import { planSeed } from '@/data/planSeed';
import { CLAVE_STORAGE, estadoInicial } from '@/lib/storage';
import { AppProvider } from '@/store/AppContext';
import type { AppState, DiaRegistro, ModoCalendario, PlatoPlanificado } from '@/types';

function hoyISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const HOY = hoyISO();

function diaRegistro(fecha: string): DiaRegistro {
  return {
    fecha,
    planId: 'A',
    objetivosSnapshot: planSeed().A,
    yogur: false,
    lecheMl: 0,
    platos: [],
  };
}

const ARROZ_100: PlatoPlanificado = {
  id: 'plan-1',
  nombre: 'Arroz previsto',
  comidaId: 'comida',
  ingredientes: [{ alimentoId: 'ch-arroz', gramos: 100, bloques: 5 }],
};

function sembrar(modo: ModoCalendario, platos: PlatoPlanificado[] = [ARROZ_100]) {
  const estado: AppState = {
    ...estadoInicial(),
    dias: { [HOY]: diaRegistro(HOY) },
    planificacion: { [HOY]: { fecha: HOY, planId: 'A', platos } },
    ajustes: { ...estadoInicial().ajustes, modoCalendario: modo },
  };
  localStorage.setItem(CLAVE_STORAGE, JSON.stringify(estado));
}

function leerEstado(): AppState {
  return JSON.parse(localStorage.getItem(CLAVE_STORAGE) ?? '{}') as AppState;
}

function montar() {
  return render(
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AppProvider>
    </HashRouter>,
  );
}

function filaGrupo(nombre: string) {
  const barra = screen
    .getAllByRole('progressbar')
    .find((el) => el.getAttribute('aria-label')?.startsWith(nombre));
  return barra?.getAttribute('aria-label') ?? '';
}

describe('TAREA 2 — calendario mensual de menús', () => {
  beforeEach(() => {
    localStorage.clear();
    window.location.hash = '';
  });

  it('CRITERIO 4 — la barra inferior muestra las 6 pestañas', async () => {
    sembrar('agenda', []);
    montar();

    const nav = await screen.findByRole('navigation', { name: 'Navegación principal' });
    const enlaces = within(nav).getAllByRole('link');
    expect(enlaces.map((e) => e.textContent)).toEqual([
      'Hoy',
      'Calendario',
      'Racha',
      'Alimentos',
      'Plan',
      'Usuario',
    ]);
  });

  it('CRITERIO 6 — en modo agenda lo planificado no entra en el seguimiento', async () => {
    const usuario = userEvent.setup();
    sembrar('agenda');
    montar();

    // La tabla de bloques ignora por completo el plato previsto.
    await waitFor(() => expect(filaGrupo('Carbohidratos')).toContain('0 de 8 bloques'));
    expect(screen.queryByText('Arroz previsto')).not.toBeInTheDocument();

    // Pero sí aparece la tarjeta de aviso con acción Ver.
    expect(screen.getByText(/Tienes 1 plato planificado para hoy/i)).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Ver' }));

    expect(await screen.findByText('Arroz previsto')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrar Arroz previsto' })).toBeInTheDocument();
  });

  it('en modo agenda, Registrar abre el formulario prerrellenado y al guardar suma bloques', async () => {
    const usuario = userEvent.setup();
    sembrar('agenda');
    montar();

    await usuario.click(await screen.findByRole('button', { name: 'Ver' }));
    await usuario.click(screen.getByRole('button', { name: 'Registrar Arroz previsto' }));

    // El formulario llega con el nombre y los gramos del plato previsto.
    expect(await screen.findByLabelText('Nombre del plato')).toHaveValue('Arroz previsto');
    expect(screen.getByLabelText('Peso crudo (g)')).toHaveValue(100);

    await usuario.click(screen.getByRole('button', { name: 'Guardar comida' }));

    await waitFor(() => expect(filaGrupo('Carbohidratos')).toContain('5 de 8 bloques'));
    expect(leerEstado().dias[HOY].platos).toHaveLength(1);
  });

  it('CRITERIO 7 — en modo programar aparece como pendiente con 0 bloques y al confirmar suma', async () => {
    const usuario = userEvent.setup();
    sembrar('programar');
    montar();

    // Visible en su sección de comida, pero sin contabilizar.
    expect(await screen.findByText('Arroz previsto')).toBeInTheDocument();
    expect(screen.getByText('Planificado')).toBeInTheDocument();
    expect(filaGrupo('Carbohidratos')).toContain('0 de 8 bloques');
    expect(filaGrupo('Carbohidratos')).toContain('+5 pendientes de confirmar');
    expect(screen.getByText(/pendiente de confirmar/)).toBeInTheDocument();

    await usuario.click(screen.getByRole('checkbox', { name: 'Lo he comido: Arroz previsto' }));

    await waitFor(() => expect(filaGrupo('Carbohidratos')).toContain('5 de 8 bloques'));
    const plato = leerEstado().dias[HOY].platos[0];
    expect(plato.planificadoId).toBe('plan-1');
    // Ya no queda nada pendiente.
    expect(screen.queryByText('Planificado')).not.toBeInTheDocument();
  });

  it('CRITERIO 8 — descartar un pendiente no lo hace reaparecer al recargar', async () => {
    const usuario = userEvent.setup();
    sembrar('programar');
    const { unmount } = montar();

    await usuario.click(await screen.findByRole('button', { name: 'Descartar Arroz previsto' }));
    await waitFor(() => expect(screen.queryByText('Arroz previsto')).not.toBeInTheDocument());
    await waitFor(() =>
      expect(leerEstado().dias[HOY].planificadosDescartados).toContain('plan-1'),
    );

    unmount();
    window.location.hash = '';
    montar();

    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());
    expect(screen.queryByText('Arroz previsto')).not.toBeInTheDocument();
    // La planificación original sigue guardada, solo se ignora en Hoy.
    expect(leerEstado().planificacion[HOY].platos).toHaveLength(1);
  });

  it('CRITERIO 5 — planificar en el calendario no altera bloques ni racha', async () => {
    const usuario = userEvent.setup();
    sembrar('agenda', []);
    montar();

    await waitFor(() => expect(filaGrupo('Carbohidratos')).toContain('0 de 8 bloques'));

    await usuario.click(screen.getByRole('link', { name: 'Calendario' }));
    const celdaHoy = await screen.findByRole('gridcell', {
      name: new RegExp(`^${new Date().getDate()} —`),
    });
    await usuario.click(celdaHoy);

    const hoja = await screen.findByRole('dialog');
    await usuario.click(within(hoja).getAllByRole('button', { name: '+ Añadir plato' })[1]);

    await usuario.type(await screen.findByLabelText('Nombre del plato'), 'Cena prevista');
    await usuario.type(screen.getByLabelText('Buscar alimento'), 'arroz');
    await usuario.click(await screen.findByRole('option', { name: /Arroz.*Blanco, integral/i }));
    await usuario.type(screen.getByLabelText('Peso crudo (g)'), '100');
    await usuario.click(screen.getByRole('button', { name: 'Añadir al plan' }));

    await waitFor(() => expect(leerEstado().planificacion[HOY].platos).toHaveLength(1));

    // Los bloques del día siguen intactos.
    await usuario.click(screen.getByRole('link', { name: 'Hoy' }));
    await waitFor(() => expect(filaGrupo('Carbohidratos')).toContain('0 de 8 bloques'));
    expect(leerEstado().dias[HOY].platos).toHaveLength(0);
  });

  it('CRITERIO 12 — el backup incluye calendario y plantillas', async () => {
    sembrar('programar');
    montar();

    await waitFor(() => expect(screen.getByText('Arroz previsto')).toBeInTheDocument());

    const { validarBackup } = await import('@/lib/backup');
    const validacion = validarBackup(localStorage.getItem(CLAVE_STORAGE)!);

    expect(validacion.ok).toBe(true);
    expect(validacion.estado?.planificacion[HOY].platos).toHaveLength(1);
    expect(validacion.resumen?.diasPlanificados).toBe(1);
    expect(validacion.estado?.ajustes.modoCalendario).toBe('programar');
  });

  it('CRITERIO 11 — un backup v1 se importa y queda con la planificación vacía', async () => {
    const v1 = {
      schemaVersion: 1,
      perfil: { nombre: 'Ana' },
      planes: planSeed(),
      dias: { [HOY]: diaRegistro(HOY) },
      platosFavoritos: [],
      ajustes: { toleranciaBloques: 0.5, primerDiaSemana: 1, tema: 'claro' },
    };

    const { validarBackup } = await import('@/lib/backup');
    const validacion = validarBackup(JSON.stringify(v1));

    expect(validacion.ok).toBe(true);
    expect(validacion.estado?.planificacion).toEqual({});
    expect(validacion.estado?.plantillasMenu).toEqual([]);
    expect(validacion.estado?.ajustes.modoCalendario).toBe('agenda');
    expect(validacion.estado?.perfil.nombre).toBe('Ana');
  });
});
