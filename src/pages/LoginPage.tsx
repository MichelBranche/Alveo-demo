import { type FormEvent, useId, useState } from 'react'
import { CurtainLink } from '../components/NavigationTransition'

const inputClass =
  'mt-1.5 w-full rounded-xl border-[3px] border-[#1A1A1A] bg-white px-4 py-3 text-[15px] text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] outline-none transition placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-[#1A1A1A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4F0EA]'

export default function LoginPage() {
  const formId = useId()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [showDemoNotice, setShowDemoNotice] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const nextErrors: typeof fieldErrors = {}
    const em = email.trim()
    if (!em) nextErrors.email = 'Inserisci l’email con cui hai creato l’account.'
    if (!password)
      nextErrors.password = 'Inserisci la password.'
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setShowDemoNotice(false)
      return
    }
    /* Invio reale (esempio):
     * const res = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, { ... })
     * Mai registrare qui la password in chiaro nei log di produzione.
     */
    setShowDemoNotice(true)
  }

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
            Bentornato
          </p>
          <h1 className="mt-2 font-['Space_Grotesk',sans-serif] text-3xl font-bold tracking-tight text-[#162327]">
            Accesso
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-gray-700">
            Qui potrai entrare nell&apos;app con email e password. Il collegamento al servizio di autenticazione
            arriverà quando il backend sarà attivo.
          </p>

          <form id={formId} onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6 text-left" noValidate>
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

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl text-sm font-medium text-gray-800 select-none [-webkit-tap-highlight-color:transparent] focus-within:outline focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-[#1A1A1A]">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="sr-only"
                />
                <span
                  className={`mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border-[3px] border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] transition-colors ${remember ? 'bg-[#d8cde6]' : 'bg-white'}`}
                  aria-hidden
                >
                  {remember ? (
                    <svg className="h-4 w-4 text-[#1A1A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : null}
                </span>
                <span className="min-w-0 leading-snug">
                  Resta collegato · preferenza salvata in questa interfaccia quando ci sarà l&apos;account
                </span>
              </label>
              <button
                type="button"
                disabled
                className="touch-manipulation whitespace-nowrap text-sm font-semibold text-gray-400 underline decoration-dotted underline-offset-2 hover:text-gray-600 sm:text-right sm:no-underline"
                title="Disponibile con il recupero tramite backend"
              >
                Password dimenticata?
              </button>
            </div>

            {showDemoNotice ? (
              <div
                className="rounded-2xl border-[3px] border-[#1A1A1A] bg-[#eae5df] px-4 py-3 text-[15px] leading-relaxed text-gray-800"
                role="status"
              >
                In questa demo non viene verificato l&apos;accesso: quando il backend sarà pronto, qui compariranno
                successo ed eventuali messaggi dal server (senza mostrare dettagli sensibili in chiaro).
              </div>
            ) : null}

            <button
              type="submit"
              className="rounded-2xl border-[3px] border-[#1A1A1A] bg-[#1A1A1A] py-4 font-['Space_Grotesk',sans-serif] text-base font-bold text-white shadow-[4px_4px_0px_#d8cde6] transition hover:bg-[#2a383f] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#d8cde6]"
            >
              Entra (demo)
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
