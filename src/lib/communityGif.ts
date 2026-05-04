/** Messaggio “solo GIF”: payload compatto nel campo `body` (nessuna migration DB). */
const GIF_MARK_START = '[[alveo-gif]]'
const GIF_MARK_END = '[[/alveo-gif]]'

function hostnameOk(host: string): boolean {
  const h = host.toLowerCase()
  if (h === 'media.giphy.com' || h === 'i.giphy.com' || h === 'media1.giphy.com' || h === 'media2.giphy.com')
    return true
  if (h.endsWith('.giphy.com')) return true
  if (h === 'media.tenor.com' || h === 'c.tenor.com' || h.endsWith('.tenor.com')) return true
  return false
}

/** URL HTTPS verso CDN Giphy/Tenor (immagine GIF). */
export function isAllowedCommunityGifUrl(url: string): boolean {
  const t = url.trim()
  if (!t.startsWith('https://')) return false
  try {
    const u = new URL(t)
    if (u.protocol !== 'https:') return false
    if (!hostnameOk(u.hostname)) return false
    const path = u.pathname.toLowerCase()
    if (u.hostname.includes('tenor')) return path.length > 2
    return path.endsWith('.gif') || path.endsWith('.webp') || path.includes('/giphy.gif')
  } catch {
    return false
  }
}

export function parseCommunityGifUrl(body: string): string | null {
  const t = body.trim()
  if (!t.startsWith(GIF_MARK_START) || !t.endsWith(GIF_MARK_END)) return null
  const inner = t.slice(GIF_MARK_START.length, -GIF_MARK_END.length)
  try {
    const url = decodeURIComponent(inner)
    return isAllowedCommunityGifUrl(url) ? url : null
  } catch {
    return null
  }
}

export function buildCommunityGifBody(url: string, maxLen: number): string | null {
  const u = url.trim()
  if (!isAllowedCommunityGifUrl(u)) return null
  const body = `${GIF_MARK_START}${encodeURIComponent(u)}${GIF_MARK_END}`
  return body.length <= maxLen ? body : null
}

/** True se sembra un link a una pagina Giphy (non ancora URL file .gif su media.*). */
export function looksLikeGiphyPageUrl(raw: string): boolean {
  const t = raw.trim()
  if (!t.startsWith('http')) return false
  try {
    const u = new URL(t.startsWith('http') ? t : `https://${t}`)
    const h = u.hostname.toLowerCase()
    if (h !== 'giphy.com' && h !== 'www.giphy.com') return false
    return /\/(gifs|clips|stickers)\//i.test(u.pathname) || u.pathname.startsWith('/embed/')
  } catch {
    return false
  }
}

/**
 * Da link pagina Giphy o URL media, ottiene un URL .gif su media.giphy.com adatto all’invio in chat.
 * Usa oEmbed pubblico + fallback su id nel path (nessuna API key).
 */
export async function resolveGiphyPasteToMediaGifUrl(raw: string): Promise<string | null> {
  const t = raw.trim()
  if (!t) return null
  if (isAllowedCommunityGifUrl(t)) return t

  let urlStr = t
  if (!/^https?:\/\//i.test(urlStr)) {
    if (/^(www\.)?giphy\.com\//i.test(urlStr)) urlStr = `https://${urlStr}`
    else return null
  }

  let u: URL
  try {
    u = new URL(urlStr)
  } catch {
    return null
  }

  const host = u.hostname.toLowerCase()
  if (host !== 'giphy.com' && host !== 'www.giphy.com') return null

  try {
    const oe = new URL('https://giphy.com/services/oembed')
    oe.searchParams.set('url', u.toString())
    const res = await fetch(oe.toString())
    if (res.ok) {
      const json = (await res.json()) as Record<string, unknown>
      for (const k of ['image_url', 'url'] as const) {
        const c = json[k]
        if (typeof c === 'string' && isAllowedCommunityGifUrl(c)) return c
      }
      const emb = json.embed_url
      if (typeof emb === 'string') {
        const idMatch = emb.match(/\/embed\/([a-zA-Z0-9]+)/)
        if (idMatch?.[1]) {
          const gifUrl = `https://media.giphy.com/media/${idMatch[1]}/giphy.gif`
          if (isAllowedCommunityGifUrl(gifUrl)) return gifUrl
        }
      }
    }
  } catch {
    /* rete / CORS: prova fallback path */
  }

  const embedId = u.pathname.match(/\/embed\/([a-zA-Z0-9]+)/i)?.[1]
  if (embedId) {
    const gifUrl = `https://media.giphy.com/media/${embedId}/giphy.gif`
    if (isAllowedCommunityGifUrl(gifUrl)) return gifUrl
  }

  const slug = u.pathname.replace(/^\/(?:gifs|clips|stickers)\//i, '').split(/[/?#]/)[0] ?? ''
  if (slug) {
    const parts = slug.split('-')
    for (let i = parts.length - 1; i >= 0; i--) {
      const seg = parts[i]
      if (seg && /^[a-zA-Z0-9]{8,24}$/.test(seg)) {
        const gifUrl = `https://media.giphy.com/media/${seg}/giphy.gif`
        if (isAllowedCommunityGifUrl(gifUrl)) return gifUrl
      }
    }
  }

  return null
}
