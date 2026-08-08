// @vitest-environment jsdom
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import App from '@/App';
import { ToastProvider } from '@/components/Toast';
import { CLAVE_STORAGE } from '@/lib/storage';
import { AppProvider } from '@/store/AppContext';
import type { AppState } from '@/types';

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

function estadoGuardado(): AppState {
  return JSON.parse(localStorage.getItem(CLAVE_STORAGE) ?? '{}') as AppState;
}

function platosDeHoy() {
  const estado = estadoGuardado();
  const hoy = new Date();
  const clave = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  return estado.dias?.[clave]?.platos ?? [];
}

async function empezarDia(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.click(await screen.findByRole('button', { name: /Empezar el día con Tipo A/i }));
}

async function anadirArroz(usuario: ReturnType<typeof userEvent.setup>, gramos: string) {
  await usuario.type(screen.getByLabelText('Buscar alimento'), 'arroz');
  await usuario.click(await screen.findByRole('option', { name: /Arroz.*Blanco, integral/i }));
  await usuario.type(screen.getByLabelText('Peso crudo (g)'), gramos);
}

function filaGrupo(nombre: string) {
  const barra = screen
    .getAllByRole('progressbar')
    .find((el) => el.getAttribute('aria-label')?.startsWith(nombre));
  return barra?.getAttribute('aria-label') ?? '';
}

describe('TAREA 1 — guardar una comida nueva', () => {
  beforeEach(() => {
    localStorage.clear();
    window.location.hash = '';
  });

  it('el botón de guardar existe, está deshabilitado sin ingredientes y explica por qué', async () => {
    const usuario = userEvent.setup();
    montar();
    await empezarDia(usuario);
    await usuario.click(screen.getByRole('button', { name: 'Registrar nueva comida' }));

    const guardar = screen.getByRole('button', { name: 'Guardar comida' });
    expect(guardar).toBeInTheDocument();
    expect(guardar).toBeDisabled();
    expect(screen.getByText(/Añade al menos un ingrediente/i)).toBeInTheDocument();
  });

  it('añadir un ingrediente habilita el guardado y el plato acaba en el estado del día', async () => {
    const usuario = userEvent.setup();
    montar();
    await empezarDia(usuario);
    await usuario.click(screen.getByRole('button', { name: 'Registrar nueva comida' }));

    await usuario.type(screen.getByLabelText('Nombre del plato'), 'Arroz con pollo');
    await anadirArroz(usuario, '100');

    const guardar = screen.getByRole('button', { name: 'Guardar comida' });
    expect(guardar).toBeEnabled();
    await usuario.click(guardar);

    await waitFor(() => expect(platosDeHoy()).toHaveLength(1));
    const [plato] = platosDeHoy();
    expect(plato.nombre).toBe('Arroz con pollo');
    expect(plato.ingredientes[0]).toMatchObject({ alimentoId: 'ch-arroz', gramos: 100, bloques: 5 });

    // Vuelve a Hoy y la tabla refleja el cambio de inmediato.
    await waitFor(() => expect(filaGrupo('Carbohidratos')).toContain('5 de 8 bloques'));
  });

  it('sin nombre pero con ingredientes propone un nombre automático y guarda con él', async () => {
    const usuario = userEvent.setup();
    montar();
    await empezarDia(usuario);
    await usuario.click(screen.getByRole('button', { name: 'Registrar nueva comida' }));

    await anadirArroz(usuario, '80');

    expect(screen.getByText(/Se guardará como «Arroz»/)).toBeInTheDocument();
    const guardar = screen.getByRole('button', { name: 'Guardar comida' });
    expect(guardar).toBeEnabled();
    await usuario.click(guardar);

    await waitFor(() => expect(platosDeHoy()).toHaveLength(1));
    expect(platosDeHoy()[0].nombre).toBe('Arroz');
  });

  it('el toast "Deshacer" revierte el guardado', async () => {
    const usuario = userEvent.setup();
    montar();
    await empezarDia(usuario);
    await usuario.click(screen.getByRole('button', { name: 'Registrar nueva comida' }));

    await usuario.type(screen.getByLabelText('Nombre del plato'), 'Plato temporal');
    await anadirArroz(usuario, '100');
    await usuario.click(screen.getByRole('button', { name: 'Guardar comida' }));

    await waitFor(() => expect(platosDeHoy()).toHaveLength(1));

    const aviso = await screen.findByText('Comida guardada');
    await usuario.click(within(aviso.closest('div')!).getByRole('button', { name: /Deshacer/i }));

    await waitFor(() => expect(platosDeHoy()).toHaveLength(0));
    await waitFor(() => expect(filaGrupo('Carbohidratos')).toContain('0 de 8 bloques'));
  });

  it('CRITERIO 3 — editar un plato lo modifica en vez de duplicarlo', async () => {
    const usuario = userEvent.setup();
    montar();
    await empezarDia(usuario);
    await usuario.click(screen.getByRole('button', { name: 'Registrar nueva comida' }));

    await usuario.type(screen.getByLabelText('Nombre del plato'), 'Comida original');
    await anadirArroz(usuario, '100');
    await usuario.click(screen.getByRole('button', { name: 'Guardar comida' }));

    await waitFor(() => expect(platosDeHoy()).toHaveLength(1));
    const idOriginal = platosDeHoy()[0].id;

    // Desplegar la tarjeta para llegar a sus acciones.
    await usuario.click(await screen.findByRole('button', { name: /Comida original/i }));
    await usuario.click(await screen.findByRole('button', { name: 'Editar Comida original' }));

    const campoNombre = await screen.findByLabelText('Nombre del plato');
    await usuario.clear(campoNombre);
    await usuario.type(campoNombre, 'Comida editada');
    await usuario.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(platosDeHoy()[0].nombre).toBe('Comida editada'));
    expect(platosDeHoy()).toHaveLength(1);
    expect(platosDeHoy()[0].id).toBe(idOriginal);
  });

  it('salir con cambios sin guardar pide confirmación', async () => {
    const usuario = userEvent.setup();
    montar();
    await empezarDia(usuario);
    await usuario.click(screen.getByRole('button', { name: 'Registrar nueva comida' }));

    await usuario.type(screen.getByLabelText('Nombre del plato'), 'A medias');
    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }));

    const dialogo = await screen.findByRole('dialog');
    expect(
      within(dialogo).getByText('Tienes cambios sin guardar, ¿descartarlos?'),
    ).toBeInTheDocument();

    await usuario.click(within(dialogo).getByRole('button', { name: 'Descartar' }));
    await waitFor(() => expect(screen.queryByLabelText('Nombre del plato')).not.toBeInTheDocument());
    expect(platosDeHoy()).toHaveLength(0);
  });
});
