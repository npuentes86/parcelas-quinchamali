/* ═══════════════════════════════════════════════════════════
   POST /api/lead — guarda una consulta del sitio en D1.

   Contexto: el sitio no tenía servidor. El formulario armaba un
   mensaje y abría WhatsApp, así que la única huella de un lead
   era el mensaje en el teléfono del propietario, y quien se
   arrepentía antes de enviarlo no dejaba rastro de ninguna clase.

   Este Worker no reemplaza a WhatsApp: se escribe la fila y el
   navegador abre WhatsApp igual. Si el Worker falla, el formulario
   sigue funcionando como antes, porque el navegador no espera la
   respuesta.

   Lo que a propósito NO hace: disparar el evento Lead de la API
   de conversiones de Meta. El sitio ya lo dispara del lado del
   navegador en js/pixel.js, y sumar el lado servidor con el mismo
   pixel duplica la cuenta.
   ═══════════════════════════════════════════════════════════ */

interface Env {
  DB: D1Database;
}

/* Solo el sitio. Sin comodín: este endpoint escribe en una base. */
const ORIGENES = new Set([
  'https://parcelasquinchamali.cl',
  'https://www.parcelasquinchamali.cl',
]);

const LIMITE_ENVIOS = 5;
const LIMITE_MINUTOS = 60;

const LARGO = {
  nombre: 120,
  email: 200,
  telefono: 40,
  lote: 40,
  mensaje: 2000,
  idempotency_key: 100,
  utm: 200,
  url: 500,
} as const;

function cors(origen: string | null): Record<string, string> {
  const permitido = origen && ORIGENES.has(origen) ? origen : '';
  return {
    'access-control-allow-origin': permitido,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    vary: 'origin',
  };
}

function json(body: unknown, status: number, origen: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...cors(origen) },
  });
}

function texto(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

/* Chile: 9 dígitos con el 9 delante. Se guarda también el original,
   porque lo normalizado sirve para deduplicar y lo escrito sirve
   para devolver la llamada tal como la persona la dictó. */
function normalizarTelefono(valor: string): string {
  const d = valor.replace(/[^0-9]/g, '');
  if (d.length === 9 && d.startsWith('9')) return '+56' + d;
  if (d.length === 11 && d.startsWith('56')) return '+' + d;
  if (d.length === 8) return '+569' + d;
  return d ? '+' + d : '';
}

function origenReferente(valor: string): string {
  try {
    return new URL(valor).origin;
  } catch {
    return '';
  }
}

/* Las mismas reglas que valida el navegador en js/main.js. Se repiten
   acá porque el navegador se puede saltar. */
function validar(b: Record<string, unknown>): { ok: false; campos: string[] } | { ok: true } {
  const campos: string[] = [];
  if (texto(b.nombre, LARGO.nombre).length < 2) campos.push('nombre');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto(b.email, LARGO.email))) campos.push('email');
  if (texto(b.telefono, LARGO.telefono).replace(/[^0-9]/g, '').length < 8) campos.push('telefono');
  if (texto(b.idempotency_key, LARGO.idempotency_key).length < 8) campos.push('idempotency_key');
  return campos.length ? { ok: false, campos } : { ok: true };
}

async function manejarLead(request: Request, env: Env, origen: string | null): Promise<Response> {
  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'No se pudo leer el envío.' }, 400, origen);
  }

  const revision = validar(cuerpo);
  if (!revision.ok) {
    return json({ error: 'Revisa los campos marcados.', campos: revision.campos }, 422, origen);
  }

  /* Los bots llenan campos ocultos. Se responde como si todo hubiera
     salido bien, para que no aprendan a esquivarlo, y no se guarda nada. */
  if (texto(cuerpo.sitio_web, 200)) {
    return json({ ok: true }, 202, origen);
  }

  const ip = request.headers.get('cf-connecting-ip') ?? '';
  const cf = (request as { cf?: { country?: string; region?: string } }).cf;

  try {
    const fila = await env.DB.prepare(
      `SELECT COUNT(*) AS recientes FROM leads
        WHERE submit_ip = ? AND submit_ip <> ''
          AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', ?)`,
    )
      .bind(ip, `-${LIMITE_MINUTOS} minutes`)
      .first<{ recientes: number }>();
    if (fila && fila.recientes >= LIMITE_ENVIOS) {
      return json({ error: 'Demasiados envíos. Intenta más tarde.' }, 429, origen);
    }
  } catch (e) {
    /* Que falle el conteo no puede bloquear una consulta real. */
    console.error('falló el control de frecuencia', e);
  }

  const clave = texto(cuerpo.idempotency_key, LARGO.idempotency_key);

  /* Reenvío de algo que el navegador ya mandó: se devuelve el mismo
     resultado en vez de crear una segunda consulta. */
  const existente = await env.DB.prepare(
    `SELECT public_id FROM leads WHERE idempotency_key = ? LIMIT 1`,
  )
    .bind(clave)
    .first<{ public_id: string }>();
  if (existente) {
    return json({ ok: true, id: existente.public_id, repetido: true }, 200, origen);
  }

  const publicId = `lead_${crypto.randomUUID()}`;
  const telefono = texto(cuerpo.telefono, LARGO.telefono);

  try {
    await env.DB.prepare(
      `INSERT INTO leads (
         public_id, idempotency_key,
         nombre, email, telefono, telefono_normalizado, lote, mensaje, origen,
         utm_source, utm_medium, utm_campaign, utm_content, utm_term, fbclid,
         referrer_origin, landing_path, pais, region, submit_ip, user_agent
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        publicId,
        clave,
        texto(cuerpo.nombre, LARGO.nombre),
        texto(cuerpo.email, LARGO.email),
        telefono,
        normalizarTelefono(telefono),
        texto(cuerpo.lote, LARGO.lote),
        texto(cuerpo.mensaje, LARGO.mensaje),
        'formulario',
        texto(cuerpo.utm_source, LARGO.utm),
        texto(cuerpo.utm_medium, LARGO.utm),
        texto(cuerpo.utm_campaign, LARGO.utm),
        texto(cuerpo.utm_content, LARGO.utm),
        texto(cuerpo.utm_term, LARGO.utm),
        texto(cuerpo.fbclid, LARGO.utm),
        origenReferente(texto(cuerpo.referrer, LARGO.url)),
        texto(cuerpo.landing_path, LARGO.url),
        cf?.country ?? '',
        cf?.region ?? '',
        ip,
        texto(request.headers.get('user-agent'), 300),
      )
      .run();
  } catch (e) {
    console.error('no se pudo guardar la consulta', e);
    return json({ error: 'No se pudo guardar la consulta.' }, 503, origen);
  }

  return json({ ok: true, id: publicId }, 201, origen);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origen = request.headers.get('origin');
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors(origen) });
    }

    if (url.pathname === '/api/lead') {
      if (request.method !== 'POST') {
        return json({ error: 'Usa POST.' }, 405, origen);
      }
      if (!origen || !ORIGENES.has(origen)) {
        return json({ error: 'Origen no permitido.' }, 403, origen);
      }
      return manejarLead(request, env, origen);
    }

    /* Sonda de salud: confirma que el Worker responde en esta ruta,
       que es lo que separa "el Worker está caído" de "el Worker está
       vivo y rechazó el envío". */
    if (url.pathname === '/api/salud') {
      return json({ ok: true, worker: 'parcelas-leads' }, 200, origen);
    }

    return json({ error: 'No existe.' }, 404, origen);
  },
};
