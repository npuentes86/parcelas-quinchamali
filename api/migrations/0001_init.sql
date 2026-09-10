-- Consultas del sitio de Parcelas Santa Rita.
--
-- La base es la fuente de verdad. La fila se escribe en cuanto la persona
-- envía el formulario, ANTES de que se abra WhatsApp, así que también queda
-- registrada la consulta de quien nunca llega a mandar el mensaje. Ese es
-- justamente el lead que hoy se pierde entero.

CREATE TABLE IF NOT EXISTS leads (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id            TEXT NOT NULL UNIQUE,
  idempotency_key      TEXT NOT NULL UNIQUE,
  created_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  -- Con DEFAULT '' en vez de obligatorios: así cabe más adelante una fila de
  -- "tocó el botón de WhatsApp", que no trae nombre ni correo, sin migrar.
  nombre               TEXT NOT NULL DEFAULT '',
  email                TEXT NOT NULL DEFAULT '',
  telefono             TEXT NOT NULL DEFAULT '',
  telefono_normalizado TEXT NOT NULL DEFAULT '',
  lote                 TEXT NOT NULL DEFAULT '',
  mensaje              TEXT NOT NULL DEFAULT '',

  -- 'formulario' hoy. Reservado para 'whatsapp' y 'telefono' si algún día se
  -- cuentan también los clics directos.
  origen               TEXT NOT NULL DEFAULT 'formulario',

  utm_source           TEXT NOT NULL DEFAULT '',
  utm_medium           TEXT NOT NULL DEFAULT '',
  utm_campaign         TEXT NOT NULL DEFAULT '',
  utm_content          TEXT NOT NULL DEFAULT '',
  utm_term             TEXT NOT NULL DEFAULT '',
  fbclid               TEXT NOT NULL DEFAULT '',
  referrer_origin      TEXT NOT NULL DEFAULT '',
  landing_path         TEXT NOT NULL DEFAULT '',

  -- De request.cf, no del navegador. Sirve para separar la consulta chilena
  -- real del ruido, que es la duda que abrió todo esto.
  pais                 TEXT NOT NULL DEFAULT '',
  region               TEXT NOT NULL DEFAULT '',

  submit_ip            TEXT NOT NULL DEFAULT '',
  user_agent           TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at);
CREATE INDEX IF NOT EXISTS idx_leads_origen     ON leads (origen, created_at);
CREATE INDEX IF NOT EXISTS idx_leads_rate_limit ON leads (submit_ip, created_at);
