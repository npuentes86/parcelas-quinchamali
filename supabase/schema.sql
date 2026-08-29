-- ============================================================================
-- Parcelas Santa Rita — esquema Supabase
-- ============================================================================
-- Ejecutar completo en: Supabase Dashboard -> SQL Editor -> New query -> Run.
-- Es idempotente: se puede volver a ejecutar sin romper nada.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. LEADS — consultas que llegan desde el formulario del sitio
-- ---------------------------------------------------------------------------
create table if not exists public.leads (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  nombre        text not null,
  email         text not null,
  telefono      text not null,
  whatsapp      boolean not null default true,
  lote_interes  text,
  origen        text,
  estado        text not null default 'nuevo',

  -- El anon key es público: cualquiera puede intentar insertar. Estas
  -- restricciones son la única defensa real contra basura en la tabla.
  constraint leads_nombre_len   check (char_length(nombre)   between 2 and 120),
  constraint leads_email_fmt    check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint leads_email_len    check (char_length(email)    <= 200),
  constraint leads_telefono_len check (char_length(telefono) between 8 and 30),
  constraint leads_lote_len     check (lote_interes is null or char_length(lote_interes) <= 40),
  constraint leads_origen_len   check (origen is null or char_length(origen) <= 200),
  constraint leads_estado_valid check (estado in ('nuevo','contactado','visita','cerrado','descartado'))
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_estado_idx     on public.leads (estado);

alter table public.leads enable row level security;

-- El público puede INSERTAR una consulta y nada más.
-- No hay policy de SELECT/UPDATE/DELETE para anon => los leads son ilegibles
-- desde el sitio. Solo se leen desde el dashboard o con la service_role key.
drop policy if exists "anon puede crear leads" on public.leads;
create policy "anon puede crear leads"
  on public.leads for insert
  to anon
  with check (
    estado = 'nuevo'  -- nadie inserta un lead ya marcado como 'cerrado'
  );


-- ---------------------------------------------------------------------------
-- 2. LOTES — los 17 lotes de la Hijuela Número Dos
-- ---------------------------------------------------------------------------
create table if not exists public.lotes (
  numero          int primary key,
  estado          text not null default 'disponible',
  superficie_m2   int,
  precio_uf       numeric(10,2),
  frente          text,
  columna         text not null default 'izquierda',
  altura_px       int  not null default 64,
  destacado       boolean not null default false,
  actualizado_at  timestamptz not null default now(),

  constraint lotes_estado_valid  check (estado  in ('disponible','reservado','vendido')),
  constraint lotes_columna_valid check (columna in ('izquierda','derecha')),
  constraint lotes_altura_range  check (altura_px between 32 and 160)
);

alter table public.lotes enable row level security;

-- Los lotes son información pública del sitio: cualquiera puede leerlos.
-- No hay policy de escritura para anon => solo se editan desde el dashboard.
drop policy if exists "lotes son públicos" on public.lotes;
create policy "lotes son públicos"
  on public.lotes for select
  to anon
  using (true);

-- Mantiene actualizado_at al día cuando cambias un estado en el dashboard.
create or replace function public.touch_lotes_actualizado_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.actualizado_at := now();
  return new;
end;
$$;

drop trigger if exists lotes_touch_actualizado_at on public.lotes;
create trigger lotes_touch_actualizado_at
  before update on public.lotes
  for each row execute function public.touch_lotes_actualizado_at();


-- ---------------------------------------------------------------------------
-- 3. SEED — estado inicial, copiado del plano y del sitio actual
-- ---------------------------------------------------------------------------
-- Vendidos: 6, 13, 15, 17, 18  (5 vendidos / 12 disponibles)
insert into public.lotes (numero, estado, columna, altura_px, superficie_m2, precio_uf, frente, destacado) values
  ( 2, 'disponible', 'izquierda',  52, null,   null,    null,                                    false),
  ( 3, 'disponible', 'derecha',    64,  5200,   950.00, 'Camino público',                        true ),
  ( 4, 'disponible', 'izquierda',  64, null,   null,    null,                                    false),
  ( 5, 'disponible', 'derecha',    56, null,   null,    null,                                    false),
  ( 6, 'vendido',    'izquierda',  70, null,   null,    null,                                    false),
  ( 7, 'disponible', 'derecha',    58,  8400,  1480.00, 'Camino público + vista cordillera',     true ),
  ( 8, 'disponible', 'izquierda',  66, null,   null,    null,                                    false),
  ( 9, 'disponible', 'derecha',    60, 12000,  2100.00, 'Esquina, dos accesos',                  true ),
  (10, 'disponible', 'izquierda',  76, null,   null,    null,                                    false),
  (11, 'disponible', 'derecha',    62, null,   null,    null,                                    false),
  (12, 'disponible', 'izquierda',  70, 20000,  3400.00, 'Camino público + orilla de estero',     true ),
  (13, 'vendido',    'derecha',    64, null,   null,    null,                                    false),
  (14, 'disponible', 'izquierda',  74, null,   null,    null,                                    false),
  (15, 'vendido',    'derecha',    66, null,   null,    null,                                    false),
  (16, 'disponible', 'izquierda',  62, null,   null,    null,                                    false),
  (17, 'vendido',    'derecha',    60, null,   null,    null,                                    false),
  (18, 'vendido',    'izquierda',  56, null,   null,    null,                                    false)
on conflict (numero) do nothing;
