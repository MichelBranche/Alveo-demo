-- Community: profili, chat globale, presenza online, richieste di amicizia, messaggi privati tra amici.
-- Esegui nel SQL Editor Supabase (stesso progetto di defusion_diary / user_app_preferences).
-- Dopo il run: Dashboard → Database → Replication → abilita realtime per le tabelle qui sotto se non si aggiornano da sole.

-- ---------------------------------------------------------------------------
-- Profili (nome visibile, foto)
-- ---------------------------------------------------------------------------
create table if not exists public.community_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url text,
  updated_at timestamptz not null default now()
);

create index if not exists community_profiles_display_name_idx
  on public.community_profiles (lower(display_name));

alter table public.community_profiles enable row level security;

create policy community_profiles_select_auth
  on public.community_profiles for select to authenticated using (true);

create policy community_profiles_insert_own
  on public.community_profiles for insert to authenticated with check (auth.uid() = user_id);

create policy community_profiles_update_own
  on public.community_profiles for update to authenticated using (auth.uid() = user_id);

-- Profilo alla registrazione (best-effort; ignora se già esiste)
create or replace function public.community_handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.community_profiles (user_id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(split_part(new.email, '@', 1)), ''),
      'Utente'
    )
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_community_profile on auth.users;
create trigger on_auth_user_created_community_profile
  after insert on auth.users
  for each row execute function public.community_handle_new_user_profile();

-- ---------------------------------------------------------------------------
-- Chat globale
-- ---------------------------------------------------------------------------
create table if not exists public.community_global_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1200),
  created_at timestamptz not null default now()
);

create index if not exists community_global_messages_created_idx
  on public.community_global_messages (created_at desc);

alter table public.community_global_messages enable row level security;

create policy community_global_select
  on public.community_global_messages for select to authenticated using (true);

create policy community_global_insert_own
  on public.community_global_messages for insert to authenticated with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Presenza “online” (heartbeat client)
-- ---------------------------------------------------------------------------
create table if not exists public.community_online_heartbeats (
  user_id uuid primary key references auth.users (id) on delete cascade,
  last_seen timestamptz not null default now()
);

alter table public.community_online_heartbeats enable row level security;

create policy community_online_select
  on public.community_online_heartbeats for select to authenticated using (true);

create policy community_online_insert_own
  on public.community_online_heartbeats for insert to authenticated with check (auth.uid() = user_id);

create policy community_online_update_own
  on public.community_online_heartbeats for update to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Richieste di amicizia
-- ---------------------------------------------------------------------------
create table if not exists public.community_friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references auth.users (id) on delete cascade,
  to_user uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  check (from_user <> to_user)
);

create unique index if not exists community_friend_requests_one_pending
  on public.community_friend_requests (from_user, to_user)
  where status = 'pending';

create index if not exists community_friend_requests_to_idx
  on public.community_friend_requests (to_user, status);

alter table public.community_friend_requests enable row level security;

create policy community_fr_select_involved
  on public.community_friend_requests for select to authenticated
  using (auth.uid() = from_user or auth.uid() = to_user);

create policy community_fr_insert_own
  on public.community_friend_requests for insert to authenticated
  with check (auth.uid() = from_user and from_user <> to_user);

-- Accettazione solo tramite RPC `community_accept_friend_request`. Da client: rifiuta o ritira.
create policy community_fr_recv_reject
  on public.community_friend_requests for update to authenticated
  using (auth.uid() = to_user and status = 'pending')
  with check (status = 'rejected');

create policy community_fr_sender_withdraw
  on public.community_friend_requests for update to authenticated
  using (auth.uid() = from_user and status = 'pending')
  with check (status = 'rejected');

-- ---------------------------------------------------------------------------
-- Amicizie (coppia ordinata) — insert solo da funzione security definer
-- ---------------------------------------------------------------------------
create table if not exists public.community_friendships (
  user_a uuid not null references auth.users (id) on delete cascade,
  user_b uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (user_a < user_b),
  primary key (user_a, user_b)
);

alter table public.community_friendships enable row level security;

create policy community_fs_select_if_friend
  on public.community_friendships for select to authenticated
  using (auth.uid() = user_a or auth.uid() = user_b);

-- Accetta richiesta (solo destinatario)
create or replace function public.community_accept_friend_request(req_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.community_friend_requests%rowtype;
begin
  select * into r from public.community_friend_requests where id = req_id for update;
  if not found then return; end if;
  if r.to_user <> auth.uid() then raise exception 'non autorizzato'; end if;
  if r.status <> 'pending' then return; end if;

  update public.community_friend_requests set status = 'accepted' where id = req_id;

  insert into public.community_friendships (user_a, user_b)
  values (least(r.from_user, r.to_user), greatest(r.from_user, r.to_user))
  on conflict do nothing;
end;
$$;

grant execute on function public.community_accept_friend_request(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Messaggi privati (solo tra amici accettati)
-- ---------------------------------------------------------------------------
create table if not exists public.community_direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users (id) on delete cascade,
  recipient_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);

create index if not exists community_dm_pair_created_idx
  on public.community_direct_messages (sender_id, recipient_id, created_at desc);

create index if not exists community_dm_recipient_created_idx
  on public.community_direct_messages (recipient_id, sender_id, created_at desc);

alter table public.community_direct_messages enable row level security;

create policy community_dm_select_if_party
  on public.community_direct_messages for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy community_dm_insert_if_friend
  on public.community_direct_messages for insert to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.community_friendships f
      where f.user_a = least(sender_id, recipient_id)
        and f.user_b = greatest(sender_id, recipient_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Realtime (se l’ALTER fallisce perché già presente, ignora l’errore)
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.community_global_messages;
alter publication supabase_realtime add table public.community_direct_messages;
alter publication supabase_realtime add table public.community_friend_requests;
alter publication supabase_realtime add table public.community_profiles;

-- Se una riga dà errore "already member of publication", ignora quella riga.
-- Se il trigger su auth.users fallisce con "syntax error near execute function", prova:
--   ... for each row execute procedure public.community_handle_new_user_profile();

-- ---------------------------------------------------------------------------
-- Profili per account creati prima di questo script (una tantum)
-- ---------------------------------------------------------------------------
insert into public.community_profiles (user_id, display_name)
select u.id,
  coalesce(
    nullif(trim(u.raw_user_meta_data->>'display_name'), ''),
    nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(split_part(u.email, '@', 1)), ''),
    'Utente'
  )
from auth.users u
where not exists (select 1 from public.community_profiles p where p.user_id = u.id);
