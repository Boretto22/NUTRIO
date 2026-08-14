import {
  AlertTriangle,
  BookOpen,
  CalendarClock,
  CalendarRange,
  ChevronDown,
  Download,
  Eraser,
  Monitor,
  Moon,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react';
import { useRef, useState } from 'react';

import { Logo } from '@/components/Logo';
import { Confirmar, Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { INSTRUCCIONES } from '@/data/instrucciones';
import {
  descargarBackup,
  fusionarEstados,
  resumirEstado,
  validarBackup,
  type ResumenBackup,
} from '@/lib/backup';
import { formatearBloques } from '@/lib/bloques';
import { restaurarDeviceId, track } from '@/lib/analytics';
import { useApp } from '@/store/useApp';
import type { AppState } from '@/types';

const TOLERANCIAS = [0.25, 0.5, 0.75, 1];

export function Usuario() {
  const {
    estado,
    setNombre,
    setAjustes,
    reemplazarEstado,
    borrarTodo,
    limpiarPlanificacionAnterior,
  } = useApp();
  const { toast } = useToast();
  const inputArchivo = useRef<HTMLInputElement>(null);

  const [importacion, setImportacion] = useState<{
    estado: AppState;
    resumen: ResumenBackup;
    deviceId?: string;
  } | null>(null);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const [textoBorrado, setTextoBorrado] = useState('');
  const [seccionAbierta, setSeccionAbierta] = useState<number | null>(null);

  const resumenActual = resumirEstado(estado);

  const onArchivo = async (archivo: File) => {
    const texto = await archivo.text();
    const resultado = validarBackup(texto);
    if (!resultado.ok || !resultado.estado || !resultado.resumen) {
      toast(resultado.error ?? 'El backup no es válido', 'error');
      return;
    }
    setImportacion({
      estado: resultado.estado,
      resumen: resultado.resumen,
      deviceId: resultado.deviceId,
    });
  };

  return (
    <div className="space-y-4 px-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <div className="flex flex-col items-center pb-1 pt-2">
        <Logo variant="lockup" size="lg" />
        <p className="mt-2 text-[12px] text-neutral-500 dark:text-neutral-400">
          Versión {__VERSION_APP__}
        </p>
      </div>

      <h1 className="text-[17px] font-bold">Usuario y ajustes</h1>

      <section className="tarjeta p-3">
        <label className="etiqueta" htmlFor="nombre-usuario">
          Tu nombre
        </label>
        <input
          id="nombre-usuario"
          type="text"
          className="campo"
          placeholder="Se usa en el saludo de la pantalla principal"
          value={estado.perfil.nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </section>

      <section className="tarjeta overflow-hidden">
        <header className="border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">
          <h2 className="text-[14px] font-bold">Ajustes</h2>
        </header>

        <div className="space-y-4 p-3">
          <div>
            <span className="etiqueta">Tolerancia de cumplimiento</span>
            <div className="flex gap-1.5">
              {TOLERANCIAS.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={estado.ajustes.toleranciaBloques === t}
                  onClick={() => setAjustes({ toleranciaBloques: t })}
                  className={`min-h-[38px] flex-1 rounded-lg text-[13px] font-semibold transition-colors ${
                    estado.ajustes.toleranciaBloques === t
                      ? 'bg-marca-600 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'
                  }`}
                >
                  ±{formatearBloques(t)}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[12px] leading-snug text-neutral-500 dark:text-neutral-400">
              Margen de bloques respecto al objetivo para dar un grupo por cumplido en la racha.
            </p>
          </div>

          <div>
            <span className="etiqueta">Primer día de la semana</span>
            <div className="flex gap-1.5">
              {([1, 0] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={estado.ajustes.primerDiaSemana === d}
                  onClick={() => setAjustes({ primerDiaSemana: d })}
                  className={`min-h-[38px] flex-1 rounded-lg text-[13px] font-semibold transition-colors ${
                    estado.ajustes.primerDiaSemana === d
                      ? 'bg-marca-600 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'
                  }`}
                >
                  {d === 1 ? 'Lunes' : 'Domingo'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="etiqueta">Modo del calendario</span>
            <div className="flex gap-1.5">
              {(
                [
                  { id: 'agenda', nombre: 'Agenda', Icono: CalendarRange },
                  { id: 'programar', nombre: 'Programar', Icono: CalendarClock },
                ] as const
              ).map(({ id, nombre, Icono }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={estado.ajustes.modoCalendario === id}
                  onClick={() => setAjustes({ modoCalendario: id })}
                  className={`flex min-h-[38px] flex-1 items-center justify-center gap-1.5 rounded-lg text-[13px] font-semibold transition-colors ${
                    estado.ajustes.modoCalendario === id
                      ? 'bg-marca-600 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'
                  }`}
                >
                  <Icono size={15} aria-hidden />
                  {nombre}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[12px] leading-snug text-neutral-500 dark:text-neutral-400">
              {estado.ajustes.modoCalendario === 'agenda'
                ? 'Agenda: el menú previsto es solo una referencia; lo registras tú desde Hoy.'
                : 'Programar: al llegar el día, el menú previsto aparece en Hoy pendiente de confirmar.'}
            </p>
            <button
              type="button"
              className="btn-secundario mt-2 w-full"
              onClick={() => {
                limpiarPlanificacionAnterior();
                toast('Planificación anterior a hoy eliminada', 'info');
              }}
            >
              <Eraser size={16} aria-hidden />
              Limpiar planificación anterior a hoy
            </button>
          </div>

          <div>
            <span className="etiqueta">Tema</span>
            <div className="flex gap-1.5">
              {(
                [
                  { id: 'claro', nombre: 'Claro', Icono: Sun },
                  { id: 'oscuro', nombre: 'Oscuro', Icono: Moon },
                  { id: 'sistema', nombre: 'Sistema', Icono: Monitor },
                ] as const
              ).map(({ id, nombre, Icono }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={estado.ajustes.tema === id}
                  onClick={() => setAjustes({ tema: id })}
                  className={`flex min-h-[38px] flex-1 items-center justify-center gap-1.5 rounded-lg text-[13px] font-semibold transition-colors ${
                    estado.ajustes.tema === id
                      ? 'bg-marca-600 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'
                  }`}
                >
                  <Icono size={15} aria-hidden />
                  {nombre}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="tarjeta overflow-hidden">
        <header className="border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">
          <h2 className="text-[14px] font-bold">Copia de seguridad</h2>
        </header>
        <div className="space-y-2 p-3">
          <p className="text-[13px] leading-snug text-neutral-600 dark:text-neutral-400">
            Tus datos viven solo en este dispositivo. {resumenActual.texto}
          </p>
          <button
            type="button"
            className="btn-secundario w-full"
            onClick={() => {
              descargarBackup(estado);
              track('backup_exportado');
              toast('Backup descargado');
            }}
          >
            <Download size={17} aria-hidden />
            Exportar backup (.json)
          </button>
          <button
            type="button"
            className="btn-secundario w-full"
            onClick={() => inputArchivo.current?.click()}
          >
            <Upload size={17} aria-hidden />
            Importar backup
          </button>
          <input
            ref={inputArchivo}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              if (archivo) void onArchivo(archivo);
              e.target.value = '';
            }}
          />
        </div>
      </section>

      <section className="tarjeta overflow-hidden">
        <header className="flex items-center gap-2 border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">
          <BookOpen size={15} className="text-marca-600 dark:text-marca-400" aria-hidden />
          <h2 className="text-[14px] font-bold">Cómo funciona mi plan</h2>
        </header>
        <ul className="divide-y divide-neutral-100 dark:divide-neutral-800/70">
          {INSTRUCCIONES.map((seccion, i) => (
            <li key={seccion.titulo}>
              <button
                type="button"
                aria-expanded={seccionAbierta === i}
                onClick={() => setSeccionAbierta(seccionAbierta === i ? null : i)}
                className="flex min-h-[46px] w-full items-center gap-2 px-3 text-left text-[13.5px] font-semibold transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              >
                <span className="flex-1">{seccion.titulo}</span>
                <ChevronDown
                  size={16}
                  className={`shrink-0 text-neutral-400 transition-transform ${
                    seccionAbierta === i ? 'rotate-180' : ''
                  }`}
                  aria-hidden
                />
              </button>
              {seccionAbierta === i && (
                <ul className="space-y-1.5 px-3 pb-3 pl-5">
                  {seccion.puntos.map((punto) => (
                    <li
                      key={punto}
                      className="list-disc text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400"
                    >
                      {punto}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="tarjeta overflow-hidden border-red-200 dark:border-red-900/50">
        <header className="border-b border-red-200 px-3 py-2 dark:border-red-900/50">
          <h2 className="flex items-center gap-2 text-[14px] font-bold text-red-700 dark:text-red-400">
            <AlertTriangle size={15} aria-hidden />
            Zona peligrosa
          </h2>
        </header>
        <div className="p-3">
          <button
            type="button"
            className="btn-peligro w-full"
            onClick={() => {
              setTextoBorrado('');
              setConfirmarBorrado(true);
            }}
          >
            <Trash2 size={17} aria-hidden />
            Borrar todos los datos
          </button>
        </div>
      </section>

      <p className="pb-2 text-center text-[11.5px] leading-relaxed text-neutral-400">
        Nutrio · datos almacenados localmente · v{estado.schemaVersion}
        <br />
        Desarrollado por Antoni Pozo Miró
      </p>

      {importacion && (
        <Modal
          abierto
          titulo="Importar backup"
          onCerrar={() => setImportacion(null)}
          pie={
            <div className="space-y-2">
              <button
                type="button"
                className="btn-primario w-full"
                onClick={() => {
                  if (importacion.deviceId) restaurarDeviceId(importacion.deviceId);
                  reemplazarEstado(fusionarEstados(estado, importacion.estado));
                  setImportacion(null);
                  track('backup_importado');
                  toast('Backup fusionado con tus datos');
                }}
              >
                Fusionar con mis datos
              </button>
              <button
                type="button"
                className="btn-peligro w-full"
                onClick={() => {
                  if (importacion.deviceId) restaurarDeviceId(importacion.deviceId);
                  reemplazarEstado(importacion.estado);
                  setImportacion(null);
                  track('backup_importado');
                  toast('Datos reemplazados por el backup');
                }}
              >
                Reemplazar todo
              </button>
              <button
                type="button"
                className="btn-secundario w-full"
                onClick={() => setImportacion(null)}
              >
                Cancelar
              </button>
            </div>
          }
        >
          <div className="space-y-3 text-[14px]">
            <div className="rounded-xl bg-neutral-100 p-3 dark:bg-neutral-800/70">
              <p className="font-semibold">Archivo válido</p>
              <p className="mt-1 text-[13px] text-neutral-600 dark:text-neutral-400">
                {importacion.resumen.texto}
              </p>
              {importacion.resumen.nombre && (
                <p className="mt-1 text-[13px] text-neutral-600 dark:text-neutral-400">
                  Perfil: {importacion.resumen.nombre}
                </p>
              )}
            </div>
            <div className="rounded-xl bg-neutral-100 p-3 dark:bg-neutral-800/70">
              <p className="font-semibold">Tus datos actuales</p>
              <p className="mt-1 text-[13px] text-neutral-600 dark:text-neutral-400">
                {resumenActual.texto}
              </p>
            </div>
            <p className="text-[13px] leading-snug text-neutral-600 dark:text-neutral-400">
              <strong>Reemplazar todo</strong> borra tus datos actuales.{' '}
              <strong>Fusionar</strong> conserva ambos; si un mismo día existe en los dos, se queda
              el más reciente.
            </p>
          </div>
        </Modal>
      )}

      <Confirmar
        abierto={confirmarBorrado}
        titulo="Borrar todos los datos"
        peligro
        textoConfirmar="Borrar definitivamente"
        mensaje={
          <div className="space-y-3">
            <p>
              Se eliminarán tu perfil, tus planes, todos los días registrados y tus favoritos. Esta
              acción no se puede deshacer.
            </p>
            <p>
              Escribe <strong>BORRAR</strong> para confirmar:
            </p>
            <input
              type="text"
              className="campo"
              value={textoBorrado}
              autoComplete="off"
              aria-label="Escribe BORRAR para confirmar"
              onChange={(e) => setTextoBorrado(e.target.value)}
            />
          </div>
        }
        onCancelar={() => setConfirmarBorrado(false)}
        onConfirmar={() => {
          if (textoBorrado.trim().toUpperCase() !== 'BORRAR') {
            toast('Escribe BORRAR para confirmar', 'error');
            return;
          }
          borrarTodo();
          setConfirmarBorrado(false);
          toast('Todos los datos han sido borrados', 'info');
        }}
      />
    </div>
  );
}
