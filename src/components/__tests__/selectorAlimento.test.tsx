// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { SelectorAlimento } from '@/components/SelectorAlimento';
import { ALIMENTOS } from '@/data/alimentos';
import type { Alimento } from '@/types';

function Anfitrion() {
  const [valor, setValor] = useState<Alimento | null>(null);
  return (
    <SelectorAlimento
      alimentos={ALIMENTOS}
      valor={valor}
      onSeleccionar={setValor}
      onLimpiar={() => setValor(null)}
    />
  );
}

describe('SelectorAlimento', () => {
  it('abre la lista y filtra al escribir', async () => {
    const usuario = userEvent.setup();
    render(<Anfitrion />);

    const input = screen.getByRole('combobox', { name: 'Buscar alimento' });
    await usuario.type(input, 'arroz');

    expect(input).toHaveValue('arroz');
    expect(input).toHaveAttribute('aria-expanded', 'true');

    const opciones = await screen.findAllByRole('option');
    expect(opciones.length).toBeGreaterThan(0);
    expect(opciones[0]).toHaveTextContent('Arroz');
    expect(opciones[0]).toHaveTextContent('1 bloque = 20 g');
  });

  it('se navega con el teclado y Enter selecciona', async () => {
    const usuario = userEvent.setup();
    render(<Anfitrion />);

    const input = screen.getByRole('combobox', { name: 'Buscar alimento' });
    await usuario.type(input, 'berenj');
    await usuario.keyboard('{Enter}');

    expect(screen.getByText('Berenjena')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cambiar alimento \(Berenjena\)/i })).toBeInTheDocument();
  });

  it('marca las legumbres con el badge de doble cómputo', async () => {
    const usuario = userEvent.setup();
    render(<Anfitrion />);

    await usuario.type(screen.getByRole('combobox', { name: 'Buscar alimento' }), 'garbanzo');
    expect((await screen.findAllByText('CH + PROT I')).length).toBeGreaterThan(0);
  });
});
