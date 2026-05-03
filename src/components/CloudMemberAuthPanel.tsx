import { type FormEvent, type ReactNode, useCallback, useId, useState } from 'react'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { useNavigate } from 'react-router-dom'
import { GoogleSignInButton } from './GoogleSignInButton'
import {
  signInDiaryCloud,
  signOutDiaryCloud,
} from '../lib/diaryCloud'
import { useNavTransition } from './NavigationTransition'

export type CloudMemberAuthPanelProps = {
  ariaLabel: string
  headline: string
  description: string
  logoutButtonLabel: string
  supabase: SupabaseClient
  session: Session | null
  memberAuthenticated: boolean
  authenticatedExtra?: ReactNode
  onToast: (msg: string) => void
}

export function CloudMemberAuthPanel({
  ariaLabel,
  headline,
  description,
  logoutButtonLabel,
  supabase: sb,
  session,
  memberAuthenticated,
  authenticatedExtra,
  onToast,
}: CloudMemberAuthPanelProps) {
  const formSuffix = useId()
  const navigate = useNavigate()
  const { runBehindCurtain } = useNavTransition()
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authBusy, setAuthBusy] = useState(false)

  const authInputClass =
    'mt-1 w-full rounded-xl border-[3px] border-[#1A1A1A] bg-white px-3 py-2.5 text-[15px] text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f0ea]'
  const emailId = `cloud-email-${formSuffix}`
  const passId = `cloud-pass-${formSuffix}`

  const onSignIn = useCallback(
    async (ev: FormEvent) => {
      ev.preventDefault()
      const em = authEmail.trim()
      if (!em || authPassword.length < 6) {
        onToast('Email e password almeno 6 caratteri.')
        return
      }
      setAuthBusy(true)
      try {
        await signInDiaryCloud(sb, em, authPassword)
        onToast('Accesso effettuato.')
        setAuthPassword('')
      } catch (err) {
        console.error(err)
        onToast('Accesso non riuscito controlla email e password.')
      } finally {
        setAuthBusy(false)
      }
    },
    [authEmail, authPassword, sb, onToast],
  )

  const onSignOut = useCallback(async () => {
    setAuthBusy(true)
    try {
      await signOutDiaryCloud(sb)
      onToast('Sessione chiusa rientra quando vuoi continuare.')
      setAuthPassword('')
    } catch (err) {
      console.error(err)
      onToast('Uscita non riuscita riprova.')
    } finally {
      setAuthBusy(false)
    }
  }, [sb, onToast])

  return (
    <section className="rounded-2xl border-[3px] border-[#1A1A1A] bg-white p-5 shadow-[4px_4px_0px_#1A1A1A] md:p-6" aria-label={ariaLabel}>
      <h2 className="font-['Space_Grotesk',sans-serif] text-lg font-bold text-[#162327]">{headline}</h2>
      <p className="mt-2 text-sm leading-relaxed text-gray-700">{description}</p>
      {memberAuthenticated ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A]">
              Collegato come:{' '}
              <span className="break-all font-normal">{session?.user.email ?? session?.user.id}</span>
            </p>
            {authenticatedExtra}
          </div>
          <button
            type="button"
            disabled={authBusy}
            onClick={() => void onSignOut()}
            className="rounded-xl border-[3px] border-[#1A1A1A] bg-[#f4f0ea] px-4 py-2 text-sm font-bold text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] transition hover:bg-[#eae5df] disabled:opacity-50"
          >
            {logoutButtonLabel}
          </button>
        </div>
      ) : (
        <>
          <div className="mt-4">
            <GoogleSignInButton
              supabase={sb}
              variant="signin"
              onError={(m) => onToast(m)}
            />
          </div>
          <div className="relative my-5 flex items-center gap-3" aria-hidden>
            <div className="h-0.5 flex-1 bg-[#eae5df]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">oppure email</span>
            <div className="h-0.5 flex-1 bg-[#eae5df]" />
          </div>
        <form className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end" onSubmit={(e) => void onSignIn(e)}>
          <div className="min-w-0 flex-1 md:min-w-[200px]">
            <label htmlFor={emailId} className="text-xs font-bold text-[#1A1A1A]">
              Email
            </label>
            <input
              id={emailId}
              type="email"
              autoComplete="email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              className={authInputClass}
            />
          </div>
          <div className="min-w-0 flex-1 md:min-w-[200px]">
            <label htmlFor={passId} className="text-xs font-bold text-[#1A1A1A]">
              Password
            </label>
            <input
              id={passId}
              type="password"
              autoComplete="new-password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              className={authInputClass}
              minLength={6}
            />
          </div>
          <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row sm:w-auto md:pb-px">
            <button
              type="submit"
              disabled={authBusy}
              className="rounded-xl border-[3px] border-[#1A1A1A] bg-[#1A1A1A] px-4 py-2.5 text-sm font-bold text-white shadow-[2px_2px_0px_#d8cde6] transition hover:bg-[#2a383f] disabled:opacity-50"
            >
              Accedi
            </button>
            <button
              type="button"
              disabled={authBusy}
              onClick={() => {
                runBehindCurtain(() => navigate('/registrazione'))
              }}
              className="rounded-xl border-[3px] border-[#1A1A1A] bg-[#d8cde6] px-4 py-2.5 text-sm font-bold text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              Registrati
            </button>
          </div>
        </form>
        </>
      )}
    </section>
  )
}
