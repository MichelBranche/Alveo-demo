import { LIMITS } from './constants'

/** Blocco minimo password troppo banali (solo client-side; il server deve rifare i controlli). */
const BLOCKLIST = new Set(
  [
    'password',
    'password123',
    '123456789012',
    'qwertyqwerty',
    'alvealveo',
    'alveo123',
    'changemeplease',
    'adminadmin',
    'letmein12345',
    'welcomehome',
  ].map((x) => x.toLowerCase()),
)

export type PasswordIssue = 'length' | 'max' | 'blocklist'

export function assessPassword(pw: string): { ok: true } | { ok: false; issues: PasswordIssue[] } {
  const issues: PasswordIssue[] = []
  if (pw.length < LIMITS.PASSWORD_MIN) issues.push('length')
  if (pw.length > LIMITS.PASSWORD_MAX) issues.push('max')
  if (BLOCKLIST.has(pw.toLowerCase())) issues.push('blocklist')
  if (issues.length > 0) return { ok: false, issues }
  return { ok: true }
}

export function passwordIssueMessages(issues: PasswordIssue[]): string {
  const parts: string[] = []
  if (issues.includes('length'))
    parts.push(`Servono almeno ${LIMITS.PASSWORD_MIN} caratteri (meglio una frase lunga e memorabile).`)
  if (issues.includes('max')) parts.push(`Massimo ${LIMITS.PASSWORD_MAX} caratteri.`)
  if (issues.includes('blocklist')) parts.push('Questa password è tra quelle più scontate: sceglierne un’altra.')
  return parts.join(' ')
}

/** Livelli 1-4 per segmenti UI; 0 se campo vuoto. */
export type PasswordStrengthTier = 0 | 1 | 2 | 3 | 4

export type PasswordStrengthResult = {
  /** 0-100 per progress bar continua. */
  score: number
  /** Segmenti pieni (stile “zxcvbn” semplificato). */
  tier: PasswordStrengthTier
  /** Etichetta italiana per UI e lettori schermo. */
  label: string
  /** Stato per colori / messaggi dedicati. */
  kind: 'empty' | 'tooLong' | 'tooShort' | 'blocklist' | 'rated'
}

/** Stima euristica della robustezza (solo client; il server resta autorevole). */
export function getPasswordStrength(pw: string): PasswordStrengthResult {
  if (pw.length === 0) {
    return { score: 0, tier: 0, label: '', kind: 'empty' }
  }
  if (pw.length > LIMITS.PASSWORD_MAX) {
    return { score: 0, tier: 0, label: `Supera il limite di ${LIMITS.PASSWORD_MAX} caratteri`, kind: 'tooLong' }
  }

  const lower = /[a-z]/.test(pw)
  const upper = /[A-Z]/.test(pw)
  const digit = /\d/.test(pw)
  const symbol = /[^A-Za-z0-9]/.test(pw)
  const variety = (lower ? 1 : 0) + (upper ? 1 : 0) + (digit ? 1 : 0) + (symbol ? 1 : 0)

  const tooShort = pw.length < LIMITS.PASSWORD_MIN
  const onBlocklist = BLOCKLIST.has(pw.toLowerCase())

  let score = variety * 11
  if (pw.length >= LIMITS.PASSWORD_MIN) score += 18
  if (pw.length >= 16) score += 12
  if (pw.length >= 20) score += 12
  if (pw.length >= 26) score += 10
  if (variety >= 3) score += 8
  if (variety === 4) score += 7
  score = Math.min(100, score)

  if (tooShort) {
    score = Math.min(38, Math.round((pw.length / LIMITS.PASSWORD_MIN) * 38))
    const tier = scoreToTier(score)
    return {
      score,
      tier,
      label: `Troppo corta (servono almeno ${LIMITS.PASSWORD_MIN} caratteri)`,
      kind: 'tooShort',
    }
  }

  if (onBlocklist) {
    score = Math.min(score, 24)
    return {
      score,
      tier: scoreToTier(score),
      label: 'Password troppo comune. Scegline un’altra.',
      kind: 'blocklist',
    }
  }

  const tier = scoreToTier(score)
  const label =
    score <= 28
      ? 'Molto debole'
      : score <= 48
        ? 'Debole'
        : score <= 68
          ? 'Discreta'
          : score <= 85
            ? 'Forte'
            : 'Molto forte'

  return { score, tier, label, kind: 'rated' }
}

function scoreToTier(score: number): PasswordStrengthTier {
  if (score <= 0) return 1
  if (score <= 25) return 1
  if (score <= 50) return 2
  if (score <= 75) return 3
  return 4
}
