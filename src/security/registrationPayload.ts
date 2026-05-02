import { LIMITS } from './constants'
import { sanitizeDisplayName, sanitizeEmail } from './sanitize'
import { validateEmailFormat } from './validateEmail'
import { assessPassword, passwordIssueMessages } from './passwordPolicy'
import type { RegisterFieldErrors } from './registerTypes'

export type RegistrationInput = {
  displayNameRaw: string
  emailRaw: string
  password: string
  confirmPassword: string
  privacyAccepted: boolean
}

/** Esito OK: payload effimero da inviare via HTTPS alla API (mai `localStorage`). */
export type RegistrationSanitized =
  | {
      ok: true
      displayName: string
      email: string
      /** Solo per la richiesta TLS al backend. Non persistere. */
      password: string
    }
  | { ok: false; errors: RegisterFieldErrors }

/** Validazione + sanitizzazione; la password esce solo nell’ramo ok per uso immediato. */
export function buildValidatedRegistrationPayload(
  input: RegistrationInput,
): RegistrationSanitized {
  const errors: RegisterFieldErrors = {}

  const displayName = sanitizeDisplayName(input.displayNameRaw)
  const email = sanitizeEmail(input.emailRaw)

  if (input.emailRaw.length > LIMITS.EMAIL_MAX) {
    errors.email = `L’email supera il limite di ${LIMITS.EMAIL_MAX} caratteri.`
  } else if (!validateEmailFormat(email)) {
    errors.email = email.trim() ? 'Il formato dell’email non risulta valido.' : 'Inserire un indirizzo email.'
  }

  const pass = assessPassword(input.password)
  if (!pass.ok) {
    errors.password = passwordIssueMessages(pass.issues)
  }

  if (input.password !== input.confirmPassword) {
    errors.confirmPassword = 'Le password non coincidono.'
  }

  if (!input.privacyAccepted) {
    errors.privacy = 'È necessario accettare l’informativa per proseguire.'
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors }

  return {
    ok: true,
    displayName,
    email,
    password: input.password,
  }
}
