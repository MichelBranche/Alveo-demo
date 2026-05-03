import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { DEV_BYPASS_AUTH_GATES } from '../devAuthBypass'
import { clearAudiobookLastPlayback } from '../lib/audiobookLastPlayback'
import { clearSavedAudiobookChapters } from '../lib/savedAudiobookChapters'
import { getDiarySupabase } from '../lib/diaryCloud'

export type DiaryAuthState = {
  /** Backend diario configurato (Supabase URL + anon key). */
  cloudEnabled: boolean
  /** Sessione recuperata dopo avvio listener. */
  initializing: boolean
  session: Session | null
  supabase: SupabaseClient | null
  /** Diario uso completo solo con account registrato sul servizio cloud. */
  canUseDiary: boolean
  /** Area personale e altri spazi membri sullo stesso account cloud. */
  canUseOasis: boolean
  /** Bypass login/cloud gate (solo dev, vedi `devAuthBypass.ts`). */
  devAuthBypass: boolean
}

const DiaryAuthContext = createContext<DiaryAuthState | null>(null)

export function DiaryAuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => getDiarySupabase(), [])
  const cloudEnabled = supabase != null

  const [initializing, setInitializing] = useState(() => cloudEnabled && !DEV_BYPASS_AUTH_GATES)
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    if (!supabase) {
      setInitializing(false)
      setSession(null)
      return
    }

    let alive = true

    if (DEV_BYPASS_AUTH_GATES) {
      setInitializing(false)
      void supabase.auth.getSession().then(({ data }) => {
        if (!alive) return
        setSession(data.session ?? null)
      })
    } else {
      void supabase.auth.getSession().then(({ data }) => {
        if (!alive) return
        setSession(data.session ?? null)
        setInitializing(false)
      })
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((evt, next) => {
      setSession(next)
      if (!DEV_BYPASS_AUTH_GATES && evt === 'SIGNED_OUT') {
        clearAudiobookLastPlayback()
        clearSavedAudiobookChapters()
      }
    })

    return () => {
      alive = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const canUseDiary = DEV_BYPASS_AUTH_GATES || Boolean(supabase && session)
  const canUseOasis = canUseDiary

  const value = useMemo(
    (): DiaryAuthState => ({
      cloudEnabled,
      initializing,
      session,
      supabase,
      canUseDiary,
      canUseOasis,
      devAuthBypass: DEV_BYPASS_AUTH_GATES,
    }),
    [cloudEnabled, initializing, session, supabase, canUseDiary, canUseOasis],
  )

  return <DiaryAuthContext.Provider value={value}>{children}</DiaryAuthContext.Provider>
}

export function useDiaryAuth(): DiaryAuthState {
  const ctx = useContext(DiaryAuthContext)
  if (!ctx) throw new Error('useDiaryAuth deve stare dentro DiaryAuthProvider')
  return ctx
}
