-- Tabella diario di defusione (Supabase / PostgreSQL)
-- Esegui da SQL Editor nel progetto Supabase dopo aver creato il progetto.

create table if not exists public.defusion_diary_entries (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null,
  prompt_id text not null,
  prompt_title text not null,
  body text not null
);

create index if not exists defusion_diary_entries_user_created_idx
  on public.defusion_diary_entries (user_id, created_at desc);

alter table public.defusion_diary_entries enable row level security;

create policy defusion_select_own on public.defusion_diary_entries
  for select using (auth.uid() = user_id);

create policy defusion_insert_own on public.defusion_diary_entries
  for insert with check (auth.uid() = user_id);

create policy defusion_update_own on public.defusion_diary_entries
  for update using (auth.uid() = user_id);

create policy defusion_delete_own on public.defusion_diary_entries
  for delete using (auth.uid() = user_id);
