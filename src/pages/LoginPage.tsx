import { type FormEvent, useCallback, useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleSignInButton } from '../components/GoogleSignInButton'
import { CurtainLink } from '../components/NavigationTransition'
import { useDiaryAuth } from '../context/DiaryAuthContext'
import { signInDiaryCloud } from '../lib/diaryCloud'

const inputClass =
  'mt-1.5 w-full rounded-xl border-[3px] border-[#1A1A1A] bg-white px-4 py-3 text-[15px] text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] outline-none transition placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-[#1A1A1A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4F0EA]'

function messageFromSignInError(err: unknown): string {
  const raw =
    typeof err === 'object' && err && 'message' in err && typeof (err as Error).message === 'string'
      ? ((err as Error).message || '').trim()
      : ''

  const lower = raw.toLowerCase()
  if (lower.includes('invalid login') || lower.includes('invalid_grant') || raw.includes('Invalid login credentials')) {
    return 'Email o password non corretti.'
  }
  if (lower.includes('email not confirmed')) {
    return 'Conferma prima l’indirizzo email dal messaggio ricevuto in registrazione.'
  }
  if (raw) return raw
  return 'Accesso non riuscito. Riprova tra poco.'
}

export default function LoginPage() {
  const formId = useId()
  const navigate = useNavigate()
  const { cloudEnabled, supabase } = useDiaryAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [oauthError, setOauthError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      setSubmitError(null)
      const nextErrors: typeof fieldErrors = {}
      const em = email.trim()
      if (!em) nextErrors.email = 'Inserisci l’email con cui hai creato l’account.'
      if (!password) nextErrors.password = 'Inserisci la password.'
      setFieldErrors(nextErrors)
      if (Object.keys(nextErrors).length > 0) return

      if (!supabase || !cloudEnabled) {
        setSubmitError(
          'Supabase non è configurato. Imposta VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (vedi .env.example).',
        )
        return
      }

      setSubmitting(true)
      try {
        await signInDiaryCloud(supabase, em, password)
        setPassword('')
        navigate('/', { replace: true })
      } catch (err) {
        console.error(err)
        setSubmitError(messageFromSignInError(err))
      } finally {
        setSubmitting(false)
      }
    },
    [cloudEnabled, email, navigate, password, supabase],
  )

  const emailErrId = `${formId}-email-err`
  const pwdErrId = `${formId}-password-err`

  return (
    <div className="flex min-h-dvh flex-col bg-[#F4F0EA] text-gray-900">
      <header className="shrink-0 border-b-2 border-[#1A1A1A] bg-[#F4F0EA]">
        <div className="flex items-center gap-3 px-4 py-3 md:px-8 md:py-4">
          <CurtainLink
            to="/"
            className="flex shrink-0 items-center gap-1.5 rounded-lg border-2 border-[#1A1A1A] bg-white px-2 py-2 text-sm font-semibold text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] transition hover:bg-[#eae5df] md:px-3"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Torna all&apos;app</span>
          </CurtainLink>
          <p className="font-['Space_Grotesk',sans-serif] text-xl font-bold md:text-2xl">Alveo.</p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] md:justify-center md:py-12">
        <div className="rounded-3xl border-[3px] border-[#1A1A1A] bg-white p-6 shadow-[5px_5px_0px_#1A1A1A] md:p-10">
          <p className="font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-[0.14em] text-gray-600">
            Accesso
          </p>
          <h1 className="mt-2 font-['Space_Grotesk',sans-serif] text-3xl font-bold tracking-tight text-[#162327]">
            Entra nell&apos;app
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-gray-700">
            Puoi collegarti con Google oppure con email e password già registrate. Le credenziali vanno al servizio di
            autenticazione su canale HTTPS, non sono memorizzate in questo schermo.
          </p>

          {!cloudEnabled || !supabase ? (
            <div
              className="mt-6 rounded-2xl border-[3px] border-amber-800 bg-amber-50 px-4 py-3 text-[15px] leading-relaxed text-amber-950"
              role="note"
            >
              Configurazione mancante: non troviamo <code className="text-sm">VITE_SUPABASE_URL</code> e/o{' '}
              <code className="text-sm">VITE_SUPABASE_ANON_KEY</code>. Controlla <code className="text-sm">.env.local</code>{' '}
              e riavvia il server locale.
            </div>
          ) : null}

          {oauthError ? (
            <p className="mt-4 rounded-2xl border-[3px] border-red-800 bg-red-50 px-4 py-3 text-[15px] font-medium text-red-950" role="alert">
              {oauthError}
            </p>
          ) : null}

          {cloudEnabled && supabase ? (
            <div className="mt-6">
              <GoogleSignInButton
                supabase={supabase}
                disabled={!cloudEnabled || submitting}
                variant="signin"
                onError={(m) => {
                  setOauthError(m)
                }}
              />
            </div>
          ) : null}

          <div className="relative my-8 flex items-center gap-4" aria-hidden>
            <div className="h-[3px] flex-1 bg-[#eae5df]" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">oppure email</span>
            <div className="h-[3px] flex-1 bg-[#eae5df]" />
          </div>

          <form id={formId} onSubmit={(ev) => void handleSubmit(ev)} className="flex flex-col gap-6 text-left" noValidate>
            {submitError ? (
              <p className="rounded-2xl border-[3px] border-red-800 bg-red-50 px-4 py-3 text-[15px] font-medium text-red-950" role="alert">
                {submitError}
              </p>
            ) : null}

            <div>
              <label htmlFor={`${formId}-email`} className="text-sm font-bold text-[#1A1A1A]">
                Email
              </label>
              <input
                id={`${formId}-email`}
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? emailErrId : undefined}
                className={inputClass}
                value={email}
                disabled={submitting || !cloudEnabled}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }))
                }}
                placeholder="nome@dominio.it"
              />
              {fieldErrors.email ? (
                <p id={emailErrId} className="mt-2 text-sm font-medium text-red-800" role="alert">
                  {fieldErrors.email}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor={`${formId}-password`} className="text-sm font-bold text-[#1A1A1A]">
                Password
              </label>
              <input
                id={`${formId}-password`}
                type="password"
                name="password"
                autoComplete="current-password"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? pwdErrId : undefined}
                className={inputClass}
                value={password}
                disabled={submitting || !cloudEnabled}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }))
                }}
                placeholder="••••••••"
              />
              {fieldErrors.password ? (
                <p id={pwdErrId} className="mt-2 text-sm font-medium text-red-800" role="alert">
                  {fieldErrors.password}
                </p>
              ) : null}
            </div>

            <p className="text-sm text-gray-600">
              <button
                type="button"
                disabled
                className="cursor-not-allowed font-semibold text-gray-400 underline decoration-dotted underline-offset-2"
                title="Prossimo passo: recupero tramite Supabase dalla stessa pagina"
              >
                Password dimenticata?
              </button>{' '}
              sarà disponibile a breve.
            </p>

            <button
              type="submit"
              disabled={submitting || !cloudEnabled || !supabase}
              className="rounded-2xl border-[3px] border-[#1A1A1A] bg-[#1A1A1A] py-4 font-['Space_Grotesk',sans-serif] text-base font-bold text-white shadow-[4px_4px_0px_#d8cde6] transition hover:bg-[#2a383f] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#d8cde6] disabled:opacity-50"
            >
              {submitting ? 'Accesso in corso…' : 'Entra con email'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-700">
            Non hai ancora un account?{' '}
            <CurtainLink
              to="/registrazione"
              className="font-bold text-[#1A1A1A] underline underline-offset-2 transition hover:text-[#2a383f]"
            >
              Creare account
            </CurtainLink>
          </p>
          <div className="mt-6 flex justify-center gap-4 border-t border-[#eae5df] pt-6 text-center text-sm font-semibold text-gray-600">
            <CurtainLink
              to="/"
              className="rounded-xl border-2 border-[#1A1A1A] bg-[#f4f0ea] px-4 py-2 text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] transition hover:bg-[#eae5df]"
            >
              Home app
            </CurtainLink>
          </div>
        </div>
      </main>
    </div>
  )
}
