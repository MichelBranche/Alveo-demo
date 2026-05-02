import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CloudMemberAuthPanel } from '../components/CloudMemberAuthPanel'
import { useDiaryAuth } from '../context/DiaryAuthContext'
import type { NavId } from '../nav'

const MOODS = ['Agitazione fisica', 'Pensieri ossessivi', 'Insonnia'] as const

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
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [progress] = useState(35)
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [actIntentIndex, setActIntentIndex] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3800)
  }, [])

  useEffect(() => {
    if (!canUseOasis) return
    const id = window.setInterval(() => {
      setActIntentIndex((i) => (i + 1) % ACT_INTENTIONS.length)
    }, ACT_INTENTION_ROTATION_MS)
    return () => window.clearInterval(id)
  }, [canUseOasis])

  const actIntent = ACT_INTENTIONS[actIntentIndex]

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
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-10">
        <div className="rounded-2xl border-[3px] border-[#1A1A1A] bg-[#faf8f5] p-8 text-center shadow-[4px_4px_0px_#1A1A1A]">
          <span className="mb-4 inline-flex text-3xl" aria-hidden>
            🏠
          </span>
          <h1 className="font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#162327]">Oasi personale</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-gray-700">
            Questa area è disponibile{' '}
            <strong className="font-semibold text-[#1A1A1A]">
              solo per chi ha account registrato sul servizio sicuro cloud di Alveo
            </strong>
            , una volta configurata l&apos;infrastruttura (variabili d&apos;ambiente come da{' '}
            <code className="rounded bg-white px-1 text-xs">.env.example</code>
            ).
          </p>
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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-10 md:gap-10">
      {sb ? (
        <CloudMemberAuthPanel
          ariaLabel="Account per l'oasi personale"
          headline="Solo utenti registrati"
          description="Accedi con le stesse credenziali dell’area cloud Alveo: abilitano oasi personale e diario. Se non sei ancora iscritta o iscritto, puoi crearle qui."
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
              Oasi personale
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
          Oasi personale
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
          <section
            className="relative overflow-hidden rounded-2xl border-[3px] border-[#1A1A1A] bg-[#F9E784] p-6 shadow-[4px_4px_0px_#1A1A1A]"
            aria-labelledby="oasis-audio-heading"
          >
            <h2 id="oasis-audio-heading" className="sr-only">
              Audiolibro in riproduzione
            </h2>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className="mb-3 inline-block rounded-md border-2 border-black bg-white px-2 py-1 text-xs font-bold uppercase tracking-wider shadow-[1px_1px_0px_#1A1A1A]">
                  In primo piano (demo)
                </span>
                <h3 className="text-2xl font-bold">La Trappola della Felicità</h3>
                <p className="font-medium text-gray-800">
                  Cap. 4: I pensieri non sono fatti veri (Russ Harris)
                </p>
              </div>
              <div className="flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-black bg-white shadow-[2px_2px_0px_#1A1A1A]">
                <div className="flex h-full w-full items-center justify-center bg-[#E57A44] text-xl font-bold text-white">
                  ACT
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setAudioPlaying((p) => !p)}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-[#1A1A1A] bg-white text-xl shadow-[2px_2px_0px_#1A1A1A] transition active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                aria-pressed={audioPlaying}
                aria-label={audioPlaying ? 'Metti in pausa' : 'Riproduci'}
              >
                {audioPlaying ? '⏸' : '▶'}
              </button>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex justify-between text-sm font-medium">
                  <span>12:40</span>
                  <span>34:15</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-lg border-2 border-[#1A1A1A] bg-white">
                  <div className="h-full border-r-2 border-[#1A1A1A] bg-[#1A1A1A]" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          </section>

          <section aria-labelledby="oasis-exercises-heading">
            <h2 id="oasis-exercises-heading" className="mb-4 font-['Space_Grotesk',sans-serif] text-xl font-bold text-[#1A1A1A]">
              Piccoli strumenti
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                type="button"
                className="rounded-2xl border-[3px] border-[#1A1A1A] bg-white p-5 text-left shadow-[4px_4px_0px_#1A1A1A] transition hover:bg-gray-50"
              >
                <h3 className="mb-1 text-lg font-bold">Defusione cognitiva</h3>
                <p className="text-sm text-gray-600">&quot;Io sto avendo il pensiero che…&quot;</p>
              </button>
              <button
                type="button"
                className="rounded-2xl border-[3px] border-[#1A1A1A] bg-white p-5 text-left shadow-[4px_4px_0px_#1A1A1A] transition hover:bg-gray-50"
              >
                <h3 className="mb-1 text-lg font-bold">Spazio di espansione</h3>
                <p className="text-sm text-gray-600">Lasciare spazio alle sensazioni nel corpo.</p>
              </button>
            </div>
          </section>
        </div>

        <div className="lg:col-span-5">
          <section
            className="flex min-h-[340px] flex-col rounded-2xl border-[3px] border-[#1A1A1A] bg-[#A5C4D4] p-6 shadow-[4px_4px_0px_#1A1A1A] lg:min-h-full lg:sticky lg:top-4"
            aria-labelledby="oasis-meditation-heading"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="oasis-meditation-heading" className="font-['Space_Grotesk',sans-serif] text-2xl font-bold">
                Stanza meditazione
              </h2>
              <span className="text-2xl" aria-hidden>
                ☁️
              </span>
            </div>
            <div className="mb-4 rounded-2xl border-[3px] border-[#1A1A1A] bg-white p-4 shadow-[2px_2px_0px_#1A1A1A]">
              <h3 className="text-lg font-bold">Radicamento nel presente</h3>
              <p className="mb-4 text-sm text-gray-600">Voce: Chiara • 10 min</p>
              <button
                type="button"
                className="w-full rounded-lg border-2 border-[#1A1A1A] bg-[#1A1A1A] py-3 font-bold text-white shadow-[2px_2px_0px_#1A1A1A] transition hover:bg-gray-800"
              >
                Avvia meditazione
              </button>
            </div>
            <h3 className="mb-3 font-bold">Stato d&apos;animo (opzionale)</h3>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((mood) => {
                const on = selectedMood === mood
                return (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => setSelectedMood((cur) => (cur === mood ? null : mood))}
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
