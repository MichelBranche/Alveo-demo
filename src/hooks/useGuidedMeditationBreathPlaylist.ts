import { useCallback, useEffect, useRef } from 'react'

import { GUIDED_MEDITATION_TRACK_FILENAMES } from '../content/guidedMeditationTracks'

function shuffleCopy<T>(arr: readonly T[], rnd: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    const tmp = a[i]!
    a[i] = a[j]!
    a[j] = tmp
  }
  return a
}

const DEFAULT_VOLUME = 0.34

/**
 * Playlist casuale (locali sotto `/meditation-playlist/`), attiva per tutta la sessione.
 * `beginFromUserGesture` va chiamato nello stesso tick del click che avvia la sessione (policy autoplay).
 */
export function useGuidedMeditationBreathPlaylist() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const queueRef = useRef<string[]>([])
  const nextIdxRef = useRef(0)

  const playNext = useCallback(() => {
    const tracks = GUIDED_MEDITATION_TRACK_FILENAMES
    if (tracks.length === 0) return

    let a = audioRef.current
    if (!a) {
      a = new Audio()
      audioRef.current = a
    }

    if (nextIdxRef.current >= queueRef.current.length) {
      queueRef.current = shuffleCopy(tracks, Math.random)
      nextIdxRef.current = 0
    }

    const filename = queueRef.current[nextIdxRef.current]
    if (filename == null || typeof filename !== 'string') return
    nextIdxRef.current += 1

    const baseRaw = import.meta.env.BASE
    const base =
      typeof baseRaw === 'string' && baseRaw !== '' ?
        baseRaw
      : '/'
    const prefix = base.endsWith('/') ? base : `${base}/`
    a.src = `${prefix}meditation-playlist/${encodeURIComponent(filename)}`
    a.volume = DEFAULT_VOLUME
    a.onended = () => {
      playNext()
    }
    void a.play().catch((err) => {
      console.warn('[meditation audio]', err)
    })
  }, [])

  const stop = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    a.onended = null
    a.pause()
    a.currentTime = 0
    a.removeAttribute('src')
    a.load()
    queueRef.current = []
    nextIdxRef.current = 0
  }, [])

  const beginFromUserGesture = useCallback(() => {
    stop()
    const tracks = GUIDED_MEDITATION_TRACK_FILENAMES
    if (tracks.length === 0) return

    queueRef.current = shuffleCopy(tracks, Math.random)
    nextIdxRef.current = 0

    if (!audioRef.current) audioRef.current = new Audio()
    audioRef.current.volume = DEFAULT_VOLUME

    playNext()
  }, [playNext, stop])

  useEffect(() => () => stop(), [stop])

  return { beginFromUserGesture, stop }
}
