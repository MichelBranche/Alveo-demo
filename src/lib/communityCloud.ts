import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'

export const COMMUNITY_GLOBAL_BODY_MAX = 1200
export const COMMUNITY_DM_BODY_MAX = 2000
export const COMMUNITY_ONLINE_WINDOW_MS = 90_000

/** Prima pagina chat globale */
export const COMMUNITY_GLOBAL_INITIAL = 120
/** Ogni “carica precedenti” chat globale */
export const COMMUNITY_GLOBAL_PAGE = 80
/** Prima pagina DM */
export const COMMUNITY_DM_INITIAL = 120
/** Ogni “carica precedenti” DM */
export const COMMUNITY_DM_PAGE = 80

export type CommunityProfile = {
  user_id: string
  display_name: string
  avatar_url: string | null
  updated_at: string
}

export type GlobalMessageRow = {
  id: string
  user_id: string
  body: string
  created_at: string
}

export type FriendRequestRow = {
  id: string
  from_user: string
  to_user: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

export type DirectMessageRow = {
  id: string
  sender_id: string
  recipient_id: string
  body: string
  created_at: string
}

export function sanitizeCommunityBody(raw: string, maxLen: number): string {
  const t = raw.replace(/\s+/g, ' ').trim()
  if (t.length === 0) return ''
  return t.length > maxLen ? t.slice(0, maxLen) : t
}

/** Evita query GET troppo lunghe (`.in` con molti UUID supera spesso il limite URL). */
const COMMUNITY_PROFILE_IN_CHUNK = 40

export function readSupabaseClientMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  if (e && typeof e === 'object' && 'message' in e) {
    const m = (e as { message: unknown }).message
    if (typeof m === 'string' && m.length > 0) return m
  }
  return 'Errore sconosciuto'
}

export async function fetchCommunityProfiles(
  sb: SupabaseClient,
  userIds: string[],
): Promise<Map<string, CommunityProfile>> {
  const map = new Map<string, CommunityProfile>()
  const ids = [...new Set(userIds)].filter(Boolean)
  if (ids.length === 0) return map
  for (let i = 0; i < ids.length; i += COMMUNITY_PROFILE_IN_CHUNK) {
    const chunk = ids.slice(i, i + COMMUNITY_PROFILE_IN_CHUNK)
    const { data, error } = await sb.from('community_profiles').select('*').in('user_id', chunk)
    if (error) throw error
    for (const row of data ?? []) {
      map.set((row as CommunityProfile).user_id, row as CommunityProfile)
    }
  }
  return map
}

export async function searchCommunityProfiles(
  sb: SupabaseClient,
  query: string,
  excludeUserId: string,
  limit = 12,
): Promise<CommunityProfile[]> {
  const q = query.trim()
  if (q.length < 2) return []
  const pattern = `%${q.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`
  const { data, error } = await sb
    .from('community_profiles')
    .select('*')
    .neq('user_id', excludeUserId)
    .ilike('display_name', pattern)
    .limit(limit)
  if (error) throw error
  return (data ?? []) as CommunityProfile[]
}

export async function fetchMyCommunityProfile(
  sb: SupabaseClient,
  userId: string,
): Promise<CommunityProfile | null> {
  const { data, error } = await sb.from('community_profiles').select('*').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return (data as CommunityProfile | null) ?? null
}

