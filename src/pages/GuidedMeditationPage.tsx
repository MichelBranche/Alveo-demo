import gsap from 'gsap'
import { useCallback, useEffect, useLayoutEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { useGuidedMeditationBreathPlaylist } from '../hooks/useGuidedMeditationBreathPlaylist'

const BREATH_MS = 8_600
/** Durata selezionabile: minuti (preset o custom); i cicli ≈ ceil(min×60s / durata ciclo). */
const DURATION_PRESETS_MIN = [1, 2, 4, 10, 20] as const
const CUSTOM_MIN_MINUTES = 0.5
const CUSTOM_MAX_MINUTES = 120
const DEFAULT_FALLBACK_MINUTES = 4
const TYPING_MS = 34

const INTRO_LINES = [
  'Ciao. Per questi minuti posso sembrare una voce “intelligente”, ma in realtà sono solo un testo che ti accompagna al ritmo del respiro.',
  'Trova una posizione comoda. Quando ti senti pronta o pronto, avviamo insieme qualche ciclo lento: non serve farlo perfetto.',
]

const MID_WHISPERS = [
  'Se la mente vaga, è normale. Rientra al suono della tua inspirazione.',
  'Non serve forzare: lascia che l’espirazione si allunghi da sola, se può.',
  'Resta con il corpo che si muove appena, anche solo un filo.',
]

const EXTRA_GUIDE_PHRASES = [
  'Non devi migliorare nulla in questo preciso istante: sei già qui, con questo ritmo.',
  'Lasciare andare l’obbligo di farcela bene anche solo per questi minuti è già un gesto gentile.',
  'Il petto può allargarsi un filo in più se capita, senza spingere.',
  'Se arriva giudizio, consideralo un suono che passa sul respiro, non un verdetto.',
  'Restare con la guida del cerchio vale più di “farlo perfetto”.',
  'Nota le spalle: spesso allentano da sole verso la fine di un’espirazione lunga.',
  'Tutto ciò che senti nel corpo può restare un attimo senza bisogno di nome.',
  'La fretta di “stare meglio” può aspettare fuori dalla finestra del respiro.',
  'Un pensiero che torna non è fallimento: è il sistema che prova a proteggerti.',
  'Chiediti solo: posso restare ancora mezzo respiro con questo movimento così com’è?',
  'L’aria che esce può essere un filo più lunga del necessario: non è spreco, è spazio.',
  'Se chiudi gli occhi o li tieni aperti, entrambe le scelte sono buone.',
] as const

const FULL_GUIDE_POOL = [...INTRO_LINES, ...MID_WHISPERS, ...EXTRA_GUIDE_PHRASES] as const

const MIN_SPHERE_PHRASES = 6
const MAX_SPHERE_PHRASES = 44
/** In media una nuova frase ogni ~N cicli (sessioni lunghe = più messaggi). */
const CYCLES_PER_PHRASE_HINT = 2.35

function pickStringsNoAdjacentDup(n: number, pool: readonly string[]): string[] {
  if (pool.length === 0) return []
  const out: string[] = []
  let last = ''
  for (let i = 0; i < n; i++) {
    let j = i % pool.length
    let t = pool[j]!
    if (t === last && pool.length > 1) {
      j = (j + 1) % pool.length
      t = pool[j]!
    }
    out.push(t)
    last = t
  }
  return out
}

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

/** Frasi da mostrare vicino alla sfera, distribuite sui cicli 0 … totalCycles−1. */
function buildSpherePhraseSchedule(
  totalCycles: number,
  pool: readonly string[] = FULL_GUIDE_POOL as readonly string[],
): { cycle: number; text: string }[] {
  if (totalCycles < 1) return []
  const raw = Math.max(2, Math.round(totalCycles / CYCLES_PER_PHRASE_HINT))
  const phraseCount = Math.min(
    MAX_SPHERE_PHRASES,
    totalCycles,
    Math.max(Math.min(MIN_SPHERE_PHRASES, totalCycles), raw),
  )
  const texts = pickStringsNoAdjacentDup(phraseCount, pool)
  const out: { cycle: number; text: string }[] = []
  for (let i = 0; i < phraseCount; i++) {
    const frac = phraseCount <= 1 ? 0 : i / (phraseCount - 1)
    let c = Math.round(frac * (totalCycles - 1))
    if (i > 0 && c <= out[i - 1]!.cycle) c = Math.min(totalCycles - 1, out[i - 1]!.cycle + 1)
    out.push({ cycle: c, text: texts[i]! })
  }
  return out
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

/** Attende fino a `performance.now() >= perfDeadlineMs` senza drift da somma dei timeout. */
async function waitUntilMs(perfDeadlineMs: number): Promise<void> {
  for (;;) {
    const delta = perfDeadlineMs - performance.now()
    if (delta <= 0) return
    await delay(delta)
  }
}

function clampMinutes(m: number): number {
  if (!Number.isFinite(m)) return DEFAULT_FALLBACK_MINUTES
  return Math.min(CUSTOM_MAX_MINUTES, Math.max(CUSTOM_MIN_MINUTES, m))
}

/** Quanti cicli di respiro (in + espi) per avvicinarsi alla durata scelta — legato al `breathMs` attivo. */
function cyclesFromTargetMinutes(minutes: number, breathMsOneCycle: number): number {
  const m = clampMinutes(minutes)
  const targetMs = m * 60 * 1000
  const n = Math.round(targetMs / breathMsOneCycle)
  return Math.max(2, Math.min(880, n))
}

function parseCustomMinutes(raw: string): number | null {
  const t = raw.trim().replace(',', '.')
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) && n > 0 ? n : null
}

function effectiveSessionMinutes(
  mode: 'preset' | 'custom',
  presetMin: number,
  customStr: string,
): number {
  if (mode === 'preset') return clampMinutes(presetMin)
  const p = parseCustomMinutes(customStr)
  if (p === null) return DEFAULT_FALLBACK_MINUTES
  return clampMinutes(p)
}

function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduce(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  return reduce
}

function GuideAvatar() {
  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-[3px] border-[#1A1A1A] bg-gradient-to-br from-[#d8cde6] to-[#c9dce6] shadow-[2px_2px_0px_#1A1A1A]"
      aria-hidden
    >
      <span className="text-lg">✦</span>
    </div>
  )
}

function TypingGuideMessage({
  text,
  instant,
  onDone,
  className,
  cursorClassName,
}: {
  text: string
  instant: boolean
  onDone?: () => void
  /** Sostituisce le classi base del paragrafo quando indicato. */
  className?: string
  cursorClassName?: string
}) {
  const [shown, setShown] = useState('')
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    setShown('')
    if (instant) {
      setShown(text)
      const t = window.setTimeout(() => doneRef.current?.(), 40)
      return () => window.clearTimeout(t)
    }
    let i = 0
    const id = window.setInterval(() => {
      i += 1
      setShown(text.slice(0, i))
      if (i >= text.length) {
        window.clearInterval(id)
        doneRef.current?.()
      }
    }, TYPING_MS)
    return () => window.clearInterval(id)
  }, [text, instant])

  const pClass =
    className ?? 'text-[15px] leading-relaxed text-[#1e2f38] md:text-base'
  const cClass =
    cursorClassName ??
    'ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-[#1A1A1A]/50 align-[-0.125em]'

  return (
    <p className={pClass}>
      {shown}
      {!instant && shown.length < text.length ? <span className={cClass} aria-hidden /> : null}
    </p>
  )
}

