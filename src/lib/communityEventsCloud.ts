import type { SupabaseClient } from '@supabase/supabase-js'

export type CommunityEventRow = {
  id: string
  title: string
  description: string | null
  starts_at: string
  location_hint: string | null
  external_url: string | null
  created_by: string | null
  created_at: string
}

/** Prossimi eventi (da adesso in poi), ordinati per data. */
export async function fetchUpcomingCommunityEvents(
  sb: SupabaseClient,
  limit = 8,
): Promise<CommunityEventRow[]> {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { data, error } = await sb
    .from('community_events')
    .select('id,title,description,starts_at,location_hint,external_url,created_by,created_at')
    .gte('starts_at', since)
    .order('starts_at', { ascending: true })
    .limit(limit)

  if (error) {
    const msg = `${error.message ?? ''} ${(error as { details?: string }).details ?? ''}`
    if (msg.includes('community_events') || msg.includes('does not exist') || msg.includes('schema cache')) {
      return []
    }
    throw error
  }
  return (data ?? []) as CommunityEventRow[]
}
