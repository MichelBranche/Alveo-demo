import { LIMITS } from './constants'

/** Rimuove NUL, ASCII control (0x00-0x1F) e DEL senza regex con caratteri di controllo (lint / audit). */
function stripControls(s: string): string {
  return [...s]
    .filter((ch) => {
      const c = ch.codePointAt(0)!
      return c >= 32 && c !== 127
    })
    .join('')
}

/** Caratteri invisibili / joiner (non control ASCII). */
const INVISIBLE =
  /\uFEFF|[\u200B-\u200D\u2060-\u2064\u206A-\u206F]|[\uFFF9-\uFFFB]/g

function stripDangerousWhitespace(s: string): string {
  return stripControls(s).trim().replace(INVISIBLE, '').normalize('NFC')
}

/**
 * Nome mostrato: sanitizzazione + NFC + lunghezza plafonata.
 * Il rendering React resta comunque escaped.
 */
export function sanitizeDisplayName(raw: string): string {
  return stripDangerousWhitespace(raw).slice(0, LIMITS.DISPLAY_NAME_MAX)
}

/** Email: controlli sui byte pericolosi; lunghezza plafonata RFC-style. */
export function sanitizeEmail(raw: string): string {
  return stripDangerousWhitespace(raw).slice(0, LIMITS.EMAIL_MAX)
}
