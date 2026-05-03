/**
 * Sincronizza sul profilo Supabase (`user_app_preferences`) i dati che prima erano solo in localStorage:
 * ultimo ascolto audiolibro, capitoli salvati, umore area personale, volume lettore.
 * Il diario resta su `defusion_diary_entries`.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

const K_LAST_PLAYBACK = 'alveo:audiobookLastPlayback:v1'
const K_SAVED_CHAPTERS = 'alveo:savedAudiobookChapters:v1'
const OASIS_MOOD_KEY = 'alveo:oasisMood:v1'
const AUDIOBOOK_VOLUME_KEY = 'alveo:audiobookVolume:v1'

const EVT_LAST_PLAYBACK = 'alveo-last-playback'
const EVT_SAVED_CHAPTERS = 'alveo-saved-chapters-changed'

const OASIS_MOODS = ['Agitazione fisica', 'Pensieri ossessivi', 'Insonnia'] as const

export const OASIS_MOOD_SYNC_EVENT = 'alveo-oasis-mood-remote'

const TABLE = 'user_app_preferences'

type DbRow = {
  user_id: string
  audiobook_last_playback: unknown
  saved_audiobook_chapters: unknown
  oasis_mood: string | null
  audiobook_volume: number | null
  updated_at: string
}

let syncCtx: { sb: SupabaseClient; userId: string } | null = null
let pushTimer: ReturnType<typeof setTimeout> | null = null
const PUSH_DEBOUNCE_MS = 1800

export function setUserAppProfileSyncContext(sb: SupabaseClient | null, userId: string | null) {
  if (pushTimer) {
    clearTimeout(pushTimer)
    pushTimer = null
  }
  syncCtx = sb && userId ? { sb, userId } : null
}

export function scheduleUserAppProfilePush() {
  if (!syncCtx) return
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    pushTimer = null
    void pushUserAppProfileFromLocal().catch((e) => console.warn('user_app_preferences push', e))
  }, PUSH_DEBOUNCE_MS)
}

export async function flushUserAppProfilePush(): Promise<void> {
  if (pushTimer) {
    clearTimeout(pushTimer)
    pushTimer = null
  }
  if (!syncCtx) return
  await pushUserAppProfileFromLocal()
}

function readJsonKey(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

function readOasisMood(): string | null {
  try {
    const raw = localStorage.getItem(OASIS_MOOD_KEY)
    if (!raw || !(OASIS_MOODS as readonly string[]).includes(raw)) return null
    return raw
  } catch {
    return null
  }
}

function readVolume(): number | null {
  try {
    const raw = Number(localStorage.getItem(AUDIOBOOK_VOLUME_KEY))
    if (!Number.isFinite(raw) || raw < 0 || raw > 1) return null
    return raw
  } catch {
    return null
  }
}

function isValidLastPlaybackJson(p: unknown): boolean {
  if (!p || typeof p !== 'object') return false
  const x = p as Record<string, unknown>
  return (
    typeof x.audiobookId === 'string' &&
    typeof x.chapterIndex === 'number' &&
    Number.isFinite(x.positionSec) &&
    typeof x.updatedAt === 'number'
  )
}

async function pushUserAppProfileFromLocal(): Promise<void> {
  const ctx = syncCtx
  if (!ctx) return

  const lastRaw = readJsonKey(K_LAST_PLAYBACK)
  const last = isValidLastPlaybackJson(lastRaw) ? lastRaw : null
  const saved = readJsonKey(K_SAVED_CHAPTERS)
  const mood = readOasisMood()
  const vol = readVolume()

  const payload = {
    user_id: ctx.userId,
    audiobook_last_playback: last,
    saved_audiobook_chapters: Array.isArray(saved) ? saved : [],
    oasis_mood: mood,
    audiobook_volume: vol,
    updated_at: new Date().toISOString(),
  }

  const { error } = await ctx.sb.from(TABLE).upsert(payload, { onConflict: 'user_id' })
  if (error) throw error
}

export async function pullUserAppProfile(sb: SupabaseClient, userId: string): Promise<void> {
  const { data, error } = await sb.from(TABLE).select('*').eq('user_id', userId).maybeSingle()

  if (error) throw error
  if (!data) return

  const row = data as DbRow

  try {
    if (row.audiobook_last_playback != null && isValidLastPlaybackJson(row.audiobook_last_playback)) {
      localStorage.setItem(K_LAST_PLAYBACK, JSON.stringify(row.audiobook_last_playback))
    }

    if (Array.isArray(row.saved_audiobook_chapters)) {
      localStorage.setItem(K_SAVED_CHAPTERS, JSON.stringify(row.saved_audiobook_chapters))
    }

    if (row.oasis_mood != null && (OASIS_MOODS as readonly string[]).includes(row.oasis_mood)) {
      localStorage.setItem(OASIS_MOOD_KEY, row.oasis_mood)
    }

    if (row.audiobook_volume != null && Number.isFinite(row.audiobook_volume)) {
      const v = Math.min(1, Math.max(0, row.audiobook_volume))
      localStorage.setItem(AUDIOBOOK_VOLUME_KEY, String(v))
    }
  } catch {
    /* ignore */
  }

  window.dispatchEvent(new CustomEvent(EVT_LAST_PLAYBACK))
  window.dispatchEvent(new CustomEvent(EVT_SAVED_CHAPTERS))
  window.dispatchEvent(new CustomEvent(OASIS_MOOD_SYNC_EVENT))
}

export function attachUserAppProfilePushOnHide() {
  const onVis = () => {
    if (document.visibilityState === 'hidden') void flushUserAppProfilePush()
  }
  const onPageHide = () => void flushUserAppProfilePush()
  document.addEventListener('visibilitychange', onVis)
  window.addEventListener('pagehide', onPageHide)
  return () => {
    document.removeEventListener('visibilitychange', onVis)
    window.removeEventListener('pagehide', onPageHide)
  }
}
