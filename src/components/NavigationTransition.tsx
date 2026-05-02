import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { LinkProps } from 'react-router-dom'

type Phase = 'idle' | 'closing' | 'opening'

type NavTransitionContextValue = {
  runBehindCurtain: (fn: () => void) => void
  prefersReducedMotion: boolean
}

const NavTransitionContext = createContext<NavTransitionContextValue | null>(null)

export function useNavTransition() {
  const ctx = useContext(NavTransitionContext)
  if (!ctx) {
    throw new Error(
      'useNavTransition deve essere annidato dentro NavigationTransitionShell.',
    )
  }
  return ctx
}

/** Link che chiude prima il sipario, poi cambia pagina SPA. Con reduced motion lascia Link nativo. */
export const CurtainLink = forwardRef<HTMLAnchorElement, LinkProps>(
  (
    {
      onClick,
      to,
      replace,
      state,
      relative,
      preventScrollReset,
      reloadDocument,
      ...rest
    },
    ref,
  ) => {
    const navigate = useNavigate()
    const { runBehindCurtain, prefersReducedMotion } = useNavTransition()

    return (
      <Link
        ref={ref}
        to={to}
        replace={replace}
        state={state}
        relative={relative}
        preventScrollReset={preventScrollReset}
        reloadDocument={reloadDocument}
        {...rest}
        onClick={(e) => {
          onClick?.(e)
          if (e.defaultPrevented) return
          if (reloadDocument) return
          if (rest.target === '_blank') return
          if (e.button !== 0) return
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
          if (prefersReducedMotion) return
          e.preventDefault()
          runBehindCurtain(() => {
            navigate(to, { replace, state, relative, preventScrollReset })
          })
        }}
      />
    )
  },
)
CurtainLink.displayName = 'CurtainLink'

function CurtainOverlay({
  variant,
  onAnimationComplete,
}: {
  variant: 'closing' | 'opening'
  onAnimationComplete: () => void
}) {
  const handleEnd = useCallback(
    // React synthetic animation event names keyframes reliably across browsers here.
    (e: React.AnimationEvent<HTMLDivElement>) => {
      const names = e.animationName.split(',').map((s) => s.trim()).filter(Boolean)
      if (e.target !== e.currentTarget) return
      if (
        variant === 'closing' &&
        !names.includes('nav-curtain-close')
      ) return
      if (
        variant === 'opening' &&
        !names.includes('nav-curtain-open')
      ) return
      onAnimationComplete()
    },
    [variant, onAnimationComplete],
  )

  const animClass =
    variant === 'closing' ? 'nav-curtain--close' : 'nav-curtain--open'

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[300] overflow-hidden"
      aria-hidden
      role="presentation"
    >
      <div
        onAnimationEnd={handleEnd}
        className={`pointer-events-auto ${animClass} absolute left-0 right-0 top-0 flex min-h-[130vh] w-full shrink-0 items-stretch bg-gradient-to-b from-[#f3df6c] via-[#c9bfe8] to-[#67a8bf] shadow-[inset_0_-40px_80px_rgba(255,255,255,0.25)]`}
      >
        <div className="pointer-events-none absolute inset-0 opacity-90 mix-blend-soft-light bg-[radial-gradient(ellipse_120%_80%_at_50%_0%,rgba(255,250,235,1),transparent_72%),linear-gradient(110deg,rgba(255,200,230,0.55)_0%,transparent_38%,transparent_62%,rgba(180,236,216,0.5)_100%)]" />
      </div>
    </div>
  )
}

function usePrefersReducedMotion(): boolean {
  const [v, setV] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setV(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  return v
}

/** Avvolge le route; la navigazione programmatica deve usare CurtainLink / runBehindCurtain. */
export default function NavigationTransitionShell({ children }: { children: React.ReactNode }) {
  const [phase, setPhaseState] = useState<Phase>('idle')
  const phaseRef = useRef<Phase>('idle')
  const pendingRef = useRef<(() => void) | null>(null)
  const pendingAfterRef = useRef<(() => void) | null>(null)
  const reduceMotion = usePrefersReducedMotion()

  const syncPhase = useCallback((next: Phase) => {
    phaseRef.current = next
    setPhaseState(next)
  }, [])

  const runBehindCurtain = useCallback(
    (fn: () => void) => {
      if (reduceMotion) {
        fn()
        return
      }
      const p = phaseRef.current
      if (p === 'idle') {
        pendingRef.current = fn
        syncPhase('closing')
        return
      }
      if (p === 'closing') {
        pendingRef.current = fn
        return
      }
      pendingAfterRef.current = fn
    },
    [reduceMotion, syncPhase],
  )

  const onClosingFinish = useCallback(() => {
    const fn = pendingRef.current
    pendingRef.current = null
    fn?.()
    syncPhase('opening')
  }, [syncPhase])

  const onOpeningFinish = useCallback(() => {
    const chained = pendingAfterRef.current
    pendingAfterRef.current = null
    if (chained) {
      pendingRef.current = chained
      syncPhase('closing')
    } else {
      syncPhase('idle')
    }
  }, [syncPhase])

  const closingDoneRef = useRef(onClosingFinish)
  const openingDoneRef = useRef(onOpeningFinish)
  closingDoneRef.current = onClosingFinish
  openingDoneRef.current = onOpeningFinish

  const notifyClosingDone = useCallback(() => closingDoneRef.current(), [])
  const notifyOpeningDone = useCallback(() => openingDoneRef.current(), [])

  const contextValue = useMemo<NavTransitionContextValue>(
    () => ({
      runBehindCurtain,
      prefersReducedMotion: reduceMotion,
    }),
    [runBehindCurtain, reduceMotion],
  )

  const variant =
    phase === 'closing' ? ('closing' as const) : phase === 'opening' ? ('opening' as const) : null

  return (
    <NavTransitionContext.Provider value={contextValue}>
      {children}
      {variant ? (
        <CurtainOverlay
          key={variant}
          variant={variant}
          onAnimationComplete={
            variant === 'closing' ? notifyClosingDone : notifyOpeningDone
          }
        />
      ) : null}
    </NavTransitionContext.Provider>
  )
}
