-- Eventi community in calendario (tabella public.community_events).
-- NON crea la chat: public.community_global_messages sta in supabase/community.sql — esegui anche quello nello stesso progetto Supabase dell’app.
-- Esegui questo file dopo community.sql (stesso database).

create table if not exists public.community_events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  description text check (description is null or char_length(description) <= 2000),
  starts_at timestamptz not null,
  location_hint text check (location_hint is null or char_length(location_hint) <= 200),
  external_url text check (external_url is null or char_length(external_url) <= 500),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists community_events_starts_at_idx
  on public.community_events (starts_at asc);

alter table public.community_events enable row level security;

-- Idempotente: rieseguire lo script non fallisce se le policy esistono già.
drop policy if exists community_events_select_public_future on public.community_events;
drop policy if exists community_events_insert_auth on public.community_events;
drop policy if exists community_events_update_own on public.community_events;
drop policy if exists community_events_delete_own on public.community_events;

-- Home e app: chiunque (anche anon con la publishable key) può leggere eventi futuri.
create policy community_events_select_public_future
  on public.community_events for select
  using (starts_at >= (now() - interval '1 hour'));

create policy community_events_insert_auth
  on public.community_events for insert to authenticated
  with check (auth.uid() = created_by);

create policy community_events_update_own
  on public.community_events for update to authenticated
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

create policy community_events_delete_own
  on public.community_events for delete to authenticated
  using (auth.uid() = created_by);

-- Realtime opzionale (lista admin / community in app)
-- alter publication supabase_realtime add table public.community_events;

-- Esempio (solo dopo login reale: created_by = id utente da auth.users)
-- insert into public.community_events (title, description, starts_at, location_hint, created_by)
-- values (
--   'Cerchio di ascolto',
--   'Breve presentazione e spazio condiviso.',
--   now() + interval '10 days',
--   'Online',
--   '00000000-0000-0000-0000-000000000000'::uuid
-- );
