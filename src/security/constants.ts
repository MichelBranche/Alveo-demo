/** Limiti input allineati a RFC / OWASP (superficie di attacco ridotta). */
export const LIMITS = {
  DISPLAY_NAME_MAX: 80,
  EMAIL_MAX: 254,
  /** Lunghezza minima consigliata OWASP / NIST-oriented (meglio una passphrase lunga che regole ostiche). */
  PASSWORD_MIN: 12,
  PASSWORD_MAX: 128,
} as const
