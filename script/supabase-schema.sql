-- SANA — schema Supabase
-- Esegui questo script nell'SQL editor del progetto Supabase.

-- Estensione per gen_random_uuid()
create extension if not exists "pgcrypto";

-- Piano: un record per giorno della settimana per utente
create table if not exists plan_days (
  user_id uuid not null references auth.users(id) on delete cascade,
  day text not null check (day in ('mon','tue','wed','thu','fri','sat','sun')),
  label text not null default '',
  meals jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

-- Log giornaliero: cosa è stato fatto in un dato giorno
create table if not exists logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  day text not null,
  meals jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

-- Versioni archiviate del piano (storico)
create table if not exists plan_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  saved_at timestamptz not null default now(),
  label text not null default '',
  days jsonb not null default '{}'::jsonb
);

-- Row Level Security: ognuno vede/modifica solo i propri dati
alter table plan_days enable row level security;
alter table logs enable row level security;
alter table plan_versions enable row level security;

create policy "plan_days_owner" on plan_days
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "logs_owner" on logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "plan_versions_owner" on plan_versions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Nota: il login è "solo username e password". Supabase Auth richiede
-- un'email internamente, quindi l'app converte lo username in
-- un'email fittizia (es. "mario" -> "mario@sana.local") in modo
-- trasparente per l'utente. Per creare un nuovo utente basta usare
-- il form di registrazione nell'app stessa (o Supabase Auth UI/API).