export async function upsertCommunityProfile(
  sb: SupabaseClient,
  userId: string,
  patch: { display_name: string; avatar_url?: string | null },
): Promise<void> {
  const { error } = await sb.from('community_profiles').upsert(
    {
      user_id: userId,
      display_name: patch.display_name.trim().slice(0, 80) || 'Utente',
      avatar_url: patch.avatar_url?.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )
  if (error) throw error
}

export async function fetchGlobalMessages(
  sb: SupabaseClient,
  opts?: { limit?: number; beforeCreatedAt?: string | null },
): Promise<GlobalMessageRow[]> {
  const limit = opts?.limit ?? COMMUNITY_GLOBAL_INITIAL
  let q = sb
    .from('community_global_messages')
    .select('id,user_id,body,created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (opts?.beforeCreatedAt) q = q.lt('created_at', opts.beforeCreatedAt)
  const { data, error } = await q
  if (error) throw error
  const rows = (data ?? []) as GlobalMessageRow[]
  return rows.reverse()
}

export async function sendGlobalMessage(sb: SupabaseClient, userId: string, body: string): Promise<GlobalMessageRow> {
  const { data, error } = await sb
    .from('community_global_messages')
    .insert({ user_id: userId, body })
    .select('id,user_id,body,created_at')
    .single()
  if (error) throw error
  return data as GlobalMessageRow
}

/**
 * `channelKey` univoco per sessione (es. user id) evita collisioni tra tab/client sulla stessa connessione Supabase.
 */
export function subscribeGlobalMessages(
  sb: SupabaseClient,
  onInsert: (row: GlobalMessageRow) => void,
  channelKey: string,
): RealtimeChannel {
  const ch = sb
    .channel(`community-global:${channelKey}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'community_global_messages' },
      (payload) => {
        const r = payload.new as GlobalMessageRow
        if (r?.id && r.user_id && r.body) onInsert(r)
      },
    )
    .subscribe()
  return ch
}

export async function touchCommunityOnline(sb: SupabaseClient, userId: string): Promise<void> {
  const { error } = await sb.from('community_online_heartbeats').upsert(
    { user_id: userId, last_seen: new Date().toISOString() },
    { onConflict: 'user_id' },
  )
  if (error) throw error
}

export async function fetchCommunityOnlineCount(sb: SupabaseClient): Promise<number> {
  const since = new Date(Date.now() - COMMUNITY_ONLINE_WINDOW_MS).toISOString()
  const { count, error } = await sb
    .from('community_online_heartbeats')
    .select('*', { count: 'exact', head: true })
    .gte('last_seen', since)
  if (error) throw error
  return count ?? 0
}

export async function listFriendRequests(sb: SupabaseClient, myId: string): Promise<FriendRequestRow[]> {
  const { data, error } = await sb
    .from('community_friend_requests')
    .select('*')
    .or(`from_user.eq.${myId},to_user.eq.${myId}`)
    .order('created_at', { ascending: false })
    .limit(80)
  if (error) throw error
  return (data ?? []) as FriendRequestRow[]
}

export async function sendFriendRequest(sb: SupabaseClient, fromUser: string, toUser: string): Promise<void> {
  if (fromUser === toUser) return
  const { error } = await sb.from('community_friend_requests').insert({
    from_user: fromUser,
    to_user: toUser,
    status: 'pending',
  })
  if (error) throw error
}

export async function rejectFriendRequest(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from('community_friend_requests').update({ status: 'rejected' }).eq('id', id)
  if (error) throw error
}

export async function acceptFriendRequestRpc(sb: SupabaseClient, reqId: string): Promise<void> {
  const { error } = await sb.rpc('community_accept_friend_request', { req_id: reqId })
  if (error) throw error
}

export type FriendshipRow = { user_a: string; user_b: string; created_at: string }

/** Amicizie in cui compare `userId` (per profilo pubblico). Richiede policy di lettura su `community_friendships`. */
export async function listFriendshipsInvolvingUser(sb: SupabaseClient, userId: string): Promise<FriendshipRow[]> {
  const { data, error } = await sb
    .from('community_friendships')
    .select('*')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as FriendshipRow[]
}

export type CommunityProfilePhotoRow = {
  id: string
  user_id: string
  image_url: string
  created_at: string
}

const COMMUNITY_PROFILE_PHOTOS_MAX = 60
const COMMUNITY_PROFILE_PHOTOS_PER_USER_CAP = 30

export async function listCommunityProfilePhotos(
  sb: SupabaseClient,
  userId: string,
  opts?: { limit?: number },
): Promise<CommunityProfilePhotoRow[]> {
  const limit = Math.min(opts?.limit ?? COMMUNITY_PROFILE_PHOTOS_MAX, COMMUNITY_PROFILE_PHOTOS_MAX)
  const { data, error } = await sb
    .from('community_profile_photos')
    .select('id,user_id,image_url,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as CommunityProfilePhotoRow[]
}

export async function addCommunityProfilePhoto(sb: SupabaseClient, userId: string, imageUrl: string): Promise<void> {
  const u = imageUrl.trim()
  if (!u.startsWith('https://') || u.length < 12) throw new Error('Incolla un URL immagine HTTPS valido.')
  if (u.length > 2048) throw new Error('URL troppo lungo.')
  const { count, error: countErr } = await sb
    .from('community_profile_photos')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  if (countErr) throw countErr
  if ((count ?? 0) >= COMMUNITY_PROFILE_PHOTOS_PER_USER_CAP) {
    throw new Error(`Puoi pubblicare al massimo ${COMMUNITY_PROFILE_PHOTOS_PER_USER_CAP} foto.`)
  }
  const { error } = await sb.from('community_profile_photos').insert({ user_id: userId, image_url: u })
  if (error) throw error
}

export async function deleteCommunityProfilePhoto(
  sb: SupabaseClient,
  userId: string,
  photoId: string,
): Promise<void> {
  const { error } = await sb.from('community_profile_photos').delete().eq('id', photoId).eq('user_id', userId)
  if (error) throw error
}

export async function listFriendships(sb: SupabaseClient, myId: string): Promise<FriendshipRow[]> {
  const { data, error } = await sb
    .from('community_friendships')
    .select('*')
    .or(`user_a.eq.${myId},user_b.eq.${myId}`)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as FriendshipRow[]
}

export function otherFriendId(row: FriendshipRow, myId: string): string {
  return row.user_a === myId ? row.user_b : row.user_a
}

export async function fetchDirectMessages(
  sb: SupabaseClient,
  me: string,
  other: string,
  opts?: { limit?: number; beforeCreatedAt?: string | null },
): Promise<DirectMessageRow[]> {
  const limit = opts?.limit ?? COMMUNITY_DM_INITIAL
  let q = sb
    .from('community_direct_messages')
    .select('*')
    .or(
      `and(sender_id.eq.${me},recipient_id.eq.${other}),and(sender_id.eq.${other},recipient_id.eq.${me})`,
    )
    .order('created_at', { ascending: false })
    .limit(limit)
  if (opts?.beforeCreatedAt) q = q.lt('created_at', opts.beforeCreatedAt)
  const { data, error } = await q
  if (error) throw error
  const rows = (data ?? []) as DirectMessageRow[]
  return rows.reverse()
}

export async function sendDirectMessage(sb: SupabaseClient, senderId: string, recipientId: string, body: string) {
  const { error } = await sb.from('community_direct_messages').insert({
    sender_id: senderId,
    recipient_id: recipientId,
    body,
  })
  if (error) throw error
}

export function subscribeDirectMessages(
  sb: SupabaseClient,
  me: string,
  other: string,
  onInsert: (row: DirectMessageRow) => void,
): RealtimeChannel {
  const [a, b] = [me, other].sort()
  const ch = sb
    .channel(`community-dm-${a}-${b}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'community_direct_messages' },
      (payload) => {
        const r = payload.new as DirectMessageRow
        if (!r?.sender_id || !r.recipient_id) return
        const involves =
          (r.sender_id === me && r.recipient_id === other) || (r.sender_id === other && r.recipient_id === me)
        if (involves) onInsert(r)
      },
    )
    .subscribe()
  return ch
}
