/** Salto indicativo per seek da centro di controllo / schermata bloccata. */
const SEEK_SKIP_SEC = 12

function absoluteFromPage(src: string): string {
  try {
    return new URL(src, typeof window !== 'undefined' ? window.location.href : 'http://localhost/').href
  } catch {
    return src
  }
}

function guessImageMime(src: string): string | undefined {
  const s = src.split('?')[0]?.toLowerCase() ?? ''
  if (s.endsWith('.svg')) return 'image/svg+xml'
  if (s.endsWith('.png')) return 'image/png'
  if (s.endsWith('.jpg') || s.endsWith('.jpeg')) return 'image/jpeg'
  if (s.endsWith('.webp')) return 'image/webp'
  return undefined
}

/** Rimuove metadati e handler (es. uscita dalla schermata ascolto). */
export function clearHtmlAudioMediaSession(): void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
  const ms = navigator.mediaSession
  const actions: MediaSessionAction[] = [
    'play',
    'pause',
    'previoustrack',
    'nexttrack',
    'seekbackward',
    'seekforward',
    'stop',
  ]
  try {
    ms.metadata = null
    for (const a of actions) {
      try {
        ms.setActionHandler(a, null)
      } catch {
        /* alcune azioni non supportate su tutti i browser */
      }
    }
  } catch {
    /* */
  }
}

type AudiobookMediaCallbacks = {
  play: () => void
  pause: () => void
  prevChapter: () => void
  nextChapter: () => void
  seekBy: (deltaSec: number) => void
}

/**
 * Collega `navigator.mediaSession` all’elemento audio (Now Playing / schermata bloccata / auto / cuffie).
 * Restituisce cleanup da chiamare in useEffect.
 */
export function attachAudiobookHtmlAudioMediaSession(
  audio: HTMLAudioElement,
  meta: {
    albumTitle: string
    artist: string
    chapterTitle: string
    coverSrc: string
    canPrevChapter: boolean
    canNextChapter: boolean
  },
  callbacks: AudiobookMediaCallbacks,
): () => void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return () => {}

  const ms = navigator.mediaSession
  const coverUrl = absoluteFromPage(meta.coverSrc)
  const mime = guessImageMime(coverUrl)

  try {
    ms.metadata = new MediaMetadata({
      title: meta.chapterTitle,
      artist: meta.artist,
      album: meta.albumTitle,
      artwork: [{ src: coverUrl, sizes: '512x512', type: mime ?? 'image/png' }],
    })
  } catch {
    /* metadata opzionale */
  }

  const pushPositionState = () => {
    if (!('setPositionState' in ms) || typeof ms.setPositionState !== 'function') return
    try {
      const dur = audio.duration
      if (!Number.isFinite(dur) || dur <= 0) return
      const pos = Math.min(Math.max(audio.currentTime, 0), dur - 1e-3)
      ms.setPositionState({
        duration: dur,
        playbackRate: audio.playbackRate || 1,
        position: pos,
      })
    } catch {
      /* Safari può rifiutare stati limite */
    }
  }

  let posInterval: ReturnType<typeof setInterval> | null = null
  const startPositionTick = () => {
    if (posInterval) return
    pushPositionState()
    posInterval = window.setInterval(pushPositionState, 980)
  }
  const stopPositionTick = () => {
    if (posInterval) {
      window.clearInterval(posInterval)
      posInterval = null
    }
    pushPositionState()
  }

  try {
    ms.setActionHandler('play', () => {
      callbacks.play()
    })
    ms.setActionHandler('pause', () => {
      callbacks.pause()
    })
  } catch {
    /* */
  }

  try {
    ms.setActionHandler(
      'previoustrack',
      meta.canPrevChapter ? () => callbacks.prevChapter() : null,
    )
  } catch {
    /* */
  }
  try {
    ms.setActionHandler(
      'nexttrack',
      meta.canNextChapter ? () => callbacks.nextChapter() : null,
    )
  } catch {
    /* */
  }

  try {
    ms.setActionHandler('seekbackward', () => {
      callbacks.seekBy(-SEEK_SKIP_SEC)
    })
    ms.setActionHandler('seekforward', () => {
      callbacks.seekBy(SEEK_SKIP_SEC)
    })
  } catch {
    /* */
  }

  const onPlay = () => startPositionTick()
  const onPause = () => stopPositionTick()
  const onSeeked = () => pushPositionState()

  audio.addEventListener('play', onPlay)
  audio.addEventListener('pause', onPause)
  audio.addEventListener('seeked', onSeeked)
  if (!audio.paused) startPositionTick()

  return () => {
    stopPositionTick()
    audio.removeEventListener('play', onPlay)
    audio.removeEventListener('pause', onPause)
    audio.removeEventListener('seeked', onSeeked)
    clearHtmlAudioMediaSession()
  }
}

/** Sessione semplice (es. playlist ambiente meditazione): solo titolo e play/pausa. */
export function attachSimpleAmbientMediaSession(
  audio: HTMLAudioElement,
  meta: { title: string; artist: string },
): () => void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return () => {}

  const ms = navigator.mediaSession
  try {
    ms.metadata = new MediaMetadata({
      title: meta.title,
      artist: meta.artist,
      album: 'Alveo',
    })
  } catch {
    /* */
  }

  let posInterval: ReturnType<typeof setInterval> | null = null
  const pushPositionState = () => {
    if (!('setPositionState' in ms) || typeof ms.setPositionState !== 'function') return
    try {
      const dur = audio.duration
      if (!Number.isFinite(dur) || dur <= 0) return
      const pos = Math.min(Math.max(audio.currentTime, 0), dur - 1e-3)
      ms.setPositionState({
        duration: dur,
        playbackRate: audio.playbackRate || 1,
        position: pos,
      })
    } catch {
      /* */
    }
  }

  const startTick = () => {
    if (posInterval) return
    pushPositionState()
    posInterval = window.setInterval(pushPositionState, 980)
  }
  const stopTick = () => {
    if (posInterval) {
      window.clearInterval(posInterval)
      posInterval = null
    }
    pushPositionState()
  }

  try {
    ms.setActionHandler('play', () => {
      void audio.play().catch(() => {})
    })
    ms.setActionHandler('pause', () => {
      audio.pause()
    })
  } catch {
    /* */
  }

  const onPlay = () => startTick()
  const onPause = () => stopTick()
  const onSeeked = () => pushPositionState()
  audio.addEventListener('play', onPlay)
  audio.addEventListener('pause', onPause)
  audio.addEventListener('seeked', onSeeked)
  if (!audio.paused) startTick()

  return () => {
    stopTick()
    audio.removeEventListener('play', onPlay)
    audio.removeEventListener('pause', onPause)
    audio.removeEventListener('seeked', onSeeked)
    clearHtmlAudioMediaSession()
  }
}
