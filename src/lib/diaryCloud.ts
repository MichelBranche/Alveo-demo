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

/** Normalizza virgolette o spazi spesso introdotti copiando in Vercel / .env */
function trimmedEnv(value: unknown): string {
  if (typeof value !== 'string') return ''
  let s = value.trim()
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim()
  }
  return s
}

/** Evita crash di createClient se l’URL non è valido (placeholders, typo, senza scheme). */
function isAllowedSupabaseUrl(raw: string): boolean {
  if (!raw) return false
  try {
    const u = new URL(raw)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false
    return Boolean(u.hostname)
  } catch {
    return false
  }
}

export function diaryCloudConfigured(): boolean {
  const u = trimmedEnv(import.meta.env.VITE_SUPABASE_URL)
  const k = trimmedEnv(import.meta.env.VITE_SUPABASE_ANON_KEY)
  return isAllowedSupabaseUrl(u) && k.length > 0
}

let client: SupabaseClient | null | undefined

export function getDiarySupabase(): SupabaseClient | null {
  if (!diaryCloudConfigured()) return null
  if (client !== undefined) return client
  const url = trimmedEnv(import.meta.env.VITE_SUPABASE_URL)
  const key = trimmedEnv(import.meta.env.VITE_SUPABASE_ANON_KEY)
  client = createClient(url, key, {
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

/** Dove tornare dopo email OAuth / magic link; va elencato in Supabase Authentication → Redirect URLs. */
export function authAppRedirectUrl(): string | undefined {
  try {
    if (typeof window === 'undefined') return undefined
    const origin = window.location.origin?.replace(/\/$/, '')
    if (!origin || origin === 'null') return undefined
    return `${origin}/`
  } catch {
    return undefined
  }
}

/** Avvia Sign in with Google (redirect browser verso Google e poi all’app). */
export async function signInWithGoogleOAuth(sb: SupabaseClient): Promise<void> {
  const redirectTo = authAppRedirectUrl()
  const { data, error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: redirectTo ? { redirectTo } : {},
  })
  if (error) throw error
  const url = data.url
  if (url && typeof window !== 'undefined') {
    window.location.assign(url)
    return
  }
  throw new Error('Accesso con Google non avviato: URL mancante.')
}

export async function signUpDiaryCloud(
  sb: SupabaseClient,
  email: string,
  password: string,
  profile?: { displayName?: string },
) {
  const name = profile?.displayName?.trim()
  const redirectTo = authAppRedirectUrl()
  const { data, error } = await sb.auth.signUp({
    email: email.trim(),
    password,
    options: {
      ...(redirectTo ? { emailRedirectTo: redirectTo } : {}),
      ...(name ? { data: { display_name: name, full_name: name } } : {}),
    },
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
