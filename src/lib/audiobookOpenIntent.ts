/** Navigazione verso Audiolibri con titolo (e capitolo) preselezionati — sessionStorage one-shot. */

export const AUDIOBOOK_OPEN_INTENT_KEY = 'alveo:audiobooksOpen:v1'

export type AudiobookOpenIntent = {
  audiobookId: string
  /** Indice 0-based nella playlist M3U */
  chapterIndex?: number
  /** Riprendi la traccia da questo punto (secondi); richiede `chapterIndex` coerente. */
  resumePositionSec?: number
}

export function stashAudiobookOpenIntent(intent: AudiobookOpenIntent) {
  try {
    sessionStorage.setItem(AUDIOBOOK_OPEN_INTENT_KEY, JSON.stringify(intent))
  } catch {
    /* ignore */
  }
}

export function takeAudiobookOpenIntent(): AudiobookOpenIntent | null {
  try {
    const raw = sessionStorage.getItem(AUDIOBOOK_OPEN_INTENT_KEY)
    if (!raw) return null
    sessionStorage.removeItem(AUDIOBOOK_OPEN_INTENT_KEY)
    const p = JSON.parse(raw) as AudiobookOpenIntent
    if (!p || typeof p.audiobookId !== 'string') return null
    return p
  } catch {
    return null
  }
}
