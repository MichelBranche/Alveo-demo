import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { AudiobookItem } from '../content/audiobooks'
import { audiobookPlaylistUrl, parseM3uPlaylist, type M3uTrack } from '../lib/parseM3u'
import {
  isAudiobookChapterSaved,
  SAVED_CHAPTERS_CHANGED,
  toggleSavedAudiobookChapter,
} from '../lib/savedAudiobookChapters'
import { AudiobookCover } from './AudiobookCover'

function PlayIcon({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M8 5v14l11-7L8 5z" />
    </svg>
  )
}

function PauseIcon({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  )
}

function PrevChapterIcon({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M17.5 18 9 12l8.5-6v12zM5 17V7h3v10H5z" />
    </svg>
  )
}

function NextChapterIcon({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M6.5 18 15 12 6.5 6v12zM16 17V7h3v10h-3z" />
    </svg>
  )
}

function HeartIcon({ filled, className }: { filled: boolean; className?: string }) {
  if (filled) {
    return (
      <svg className={className} viewBox="0 0 24 24" aria-hidden fill="currentColor">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    )
  }
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  )
}

function VolumeHighIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M3 10v4h4l5 5V5L7 10H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
  )
}

function VolumeMutedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
    </svg>
  )
}

function DockSpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className ?? ''}`} fill="none" viewBox="0 0 24 24" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

function formatMmSs(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return '—'
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatHoursMinutes(totalSec: number): string {
  if (!Number.isFinite(totalSec) || totalSec <= 0) return '—'
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  if (h > 0) return `${h} h ${m} min`
  return `${m} min`
}

const AUDIOBOOK_VOLUME_LS = 'alveo:audiobookVolume:v1'

type Props = {
  item: AudiobookItem
  onBack: () => void
  pendingChapterIndex?: number
  onPendingChapterApplied?: () => void
}

export function AudiobookAlbumListenView({
  item,
  onBack,
  pendingChapterIndex,
  onPendingChapterApplied,
}: Props) {
  const audioLabelId = useId()
  const audioRef = useRef<HTMLAudioElement>(null)
  const playAfterLoadRef = useRef(false)
  const seekingRef = useRef(false)
  const tracksRef = useRef<M3uTrack[] | null>(null)
  const activeIdxRef = useRef(0)

  const [tracks, setTracks] = useState<M3uTrack[] | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [positionSec, setPositionSec] = useState(0)
  const [durationSec, setDurationSec] = useState(0)
  const [launcherDismissed, setLauncherDismissed] = useState(false)
  const [dockSessionStarted, setDockSessionStarted] = useState(false)
  const [volumeLinear, setVolumeLinear] = useState(0.92)
  const [muted, setMuted] = useState(false)
  const [likedCurrent, setLikedCurrent] = useState(false)
  const [savedUiTick, setSavedUiTick] = useState(0)
  const [dockAnimIn, setDockAnimIn] = useState(false)

  const pendingChapterConsumedRef = useRef(false)

  const audio = item.audio

  tracksRef.current = tracks
  activeIdxRef.current = activeIndex

  useEffect(() => {
    try {
      const raw = Number(localStorage.getItem(AUDIOBOOK_VOLUME_LS))
      if (Number.isFinite(raw) && raw >= 0 && raw <= 1) setVolumeLinear(raw)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    pendingChapterConsumedRef.current = false
    setActiveIndex(0)
  }, [item.id])

  useEffect(() => {
    if (!tracks?.length || pendingChapterConsumedRef.current) return
    if (pendingChapterIndex == null || Number.isNaN(pendingChapterIndex)) return
    const idx = Math.max(0, Math.min(tracks.length - 1, Math.floor(pendingChapterIndex)))
    pendingChapterConsumedRef.current = true
    setActiveIndex(idx)
    queueMicrotask(() => onPendingChapterApplied?.())
  }, [tracks, pendingChapterIndex, onPendingChapterApplied])

  useEffect(() => {
    setLikedCurrent(isAudiobookChapterSaved(item.id, activeIndex))
  }, [item.id, activeIndex])

  useEffect(() => {
    const sync = () => {
      setLikedCurrent(isAudiobookChapterSaved(item.id, activeIndex))
      setSavedUiTick((n) => n + 1)
    }
    window.addEventListener(SAVED_CHAPTERS_CHANGED, sync)
    return () => window.removeEventListener(SAVED_CHAPTERS_CHANGED, sync)
  }, [item.id, activeIndex])

  useEffect(() => {
    if (!audio) return
    let cancelled = false
    const m3uUrl = audiobookPlaylistUrl(audio.folderSegments, audio.playlistFilename)
    setLoading(true)
    setError(null)
    setTracks(null)
    void fetch(m3uUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.text()
      })
      .then((txt) => {
        if (cancelled) return
        const parsed = parseM3uPlaylist(txt, audio.folderSegments)
        if (parsed.length === 0) {
          setError('Playlist vuota o non leggibile.')
          setTracks(null)
          return
        }
        setTracks(parsed)
      })
      .catch(() => {
        if (cancelled) return
        setError('Impossibile caricare i capitoli.')
        setTracks(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [audio])

  const currentSrc = tracks?.[activeIndex]?.fileUrl
  const currentTitle = tracks?.[activeIndex]?.title
  const canPrevChapter = activeIndex > 0
  const canNextChapter = !!(tracks && activeIndex < tracks.length - 1)

  useEffect(() => {
    setPositionSec(0)
    setDurationSec(0)
  }, [currentSrc])

  useEffect(() => {
    const el = audioRef.current
    if (!el || !currentSrc) return
    el.src = currentSrc
    el.load()
    if (playAfterLoadRef.current) {
      playAfterLoadRef.current = false
      void el.play().catch(() => {})
    }
  }, [currentSrc])

  useEffect(() => {
    const el = audioRef.current
    if (!el || !tracks?.length) return

    const onPlay = () => {
      setPlaying(true)
      setDockSessionStarted(true)
    }
    const onPause = () => setPlaying(false)

    const onTimeUpdate = () => {
      if (seekingRef.current) return
      setPositionSec(el.currentTime)
      if (Number.isFinite(el.duration) && el.duration > 0) setDurationSec(el.duration)
    }

    const onLoadedMeta = () => {
      setPositionSec(el.currentTime)
      if (Number.isFinite(el.duration) && el.duration > 0) setDurationSec(el.duration)
    }

    const onEnded = () => {
      setPlaying(false)
      const list = tracksRef.current
      const idx = activeIdxRef.current
      if (list && idx + 1 < list.length) {
        playAfterLoadRef.current = true
        setActiveIndex(idx + 1)
      }
    }

    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    el.addEventListener('timeupdate', onTimeUpdate)
    el.addEventListener('loadedmetadata', onLoadedMeta)
    el.addEventListener('durationchange', onLoadedMeta)
    el.addEventListener('ended', onEnded)

    return () => {
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
      el.removeEventListener('timeupdate', onTimeUpdate)
      el.removeEventListener('loadedmetadata', onLoadedMeta)
      el.removeEventListener('durationchange', onLoadedMeta)
      el.removeEventListener('ended', onEnded)
    }
  }, [tracks])

  /** Movimento fluido del thumb (come Spotify): timeupdate è troppo rado. */
  useEffect(() => {
    if (!playing) return
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    let cancelled = false
    let rafId = 0

    const tick = () => {
      if (cancelled) return
      const el = audioRef.current
      if (!el || el.paused) return
      if (!seekingRef.current) setPositionSec(el.currentTime)
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
    }
  }, [playing, currentSrc])

  const totalDurationSec = useMemo(() => {
    if (!tracks) return 0
    return tracks.reduce((acc, t) => acc + (Number.isFinite(t.durationSec) ? t.durationSec : 0), 0)
  }, [tracks])

  const selectTrack = useCallback(
    (idx: number) => {
      setLauncherDismissed(true)
      if (idx === activeIndex) {
        playAfterLoadRef.current = false
        void audioRef.current?.play().catch(() => {})
        return
      }
      playAfterLoadRef.current = true
      setActiveIndex(idx)
    },
    [activeIndex],
  )

  const togglePlayPause = useCallback(() => {
    setLauncherDismissed(true)
    const el = audioRef.current
    if (!el || !currentSrc) return
    // Usa lo stato reale del nodo audio: `playing` in React può restare indietro rispetto agli eventi.
    if (el.paused) void el.play().catch(() => {})
    else void el.pause()
  }, [currentSrc])

  const seekTo = useCallback((sec: number) => {
    const el = audioRef.current
    if (!el || !Number.isFinite(sec)) return
    const dur = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : durationSec
    if (dur <= 0) return
    el.currentTime = Math.min(Math.max(sec, 0), dur)
    setPositionSec(el.currentTime)
  }, [durationSec])

  const beginSeekInteraction = useCallback(() => {
    seekingRef.current = true
  }, [])

  const endSeekInteraction = useCallback(() => {
    seekingRef.current = false
    const el = audioRef.current
    if (el) setPositionSec(el.currentTime)
  }, [])

  const goPrevChapter = useCallback(() => {
    if (activeIndex > 0) {
      selectTrack(activeIndex - 1)
      return
    }
    const el = audioRef.current
    if (el) {
      el.currentTime = 0
      setPositionSec(0)
    }
  }, [activeIndex, selectTrack])

  const goNextChapter = useCallback(() => {
    if (tracks && activeIndex + 1 < tracks.length) selectTrack(activeIndex + 1)
  }, [activeIndex, tracks, selectTrack])

  const restartFromFirst = useCallback(() => {
    setLauncherDismissed(true)
    if (activeIndex !== 0) {
      selectTrack(0)
      return
    }
    const el = audioRef.current
    if (el) {
      el.currentTime = 0
      setPositionSec(0)
      void el.play().catch(() => {})
    }
  }, [activeIndex, selectTrack])

  const showHeroPlayControl = !!(item.audio && !loading && !error && tracks && tracks.length > 0)

  const showDockPlayer = !!(tracks?.length && launcherDismissed)
  const dockAwaitingPlayback = showDockPlayer && !dockSessionStarted

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    el.volume = volumeLinear
  }, [volumeLinear, tracks])

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    el.muted = muted
  }, [muted, tracks])

  useEffect(() => {
    if (!showDockPlayer) {
      setDockAnimIn(false)
      return
    }
    const id = window.setTimeout(() => setDockAnimIn(true), 28)
    return () => window.clearTimeout(id)
  }, [showDockPlayer])

  const setPersistedVolume = useCallback((v: number) => {
    const clamped = Math.min(1, Math.max(0, v))
    setVolumeLinear(clamped)
    try {
      localStorage.setItem(AUDIOBOOK_VOLUME_LS, String(clamped))
    } catch {
      /* ignore */
    }
  }, [])

  const toggleMute = useCallback(() => {
    setMuted((m) => !m)
  }, [])

  const toggleLikeCurrentChapter = useCallback(() => {
    if (!tracks?.length) return
    const chapTitle = tracks[activeIndex]?.title ?? `Capitolo ${activeIndex + 1}`
    const nowLiked = toggleSavedAudiobookChapter({
      audiobookId: item.id,
      audiobookTitle: item.title,
      author: item.author,
      chapterIndex: activeIndex,
      chapterTitle: chapTitle,
      coverSrc: item.coverSrc,
    })
    setLikedCurrent(nowLiked)
  }, [tracks, activeIndex, item])

  const toggleLikeAtIndex = useCallback(
    (idx: number) => {
      if (!tracks?.length) return
      const chapTitle = tracks[idx]?.title ?? `Capitolo ${idx + 1}`
      toggleSavedAudiobookChapter({
        audiobookId: item.id,
        audiobookTitle: item.title,
        author: item.author,
        chapterIndex: idx,
        chapterTitle: chapTitle,
        coverSrc: item.coverSrc,
      })
    },
    [tracks, item],
  )

  return (
    <>
      {/* Motore HTML5 montato quando la playlist è pronta (controllato dalla barra fissa). */}
      {tracks && tracks.length > 0 ?
        <audio ref={audioRef} preload="metadata" className="sr-only" tabIndex={-1} />
      : null}

      <div
        className={`mx-auto w-full max-w-5xl pt-2 ${showDockPlayer ? 'pb-[calc(6.65rem+env(safe-area-inset-bottom,0px))] sm:pb-[calc(7rem+env(safe-area-inset-bottom,0px))]' : 'pb-12'}`}
      >
      <nav className="mb-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border-[3px] border-[#1A1A1A] bg-white px-4 py-2.5 text-sm font-bold text-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] transition hover:bg-[#f4f0ea]"
        >
          ← Catalogo
        </button>
      </nav>

      <div className="overflow-hidden rounded-3xl border-[3px] border-[#1A1A1A] bg-gradient-to-b from-[#e8dfd4]/95 via-[#faf8f5] to-[#f4f0ea] shadow-[8px_8px_0px_#1A1A1A]">
        <div className="p-6 sm:p-10 md:flex md:flex-row md:items-end md:gap-12 md:p-12">
          <div className="mx-auto shrink-0 md:mx-0 md:w-[min(100%,17.5rem)]">
            <AudiobookCover
              title={item.title}
              author={item.author}
              coverSrc={item.coverSrc}
              accent={item.accent}
            />
          </div>

          <div className="mt-8 flex min-w-0 flex-1 flex-col md:mt-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-700">Audiolibro</p>
            <h1 className="mt-2 font-['Space_Grotesk',sans-serif] text-[clamp(1.85rem,4.5vw,3.25rem)] font-bold leading-[1.1] tracking-tight text-[#162327]">
              {item.title}
            </h1>
            <p className="mt-4 text-[15px] font-semibold text-[#374550] md:text-lg">{item.author}</p>
            {tracks && tracks.length > 0 ?
              <p className="mt-2 text-sm font-medium text-gray-600">
                {tracks.length} capitoli · ca. {formatHoursMinutes(totalDurationSec)}
              </p>
            : null}

            {showHeroPlayControl ?
              <div className="mt-8 flex flex-col items-start gap-2">
                <button
                  type="button"
                  onClick={togglePlayPause}
                  disabled={!currentSrc}
                  className="flex h-[4.35rem] w-[4.35rem] shrink-0 items-center justify-center rounded-full border-[3px] border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-[5px_5px_0px_#f9e784] transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-px active:shadow-[3px_3px_0px_#f9e784] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={
                    !currentSrc ?
                      'Audio non pronto'
                    : playing ?
                      'Pausa'
                    : dockAwaitingPlayback ?
                      'Avvio in corso, tocca per riprovare'
                    : 'Riproduci'}
                >
                  {dockAwaitingPlayback && !playing ?
                    <DockSpinnerIcon className="h-9 w-9 text-white" />
                  : playing ?
                    <PauseIcon className="h-9 w-9" />
                  : <PlayIcon className="ml-1 h-9 w-9" />}
                </button>
                <p className="max-w-md text-[13px] leading-relaxed text-gray-600">
                  Stesso play/pausa della barra in basso: resta qui per avviare o fermare dopo il primo ascolto.
                </p>
              </div>
            : null}
          </div>
        </div>

        {!item.audio ?
          <div className="border-t-[3px] border-[#1A1A1A]/20 bg-[#faf8f5]/85 px-6 py-12 text-center md:px-12">
            <p className="text-[15px] leading-relaxed text-gray-800">
              Non ci sono ancora file audio pubblici per questo titolo.
            </p>
          </div>
        : loading ?
          <div className="border-t-[3px] border-[#1A1A1A]/20 px-8 py-16 text-center text-sm font-semibold text-gray-700">
            Carico i capitoli…
          </div>
        : error ?
          <div className="border-t-[3px] border-[#1A1A1A]/20 px-8 py-10">
            <p className="rounded-2xl border-2 border-amber-800 bg-amber-50 px-4 py-4 text-center text-sm font-semibold text-amber-950" role="alert">
              {error}
            </p>
          </div>
        : tracks && tracks.length > 0 ?
          <>
            <div className="bg-[#fdfcfa] px-3 pb-10 pt-4 sm:px-6 md:px-10">
              <div className="mb-4 flex items-end justify-between border-b-[3px] border-[#1A1A1A] pb-3">
                <h2 className="font-['Space_Grotesk',sans-serif] text-lg font-bold text-[#162327] md:text-xl">
                  Capitoli
                </h2>
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-gray-500">Tocca una riga</span>
              </div>
              <ul className="divide-y divide-[#1A1A1A]/12" role="list">
                {tracks.map((t, idx) => {
                  void savedUiTick
                  const active = idx === activeIndex
                  const rowLiked = isAudiobookChapterSaved(item.id, idx)
                  return (
                    <li key={`${idx}-${t.fileUrl}`} className="flex items-stretch">
                      <button
                        type="button"
                        onClick={() => selectTrack(idx)}
                        className={`group grid min-h-[3rem] flex-1 grid-cols-[2.5rem_1fr_3.5rem] items-center gap-2 px-1 py-3 text-left sm:grid-cols-[3rem_1fr_4.5rem] sm:gap-4 sm:px-2 sm:py-3.5 ${
                          active ? 'bg-[#d8cde6]' : 'hover:bg-white'
                        } transition`}
                      >
                        <span
                          className={`text-center font-mono text-[13px] tabular-nums sm:text-sm ${active ? 'font-bold text-[#1A1A1A]' : 'text-gray-500 group-hover:text-[#1A1A1A]'}`}
                        >
                          {idx + 1}
                        </span>
                        <span
                          className={`min-w-0 text-[14px] leading-snug sm:text-[15px] ${active ? 'font-bold text-[#1A1A1A]' : 'font-medium text-[#162327]'}`}
                        >
                          {t.title}
                        </span>
                        <span className="text-right font-mono text-[12px] tabular-nums text-gray-600 sm:text-sm">
                          {formatMmSs(t.durationSec)}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={(ev) => {
                          ev.preventDefault()
                          toggleLikeAtIndex(idx)
                        }}
                        aria-label={
                          rowLiked ? 'Togli dai salvati dell’area personale' : 'Salva nell’area personale nei preferiti'
                        }
                        aria-pressed={rowLiked}
                        className="flex w-11 shrink-0 flex-col items-center justify-center border-l border-transparent text-[#162327]/50 transition hover:bg-[#fce7f3]/80 hover:text-[#c026d3] active:bg-[#fbcfe8]/90"
                      >
                        <HeartIcon filled={rowLiked} className="h-5 w-5" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </>
        :
          null}
      </div>

      {item.synopsis ?
        <details className="mx-auto mt-10 max-w-3xl rounded-2xl border-[3px] border-[#1A1A1A] bg-white p-5 shadow-[4px_4px_0px_#d8cde6] md:p-6">
          <summary className="cursor-pointer list-none font-['Space_Grotesk',sans-serif] text-base font-bold text-[#1A1A1A] marker:content-none [&::-webkit-details-marker]:hidden">
            Descrizione
          </summary>
          <p className="mt-4 text-[15px] leading-relaxed text-gray-800">{item.synopsis}</p>
        </details>
      : null}
      </div>

      {/* Dock sottile: progress, metadati, controlli centrati, volume, mi piace */}
      {showDockPlayer ?
        <div
          className={`dock-player-slide fixed inset-x-0 bottom-0 z-[140] border-t border-white/10 bg-[rgba(18,18,18,0.97)] shadow-[0_-10px_36px_rgba(0,0,0,0.32)] backdrop-blur-lg [--dock-pad-x:clamp(10px,2.8vw,18px)] transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            dockAnimIn ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-95'
          }`}
          style={{
            paddingBottom: `calc(7px + env(safe-area-inset-bottom, 0px))`,
          }}
          role="region"
          aria-labelledby={audioLabelId}
          aria-busy={dockAwaitingPlayback}
        >
          <span id={audioLabelId} className="sr-only">
            {dockAwaitingPlayback ? `Preparazione riproduzione — ${item.title}` : `Lettore in riproduzione — ${item.title}`}
          </span>

          <div className="px-[var(--dock-pad-x)] pb-2 pt-2 transition-opacity duration-200">
            <label htmlFor={`${audioLabelId}-dock-seek`} className="sr-only">
              Posizione nella traccia corrente
            </label>
            {dockAwaitingPlayback ?
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.14]" aria-hidden>
                <div className="h-full w-[28%] max-w-[50%] animate-pulse rounded-full bg-[#1ed760]" />
              </div>
            : (
              <input
                id={`${audioLabelId}-dock-seek`}
                type="range"
                min={0}
                max={durationSec > 0 ? durationSec : 1}
                step={Math.max(durationSec > 120 ? 0.25 : 0.05, 0.05)}
                value={durationSec > 0 ? Math.min(Math.max(positionSec, 0), durationSec) : 0}
                disabled={durationSec <= 0}
                onPointerDown={beginSeekInteraction}
                onPointerUp={endSeekInteraction}
                onPointerCancel={endSeekInteraction}
                onChange={(e) => seekTo(Number(e.target.value))}
                className="slider-audiobook-dock w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-35"
              />
            )}
          </div>

          <div className="relative flex min-h-[3.125rem] items-center">
            <div className="z-[1] flex min-w-0 flex-1 items-center gap-2 overflow-hidden pl-[var(--dock-pad-x)] pr-2 sm:gap-2.5">
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-[6px] border border-white/[0.08] shadow-sm">
                {item.coverSrc ?
                  <img
                    src={item.coverSrc}
                    alt=""
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                : (
                  <div
                    className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#2d2d2d] to-[#0a0a0a] text-[8px] font-bold uppercase tracking-[0.15em] text-white/50"
                    aria-hidden
                  >
                    Alveo
                  </div>
                )}
                {dockAwaitingPlayback ?
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <DockSpinnerIcon className="h-5 w-5 text-[#1ed760]" />
                  </div>
                : null}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold leading-snug text-white motion-reduce:transition-none">
                  {currentTitle ?? `Capitolo ${activeIndex + 1}`}
                </p>
                <p className="truncate text-[11px] leading-snug text-white/[0.58]">
                  {dockAwaitingPlayback ?
                    <span className="inline-flex items-center gap-1.5 text-[#1ed760]/95">
                      <DockSpinnerIcon className="h-3 w-3 shrink-0" />
                      Connessione…
                    </span>
                  : (
                    `${item.author} · ${item.title}`
                  )}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] tabular-nums text-white/[0.44]">
                  <span>{dockAwaitingPlayback ? '— / —' : `${formatMmSs(positionSec)} / ${durationSec > 0 ? formatMmSs(durationSec) : '—'}`}</span>
                  <span>· Cap. {activeIndex + 1}/{tracks.length}</span>
                  <button
                    type="button"
                    onClick={restartFromFirst}
                    className="font-bold uppercase tracking-[0.04em] text-[#1ed760]/95 underline-offset-2 transition hover:text-[#1ed760] hover:underline"
                  >
                    Dal 1°
                  </button>
                </p>
              </div>
            </div>

            {/* z-[2] sopra le colonne laterali (z-[1]): altrimenti flex-1 a sinistra intercetta i tap sul play/pausa */}
            <div className="pointer-events-none absolute inset-x-0 top-1/2 z-[2] flex -translate-y-1/2 justify-center px-[min(42vw,8.5rem)] sm:px-36">
              <div className="pointer-events-auto flex items-center gap-0.5 sm:gap-1">
                <button
                  type="button"
                  onClick={goPrevChapter}
                  aria-label={canPrevChapter ? 'Capitolo precedente' : 'Riavvia da inizio capitolo'}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/[0.1] hover:text-[#1ed760] active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100"
                >
                  <PrevChapterIcon className="h-[1.125rem] w-[1.125rem] sm:h-5 sm:w-5" />
                </button>
                <button
                  type="button"
                  onClick={togglePlayPause}
                  aria-label={
                    dockAwaitingPlayback ?
                      'Connessione in corso, tocca per riprovare o attendi'
                    : playing ?
                      'Pausa'
                    : 'Riproduci'}
                  className="mx-1 flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-[0_6px_20px_rgba(0,0,0,.4)] transition hover:scale-[1.04] active:scale-[0.96] motion-reduce:transition-none motion-reduce:hover:scale-100"
                >
                  {dockAwaitingPlayback ?
                    <DockSpinnerIcon className="h-6 w-6 text-black" />
                  : playing ?
                    <PauseIcon className="h-5 w-5" />
                  : <PlayIcon className="ml-0.5 h-[1.375rem] w-[1.375rem]" />}
                </button>
                <button
                  type="button"
                  onClick={goNextChapter}
                  disabled={!canNextChapter}
                  aria-label={canNextChapter ? 'Prossimo capitolo' : 'Ultimo capitolo'}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white transition enabled:hover:bg-white/[0.1] enabled:hover:text-[#1ed760] enabled:active:scale-95 disabled:text-white/30 motion-reduce:transition-none motion-reduce:hover:scale-100"
                >
                  <NextChapterIcon className="h-[1.125rem] w-[1.125rem] sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>

            <div className="z-[1] ml-auto flex shrink-0 items-center gap-1 pr-[var(--dock-pad-x)] pl-[min(37vw,6.75rem)] sm:gap-2 sm:pl-40">
              <button
                type="button"
                onClick={toggleMute}
                aria-label={muted ? 'Riattiva audio' : 'Silenzia'}
                aria-pressed={muted}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/90 transition hover:bg-white/[0.1] hover:text-white motion-reduce:transition-none"
              >
                {muted || volumeLinear < 0.02 ?
                  <VolumeMutedIcon className="h-[1.15rem] w-[1.15rem]" />
                : <VolumeHighIcon className="h-[1.15rem] w-[1.15rem]" />}
              </button>
              <label htmlFor={`${audioLabelId}-vol`} className="sr-only">
                Volume
              </label>
              <input
                id={`${audioLabelId}-vol`}
                type="range"
                min={0}
                max={1}
                step={0.03}
                value={volumeLinear}
                onChange={(e) => {
                  setMuted(false)
                  setPersistedVolume(Number(e.target.value))
                }}
                className="slider-audiobook-volume motion-reduce:transition-none"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(volumeLinear * 100)}
              />
              <button
                type="button"
                onClick={toggleLikeCurrentChapter}
                aria-label={
                  likedCurrent ? 'Togli dai salvati dell’area personale' : 'Salva questo capitolo nell’area personale'
                }
                aria-pressed={likedCurrent}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition motion-reduce:transition-none ${
                  likedCurrent ? 'scale-105 text-[#1ed760]' : 'text-white/70 hover:scale-[1.05] hover:text-[#1ed760]'
                }`}
              >
                <HeartIcon filled={likedCurrent} className="h-[1.25rem] w-[1.25rem] sm:h-6 sm:w-6" />
              </button>
            </div>
          </div>
        </div>
      : null}
    </>
  )
}
