import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { useNavTransition } from './components/NavigationTransition'
import { useDiaryAuth } from './context/DiaryAuthContext'
import Lenis from 'lenis/react'
import { NAV } from './nav'
import type { NavId } from './nav'
import ComingSoon from './pages/ComingSoon'
import HomeLandingPage from './pages/HomeLandingPage'
import PersonalOasisPage from './pages/PersonalOasisPage'
import DefusionDiaryPage from './pages/DefusionDiaryPage'
import GuidedMeditationPage from './pages/GuidedMeditationPage'
import RelaxationTechniquesPage from './pages/RelaxationTechniquesPage'
import ToolsAudiobooksPage from './pages/ToolsAudiobooksPage'

function NavLinks({
  items,
  activeNav,
  onSelectNav,
  onNavigate,
}: {
  items: readonly (typeof NAV)[number][]
  activeNav: NavId
  onSelectNav: (id: NavId) => void
  onNavigate?: () => void
}) {
  return (
    <nav className="space-y-3">
      {items.map((item) => {
        const active = activeNav === item.id
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              if (active) {
                onNavigate?.()
                return
              }
              onSelectNav(item.id)
              onNavigate?.()
            }}
            className={
              active
                ? 'flex w-full items-center gap-3 rounded-xl border-2 border-black bg-white p-3 text-left font-semibold shadow-[2px_2px_0px_#1A1A1A]'
                : 'flex w-full items-center gap-3 rounded-xl p-3 text-left font-medium transition-colors hover:bg-[#DED9D3]'
            }
          >
            <span aria-hidden>{item.emoji}</span>
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}

function BackChevronIcon() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      {open ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      )}
    </svg>
  )
}

type ShellNavState = { activeNav: NavId; navPast: NavId[] }

type ShellNavAction = { type: 'go'; next: NavId } | { type: 'back' }

function shellNavReducer(s: ShellNavState, a: ShellNavAction): ShellNavState {
  if (a.type === 'go') {
    if (a.next === s.activeNav) return s
    return { activeNav: a.next, navPast: [...s.navPast, s.activeNav] }
  }
  if (s.navPast.length === 0) return s
  return {
    activeNav: s.navPast[s.navPast.length - 1]!,
    navPast: s.navPast.slice(0, -1),
  }
}

export default function AppShell() {
  const [{ activeNav, navPast }, dispatchNav] = useReducer(shellNavReducer, {
    activeNav: 'home',
    navPast: [],
  })
  const [menuOpen, setMenuOpen] = useState(false)
  const { runBehindCurtain } = useNavTransition()
  const { cloudEnabled: diaryCloudOn } = useDiaryAuth()

  const shellNavItems = useMemo(
    () => NAV.filter((n) => (n.id === 'diary' || n.id === 'oasi' ? diaryCloudOn : true)),
    [diaryCloudOn],
  )

  const currentSectionLabel = NAV.find((n) => n.id === activeNav)?.shortTitle ?? 'Home'
  const canGoBack = navPast.length > 0 && activeNav !== 'home'

  const goToSection = useCallback(
    (next: NavId) => {
      if (next === activeNav) return
      runBehindCurtain(() => {
        dispatchNav({ type: 'go', next })
      })
    },
    [activeNav, runBehindCurtain],
  )

  const goBack = useCallback(() => {
    runBehindCurtain(() => {
      dispatchNav({ type: 'back' })
    })
  }, [runBehindCurtain])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <div className="flex h-dvh max-h-dvh min-h-0 w-full overflow-hidden bg-[#F4F0EA] text-gray-900">
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ${
          menuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!menuOpen}
        onClick={() => setMenuOpen(false)}
      />

      <aside
        id="app-nav-drawer"
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,90vw)] flex-col justify-between border-r-4 border-[#1A1A1A] bg-[#EAE5DF] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] shadow-xl transition-transform duration-200 ease-out sm:w-72 md:w-72 md:shadow-2xl ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!menuOpen}
      >
        <div>
          <div className="mb-10 flex items-center justify-between gap-3 md:mb-12">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-[3px] border-[#1A1A1A] bg-[#D8CDE6] shadow-[2px_2px_0px_#1A1A1A] md:h-12 md:w-12 md:shadow-[3px_3px_0px_#1A1A1A]">
                <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </div>
              <h1 className="truncate text-2xl font-bold tracking-tighter md:text-3xl">Alveo.</h1>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-lg border-2 border-[#1A1A1A] bg-white p-2 shadow-[2px_2px_0px_#1A1A1A]"
              onClick={() => setMenuOpen(false)}
              aria-label="Chiudi menu"
            >
              <MenuIcon open />
            </button>
          </div>
          <NavLinks
            items={shellNavItems}
            activeNav={activeNav}
            onSelectNav={goToSection}
            onNavigate={() => setMenuOpen(false)}
          />
        </div>
        <button
          type="button"
          className="mt-6 flex items-center justify-center gap-2 rounded-2xl border-[3px] border-[#1A1A1A] bg-[#FF9B71] p-4 text-center font-bold shadow-[4px_4px_0px_#1A1A1A] transition hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_#1A1A1A]"
          onClick={() => setMenuOpen(false)}
        >
          <span aria-hidden>🚨</span>
          Protocollo SOS
        </button>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="shrink-0 border-b-2 border-[#1A1A1A] bg-[#F4F0EA]">
          <div className="flex items-center gap-2 px-4 py-3 md:gap-3 md:px-8 md:py-4">
            {canGoBack ? (
              <button
                type="button"
                onClick={goBack}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border-2 border-[#1A1A1A] bg-white px-2 py-2 text-sm font-semibold text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] transition hover:bg-[#f4f0ea] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0px_#1A1A1A] md:px-3"
                aria-label="Torna alla sezione precedente"
              >
                <BackChevronIcon />
                <span className="hidden sm:inline">Indietro</span>
              </button>
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="font-['Space_Grotesk',sans-serif] text-xl font-bold leading-none md:text-2xl">Alveo.</p>
              <p className="mt-1 truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-600 md:text-xs">
                {currentSectionLabel}
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-lg border-2 border-[#1A1A1A] bg-white p-2 shadow-[2px_2px_0px_#1A1A1A] md:p-2.5"
              onClick={() => setMenuOpen(true)}
              aria-expanded={menuOpen}
              aria-controls="app-nav-drawer"
              aria-label="Apri menu"
            >
              <MenuIcon open={false} />
            </button>
          </div>
        </header>

        <Lenis
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden [-webkit-overflow-scrolling:touch]"
          options={{
            lerp: 0.09,
            wheelMultiplier: 0.85,
            touchMultiplier: 1.1,
            syncTouch: true,
            autoRaf: true,
          }}
        >
          <div className="p-4 sm:p-6 md:p-8 md:pb-10">
            {activeNav === 'home' ? (
              <HomeLandingPage onEnterOasis={() => goToSection('oasi')} onSelectNav={goToSection} />
            ) : activeNav === 'oasi' ? (
              <PersonalOasisPage onSelectNav={goToSection} />
            ) : activeNav === 'tools' ? (
              <ToolsAudiobooksPage onSelectNav={goToSection} />
            ) : activeNav === 'med' ? (
              <GuidedMeditationPage />
            ) : activeNav === 'relax' ? (
              <RelaxationTechniquesPage onSelectNav={goToSection} />
            ) : activeNav === 'diary' ? (
              <DefusionDiaryPage />
            ) : (
              <ComingSoon navId={activeNav} />
            )}
          </div>
        </Lenis>
      </main>
    </div>
  )
}
