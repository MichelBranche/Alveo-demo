import { assertSecureApiOrigin } from './ensureHttps'

const DEFAULT_TIMEOUT_MS = 25_000

export type SecureFetchOptions = RequestInit & {
  timeoutMs?: number
}

/**
 * `fetch` con timeout, HTTPS in produzione, `credentials: same-origin`.
 * Payload sensibili: passare nel body già estratto dall’uso effimero (non loggare mai).
 */
export async function secureFetch(urlStr: string, opts: SecureFetchOptions = {}): Promise<Response> {
  assertSecureApiOrigin(urlStr)

  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal: userSignal, ...rest } = opts
  const ctl = new AbortController()
  const t = window.setTimeout(() => ctl.abort(), timeoutMs)

  if (userSignal) {
    if (userSignal.aborted) ctl.abort()
    userSignal.addEventListener('abort', () => ctl.abort(), { once: true })
  }

  const headers = new Headers(rest.headers ?? undefined)
  if (!(rest.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  try {
    return await fetch(urlStr, {
      credentials: 'same-origin',
      ...rest,
      headers,
      signal: ctl.signal,
    })
  } finally {
    window.clearTimeout(t)
  }
}
