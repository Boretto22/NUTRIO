// @vitest-environment jsdom
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import App from '@/App';
import { ToastProvider } from '@/components/Toast';
import { AppProvider } from '@/store/AppContext';
import { CLAVE_STORAGE } from '@/lib/storage';

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

/** Localiza la fila de un grupo dentro de la tabla de seguimiento. */
function filaGrupo(nombre: string) {
  const barra = screen
    .getAllByRole('progressbar')
    .find((el) => el.getAttribute('aria-label')?.startsWith(nombre));
  if (!barra) throw new Error(`No se encontró la fila del grupo ${nombre}`);
  return barra.getAttribute('aria-label') ?? '';
}

describe('flujo principal de la app', () => {
  beforeEach(() => {
    localStorage.clear();
    // El hash del router se comparte entre tests dentro del mismo entorno jsdom.
    window.location.hash = '';
  });

  it('CRITERIO 1 — al abrir por primera vez pide elegir plan y no deja saltarlo', async () => {
    montar();

    const dialogo = await screen.findByRole('dialog');
    expect(within(dialogo).getByText('¿Qué estructura sigues hoy?')).toBeInTheDocument();
    expect(within(dialogo).getByRole('radio', { name: /TIPO A/i })).toBeInTheDocument();
    expect(within(dialogo).getByRole('radio', { name: /TIPO B/i })).toBeInTheDocument();
    // Un gate no ofrece botón de cierre.
    expect(within(dialogo).queryByRole('button', { name: 'Cerrar' })).not.toBeInTheDocument();
  });

  it('CRITERIO 2 — registrar 100 g de arroz suma 5 bloques de carbohidratos', async () => {
    const usuario = userEvent.setup();
    montar();

    await usuario.click(await screen.findByRole('button', { name: /Empezar el día con Tipo A/i }));

    expect(filaGrupo('Carbohidratos')).toContain('0 de 8 bloques');

    await usuario.click(screen.getByRole('button', { name: 'Registrar nueva comida' }));

    await usuario.type(screen.getByLabelText('Nombre del plato'), 'Arroz con verduras');
    await usuario.type(screen.getByLabelText('Buscar alimento'), 'arroz');
    await usuario.click(await screen.findByRole('option', { name: /Arroz.*Blanco, integral/i }));
    await usuario.type(screen.getByLabelText('Peso crudo (g)'), '100');

    expect(screen.getByText(/= 5 bloques de Carbohidratos/)).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Guardar comida' }));

    await waitFor(() => expect(filaGrupo('Carbohidratos')).toContain('5 de 8 bloques'));
    expect(screen.getByText('Arroz con verduras')).toBeInTheDocument();
  });

  it('CRITERIO 3 — 60 g de legumbre cruda suman 2 CH y 2 Proteicos I', async () => {
    const usuario = userEvent.setup();
    montar();

    await usuario.click(await screen.findByRole('button', { name: /Empezar el día con Tipo A/i }));
    await usuario.click(screen.getByRole('button', { name: 'Registrar nueva comida' }));

    await usuario.type(screen.getByLabelText('Buscar alimento'), 'legumbre cruda');
    await usuario.click(await screen.findByRole('option', { name: /Legumbre cruda/i }));
    await usuario.type(screen.getByLabelText('Peso crudo (g)'), '60');

    expect(screen.getByText(/= 2 bloques de Carbohidratos/)).toBeInTheDocument();
    expect(screen.getAllByText('CH + PROT I').length).toBeGreaterThan(0);

    await usuario.click(screen.getByRole('button', { name: 'Guardar comida' }));

    await waitFor(() => expect(filaGrupo('Carbohidratos')).toContain('2 de 8 bloques'));
    expect(filaGrupo('Alim. Proteicos I')).toContain('2 de 9 bloques');
  });

  it('CRITERIO 4 — el toggle de yogur ajusta los objetivos del día tipo A', async () => {
    const usuario = userEvent.setup();
    montar();

    await usuario.click(await screen.findByRole('button', { name: /Empezar el día con Tipo A/i }));

    expect(filaGrupo('Carbohidratos')).toContain('de 8 bloques');

    await usuario.click(screen.getByRole('checkbox', { name: /Hoy tomo yogur bifidus/i }));

    await waitFor(() => expect(filaGrupo('Carbohidratos')).toContain('de 7.5 bloques'));
    expect(filaGrupo('Alim. Proteicos I')).toContain('de 8.5 bloques');
    expect(filaGrupo('Grasas')).toContain('de 6 bloques');
  });

  it('CRITERIO 5 — la búsqueda de alimentos ignora acentos y mayúsculas', async () => {
    const usuario = userEvent.setup();
    montar();

    await usuario.click(await screen.findByRole('button', { name: /Empezar el día con Tipo A/i }));
    await usuario.click(screen.getByRole('link', { name: /Alimentos/i }));

    const buscador = await screen.findByRole('searchbox', { name: 'Buscar alimento' });

    await usuario.type(buscador, 'PLATANO');
    expect(await screen.findByText('Plátano')).toBeInTheDocument();

    await usuario.clear(buscador);
    await usuario.type(buscador, 'berenj');
    expect(await screen.findByText('Berenjena')).toBeInTheDocument();
  });

  it('CRITERIO 6 — editar el plan no altera los objetivos de un día ya registrado', async () => {
    const usuario = userEvent.setup();
    const ayer = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

    // Día previo cerrado con el plan A original.
    localStorage.setItem(
      CLAVE_STORAGE,
      JSON.stringify({
        schemaVersion: 1,
        perfil: { nombre: 'Ana' },
        planes: {
          A: {
            id: 'A',
            nombre: 'Tipo A',
            descripcion: 'Solo proteína magra, más bloques de grasa',
            comidas: [{ id: 'desayuno', nombre: 'Desayuno', orden: 1 }],
            bloques: { desayuno: { carbohidratos: 8 } },
            lecheSemiMl: 200,
          },
          B: {
            id: 'B',
            nombre: 'Tipo B',
            descripcion: 'Proteína magra + proteína grasa',
            comidas: [{ id: 'desayuno', nombre: 'Desayuno', orden: 1 }],
            bloques: { desayuno: { carbohidratos: 8 } },
            lecheSemiMl: 200,
          },
        },
        dias: {
          [ayer]: {
            fecha: ayer,
            planId: 'A',
            objetivosSnapshot: {
              id: 'A',
              nombre: 'Tipo A',
              descripcion: 'Solo proteína magra',
              comidas: [{ id: 'desayuno', nombre: 'Desayuno', orden: 1 }],
              bloques: { desayuno: { carbohidratos: 8 } },
              lecheSemiMl: 200,
            },
            yogur: false,
            lecheMl: 0,
            platos: [
              {
                id: 'plato-1',
                nombre: 'Tostadas',
                comidaId: 'desayuno',
                hora: '09:00',
                ingredientes: [{ alimentoId: 'ch-arroz', gramos: 40, bloques: 2 }],
                creadoEn: new Date(Date.now() - 86_400_000).toISOString(),
              },
            ],
          },
        },
        platosFavoritos: [],
        ajustes: { toleranciaBloques: 0.5, primerDiaSemana: 1, tema: 'claro' },
      }),
    );

    montar();
    await usuario.click(await screen.findByRole('button', { name: /Empezar el día con Tipo A/i }));

    // Sube los CH del desayuno del plan A de 8 a 9.5 y guarda.
    await usuario.click(screen.getByRole('link', { name: /Plan/i }));
    const masCH = await screen.findByRole('button', {
      name: /Añadir 0,5 bloques de Carbohidratos en Desayuno/i,
    });
    await usuario.click(masCH);
    await usuario.click(masCH);
    await usuario.click(masCH);
    await usuario.click(screen.getByRole('button', { name: 'Guardar plan' }));

    // El día de ayer conserva su objetivo original de 8.
    await usuario.click(screen.getByRole('link', { name: 'Hoy' }));
    await usuario.click(await screen.findByRole('button', { name: 'Día anterior' }));

    await waitFor(() => expect(filaGrupo('Carbohidratos')).toContain('2 de 8 bloques'));
  });

  it('la conversión de cocido a crudo se aplica al guardar el ingrediente', async () => {
    const usuario = userEvent.setup();
    montar();

    await usuario.click(await screen.findByRole('button', { name: /Empezar el día con Tipo A/i }));
    await usuario.click(screen.getByRole('button', { name: 'Registrar nueva comida' }));

    await usuario.type(screen.getByLabelText('Buscar alimento'), 'arroz');
    await usuario.click(await screen.findByRole('option', { name: /Arroz.*Blanco, integral/i }));
    await usuario.click(screen.getByRole('checkbox', { name: /He pesado en cocido/i }));
    await usuario.type(screen.getByLabelText('Peso cocido (g)'), '300');

    expect(screen.getByText(/100 g/)).toBeInTheDocument();
    expect(screen.getByText(/= 5 bloques de Carbohidratos/)).toBeInTheDocument();
  });

  it('las frutas se registran en porciones con un stepper de 0,5', async () => {
    const usuario = userEvent.setup();
    montar();

    await usuario.click(await screen.findByRole('button', { name: /Empezar el día con Tipo A/i }));
    await usuario.click(screen.getByRole('button', { name: 'Registrar nueva comida' }));

    await usuario.type(screen.getByLabelText('Buscar alimento'), 'manzana');
    await usuario.click(await screen.findByRole('option', { name: /Manzana/i }));

    expect(screen.getByText(/1 bloque = 1 unidad \(120–200 g\)/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Peso crudo (g)')).not.toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: /Añadir 0,5 — Porciones de Manzana/i }));
    await usuario.click(screen.getByRole('button', { name: /Añadir 0,5 — Porciones de Manzana/i }));

    expect(screen.getByText(/= 1 bloque de Frutas/)).toBeInTheDocument();
  });

  it('el atajo de AOVE añade 1 bloque de grasa de 5 g', async () => {
    const usuario = userEvent.setup();
    montar();

    await usuario.click(await screen.findByRole('button', { name: /Empezar el día con Tipo A/i }));
    await usuario.click(screen.getByRole('button', { name: 'Registrar nueva comida' }));
    await usuario.click(screen.getByRole('button', { name: /\+1 bloque de grasa \(5 g AOVE\)/i }));

    expect(await screen.findByText(/= 1 bloque de Grasas/)).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Guardar comida' }));
    await waitFor(() => expect(filaGrupo('Grasas')).toContain('1 de 6.5 bloques'));
  });

  it('CRITERIO 7 — exportar, borrar e importar restaura el estado', async () => {
    const usuario = userEvent.setup();
    montar();

    await usuario.click(await screen.findByRole('button', { name: /Empezar el día con Tipo A/i }));
    await usuario.click(screen.getByRole('button', { name: 'Registrar nueva comida' }));
    await usuario.type(screen.getByLabelText('Nombre del plato'), 'Arroz de prueba');
    await usuario.type(screen.getByLabelText('Buscar alimento'), 'arroz');
    await usuario.click(await screen.findByRole('option', { name: /Arroz.*Blanco, integral/i }));
    await usuario.type(screen.getByLabelText('Peso crudo (g)'), '100');
    await usuario.click(screen.getByRole('button', { name: 'Guardar comida' }));

    await waitFor(() => expect(localStorage.getItem(CLAVE_STORAGE)).toContain('Arroz de prueba'));
    const backup = localStorage.getItem(CLAVE_STORAGE)!;

    const { validarBackup } = await import('@/lib/backup');
    const validacion = validarBackup(backup);
    expect(validacion.ok).toBe(true);
    expect(validacion.resumen?.dias).toBe(1);
    expect(validacion.resumen?.platos).toBe(1);
    expect(JSON.parse(backup)).toEqual(validacion.estado);
  });
});
