import { type FormEvent, useCallback, useId, useMemo, useRef, useState } from 'react'
import { OAuthSignInStack } from '../components/OAuthSignInButtons'
import { CurtainLink } from '../components/NavigationTransition'
import PasswordStrengthMeter from '../components/PasswordStrengthMeter'
import { useDiaryAuth } from '../context/DiaryAuthContext'
import { signUpDiaryCloud } from '../lib/diaryCloud'
import {
  buildValidatedRegistrationPayload,
  getPasswordStrength,
  LIMITS,
  type RegisterFieldErrors,
} from '../security'

const inputClass =
  'mt-1.5 w-full rounded-xl border-[3px] border-[#1A1A1A] bg-white px-4 py-3 text-[15px] text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] outline-none transition placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-[#1A1A1A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4F0EA]'

const SUBMIT_COOLDOWN_MS = 1200

function messageFromSignupError(err: unknown): string {
  const raw =
    typeof err === 'object' &&
    err &&
    'message' in err &&
    typeof (err as { message?: unknown }).message === 'string'
      ? ((err as { message: string }).message || '').trim()
      : ''

  const lower = raw.toLowerCase()

  if (
    /already (registered|exists)|duplicate|already been registered/i.test(raw) ||
    lower.includes('user already registered')
  ) {
    return 'Esiste già un account con questa email. Usa «Accedi» dalla stessa pagina.'
  }

  if (lower.includes('password') && lower.includes('weak')) {
    return 'La password è stata rifiutata dal servizio scegli una più lunga o più complessa.'
  }

  if (raw) return raw
  return 'Registrazione non riuscita. Riprova tra poco.'
}

