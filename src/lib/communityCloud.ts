import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'

export const COMMUNITY_GLOBAL_BODY_MAX = 1200
export const COMMUNITY_DM_BODY_MAX = 2000
export const COMMUNITY_ONLINE_WINDOW_MS = 90_000

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

export async function fetchCommunityProfiles(
  sb: SupabaseClient,
  userIds: string[],
): Promise<Map<string, CommunityProfile>> {
  const map = new Map<string, CommunityProfile>()
  const ids = [...new Set(userIds)].filter(Boolean)
  if (ids.length === 0) return map
  const { data, error } = await sb.from('community_profiles').select('*').in('user_id', ids)
  if (error) throw error
  for (const row of data ?? []) {
    map.set((row as CommunityProfile).user_id, row as CommunityProfile)
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

export async function fetchGlobalMessages(sb: SupabaseClient, limit = 120): Promise<GlobalMessageRow[]> {
  const { data, error } = await sb
    .from('community_global_messages')
    .select('id,user_id,body,created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
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

export function subscribeGlobalMessages(
  sb: SupabaseClient,
  onInsert: (row: GlobalMessageRow) => void,
): RealtimeChannel {
  const ch = sb
    .channel('community-global-messages')
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
  limit = 150,
): Promise<DirectMessageRow[]> {
  const { data, error } = await sb
    .from('community_direct_messages')
    .select('*')
    .or(
      `and(sender_id.eq.${me},recipient_id.eq.${other}),and(sender_id.eq.${other},recipient_id.eq.${me})`,
    )
    .order('created_at', { ascending: true })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as DirectMessageRow[]
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
