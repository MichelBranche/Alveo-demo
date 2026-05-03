-- Preferenze profilo app (audiolibri, area personale, volume) — una riga per utente.
-- Esegui da SQL Editor nel progetto Supabase (come defusion_diary.sql).

create table if not exists public.user_app_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  audiobook_last_playback jsonb,
  saved_audiobook_chapters jsonb not null default '[]'::jsonb,
  oasis_mood text,
  audiobook_volume real,
  updated_at timestamptz not null default now()
);

create index if not exists user_app_preferences_updated_idx
  on public.user_app_preferences (user_id, updated_at desc);

alter table public.user_app_preferences enable row level security;

create policy user_app_prefs_select_own on public.user_app_preferences
  for select using (auth.uid() = user_id);

create policy user_app_prefs_insert_own on public.user_app_preferences
  for insert with check (auth.uid() = user_id);

create policy user_app_prefs_update_own on public.user_app_preferences
  for update using (auth.uid() = user_id);

create policy user_app_prefs_delete_own on public.user_app_preferences
  for delete using (auth.uid() = user_id);
