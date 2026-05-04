import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CloudMemberAuthPanel } from '../components/CloudMemberAuthPanel'
import { AUDIOBOOK_CATALOG } from '../content/audiobooks'
import {
  LAST_PLAYBACK_CHANGED,
  loadAudiobookLastPlayback,
  type AudiobookLastPlaybackState,
} from '../lib/audiobookLastPlayback'
import { stashAudiobookOpenIntent } from '../lib/audiobookOpenIntent'
import {
  loadSavedAudiobookChapters,
  removeSavedAudiobookChapter,
  SAVED_CHAPTERS_CHANGED,
  type SavedAudiobookChapter,
} from '../lib/savedAudiobookChapters'
import { CurtainLink } from '../components/NavigationTransition'
import { useDiaryAuth } from '../context/DiaryAuthContext'
import { OASIS_MOOD_SYNC_EVENT, scheduleUserAppProfilePush } from '../lib/userAppPreferencesCloud'
import type { NavId } from '../nav'

const MOODS = ['Agitazione fisica', 'Pensieri ossessivi', 'Insonnia'] as const
type OasisMood = (typeof MOODS)[number]

const OASIS_MOOD_STORAGE_KEY = 'alveo:oasisMood:v1'

/** Rotating ACT-inspired reminders for the oasis banner */
const ACT_INTENTION_ROTATION_MS = 20_000

const ACT_INTENTIONS = [
  {
    title: 'Intenzione gentile',
    body:
      'Non è necessario “stare meglio” in questo momento: è sufficiente, quando capita, ricordarsi del respiro, anche solo per un minuto.',
  },
  {
    title: 'Accettazione',
    body:
      'La sofferenza che senti non è un errore da sistemare subito: puoi fare spazio per lei senza combatterla né dare per vero tutto ciò che la mente narra.',
  },
  {
    title: 'Defusione',
    body:
      '«Sto avendo il pensiero che…» Non serve vincere il pensiero: puoi notarlo come rumore mentale, anche quando insiste.',
  },
  {
    title: 'Valori',
    body:
      'Non serve avere la certezza del futuro per compiere un piccolo gesto oggi nella direzione che — a cuore aperto — ti sembra davvero importante.',
  },
  {
    title: 'Momento presente',
    body:
      'Qui e ora non devi risolvere tutto: puoi ancorarti al respiro o a un punto del corpo per un istante e lasciare perdere l’urgenza di farcela perfettamente.',
  },
  {
    title: 'Se come contesto',
    body:
      'C’è la storia che la mente racconta su di te e c’è anche uno spazio più ampio in cui quella storia compare — come nuvole che passano.',
  },
  {
    title: 'Volontà aperta',
    body:
      'Essere disponibili non è arrendersi: è restare presenti con ciò che c’è mentre agiamo verso ciò che conta per noi.',
  },
  {
    title: 'Flessibilità psicologica',
    body:
      'Posso provare disagio e, nello stesso momento, fare qualcosa che mi avvicina alla vita che scelgo di nutrire — le due cose possono coesistere.',
  },
  {
    title: 'Curiosità gentile',
    body:
      'Alle sensazioni nel corpo puoi rivolgerti come a un ospite scomodo ma informativo: notarle senza etichetta può cambiare il rapporto con la tensione.',
  },
  {
    title: 'Autocompassione',
    body:
      'Parlati come parleresti a un amico in difficoltà: tono più basso, più lento; la critica interiore ha spesso imparato da anni di abitudine, non dalla verità.',
  },
] as const

const QUICK_CARD =
  'flex min-h-[92px] flex-1 basis-[clamp(140px,38%,1fr)] flex-col justify-between rounded-2xl border-[3px] border-[#1A1A1A] bg-white p-4 text-left shadow-[3px_3px_0px_#1A1A1A] transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1A1A1A]'

