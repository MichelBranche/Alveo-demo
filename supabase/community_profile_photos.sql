-- Foto pubbliche sul profilo community + lettura amicizie per directory profili.
-- Esegui nel SQL Editor Supabase sullo stesso progetto di community.sql.

-- ---------------------------------------------------------------------------
-- Amicizie: chiunque sia autenticato può leggere le coppie (per conteggi / elenco amici sui profili).
-- La policy esistente "community_fs_select_if_friend" resta; questa la estende (OR).
-- ---------------------------------------------------------------------------
drop policy if exists community_fs_select_directory on public.community_friendships;
create policy community_fs_select_directory
  on public.community_friendships for select to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Galleria profilo (URL immagine HTTPS, come avatar)
-- ---------------------------------------------------------------------------
create table if not exists public.community_profile_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  image_url text not null check (
    char_length(image_url) between 12 and 2048
    and image_url like 'https://%'
  ),
  created_at timestamptz not null default now()
);

create index if not exists community_profile_photos_user_created_idx
  on public.community_profile_photos (user_id, created_at desc);

alter table public.community_profile_photos enable row level security;

drop policy if exists community_profile_photos_select_auth on public.community_profile_photos;
create policy community_profile_photos_select_auth
  on public.community_profile_photos for select to authenticated using (true);

drop policy if exists community_profile_photos_insert_own on public.community_profile_photos;
create policy community_profile_photos_insert_own
  on public.community_profile_photos for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists community_profile_photos_delete_own on public.community_profile_photos;
create policy community_profile_photos_delete_own
  on public.community_profile_photos for delete to authenticated using (auth.uid() = user_id);
