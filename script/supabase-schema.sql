-- SANA — schema Supabase
-- Esegui questo script nell'SQL editor del progetto Supabase.
--
-- Architettura: il backend Node/Express (cartella /backend) è l'unico
-- client che parla con Supabase, usando la service role key (che bypassa
-- sempre la Row Level Security). L'autenticazione è solo username (senza
-- password, per uso personale/privato): al primo accesso l'utente viene
-- creato al volo. RLS è comunque abilitata senza policy, così anon/authenticated
-- (se mai usate) non hanno accesso di default: solo la service role key può
-- leggere/scrivere.

create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists plan_days (
  user_id uuid not null references users(id) on delete cascade,
  day text not null check (day in ('mon','tue','wed','thu','fri','sat','sun')),
  label text not null default '',
  meals jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

create table if not exists logs (
  user_id uuid not null references users(id) on delete cascade,
  date date not null,
  day text not null,
  meals jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

create table if not exists plan_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  saved_at timestamptz not null default now(),
  label text not null default '',
  days jsonb not null default '{}'::jsonb
);

alter table users enable row level security;
alter table plan_days enable row level security;
alter table logs enable row level security;
alter table plan_versions enable row level security;
-- Nessuna policy definita: solo la service role key (usata dal backend) può
-- leggere/scrivere queste tabelle.

-- ---------------------------------------------------------------------------
-- Sezione "Progressi": cartelle con foto/video.
-- I file stanno in Supabase Storage (bucket privato "progress", creato in
-- automatico dal backend al primo upload); qui solo i metadati.
-- ---------------------------------------------------------------------------

create table if not exists progress_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists progress_media (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid not null references progress_folders(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  path text not null,
  filename text not null default '',
  type text not null check (type in ('image', 'video')),
  size bigint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists progress_media_folder_idx on progress_media(folder_id, created_at);

alter table progress_folders enable row level security;
alter table progress_media enable row level security;