export default function RegisterPage() {
  const formId = useId()
  const lastSubmitAt = useRef(0)
  const { cloudEnabled, supabase } = useDiaryAuth()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [errors, setErrors] = useState<RegisterFieldErrors>({})
  const [submittedOk, setSubmittedOk] = useState(false)
  const [postSubmit, setPostSubmit] = useState<'logged_in' | 'confirm_email' | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [oauthError, setOauthError] = useState<string | null>(null)

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password])

  const passwordDescribedBy = [
    `${formId}-password-hint`,
    password.length > 0 ? `${formId}-strength-label` : null,
    errors.password ? `${formId}-password-err` : null,
  ]
    .filter(Boolean)
    .join(' ')

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      const now = Date.now()
      if (now - lastSubmitAt.current < SUBMIT_COOLDOWN_MS) return
      lastSubmitAt.current = now

      setSubmittedOk(false)
      setPostSubmit(null)
      setSubmitError(null)

      const result = buildValidatedRegistrationPayload({
        displayNameRaw: displayName,
        emailRaw: email,
        password,
        confirmPassword,
        privacyAccepted,
      })

      if (!result.ok) {
        setErrors(result.errors)
        return
      }

      if (!supabase || !cloudEnabled) {
        setSubmitError(
          'Supabase non è configurato nell’ambiente dell’app. Imposta VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (vedi .env.example) e riavvia il server di sviluppo.',
        )
        return
      }

      setSubmitting(true)
      try {
        const session = await signUpDiaryCloud(supabase, result.email, result.password, {
          displayName: result.displayName.trim() ? result.displayName : undefined,
        })
        setPassword('')
        setConfirmPassword('')
        setErrors({})
        setPostSubmit(session ? 'logged_in' : 'confirm_email')
        setSubmittedOk(true)
      } catch (err) {
        console.error(err)
        setSubmitError(messageFromSignupError(err))
      } finally {
        setSubmitting(false)
      }
    },
    [
      cloudEnabled,
      confirmPassword,
      displayName,
      email,
      password,
      privacyAccepted,
      supabase,
    ],
  )

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

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] md:py-12">
        <div className="mb-8">
          <p className="font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-[0.14em] text-gray-600">
            Nuovo account
          </p>
          <h1 className="mt-2 font-['Space_Grotesk',sans-serif] text-3xl font-bold tracking-tight text-[#162327]">
            Registrazione
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-gray-700">
            Puoi usare Google, Discord oppure email e password. Le password e i dati sensibili non restano in questo schermo:
            vanno al servizio di autenticazione su canale HTTPS. Non usare password riutilizzate da altri servizi.
          </p>
        </div>

        {submittedOk && postSubmit ? (
          <div
            className="rounded-2xl border-[3px] border-[#1A1A1A] bg-[#D8CDE6]/70 p-6 shadow-[4px_4px_0px_#1A1A1A]"
            role="status"
          >
            {postSubmit === 'logged_in' ? (
              <>
                <p className="font-['Space_Grotesk',sans-serif] text-lg font-bold text-[#1A1A1A]">
                  Account creato: sei dentro
                </p>
                <p className="mt-3 text-[15px] leading-relaxed text-gray-800">
                  La sessione è attiva: puoi usare diario e area personale collegati al cloud. Se qualcosa non si aggiorna subito,
                  torna alla home e riapri la sezione.
                </p>
              </>
            ) : (
              <>
                <p className="font-['Space_Grotesk',sans-serif] text-lg font-bold text-[#1A1A1A]">
                  Controlla la posta elettronica
                </p>
                <p className="mt-3 text-[15px] leading-relaxed text-gray-800">
                  Il servizio richiede di confermare l&apos;indirizzo email prima di entrare nell&apos;app. Apri il link
                  nel messaggio; dopo la conferma potrai eseguire l&apos;accesso da «Accedi» o dal pannello nel diario.
                </p>
                <p className="mt-3 text-[15px] leading-relaxed text-gray-800">
                  Il link nell&apos;email rimanda allo stesso indirizzo da cui hai inviato la registrazione: se eri su
                  questo computer in sviluppo, vedrai <strong className="font-semibold">localhost</strong>; se ti sei
                  registrato dal sito pubblico, vedrai il tuo dominio (es. Vercel). Apri il link sullo stesso ambiente,
                  oppure registra di nuovo partendo dall&apos;URL che vuoi usare sempre.
                </p>
              </>
            )}
            <CurtainLink
              to="/"
              className="mt-6 inline-flex rounded-xl border-[3px] border-[#1A1A1A] bg-[#1A1A1A] px-6 py-3 font-semibold text-white shadow-[2px_2px_0px_#ffffff] transition hover:bg-[#2a383f]"
            >
              Tornare alla home dell&apos;app
            </CurtainLink>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {cloudEnabled && supabase ? (
              <div className="flex flex-col gap-4">
                {oauthError ? (
                  <p className="rounded-2xl border-[3px] border-red-800 bg-red-50 px-4 py-3 text-[15px] font-medium text-red-950" role="alert">
                    {oauthError}
                  </p>
                ) : null}
                <OAuthSignInStack
                  supabase={supabase}
                  disabled={submitting}
                  variant="signup"
                  onError={(m) => setOauthError(m)}
                />
                <div className="relative flex items-center gap-4" aria-hidden>
                  <div className="h-[3px] flex-1 bg-[#d8d8d0]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                    oppure email e password
                  </span>
                  <div className="h-[3px] flex-1 bg-[#d8d8d0]" />
                </div>
              </div>
            ) : null}

            <form
            id={formId}
            onSubmit={(ev) => void handleSubmit(ev)}
            className="flex flex-col gap-6"
            noValidate
            aria-busy={submitting || undefined}
          >
            {!cloudEnabled ? (
              <div
                className="rounded-2xl border-[3px] border-amber-800 bg-amber-50 px-4 py-3 text-[15px] leading-relaxed text-amber-950"
                role="note"
              >
                Configurazione mancante: non troviamo <code className="text-sm">VITE_SUPABASE_URL</code> e/o{' '}
                <code className="text-sm">VITE_SUPABASE_ANON_KEY</code>. Conferma nel file{' '}
                <code className="text-sm">.env.local</code> e riavvia{' '}
                <code className="text-sm">npm run dev</code>.
              </div>
            ) : null}

            {submitError ? (
              <p className="rounded-2xl border-[3px] border-red-800 bg-red-50 px-4 py-3 text-[15px] font-medium leading-relaxed text-red-950" role="alert">
                {submitError}
              </p>
            ) : null}
            <div>
              <label htmlFor={`${formId}-name`} className="text-sm font-bold text-[#1A1A1A]">
                Nome o come presentarsi <span className="font-medium text-gray-500">(facoltativo)</span>
              </label>
              <input
                id={`${formId}-name`}
                type="text"
                autoComplete="nickname"
                maxLength={LIMITS.DISPLAY_NAME_MAX}
                spellCheck={false}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={inputClass}
                placeholder="Es. come preferisci essere chiamato in app"
              />
            </div>

            <div>
              <label htmlFor={`${formId}-email`} className="text-sm font-bold text-[#1A1A1A]">
                Email
              </label>
              <input
                id={`${formId}-email`}
                type="email"
                autoComplete="email"
                inputMode="email"
                maxLength={LIMITS.EMAIL_MAX}
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors((x) => ({ ...x, email: undefined }))
                }}
                className={inputClass}
                placeholder="nome@esempio.it"
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? `${formId}-email-err` : undefined}
              />
              {errors.email ? (
                <p id={`${formId}-email-err`} className="mt-2 text-sm font-medium text-red-800" role="alert">
                  {errors.email}
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
                autoComplete="new-password"
                maxLength={LIMITS.PASSWORD_MAX}
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errors.password) setErrors((x) => ({ ...x, password: undefined }))
                }}
                className={inputClass}
                placeholder={`Almeno ${LIMITS.PASSWORD_MIN} caratteri`}
                aria-invalid={errors.password ? true : undefined}
                aria-describedby={passwordDescribedBy || undefined}
              />
              <PasswordStrengthMeter strength={passwordStrength} idBase={formId} />
              {errors.password ? (
                <p id={`${formId}-password-err`} className="mt-2 text-sm font-medium text-red-800" role="alert">
                  {errors.password}
                </p>
              ) : null}
              <p id={`${formId}-password-hint`} className="mt-2 text-xs text-gray-600">
                Minimo {LIMITS.PASSWORD_MIN} caratteri, massimo {LIMITS.PASSWORD_MAX}; preferibile una passphrase lunga e
                unica per Alveo.
              </p>
            </div>

            <div>
              <label htmlFor={`${formId}-confirm`} className="text-sm font-bold text-[#1A1A1A]">
                Conferma password
              </label>
              <input
                id={`${formId}-confirm`}
                type="password"
                autoComplete="new-password"
                maxLength={LIMITS.PASSWORD_MAX}
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (errors.confirmPassword) setErrors((x) => ({ ...x, confirmPassword: undefined }))
                }}
                className={inputClass}
                placeholder="Ripeti la password"
                aria-invalid={errors.confirmPassword ? true : undefined}
                aria-describedby={errors.confirmPassword ? `${formId}-confirm-err` : undefined}
              />
              {errors.confirmPassword ? (
                <p id={`${formId}-confirm-err`} className="mt-2 text-sm font-medium text-red-800" role="alert">
                  {errors.confirmPassword}
                </p>
              ) : null}
            </div>

            <div className="rounded-2xl border-[3px] border-[#1A1A1A] bg-white p-4 shadow-[3px_3px_0px_#1A1A1A]">
              <div className="flex gap-3">
                <input
                  id={`${formId}-privacy-cb`}
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(e) => {
                    setPrivacyAccepted(e.target.checked)
                    if (errors.privacy) setErrors((x) => ({ ...x, privacy: undefined }))
                  }}
                  className="mt-1 h-5 w-5 shrink-0 rounded border-2 border-[#1A1A1A] accent-[#1A1A1A]"
                  aria-invalid={errors.privacy ? true : undefined}
                  aria-describedby={
                    errors.privacy
                      ? `${formId}-privacy-err`
                      : `${formId}-privacy-hint ${formId}-privacy-link`
                  }
                />
                <div className="min-w-0 text-sm leading-relaxed text-gray-800">
                  <label htmlFor={`${formId}-privacy-cb`} className="cursor-pointer">
                    <span id={`${formId}-privacy-hint`}>
                      Dichiaro di aver letto l&apos;informativa sulla privacy e di accettare il trattamento dei dati
                      necessari alla registrazione.{' '}
                    </span>
                  </label>
                  <CurtainLink
                    id={`${formId}-privacy-link`}
                    to="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[#1A1A1A] underline underline-offset-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Leggi il testo completo
                  </CurtainLink>
                  .
                </div>
              </div>
              {errors.privacy ? (
                <p id={`${formId}-privacy-err`} className="mt-3 text-sm font-medium text-red-800" role="alert">
                  {errors.privacy}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={submitting || !cloudEnabled}
              className="rounded-2xl border-[3px] border-[#1A1A1A] bg-[#1A1A1A] py-4 font-['Space_Grotesk',sans-serif] text-base font-bold text-white shadow-[4px_4px_0px_#D8CDE6] transition hover:bg-[#2a383f] active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50"
            >
              {submitting ? 'Creazione…' : 'Crea account'}
            </button>

            <p className="text-center text-sm text-gray-700">
              Hai già un account?{' '}
              <CurtainLink to="/accedi" className="font-bold text-[#1A1A1A] underline underline-offset-2">
                Accedi
              </CurtainLink>
            </p>
          </form>
          </div>
        )}
      </main>
    </div>
  )
}
