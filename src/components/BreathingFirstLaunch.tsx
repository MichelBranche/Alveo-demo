import { useCallback, useEffect, useRef, useState } from 'react'

const BREATH_MS = 8_600
const AUTO_MS = 19_000
const CTA_AFTER_MS = 8_500
const REDUCED_AUTO_MS = 2_600
const REDUCED_CTA_AFTER_MS = 900
const EXIT_MS = 750

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

type BreathPhase = 'in' | 'out'

export default function BreathingFirstLaunch({
  onComplete,
}: {
  onComplete: () => void
}) {
  const reduceMotion = usePrefersReducedMotion()
  const breathMs = reduceMotion ? 5_500 : BREATH_MS

  const [phase, setPhase] = useState<BreathPhase>('in')
  const [exiting, setExiting] = useState(false)
  const [showCta, setShowCta] = useState(reduceMotion)
  const doneGuard = useRef(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const finish = useCallback(() => {
    if (doneGuard.current) return
    doneGuard.current = true
    setExiting(true)
    timers.current.push(
      window.setTimeout(() => {
        onComplete()
      }, EXIT_MS),
    )
  }, [onComplete])

  useEffect(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []

    const auto = reduceMotion ? REDUCED_AUTO_MS : AUTO_MS
    timers.current.push(window.setTimeout(finish, auto))

    timers.current.push(
      window.setTimeout(() => setShowCta(true), reduceMotion ? REDUCED_CTA_AFTER_MS : CTA_AFTER_MS),
    )

    return () => {
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
  }, [reduceMotion, finish])

  useEffect(() => {
    const half = breathMs / 2
    const id = window.setInterval(() => {
      setPhase((p) => (p === 'in' ? 'out' : 'in'))
    }, half)
    return () => clearInterval(id)
  }, [breathMs])

  return (
    <div
      className={`fixed inset-0 z-[100] flex min-h-[100dvh] min-h-dvh w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#c9dbe4] via-[#dfe8ee] to-[#e8dfd5] transition-opacity duration-[750ms] ease-out ${
        exiting ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="first-launch-title"
      aria-describedby="first-launch-desc"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(255,255,255,0.55),transparent_65%)]" />

      <div
        className="relative mx-auto box-border flex w-full max-w-lg shrink-0 flex-col items-center justify-center pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] pt-[max(1rem,env(safe-area-inset-top))]"
        role="presentation"
      >
        <div className="flex w-full flex-col items-center justify-center gap-8 text-center sm:gap-10">
          <p
            id="first-launch-title"
            className="font-['Space_Grotesk',sans-serif] text-4xl font-bold tracking-tight text-[#1e2f38] md:text-5xl"
          >
            Alveo.
          </p>

          <div className="flex flex-shrink-0 items-center justify-center" aria-hidden="true">
            <div
              className={`breath-outer ${reduceMotion ? 'breath-static' : ''}`}
              style={{
                animationDuration: reduceMotion ? '0ms' : `${breathMs}ms`,
              }}
            >
              <div
                className={`breath-core ${reduceMotion ? 'breath-static-core' : ''}`}
                style={{
                  animationDuration: reduceMotion ? '0ms' : `${breathMs}ms`,
                }}
              />
            </div>
          </div>

          <div className="min-h-[4.5rem]" role="status" aria-live="polite">
            <span id="breath-vis" className="sr-only">
              {phase === 'in' ? 'Fase inspirazione.' : 'Fase espirazione.'}
            </span>
            <span className="block font-['Space_Grotesk',sans-serif] text-2xl font-semibold text-[#1e2f38]/90 md:text-3xl" aria-hidden="true">
              {phase === 'in' ? 'Inspira…' : 'Espira lentamente…'}
            </span>
            <p
              id="first-launch-desc"
              className="mt-4 block max-w-sm text-[15px] leading-relaxed text-[#374e5c] md:mx-auto md:max-w-md md:text-base"
            >
              Segui il cerchio senza fretta: non serve farlo bene, basta essere qui.
            </p>
          </div>

          <button
            type="button"
            disabled={exiting || !showCta}
            onClick={() => finish()}
            className={`text-sm font-semibold text-[#2a4855] underline decoration-[#2a4855]/35 underline-offset-4 transition-opacity duration-300 ${
              showCta && !exiting ? 'opacity-90 hover:text-[#1e2f38]' : 'cursor-default opacity-0'
            }`}
          >
            Continuare quando è il momento giusto
          </button>
        </div>
      </div>
    </div>
  )
}
