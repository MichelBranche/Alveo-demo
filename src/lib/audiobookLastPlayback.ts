/** Ultimo audiolibro ascoltato — posizione nel capitolo (localStorage sul dispositivo). */

export const LAST_PLAYBACK_CHANGED = 'alveo-last-playback'

const LS_KEY = 'alveo:audiobookLastPlayback:v1'

export type AudiobookLastPlaybackState = {
  audiobookId: string
  audiobookTitle: string
  author: string
  chapterIndex: number
  chapterTitle: string
  /** Secondi nella traccia corrente (HTMLMediaElement.currentTime) */
  positionSec: number
  durationSec: number | null
  coverSrc?: string
  updatedAt: number
}

function isValidState(p: unknown): p is AudiobookLastPlaybackState {
  if (!p || typeof p !== 'object') return false
  const x = p as AudiobookLastPlaybackState
  return (
    typeof x.audiobookId === 'string' &&
    typeof x.chapterIndex === 'number' &&
    Number.isFinite(x.positionSec) &&
    typeof x.updatedAt === 'number'
  )
}

export function loadAudiobookLastPlayback(): AudiobookLastPlaybackState | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!isValidState(parsed)) return null
    if (parsed.chapterIndex < 0 || parsed.chapterIndex > 9999) return null
    if (parsed.positionSec < 0 || parsed.positionSec > 86400 * 24) return null
    return parsed
  } catch {
    return null
  }
}

export function saveAudiobookLastPlayback(patch: Omit<AudiobookLastPlaybackState, 'updatedAt'> & { updatedAt?: number }) {
  const next: AudiobookLastPlaybackState = {
    ...patch,
    durationSec:
      patch.durationSec != null && Number.isFinite(patch.durationSec) && patch.durationSec > 0 ?
        patch.durationSec
      : null,
    updatedAt: patch.updatedAt ?? Date.now(),
  }
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent(LAST_PLAYBACK_CHANGED))
    void import('./userAppPreferencesCloud').then((m) => m.scheduleUserAppProfilePush())
  } catch {
    /* ignore */
  }
}

/** Elimina stato «continua da qui» sul dispositivo (es. logout). */
export function clearAudiobookLastPlayback() {
  try {
    localStorage.removeItem(LS_KEY)
    window.dispatchEvent(new CustomEvent(LAST_PLAYBACK_CHANGED))
  } catch {
    /* ignore */
  }
}