type BreathPhase = 'in' | 'out'

type SessionEndKind = 'complete' | 'stopped'

export default function GuidedMeditationPage() {
  const reduceMotion = usePrefersReducedMotion()
  const breathMs = reduceMotion ? 5_500 : BREATH_MS
  const half = breathMs / 2

  const [sessionOn, setSessionOn] = useState(false)
  const [immersiveOpen, setImmersiveOpen] = useState(false)
  /** Testo dolce aggiornato lungo la sessione, sotto la sfera del respiro. */
  const [spherePhrase, setSpherePhrase] = useState<{ id: number; text: string } | null>(null)
  const [phase, setPhase] = useState<BreathPhase>('in')
  const [displayCycle, setDisplayCycle] = useState(1)
  const [chatTail, setChatTail] = useState<{ id: string; text: string }[]>([])
  const [sessionEndedKind, setSessionEndedKind] = useState<'complete' | 'stopped' | null>(null)

  const [durationMode, setDurationMode] = useState<'preset' | 'custom'>('preset')
  const [presetMinutes, setPresetMinutes] = useState(4)
  const [customMinutesStr, setCustomMinutesStr] = useState('')
  const [activeCycleTotal, setActiveCycleTotal] = useState<number | null>(null)
  /** Incrementata quando la sfera deve ripartire da zero (sync con testo Inspira / Espira). */
  const [breathAnimEpoch, setBreathAnimEpoch] = useState(0)
  /** true quando il velo immersivo ha finito l’intro (o subito in reduced motion): il respiro parte allineato a ciò che si vede. */
  const [immersiveBreathReady, setImmersiveBreathReady] = useState(false)

  const immersiveBackdropRef = useRef<HTMLDivElement>(null)
  const immersivePanelRef = useRef<HTMLDivElement>(null)
  const interruptRef = useRef<HTMLButtonElement>(null)
  const sphereCaptionSeq = useRef(0)
  const spherePhraseByCycleRef = useRef<Map<number, string>>(new Map())
  /** Origin temporale dell’animazione sulla sfera (allinea testo inhale/exhale al CSS). */
  const breathTimelineT0Ref = useRef<number | null>(null)
  const breathRevealAppliedRef = useRef(false)
  const sessionOnRef = useRef(sessionOn)
  const exitBusyRef = useRef(false)
  /** Impostato in `startSession` prima di avviare i timer; letto dall’effect del respiro. */
  const sessionCyclesRef = useRef(28)

  const durationFieldId = useId()
  const { beginFromUserGesture: beginBreathAmbientFromClick, stop: stopBreathAmbient } =
    useGuidedMeditationBreathPlaylist()

  useEffect(() => {
    sessionOnRef.current = sessionOn
  }, [sessionOn])

  const previewMinutes = effectiveSessionMinutes(durationMode, presetMinutes, customMinutesStr)
  const previewCycles = cyclesFromTargetMinutes(previewMinutes, breathMs)
  const previewApproxClockMin =
    Math.round(((previewCycles * breathMs) / (60 * 1000)) * 10 + Number.EPSILON) / 10

  const closeImmersive = useCallback(
    (kind: SessionEndKind) => {
      if (exitBusyRef.current) return
      exitBusyRef.current = true
      stopBreathAmbient()
      setImmersiveBreathReady(false)
      setSessionOn(false)

      const runAfter = () => {
        exitBusyRef.current = false
        setSpherePhrase(null)
        setActiveCycleTotal(null)
        setImmersiveOpen(false)
        if (kind === 'complete') {
          setPhase('in')
          setSessionEndedKind('complete')
          setChatTail((prev) => [
            ...prev,
            {
              id: 'closing',
              text: 'Bene così. Resta ancora qualche momento con te, senza fare nulla di speciale.',
            },
          ])
        } else {
          setSessionEndedKind('stopped')
          setChatTail((prev) => [
            ...prev,
            {
              id: `stop-${Date.now()}`,
              text: 'Hai fermato la sessione: va benissimo. Torna quando vuoi ritrovare questo ritmo.',
            },
          ])
        }
      }

      const b = immersiveBackdropRef.current
      const p = immersivePanelRef.current

      if (reduceMotion || !b || !p) {
        runAfter()
        return
      }

      gsap.killTweensOf([b, p])
      gsap
        .timeline({ onComplete: runAfter })
        .to(p, { autoAlpha: 0, scale: 0.94, y: 48, duration: 0.44, ease: 'power3.in' })
        .to(b, { autoAlpha: 0, duration: 0.36, ease: 'power2.in' }, '-=0.26')
    },
    [reduceMotion, stopBreathAmbient],
  )

  useLayoutEffect(() => {
    if (!sessionOn) {
      breathRevealAppliedRef.current = false
      return
    }
    if (!immersiveBreathReady) return
    const firstPass = !breathRevealAppliedRef.current
    if (firstPass) breathRevealAppliedRef.current = true
    breathTimelineT0Ref.current = performance.now()
    if (firstPass) setBreathAnimEpoch((k) => k + 1)
  }, [sessionOn, immersiveBreathReady, breathAnimEpoch])

  useEffect(() => {
    let cancelled = false

    async function runBreathing() {
      if (!sessionOn || !immersiveBreathReady) return

      const total = sessionCyclesRef.current
      const scatter = spherePhraseByCycleRef.current
      const t0 = breathTimelineT0Ref.current ?? performance.now()
      for (let b = 0; b < total && !cancelled; b++) {
        const line = scatter.get(b)
        if (line !== undefined) {
          sphereCaptionSeq.current += 1
          setSpherePhrase({ id: sphereCaptionSeq.current, text: line })
        }
        setPhase('in')
        setDisplayCycle(b + 1)
        const inhaleEnd = t0 + breathMs * b + half
        await waitUntilMs(inhaleEnd)
        if (cancelled) return
        setPhase('out')
        const cycleEnd = t0 + breathMs * (b + 1)
        await waitUntilMs(cycleEnd)
        if (cancelled) return
      }

      if (cancelled) return
      closeImmersive('complete')
    }

    if (sessionOn && immersiveBreathReady) {
      runBreathing().catch(() => {})
    }

    return () => {
      cancelled = true
    }
  }, [sessionOn, immersiveBreathReady, breathMs, closeImmersive])

  useLayoutEffect(() => {
    if (!immersiveOpen) return
    const b = immersiveBackdropRef.current
    const p = immersivePanelRef.current
    if (!b || !p) return
    if (reduceMotion) {
      gsap.set([b, p], { opacity: 1, scale: 1, y: 0 })
      return
    }
    gsap.killTweensOf([b, p])
    gsap.set(b, { autoAlpha: 0 })
    gsap.set(p, { autoAlpha: 0, scale: 0.9, y: 40 })
    const tl = gsap
      .timeline({
        onComplete: () => {
          if (sessionOnRef.current) setImmersiveBreathReady(true)
        },
      })
      .to(b, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' })
      .to(p, { autoAlpha: 1, scale: 1, y: 0, duration: 0.72, ease: 'power3.out' }, '-=0.36')
    return () => {
      tl.kill()
    }
  }, [immersiveOpen, reduceMotion])

  useEffect(() => {
    if (!immersiveOpen) {
      setImmersiveBreathReady(false)
      return
    }
    if (reduceMotion) setImmersiveBreathReady(true)
  }, [immersiveOpen, reduceMotion])

  useEffect(() => {
    if (!immersiveOpen) return
    document.body.dataset.alveoBreathFullscreen = '1'
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      delete document.body.dataset.alveoBreathFullscreen
      document.body.style.overflow = prevOverflow
    }
  }, [immersiveOpen])

  useEffect(() => {
    if (!immersiveOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeImmersive('stopped')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [immersiveOpen, closeImmersive])

  useEffect(() => {
    if (!immersiveOpen || !sessionOn || !immersiveBreathReady || reduceMotion) return
    const id = window.requestAnimationFrame(() => interruptRef.current?.focus())
    return () => window.cancelAnimationFrame(id)
  }, [immersiveOpen, sessionOn, immersiveBreathReady, reduceMotion])

  const startSession = useCallback(() => {
    beginBreathAmbientFromClick()
    exitBusyRef.current = false
    setImmersiveBreathReady(false)
    breathRevealAppliedRef.current = false
    setSessionEndedKind(null)
    setChatTail([])
    setDisplayCycle(1)
    setSpherePhrase(null)
    const mins = effectiveSessionMinutes(durationMode, presetMinutes, customMinutesStr)
    const total = cyclesFromTargetMinutes(mins, breathMs)
    sessionCyclesRef.current = total
    const pool = shuffleCopy(FULL_GUIDE_POOL, Math.random) as readonly string[]
    spherePhraseByCycleRef.current = new Map(
      buildSpherePhraseSchedule(total, pool).map((s) => [s.cycle, s.text]),
    )
    sphereCaptionSeq.current = 0
    setPhase('in')
    setActiveCycleTotal(total)
    setImmersiveOpen(true)
    setSessionOn(true)
  }, [beginBreathAmbientFromClick, breathMs, customMinutesStr, durationMode, presetMinutes])

  const phaseLabel = phase === 'in' ? 'Inspira…' : 'Espira lentamente…'

  const cycleHudTotal = activeCycleTotal ?? previewCycles
  const customParseInvalid =
    durationMode === 'custom' && customMinutesStr.trim() !== '' && parseCustomMinutes(customMinutesStr) === null

  const breathPortalEl =
    typeof document !== 'undefined' ?
      createPortal(
        <>
          <div
            ref={immersiveBackdropRef}
            aria-hidden
            className="fixed inset-0 z-[920] min-h-[100dvh] bg-gradient-to-b from-[#1a2730]/45 via-[#c9dbe4]/82 to-[#e8dfd5]/90 backdrop-blur-[14px]"
          />
          <div
            role="presentation"
            className="pointer-events-none fixed inset-0 z-[930] flex flex-col overflow-hidden overscroll-none"
          >
            <section
              ref={immersivePanelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="breath-vis-label-fs"
              className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden overscroll-none bg-transparent pointer-events-none"
            >
              <span id="breath-vis-label-fs" className="sr-only">
                {!sessionOn ?
                  `Sessione in chiusura o chiusa. Ultimo ciclo indicato ${displayCycle} di ${cycleHudTotal}.`
                : `${phase === 'in' ? 'Fase inspirazione.' : 'Fase espirazione.'} Ciclo ${displayCycle} di ${cycleHudTotal}.`}
              </span>

              <div className="pointer-events-none flex shrink-0 flex-col items-center px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))] text-center opacity-100">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#fafcfd] drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)] sm:text-xs">
                  Segui il cerchio · {displayCycle} / {cycleHudTotal}
                </p>
              </div>

              <div className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center overflow-hidden px-4 py-2 opacity-100 md:pointer-events-auto md:justify-start md:pt-1 md:pb-4">
                <div className="flex w-full flex-col items-center gap-5 md:flex-col-reverse md:gap-6">
                  <div
                    key={breathAnimEpoch}
                    aria-hidden="true"
                    className={`breath-outer breath-outer--immersive ${reduceMotion ? 'breath-static' : ''}`}
                    style={{ animationDuration: reduceMotion ? '0ms' : `${breathMs}ms` }}
                  >
                    <div
                      className={`breath-core ${reduceMotion ? 'breath-static-core' : ''}`}
                      style={{ animationDuration: reduceMotion ? '0ms' : `${breathMs}ms` }}
                    />
                  </div>
                  <div
                    role="status"
                    aria-live="polite"
                    className="w-full shrink-0 px-3 md:pointer-events-auto md:max-h-[34vh] md:overflow-y-auto md:[overscroll-behavior:contain] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:h-0"
                  >
                    {spherePhrase ?
                      <div
                        key={spherePhrase.id}
                        className="alveo-sphere-caption-wrap mx-auto w-full max-w-[min(34rem,92vw)] rounded-[1.35rem] border border-white/34 bg-gradient-to-b from-white/[0.22] to-white/[0.1] px-5 py-4 text-left backdrop-blur-[16px] md:px-7 md:py-5"
                      >
                        <TypingGuideMessage
                          text={spherePhrase.text}
                          instant={reduceMotion}
                          className="text-[0.98rem] font-semibold leading-[1.65] text-[#fdfeff]/[0.98] md:text-[1.07rem] md:leading-[1.7]"
                          cursorClassName="ml-0.5 inline-block h-[1.05em] w-0.5 animate-pulse bg-white/65 align-[-0.12em] shadow-[0_0_8px_rgba(255,255,255,0.36)]"
                        />
                      </div>
                    : null}
                  </div>
                </div>
              </div>

              <div className="relative z-10 mt-auto flex shrink-0 flex-col items-center gap-3 bg-gradient-to-t from-[#eae5df]/35 via-transparent to-transparent px-5 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-6 text-center md:pt-10">
                <p
                  className="font-['Space_Grotesk',sans-serif] text-3xl font-semibold tracking-tight text-[#fbfdfe] drop-shadow-[0_2px_12px_rgba(0,0,0,0.58)] md:text-[2.125rem]"
                  aria-hidden="true"
                >
                  {phaseLabel}
                </p>
                <button
                  ref={interruptRef}
                  type="button"
                  onClick={() => closeImmersive('stopped')}
                  className="pointer-events-auto rounded-full border-[3px] border-[#1A1A1A] bg-[#f4f0ea]/92 px-5 py-3 text-sm font-bold text-[#1e2f38] shadow-[4px_4px_0_#1A1A1A] outline-none transition hover:bg-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a2730]/75"
                >
                  Interrompi quando serve
                </button>
              </div>
            </section>
          </div>
        </>,
        document.body,
      )
    : null

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-lg flex-col gap-8 pb-8 md:max-w-xl md:gap-10 md:pb-6">
      <header>
        <p className="mb-3 inline-flex items-center rounded-lg border-2 border-[#1A1A1A] bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#2a383f] shadow-[2px_2px_0px_#1A1A1A]">
          Meditazioni guidate
        </p>
        <h1 className="font-['Space_Grotesk',sans-serif] text-3xl font-bold tracking-tight text-[#162327] md:text-4xl">
          Respiro guidato
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600 md:text-[15px]">
          Dopo il pulsante giallo si apre il velo calmo a tutto schermo con il cerchio del respiro:{' '}
          <strong className="font-semibold text-gray-700">messaggi dalla guida</strong> arrivano uno alla volta vicino alla
          sfera per tutta la durata della sessione. Sottofondo musicale da tracce incluse nell&apos;app (ordine casuale); nessun streaming in rete.
        </p>
      </header>

      <section
        className="rounded-3xl border-[3px] border-[#1A1A1A] bg-gradient-to-b from-[#ece8f2] via-[#f4f0ea] to-[#dfe9ee] p-5 shadow-[5px_5px_0px_#1A1A1A] md:p-7"
        aria-labelledby="guide-chat-heading"
      >
        <h2 id="guide-chat-heading" className="sr-only">
          Conversazione con la guida al respiro
        </h2>

        <div className="mb-6 flex items-center gap-3 border-b-2 border-dashed border-[#1A1A1A]/25 pb-4">
          <GuideAvatar />
          <div className="min-w-0">
            <p className="font-['Space_Grotesk',sans-serif] text-sm font-bold text-[#1A1A1A]">Guida respiratorio</p>
            <p className="text-xs font-medium text-gray-600">
              {!sessionOn && !immersiveOpen ?
                'Pronta quando lo sei anche tu'
              : immersiveOpen ?
                (!sessionOn ? 'Fine sessione sullo schermo immersivo · torna qui' : 'Sessione attiva · frasi sulla sfera')
              : 'Sessione attiva · schermo immersivo'}
              {sessionOn || immersiveOpen ?
                <span className="ml-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-600/85" aria-hidden />
              : null}
            </p>
          </div>
        </div>

        <div className="space-y-5" role="log" aria-live="polite" aria-relevant="additions text">
          <div className="flex gap-3">
            <GuideAvatar />
            <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border-[3px] border-[#1A1A1A] bg-white px-4 py-3 shadow-[3px_3px_0px_rgba(26,26,26,0.18)]">
              <p className="text-[15px] leading-relaxed text-[#1e2f38] md:text-base">
                Da qui scegli la durata e avvia: sul velo vedrai{' '}
                <strong className="font-semibold text-[#162327]">il cerchio e le frasi sotto il cerchio</strong>, distribuite nei
                minuti della sessione, con apparizione dolce mentre respiri.
              </p>
            </div>
          </div>

          {chatTail.map((m) => (
            <div key={m.id} className="flex gap-3">
              <GuideAvatar />
              <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border-[3px] border-[#1A1A1A] bg-white/95 px-4 py-3 shadow-[3px_3px_0px_rgba(26,26,26,0.18)]">
                <p className="text-[15px] leading-relaxed text-[#1e2f38]">{m.text}</p>
              </div>
            </div>
          ))}
        </div>

        {!sessionOn && !immersiveOpen ?
          <div className="mt-6 space-y-4">
            <fieldset
              className="rounded-2xl border-2 border-dashed border-[#1A1A1A]/35 bg-white/55 p-4"
              aria-labelledby={`${durationFieldId}-legend`}
            >
              <legend
                id={`${durationFieldId}-legend`}
                className="font-['Space_Grotesk',sans-serif] px-1 text-sm font-bold text-[#1A1A1A]"
              >
                Durata della sessione
              </legend>
              <p className="mt-2 text-[13px] leading-relaxed text-gray-600 md:text-[15px]">
                Stima circa <strong>{previewCycles}</strong> cicli respiro (in + espirazione){' '}
                <span className="whitespace-nowrap">≈</span> <strong>{previewApproxClockMin}</strong>{' '}
                <span className="whitespace-nowrap">min</span> sul ritmo attuale della guida ({Math.round((breathMs / 1000) * 10) / 10}s per ciclo
                ).
              </p>
              <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Minuti preset">
                {DURATION_PRESETS_MIN.map((m) => {
                  const pressed = durationMode === 'preset' && presetMinutes === m
                  return (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={pressed}
                      onClick={() => {
                        setDurationMode('preset')
                        setPresetMinutes(m)
                      }}
                      className={
                        pressed
                          ? 'rounded-xl border-[3px] border-[#1A1A1A] bg-[#1A1A1A] px-4 py-2 text-sm font-bold text-white shadow-[2px_2px_0px_#d8cde6] transition hover:bg-[#2a383f]'
                          : 'rounded-xl border-[3px] border-[#1A1A1A] bg-white px-4 py-2 text-sm font-bold text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] transition hover:-translate-y-px hover:shadow-[3px_3px_0px_#1A1A1A]'
                      }
                    >
                      {m} min
                    </button>
                  )
                })}
                <button
                  type="button"
                  aria-pressed={durationMode === 'custom'}
                  onClick={() => setDurationMode('custom')}
                  className={
                    durationMode === 'custom' ?
                      'rounded-xl border-[3px] border-[#1A1A1A] bg-[#d8cde6] px-4 py-2 text-sm font-bold text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] ring-2 ring-[#1A1A1A] ring-offset-2 ring-offset-transparent'
                    : 'rounded-xl border-[3px] border-[#1A1A1A] bg-[#eae5df] px-4 py-2 text-sm font-bold text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] transition hover:bg-[#e0dbd4]'
                  }
                >
                  Custom
                </button>
              </div>
              {durationMode === 'custom' ?
                <div className="mt-4">
                  <label htmlFor={`${durationFieldId}-input`} className="text-xs font-bold text-[#1A1A1A]">
                    Minuti ({CUSTOM_MIN_MINUTES}–{CUSTOM_MAX_MINUTES}), decimali consentiti (es.&nbsp;7,5)
                  </label>
                  <input
                    id={`${durationFieldId}-input`}
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    min={CUSTOM_MIN_MINUTES}
                    max={CUSTOM_MAX_MINUTES}
                    aria-invalid={customParseInvalid}
                    aria-labelledby={`${durationFieldId}-legend`}
                    placeholder="Es. 5 o 15,5"
                    value={customMinutesStr}
                    onChange={(e) => setCustomMinutesStr(e.target.value)}
                    className="mt-2 w-full max-w-[12rem] rounded-xl border-[3px] border-[#1A1A1A] bg-white px-3 py-2.5 text-[15px] shadow-[2px_2px_0px_#1A1A1A] outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]"
                  />
                  {customParseInvalid ?
                    <p className="mt-2 text-[13px] font-medium text-amber-800">Aggiungi un numero valido; per ora conta la stima sopra ({DEFAULT_FALLBACK_MINUTES} min).</p>
                  : null}
                </div>
              : null}
            </fieldset>

            {sessionEndedKind !== 'complete' ?
              <button
                type="button"
                onClick={startSession}
                className="w-full rounded-xl border-[3px] border-[#1A1A1A] bg-[#f9e784] px-6 py-3.5 font-['Space_Grotesk',sans-serif] text-sm font-bold text-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] transition hover:-translate-y-px hover:shadow-[4px_4px_0px_#1A1A1A] sm:w-auto"
              >
                Iniziamo il respiro
              </button>
            : (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSessionEndedKind(null)
                    setChatTail([])
                  }}
                  className="rounded-xl border-[3px] border-[#1A1A1A] bg-[#1A1A1A] px-6 py-3.5 font-['Space_Grotesk',sans-serif] text-sm font-bold text-white shadow-[3px_3px_0px_#d8cde6] transition hover:bg-[#2a383f]"
                >
                  Ripeti la sessione
                </button>
              </div>
            )}
          </div>
        : null}
      </section>

      {immersiveOpen ? breathPortalEl : null}

      {sessionEndedKind || chatTail.some((x) => x.id === 'closing') ? (
        <p className="text-center text-xs text-gray-500">
          La guida è testo sul dispositivo; la musica parte in ordine casuale da file inclusi nell&apos;app, senza streaming in rete.
        </p>
      ) : null}
    </div>
  )
}
