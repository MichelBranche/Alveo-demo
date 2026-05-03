import { useCallback, useEffect, useRef, useState } from 'react'

/** Ciclo animazione cerchio */
const BREATH_MS = 5_200
/** Chiusura automatica (prima era ~19s) */
const AUTO_MS = 2_600
const REDUCED_AUTO_MS = 1_200
const EXIT_MS = 420

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

export default function BreathingFirstLaunch({
  onComplete,
}: {
  onComplete: () => void
}) {
  const reduceMotion = usePrefersReducedMotion()
  const breathMs = reduceMotion ? 3_200 : BREATH_MS

  const [exiting, setExiting] = useState(false)
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
    return () => {
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
  }, [reduceMotion, finish])

  return (
    <div
      className={`fixed inset-0 z-[100] flex min-h-[100dvh] min-h-dvh w-full cursor-pointer flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#c9dbe4] via-[#dfe8ee] to-[#e8dfd5] transition-opacity duration-[420ms] ease-out ${
        exiting ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="first-launch-title"
      tabIndex={0}
      onClick={() => {
        if (!exiting) finish()
      }}
      onKeyDown={(e) => {
        if (exiting) return
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
          e.preventDefault()
          finish()
        }
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(255,255,255,0.55),transparent_65%)]" />

      <div
        className="relative mx-auto box-border flex w-full max-w-lg shrink-0 flex-col items-center justify-center pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] pt-[max(1rem,env(safe-area-inset-top))]"
        role="presentation"
      >
        <div className="flex w-full flex-col items-center justify-center gap-8 text-center sm:gap-10">
          <h1
            id="first-launch-title"
            className="font-['Space_Grotesk',sans-serif] text-4xl font-bold tracking-tight text-[#1e2f38] md:text-5xl"
          >
            Alveo
          </h1>

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
        </div>
      </div>
    </div>
  )
}
