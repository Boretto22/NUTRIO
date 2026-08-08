import { Info, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Confirmar, Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { clonar } from '@/data/planSeed';
import { GRUPOS, GRUPOS_ORDEN } from '@/data/grupos';
import { formatearBloques, redondear, totalesDelPlan } from '@/lib/bloques';
import { normalizar } from '@/lib/search';
import { useApp } from '@/store/useApp';
import type { EstructuraPlan, GrupoId } from '@/types';

type Planes = { A: EstructuraPlan; B: EstructuraPlan };

export function EditarPlan() {
  const { estado, guardarPlanes, restaurarPlanes } = useApp();
  const { toast } = useToast();

  const [pestana, setPestana] = useState<'A' | 'B'>('A');
  const [borrador, setBorrador] = useState<Planes>(() => clonar(estado.planes));
  const [confirmarRestaurar, setConfirmarRestaurar] = useState(false);
  const [comidaEnEdicion, setComidaEnEdicion] = useState<{ id: string; nombre: string } | null>(null);
  const [comidaPorEliminar, setComidaPorEliminar] = useState<{ id: string; nombre: string } | null>(
    null,
  );

  // Si el plan guardado cambia desde fuera (importar backup, restaurar), resincroniza.
  useEffect(() => {
    setBorrador(clonar(estado.planes));
  }, [estado.planes]);

  const plan = borrador[pestana];
  const comidas = useMemo(() => [...plan.comidas].sort((a, b) => a.orden - b.orden), [plan.comidas]);
  const totales = useMemo(() => totalesDelPlan(plan), [plan]);
  const hayCambios = useMemo(
    () => JSON.stringify(borrador) !== JSON.stringify(estado.planes),
    [borrador, estado.planes],
  );

  const editarPlan = (fn: (p: EstructuraPlan) => EstructuraPlan) =>
    setBorrador((prev) => ({ ...prev, [pestana]: fn(clonar(prev[pestana])) }));

  const setValor = (comidaId: string, grupo: GrupoId, valor: string) =>
    editarPlan((p) => {
      const fila = { ...(p.bloques[comidaId] ?? {}) };
      if (valor === '') {
        delete fila[grupo];
      } else {
        const n = Number(valor.replace(',', '.'));
        fila[grupo] = Number.isFinite(n) && n >= 0 ? redondear(n, 2) : 0;
      }
      p.bloques[comidaId] = fila;
      return p;
    });

  const paso = (comidaId: string, grupo: GrupoId, delta: number) =>
    editarPlan((p) => {
      const fila = { ...(p.bloques[comidaId] ?? {}) };
      const siguiente = Math.max(0, redondear((fila[grupo] ?? 0) + delta, 2));
      if (siguiente === 0) delete fila[grupo];
      else fila[grupo] = siguiente;
      p.bloques[comidaId] = fila;
      return p;
    });

  const anadirComida = () => {
    const nombre = `Comida ${plan.comidas.length + 1}`;
    const id = idUnico(nombre, plan.comidas.map((c) => c.id));
    editarPlan((p) => {
      p.comidas = [...p.comidas, { id, nombre, orden: p.comidas.length + 1 }];
      p.bloques[id] = {};
      return p;
    });
    setComidaEnEdicion({ id, nombre });
  };

  const renombrarComida = (id: string, nombre: string) =>
    editarPlan((p) => {
      p.comidas = p.comidas.map((c) => (c.id === id ? { ...c, nombre } : c));
      return p;
    });

  const eliminarComida = (id: string) =>
    editarPlan((p) => {
      p.comidas = p.comidas
        .filter((c) => c.id !== id)
        .map((c, i) => ({ ...c, orden: i + 1 }));
      delete p.bloques[id];
      return p;
    });

  return (
    <div className="space-y-4 px-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <header>
        <h1 className="text-[17px] font-bold">Mi plan nutricional</h1>
        <p className="mt-0.5 text-[13px] text-neutral-600 dark:text-neutral-400">
          Bloques objetivo por comida y grupo de alimento.
        </p>
      </header>

      <div className="flex gap-1 rounded-xl bg-neutral-200/70 p-1 dark:bg-neutral-800" role="tablist">
        {(['A', 'B'] as const).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={pestana === id}
            onClick={() => setPestana(id)}
            className={`min-h-[40px] flex-1 rounded-lg text-[14px] font-bold transition-colors ${
              pestana === id
                ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-950 dark:text-neutral-100'
                : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            TIPO {id}
          </button>
        ))}
      </div>

      <p className="text-[13px] text-neutral-600 dark:text-neutral-400">{plan.descripcion}</p>

      <div className="space-y-3">
        {comidas.map((comida) => (
          <section key={comida.id} className="tarjeta overflow-hidden">
            <header className="flex items-center gap-1 border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">
              <h2 className="flex-1 text-[14px] font-bold">{comida.nombre}</h2>
              <button
                type="button"
                className="icono-btn !h-9 !w-9"
                onClick={() => setComidaEnEdicion({ id: comida.id, nombre: comida.nombre })}
                aria-label={`Renombrar ${comida.nombre}`}
              >
                <Pencil size={15} aria-hidden />
              </button>
              {comidas.length > 1 && (
                <button
                  type="button"
                  className="icono-btn !h-9 !w-9 !text-red-600 hover:!bg-red-50 dark:!text-red-400 dark:hover:!bg-red-500/10"
                  onClick={() => setComidaPorEliminar({ id: comida.id, nombre: comida.nombre })}
                  aria-label={`Eliminar ${comida.nombre}`}
                >
                  <Trash2 size={15} aria-hidden />
                </button>
              )}
            </header>

            <ul className="divide-y divide-neutral-100 dark:divide-neutral-800/70">
              {GRUPOS_ORDEN.map((g) => {
                const valor = plan.bloques[comida.id]?.[g];
                const inputId = `${pestana}-${comida.id}-${g}`;
                return (
                  <li key={g} className="flex items-center gap-2 px-3 py-1.5">
                    <label
                      htmlFor={inputId}
                      className="flex min-w-0 flex-1 items-center gap-2 text-[13.5px]"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: GRUPOS[g].color }}
                        aria-hidden
                      />
                      <span className="truncate">{GRUPOS[g].nombre}</span>
                    </label>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        className="icono-btn !h-9 !w-9 border border-neutral-200 dark:border-neutral-700"
                        onClick={() => paso(comida.id, g, -0.5)}
                        aria-label={`Quitar 0,5 bloques de ${GRUPOS[g].nombre} en ${comida.nombre}`}
                      >
                        −
                      </button>
                      <input
                        id={inputId}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step={0.5}
                        className="campo !w-16 !px-1 py-1.5 text-center tabular-nums"
                        placeholder="—"
                        value={valor ?? ''}
                        onChange={(e) => setValor(comida.id, g, e.target.value)}
                      />
                      <button
                        type="button"
                        className="icono-btn !h-9 !w-9 border border-neutral-200 dark:border-neutral-700"
                        onClick={() => paso(comida.id, g, 0.5)}
                        aria-label={`Añadir 0,5 bloques de ${GRUPOS[g].nombre} en ${comida.nombre}`}
                      >
                        +
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        <button type="button" className="btn-secundario w-full" onClick={anadirComida}>
          <Plus size={17} aria-hidden />
          Añadir comida
        </button>
      </div>

      <section className="tarjeta overflow-hidden">
        <header className="border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">
          <h2 className="text-[14px] font-bold">Total diario (calculado)</h2>
        </header>
        <ul className="divide-y divide-neutral-100 dark:divide-neutral-800/70">
          {GRUPOS_ORDEN.map((g) => (
            <li key={g} className="flex items-center gap-2 px-3 py-2 text-[13.5px]">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: GRUPOS[g].color }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate">{GRUPOS[g].nombre}</span>
              <span className="shrink-0 font-bold tabular-nums">
                {formatearBloques(totales[g])}
              </span>
            </li>
          ))}
          <li className="flex items-center gap-2 px-3 py-2 text-[13.5px]">
            <span className="h-2 w-2 shrink-0 rounded-full bg-sky-400" aria-hidden />
            <label htmlFor="leche-plan" className="min-w-0 flex-1 truncate">
              Leche semi diaria (ml)
            </label>
            <input
              id="leche-plan"
              type="number"
              inputMode="numeric"
              min={0}
              step={50}
              className="campo !w-24 !px-2 py-1.5 text-right tabular-nums"
              value={plan.lecheSemiMl}
              onChange={(e) =>
                editarPlan((p) => {
                  p.lecheSemiMl = Math.max(0, Math.round(Number(e.target.value) || 0));
                  return p;
                })
              }
            />
          </li>
        </ul>
      </section>

      <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-[13px] leading-snug text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
        <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
        Editar el plan solo afecta a los días futuros y al día de hoy; los días ya cerrados
        conservan el objetivo con el que se registraron.
      </p>

      <div className="space-y-2">
        <button
          type="button"
          className="btn-primario w-full"
          disabled={!hayCambios}
          onClick={() => {
            guardarPlanes(borrador);
            toast('Plan guardado');
          }}
        >
          Guardar plan
        </button>
        <button
          type="button"
          className="btn-secundario w-full"
          disabled={!hayCambios}
          onClick={() => {
            setBorrador(clonar(estado.planes));
            toast('Cambios descartados', 'info');
          }}
        >
          Descartar cambios
        </button>
        <button
          type="button"
          className="btn-fantasma w-full"
          onClick={() => setConfirmarRestaurar(true)}
        >
          <RotateCcw size={16} aria-hidden />
          Restaurar plan original
        </button>
      </div>

      <Confirmar
        abierto={confirmarRestaurar}
        titulo="Restaurar plan original"
        mensaje="Se descartarán tus cambios en los planes A y B y se recuperará el plan original del nutricionista. Los días ya registrados no se modifican."
        textoConfirmar="Restaurar"
        onCancelar={() => setConfirmarRestaurar(false)}
        onConfirmar={() => {
          restaurarPlanes();
          setConfirmarRestaurar(false);
          toast('Plan original restaurado');
        }}
      />

      <Confirmar
        abierto={comidaPorEliminar !== null}
        titulo="Eliminar comida"
        mensaje={
          <>
            Se eliminará <strong>{comidaPorEliminar?.nombre}</strong> del plan {pestana} y sus
            bloques objetivo. Los platos ya registrados en días anteriores no se borran.
          </>
        }
        textoConfirmar="Eliminar"
        peligro
        onCancelar={() => setComidaPorEliminar(null)}
        onConfirmar={() => {
          if (comidaPorEliminar) eliminarComida(comidaPorEliminar.id);
          setComidaPorEliminar(null);
        }}
      />

      {comidaEnEdicion && (
        <RenombrarComida
          nombreInicial={comidaEnEdicion.nombre}
          onCerrar={() => setComidaEnEdicion(null)}
          onGuardar={(nombre) => {
            renombrarComida(comidaEnEdicion.id, nombre);
            setComidaEnEdicion(null);
          }}
        />
      )}
    </div>
  );
}

function RenombrarComida({
  nombreInicial,
  onGuardar,
  onCerrar,
}: {
  nombreInicial: string;
  onGuardar: (nombre: string) => void;
  onCerrar: () => void;
}) {
  const [nombre, setNombre] = useState(nombreInicial);
  return (
    <Modal
      abierto
      titulo="Nombre de la comida"
      onCerrar={onCerrar}
      pie={
        <div className="flex gap-2">
          <button type="button" className="btn-secundario flex-1" onClick={onCerrar}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-primario flex-1"
            disabled={nombre.trim().length === 0}
            onClick={() => onGuardar(nombre.trim())}
          >
            Guardar
          </button>
        </div>
      }
    >
      <label className="etiqueta" htmlFor="nombre-comida">
        Nombre
      </label>
      <input
        id="nombre-comida"
        type="text"
        className="campo"
        value={nombre}
        autoFocus
        onChange={(e) => setNombre(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && nombre.trim()) onGuardar(nombre.trim());
        }}
      />
    </Modal>
  );
}

function idUnico(nombre: string, existentes: string[]): string {
  const base = normalizar(nombre).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'comida';
  let id = base;
  let n = 2;
  while (existentes.includes(id) || id === 'extra') {
    id = `${base}-${n}`;
    n += 1;
  }
  return id;
}
