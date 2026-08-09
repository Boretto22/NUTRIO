type VercelRequest = {
  method?: string;
};

type VercelResponse = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  end: () => void;
};

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
};

/**
 * Gate de acceso remoto. La suscripción se controla con LICENSE_ACTIVE en el
 * entorno de Vercel (true = acceso; cualquier otro valor o ausencia = 403).
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  for (const [clave, valor] of Object.entries(CORS)) {
    res.setHeader(clave, valor);
  }

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.status(405).json({ active: false, message: 'Método no permitido' });
    return;
  }

  if (process.env.LICENSE_ACTIVE === 'true') {
    res.status(200).json({ active: true });
    return;
  }

  res.status(403).json({
    active: false,
    message: 'Suscripción temporalmente pausada',
  });
}
