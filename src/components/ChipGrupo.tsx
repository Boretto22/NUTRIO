import { GRUPOS } from '@/data/grupos';
import { formatearBloques } from '@/lib/bloques';
import type { GrupoId } from '@/types';

interface ChipGrupoProps {
  grupo: GrupoId;
  /** Si se indica, se muestra el nº de bloques junto al nombre. */
  bloques?: number;
  corto?: boolean;
  tamano?: 'sm' | 'md';
  className?: string;
}

export function ChipGrupo({
  grupo,
  bloques,
  corto = true,
  tamano = 'sm',
  className = '',
}: ChipGrupoProps) {
  const meta = GRUPOS[grupo];
  const padding = tamano === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-[13px]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${padding} ${className}`}
      style={{ backgroundColor: `${meta.color}1f`, color: meta.color }}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: meta.color }}
        aria-hidden
      />
      {bloques !== undefined && <span className="tabular-nums">{formatearBloques(bloques)}</span>}
      {corto ? meta.nombreCorto : meta.nombre}
    </span>
  );
}

export function BadgeDobleComputo({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-dashed px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${className}`}
      style={{
        borderColor: GRUPOS.proteicos1.color,
        color: GRUPOS.proteicos1.color,
        backgroundColor: `${GRUPOS.proteicos1.color}12`,
      }}
      title="Las legumbres restan a la vez 1 bloque de Carbohidratos y 1 de Proteicos I"
    >
      CH + PROT I
    </span>
  );
}