function formatPlaybackMmSs(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return '—'
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function PersonalOasisPage({ onSelectNav }: { onSelectNav: (id: NavId) => void }) {
  const {
    cloudEnabled,
    initializing: authInitializing,
    session,
    supabase: sb,
    canUseOasis,
    canUseDiary,
    devAuthBypass,
  } = useDiaryAuth()
  const [selectedMood, setSelectedMood] = useState<OasisMood | null>(null)
  const [actIntentIndex, setActIntentIndex] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [savedListening, setSavedListening] = useState<SavedAudiobookChapter[]>([])
  const [lastPlayback, setLastPlayback] = useState<AudiobookLastPlaybackState | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3800)
  }, [])

  useEffect(() => {
    if (!canUseOasis) return
    const syncMoodFromStorage = () => {
      try {
        const raw = localStorage.getItem(OASIS_MOOD_STORAGE_KEY)
        if (raw && (MOODS as readonly string[]).includes(raw)) setSelectedMood(raw as OasisMood)
        else setSelectedMood(null)
      } catch {
        /* storage non disponibile */
      }
    }
    syncMoodFromStorage()
    window.addEventListener(OASIS_MOOD_SYNC_EVENT, syncMoodFromStorage)
    const id = window.setInterval(() => {
      setActIntentIndex((i) => (i + 1) % ACT_INTENTIONS.length)
    }, ACT_INTENTION_ROTATION_MS)
    return () => {
      window.removeEventListener(OASIS_MOOD_SYNC_EVENT, syncMoodFromStorage)
      window.clearInterval(id)
    }
  }, [canUseOasis])

  useEffect(() => {
    if (!canUseOasis) {
      setSavedListening([])
      return
    }
    setSavedListening(loadSavedAudiobookChapters())
    const fn = () => setSavedListening(loadSavedAudiobookChapters())
    window.addEventListener(SAVED_CHAPTERS_CHANGED, fn)
    return () => window.removeEventListener(SAVED_CHAPTERS_CHANGED, fn)
  }, [canUseOasis])

  useEffect(() => {
    if (!canUseOasis) {
      setLastPlayback(null)
      return
    }
    setLastPlayback(loadAudiobookLastPlayback())
    const fn = () => setLastPlayback(loadAudiobookLastPlayback())
    window.addEventListener(LAST_PLAYBACK_CHANGED, fn)
    return () => window.removeEventListener(LAST_PLAYBACK_CHANGED, fn)
  }, [canUseOasis])

  const toggleMood = useCallback((mood: OasisMood) => {
    setSelectedMood((cur) => {
      const next = cur === mood ? null : mood
      try {
        if (next == null) localStorage.removeItem(OASIS_MOOD_STORAGE_KEY)
        else localStorage.setItem(OASIS_MOOD_STORAGE_KEY, next)
      } catch {
        /* ignore */
      }
      return next
    })
    scheduleUserAppProfilePush()
  }, [])

  const actIntent = ACT_INTENTIONS[actIntentIndex]

  const spotlightAudiobook = useMemo(() => AUDIOBOOK_CATALOG[0] ?? null, [])

  const lastPlaybackKnown = useMemo(() => {
    if (!lastPlayback) return false
    return AUDIOBOOK_CATALOG.some((x) => x.id === lastPlayback.audiobookId)
  }, [lastPlayback])

  const todayLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(new Date())
    } catch {
      return 'Oggi'
    }
  }, [])

  if (!cloudEnabled && !devAuthBypass) {
    return (
      <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-6 pb-10">
        <div className="rounded-2xl border-[3px] border-[#1A1A1A] bg-[#faf8f5] p-8 text-center shadow-[4px_4px_0px_#1A1A1A]">
          <span className="mb-4 inline-flex text-3xl" aria-hidden>
            🏠
          </span>
          <h1 className="font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#162327]">Area personale</h1>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-gray-700">
            Questa sezione non è al momento disponibile. Puoi continuare a usare il resto dell&apos;app dalla home.
          </p>
          <CurtainLink
            to="/"
            className="mx-auto mt-6 inline-flex rounded-2xl border-[3px] border-[#1A1A1A] bg-[#1A1A1A] px-8 py-3 font-['Space_Grotesk',sans-serif] text-sm font-bold text-white shadow-[3px_3px_0px_#f9e784] transition hover:bg-[#2a383f]"
          >
            Torna alla home
          </CurtainLink>
        </div>
      </div>
    )
  }

  if (authInitializing && !devAuthBypass) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
        <p className="text-[15px] font-medium text-gray-700">Verifica dell&apos;accesso...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-8 pb-10 md:gap-10">
      {sb ? (
        <CloudMemberAuthPanel
          ariaLabel="Account per l'area personale"
          headline="Solo utenti registrati"
          description="Accedi con le stesse credenziali dell’area cloud Alveo: abilitano area personale e diario. Se non sei ancora iscritta o iscritto, puoi crearle qui."
          logoutButtonLabel="Disconnettiti dall'account Alveo"
          supabase={sb}
          session={session}
          memberAuthenticated={canUseOasis}
          onToast={showToast}
        />
      ) : null}

      {toast ?
        <p
          className="-mt-2 rounded-xl border-[3px] border-[#1A1A1A] bg-[#f9e784] px-4 py-2 text-center text-sm font-semibold text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]"
          role="status"
        >
          {toast}
        </p>
      : null}

      {!canUseOasis ?
        <>
          <header className="relative overflow-hidden rounded-2xl border-[3px] border-[#1A1A1A] bg-gradient-to-br from-[#e8dfd4] via-white to-[#d8cde6]/90 p-6 shadow-[4px_4px_0px_#1A1A1A] md:p-8">
            <span className="mb-4 inline-flex text-3xl md:text-[2rem]" aria-hidden>
              🏠
            </span>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-gray-600">
              Riservato agli utenti collegati
            </p>
            <h1 className="mb-4 font-['Space_Grotesk',sans-serif] text-3xl font-bold tracking-tight text-[#162327] md:text-4xl">
              Area personale
            </h1>
            <p className="max-w-2xl text-[15px] leading-relaxed text-gray-700 md:text-base">
              Accessi rapidi, idee ruotate dall&apos;ACT, suggerimenti di ascolto e la stanza meditazione compaiono{' '}
              <strong className="font-semibold text-[#1A1A1A]">dopo l&apos;accesso con il tuo account</strong>.
              Nell&apos;intestazione di questa pagina trovi modulo di login e registrazione; dalla home puoi sempre
              arrivare qui anche solo per recuperare utenza.
            </p>
          </header>
          <p className="text-center text-xs leading-relaxed text-gray-600">
            In caso di emergenza o dolore forte contatta il 112, il 118 o i servizi del tuo territorio.
          </p>
        </>
      : <>
      <header className="relative overflow-hidden rounded-2xl border-[3px] border-[#1A1A1A] bg-[#E8E2D8] p-6 shadow-[4px_4px_0px_#1A1A1A] md:p-8">
        <div className="pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full border-[3px] border-[#1A1A1A]/15 bg-[#D8CDE6]/40 md:-right-4 md:-top-8 md:h-48 md:w-48" />
        <p className="relative mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-gray-600">
          {todayLabel}
        </p>
        <h1 className="relative mb-3 max-w-[22ch] font-['Space_Grotesk',sans-serif] text-3xl font-bold leading-tight text-[#1A1A1A] md:max-w-none md:text-4xl">
          Area personale
        </h1>
        <p className="relative max-w-2xl text-[15px] font-medium leading-relaxed text-gray-700 md:text-base">
          Un contenitore lento, pensato senza pressione di risultati. L&apos;ansia può essere osservata come un
          ospite di passaggio, senza etichette o giudizio.
        </p>
      </header>

      <section aria-labelledby="oasis-quick-heading">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 id="oasis-quick-heading" className="font-['Space_Grotesk',sans-serif] text-xl font-bold text-[#1A1A1A]">
            Accessi rapidi
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" className={QUICK_CARD} onClick={() => onSelectNav('med')}>
            <span className="text-2xl" aria-hidden>
              🧘‍♀️
            </span>
            <span className="font-semibold text-[#1A1A1A]">Trovare calma</span>
            <span className="text-xs font-medium text-gray-600">Meditazioni guidate</span>
          </button>
          <button type="button" className={QUICK_CARD} onClick={() => onSelectNav('tools')}>
            <span className="text-2xl" aria-hidden>
              📚
            </span>
            <span className="font-semibold text-[#1A1A1A]">Imparare con calma</span>
            <span className="text-xs font-medium text-gray-600">Strumenti e audiolibri</span>
          </button>
          <button
            type="button"
            className={`${QUICK_CARD} min-h-[112px]`}
            onClick={() => onSelectNav('diary')}
            title={
              canUseDiary ?
                undefined
              : 'Servizio riservato agli utenti registrati. Apri la pagina del diario per accedere o registrarti.'
            }
          >
            <span className="text-2xl" aria-hidden>
              ✍️
            </span>
            <span className="font-semibold text-[#1A1A1A]">
              {canUseDiary ?
                'Scrivere e alleggerire'
              : 'Servizio riservato ai registrati'}
            </span>
            <span className="text-xs font-medium leading-snug text-gray-600">
              {canUseDiary ?
                'Diario di defusione'
              : cloudEnabled ?
                'Accedi o registrati per usare il diario sul cloud'
              : 'Requisiti e accesso nella pagina dedicata'}
            </span>
          </button>
        </div>
      </section>

      <section
        className="rounded-2xl border-[3px] border-[#1A1A1A] bg-[#D8CDE6]/60 p-5 shadow-[3px_3px_0px_#1A1A1A] md:p-6"
        aria-labelledby="oasis-intent-heading"
      >
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-700">
          Idee dall&apos;ACT · cambiano ogni {(ACT_INTENTION_ROTATION_MS / 1000).toFixed(0)} secondi
        </p>
        <h2 id="oasis-intent-heading" className="mb-2 font-['Space_Grotesk',sans-serif] text-lg font-bold text-[#1A1A1A]">
          {actIntent.title}
        </h2>
        <p
          key={actIntentIndex}
          className="text-[15px] leading-relaxed text-gray-800 md:text-base"
          aria-live="polite"
        >
          {actIntent.body}
        </p>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="space-y-8 lg:col-span-7">
          <section className="rounded-2xl border-[3px] border-[#1A1A1A] bg-[#F9E784] p-6 shadow-[4px_4px_0px_#1A1A1A] md:p-7" aria-labelledby="oasis-audiobooks-spot-heading">
            <div className="mb-5 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <span className="mb-3 inline-block rounded-md border-2 border-black bg-white px-2 py-1 text-xs font-bold uppercase tracking-wider shadow-[1px_1px_0px_#1A1A1A]">
                  {lastPlaybackKnown ?
                    'Continua audiolibro'
                  : 'Dal catalogo audiolibri'}
                </span>
                <h2 id="oasis-audiobooks-spot-heading" className="font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#162327]">
                  {lastPlaybackKnown ?
                    lastPlayback?.audiobookTitle
                  : spotlightAudiobook ?
                    spotlightAudiobook.title
                  : 'Strumenti e audiolibri'}
                </h2>
                {lastPlaybackKnown && lastPlayback ?
                  <>
                    <p className="mt-1 text-sm font-semibold text-gray-800">{lastPlayback.author}</p>
                    <p className="mt-3 max-w-prose font-['Space_Grotesk',sans-serif] text-[15px] font-semibold leading-snug text-[#162327]">
                      {lastPlayback.chapterTitle}
                    </p>
                    <p className="mt-2 text-[13px] font-medium tabular-nums text-gray-800">
                      {formatPlaybackMmSs(lastPlayback.positionSec)}
                      {lastPlayback.durationSec && lastPlayback.durationSec > 0 ?
                        <>
                          {' '}
                          <span aria-hidden>/</span> {formatPlaybackMmSs(lastPlayback.durationSec)}
                        </>
                      : null}
                      {' · '}
                      Cap. {lastPlayback.chapterIndex + 1}
                    </p>
                    <p className="mt-2 max-w-prose text-[13px] leading-relaxed text-gray-800">
                      Il punto nell&apos;ascolto è salvato sul dispositivo; tocca Riprendi per aprire il lettore nello stesso
                      momento — anche da un&apos;altra pagina nell&apos;app.
                    </p>
                  </>
                : spotlightAudiobook ?
                  <>
                    <p className="mt-1 text-sm font-semibold text-gray-800">{spotlightAudiobook.author}</p>
                    <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-gray-800">{spotlightAudiobook.synopsis}</p>
                  </>
                : (
                  <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-gray-800">
                    Apri gli strumenti per la lista di capitoli e la riproduzione dal catalogo caricato sulla tua
                    copia dell&apos;app.
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {lastPlaybackKnown && lastPlayback ?
                <button
                  type="button"
                  onClick={() => {
                    stashAudiobookOpenIntent({
                      audiobookId: lastPlayback.audiobookId,
                      chapterIndex: lastPlayback.chapterIndex,
                      resumePositionSec: lastPlayback.positionSec,
                    })
                    onSelectNav('tools')
                    showToast("Riprendiamo dall'ultimo punto di ascolto…")
                  }}
                  className="w-full rounded-xl border-[3px] border-[#1A1A1A] bg-[#1ed760] py-3.5 font-['Space_Grotesk',sans-serif] text-base font-bold text-[#0a0a0a] shadow-[3px_3px_0px_#ffffff] transition hover:brightness-105 sm:w-auto sm:min-w-[13rem] sm:px-8"
                >
                  Riprendi ascolto
                </button>
              : null}
              <button
                type="button"
                onClick={() => onSelectNav('tools')}
                className={`w-full rounded-xl border-[3px] border-[#1A1A1A] py-3.5 font-['Space_Grotesk',sans-serif] text-base font-bold shadow-[3px_3px_0px_#ffffff] transition sm:w-auto sm:min-w-[14rem] sm:px-8 ${
                  lastPlaybackKnown ?
                    'bg-white text-[#1A1A1A] hover:bg-[#fafafa]'
                  : 'bg-[#1A1A1A] text-white hover:bg-[#2a383f]'
                }`}
              >
                Apri strumenti e catalogo completo
              </button>
            </div>
          </section>

          <section
            className="rounded-2xl border-[3px] border-[#1A1A1A] bg-white p-5 shadow-[3px_3px_0px_#1A1A1A] md:p-6"
            aria-labelledby="oasis-saved-listening-heading"
          >
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <span className="mb-2 inline-flex items-center gap-2 rounded-lg border-2 border-[#1A1A1A] bg-[#ecfdf5] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider">
                  <span aria-hidden>❤️</span> Salvati dall’ascolto
                </span>
                <h2 id="oasis-saved-listening-heading" className="mt-3 font-['Space_Grotesk',sans-serif] text-xl font-bold text-[#162327]">
                  Capitoli che ti ispirano
                </h2>
                <p className="mt-2 max-w-prose text-sm leading-relaxed text-gray-700">
                  I capitoli contrassegnati con «mi piace» dall’audioplayer restano qui sul dispositivo. Apri nel lettore quando vuoi ripartire da quel punto.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onSelectNav('tools')
                  showToast('Vai allo strumento audiolibri per il catalogo completo.')
                }}
                className="shrink-0 rounded-xl border-[3px] border-[#1A1A1A] bg-[#fafafa] px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] transition hover:bg-[#f4f4f5]"
              >
                Catalogo
              </button>
            </div>
            {savedListening.length === 0 ?
              <p className="rounded-xl border-2 border-dashed border-[#1A1A1A]/30 bg-[#faf8f5] px-4 py-6 text-center text-sm text-gray-600">
                Non hai ancora salvato capitoli. In riproduzione, tocca il cuore sulla barra in basso o accanto alla lista capitoli.
              </p>
            : (
              <ul className="space-y-3" role="list">
                {savedListening.map((s) => {
                  let dateLabel = ''
                  try {
                    dateLabel = new Intl.DateTimeFormat('it-IT', {
                      day: 'numeric',
                      month: 'short',
                    }).format(new Date(s.savedAt))
                  } catch {
                    dateLabel = ''
                  }
                  return (
                    <li key={`${s.audiobookId}-${s.chapterIndex}`}>
                      <div className="flex gap-3 rounded-xl border-[3px] border-[#1A1A1A] bg-[#fafefa] p-3 shadow-[2px_2px_0px_#1A1A1A] md:p-4">
                        <div className="h-14 w-11 shrink-0 overflow-hidden rounded-md border border-[#1A1A1A]/20 bg-[#e8dfd4]/60">
                          {s.coverSrc ?
                            <img src={s.coverSrc} alt="" className="h-full w-full object-cover" draggable={false} />
                          : (
                            <div className="flex h-full w-full items-center justify-center text-[9px] font-bold text-[#162327]/50">
                              ♪
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 font-['Space_Grotesk',sans-serif] text-[14px] font-bold leading-snug text-[#162327]">
                            {s.chapterTitle}
                          </p>
                          <p className="mt-1 text-[12px] font-semibold text-gray-700">
                            {s.audiobookTitle} · {s.author}
                          </p>
                          <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.12em] text-gray-500">
                            Capitolo {s.chapterIndex + 1}{dateLabel ? ` · salvato il ${dateLabel}` : ''}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="rounded-lg border-[3px] border-[#1A1A1A] bg-[#1ed760]/90 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.06em] text-[#0a0a0a] shadow-[2px_2px_0px_#1A1A1A] transition hover:brightness-105 active:translate-y-[1px]"
                              onClick={() => {
                                stashAudiobookOpenIntent({
                                  audiobookId: s.audiobookId,
                                  chapterIndex: s.chapterIndex,
                                })
                                showToast('Apertura in Strumenti e audiolibri…')
                                onSelectNav('tools')
                              }}
                            >
                              Apri nel lettore
                            </button>
                            <button
                              type="button"
                              className="rounded-lg border-2 border-[#1A1A1A]/35 bg-transparent px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-gray-700 transition hover:bg-white"
                              onClick={() => {
                                removeSavedAudiobookChapter(s.audiobookId, s.chapterIndex)
                                showToast('Rimosso dai salvati.')
                              }}
                            >
                              Rimuovi
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="oasis-exercises-heading">
            <h2 id="oasis-exercises-heading" className="mb-4 font-['Space_Grotesk',sans-serif] text-xl font-bold text-[#1A1A1A]">
              Piccoli strumenti
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => onSelectNav('diary')}
                className="rounded-2xl border-[3px] border-[#1A1A1A] bg-white p-5 text-left shadow-[4px_4px_0px_#1A1A1A] transition hover:bg-gray-50"
              >
                <h3 className="mb-1 text-lg font-bold">Diario di defusione</h3>
                <p className="text-sm text-gray-600">Scrivi con le annotazioni salvate quando sei collegata o collegato al cloud.</p>
              </button>
              <button
                type="button"
                onClick={() => onSelectNav('med')}
                className="rounded-2xl border-[3px] border-[#1A1A1A] bg-white p-5 text-left shadow-[4px_4px_0px_#1A1A1A] transition hover:bg-gray-50"
              >
                <h3 className="mb-1 text-lg font-bold">Respiro e meditazioni</h3>
                <p className="text-sm text-gray-600">Apri le meditazioni guidate della app: ciclo di ispirazioni e playlist audio operative.</p>
              </button>
            </div>
          </section>
        </div>

        <div className="lg:col-span-5">
          <section
            className="flex flex-col rounded-2xl border-[3px] border-[#1A1A1A] bg-[#A5C4D4] p-6 shadow-[4px_4px_0px_#1A1A1A] lg:sticky lg:top-4"
            aria-labelledby="oasis-meditation-heading"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="oasis-meditation-heading" className="font-['Space_Grotesk',sans-serif] text-2xl font-bold">
                Meditazioni
              </h2>
              <span className="text-2xl" aria-hidden>
                ☁️
              </span>
            </div>
            <p className="mb-5 text-sm leading-relaxed text-gray-900">
              La stanza vera è nella sezione «Meditazioni guidate»: lì parte il ciclo con voce sintetizzata e tracce quando sono disponibili.
            </p>
            <button
              type="button"
              onClick={() => onSelectNav('med')}
              className="mb-6 w-full rounded-xl border-[3px] border-[#1A1A1A] bg-[#1A1A1A] py-3.5 font-bold text-white shadow-[3px_3px_0px_#eaf4f9] transition hover:bg-[#2a383f]"
            >
              Vai alle meditazioni guidate
            </button>
            <h3 className="mb-2 text-sm font-bold uppercase tracking-[0.1em] text-gray-900">Come ti trovi ora (solo su questo dispositivo)</h3>
            <p className="mb-3 text-xs leading-relaxed text-gray-800">
              Opzionale: serve a ricordarti il contesto al prossimo accesso alla stessa area personale sul browser che stai usando.
            </p>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((mood) => {
                const on = selectedMood === mood
                return (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => toggleMood(mood)}
                    className={
                      on
                        ? 'rounded-full border-2 border-black bg-[#1A1A1A] px-4 py-1.5 text-sm font-semibold text-white shadow-[2px_2px_0px_#1A1A1A]'
                        : 'rounded-full border-2 border-black bg-white px-4 py-1.5 text-sm font-semibold shadow-[2px_2px_0px_#1A1A1A] transition hover:bg-gray-100'
                    }
                  >
                    {mood}
                  </button>
                )
              })}
            </div>
          </section>
        </div>
      </div>
      </>
      }
    </div>
  )
}
