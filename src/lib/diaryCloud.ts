import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js'

export const DIARY_PROMPT_IDS = [
  'having',
  'label-funny',
  'body-room',
  'guest',
  'thanks-brain',
] as const

export type DiaryPromptId = (typeof DIARY_PROMPT_IDS)[number]

export type DiaryEntry = {
  id: string
  createdAt: string
  promptId: DiaryPromptId
  promptTitle: string
  body: string
}

type DbRow = {
  id: string
  user_id: string
  created_at: string
  prompt_id: string
  prompt_title: string
  body: string
}

export function diaryCloudConfigured(): boolean {
  const u = import.meta.env.VITE_SUPABASE_URL
  const k = import.meta.env.VITE_SUPABASE_ANON_KEY
  return typeof u === 'string' && u.length > 0 && typeof k === 'string' && k.length > 0
}

let client: SupabaseClient | null | undefined

export function getDiarySupabase(): SupabaseClient | null {
  if (!diaryCloudConfigured()) return null
  if (client !== undefined) return client
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  client = createClient(url!, key!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
  return client
}

export function normalizePromptId(raw: string): DiaryPromptId {
  return (DIARY_PROMPT_IDS as readonly string[]).includes(raw)
    ? (raw as DiaryPromptId)
    : 'having'
}

function rowToEntry(r: DbRow): DiaryEntry {
  return {
    id: r.id,
    createdAt: r.created_at,
    promptId: normalizePromptId(r.prompt_id),
    promptTitle: r.prompt_title,
    body: r.body,
  }
}

function entryToRow(e: DiaryEntry, userId: string): Omit<DbRow, 'user_id'> & { user_id: string } {
  return {
    id: e.id,
    user_id: userId,
    created_at: e.createdAt,
    prompt_id: e.promptId,
    prompt_title: e.promptTitle,
    body: e.body,
  }
}

function mergeByPreferNewer(a: DiaryEntry, b: DiaryEntry): DiaryEntry {
  return a.createdAt >= b.createdAt ? a : b
}

/** Unione per id; in conflitto tiene la voce con createdAt più recente. */
export function mergeDiaryEntries(remote: DiaryEntry[], local: DiaryEntry[]): DiaryEntry[] {
  const m = new Map<string, DiaryEntry>()
  for (const e of remote) m.set(e.id, e)
  for (const e of local) {
    const o = m.get(e.id)
    m.set(e.id, o ? mergeByPreferNewer(o, e) : e)
  }
  return [...m.values()]
}

export async function fetchDiaryEntriesCloud(sb: SupabaseClient): Promise<DiaryEntry[]> {
  const { data, error } = await sb
    .from('defusion_diary_entries')
    .select('id,user_id,created_at,prompt_id,prompt_title,body')
    .order('created_at', { ascending: false })

  if (error) throw error
  const rows = (data ?? []) as DbRow[]
  return rows.map(rowToEntry)
}

export async function upsertDiaryEntriesCloud(
  sb: SupabaseClient,
  userId: string,
  entries: DiaryEntry[],
): Promise<void> {
  if (entries.length === 0) return
  const payload = entries.map((e) => entryToRow(e, userId))
  const { error } = await sb.from('defusion_diary_entries').upsert(payload, { onConflict: 'id' })
  if (error) throw error
}

export async function upsertOneDiaryEntryCloud(
  sb: SupabaseClient,
  userId: string,
  entry: DiaryEntry,
): Promise<void> {
  await upsertDiaryEntriesCloud(sb, userId, [entry])
}

export async function deleteDiaryEntryCloud(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from('defusion_diary_entries').delete().eq('id', id)
  if (error) throw error
}

export async function signInDiaryCloud(sb: SupabaseClient, email: string, password: string) {
  const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password })
  if (error) throw error
  return data.session
}

export async function signUpDiaryCloud(
  sb: SupabaseClient,
  email: string,
  password: string,
  profile?: { displayName?: string },
) {
  const name = profile?.displayName?.trim()
  const { data, error } = await sb.auth.signUp({
    email: email.trim(),
    password,
    ...(name
      ? {
          options: {
            data: { display_name: name, full_name: name },
          },
        }
      : {}),
  })
  if (error) throw error
  return data.session as Session | null
}

export async function signOutDiaryCloud(sb: SupabaseClient) {
  const { error } = await sb.auth.signOut()
  if (error) throw error
}

export async function getDiarySession(sb: SupabaseClient): Promise<Session | null> {
  const { data } = await sb.auth.getSession()
  return data.session ?? null
}
