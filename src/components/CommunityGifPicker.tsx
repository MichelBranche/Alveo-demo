import { useEffect, useMemo, useState } from 'react'
import { isAllowedCommunityGifUrl, looksLikeGiphyPageUrl, resolveGiphyPasteToMediaGifUrl } from '../lib/communityGif'

type GiphyItem = { id: string; url: string; preview: string; title: string }

function mapGiphyData(data: unknown): GiphyItem[] {
  if (!Array.isArray(data)) return []
  const out: GiphyItem[] = []
  for (const row of data) {
    if (!row || typeof row !== 'object') continue
    const o = row as Record<string, unknown>
    const id = typeof o.id === 'string' ? o.id : ''
    const images = o.images as Record<string, { url?: string }> | undefined
    const cand = [
      images?.fixed_height?.url,
      images?.downsized?.url,
      images?.original?.url,
      images?.downsized_medium?.url,
      images?.fixed_height_small?.url,
    ].filter((x): x is string => typeof x === 'string' && x.startsWith('https://'))
    const url = cand.find((c) => /\.gif(\?|$)/i.test(c) || /\/giphy\.gif(\?|$)/i.test(c)) ?? cand[0] ?? ''
    const prev =
      images?.fixed_height_small?.url || images?.preview_gif?.url || images?.downsized?.url || url
    const title = typeof o.title === 'string' ? o.title : 'GIF'
    if (id && typeof url === 'string' && url.startsWith('https://')) {
      out.push({ id, url, preview: typeof prev === 'string' ? prev : url, title })
    }
  }
  return out
}

export default function CommunityGifPicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean
  onClose: () => void
  onPick: (gifImageUrl: string) => void
}) {
  const apiKey = (import.meta.env.VITE_GIPHY_API_KEY as string | undefined)?.trim()
  const [q, setQ] = useState('')
  const [pasteUrl, setPasteUrl] = useState('')
  const [items, setItems] = useState<GiphyItem[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [pasteBusy, setPasteBusy] = useState(false)
  const [pasteErr, setPasteErr] = useState<string | null>(null)

  const canSendPaste = useMemo(() => {
    const p = pasteUrl.trim()
    return p.length > 0 && (isAllowedCommunityGifUrl(p) || looksLikeGiphyPageUrl(p))
  }, [pasteUrl])

  useEffect(() => {
    if (!open) return
    setPasteUrl('')
    setQ('')
    setPasteErr(null)
  }, [open])

  useEffect(() => {
    setPasteErr(null)
  }, [pasteUrl])

  useEffect(() => {
    if (!open) return
    if (!apiKey) {
      setItems([])
      setErr(null)
      setLoading(false)
      return
    }
    let cancelled = false
    const term = q.trim()
    const delay = term === '' ? 0 : 400
    const id = window.setTimeout(() => {
      void (async () => {
        setLoading(true)
        setErr(null)
        try {
          const u =
            term === '' ?
              new URL('https://api.giphy.com/v1/gifs/trending')
            : new URL('https://api.giphy.com/v1/gifs/search')
          u.searchParams.set('api_key', apiKey)
          u.searchParams.set('limit', '24')
          u.searchParams.set('rating', 'pg')
          if (term !== '') u.searchParams.set('q', term)
          const res = await fetch(u.toString())
          if (!res.ok) throw new Error(term === '' ? 'Caricamento GIF non riuscito' : 'Ricerca GIF non riuscita')
          const json = (await res.json()) as { data?: unknown }
          if (!cancelled) setItems(mapGiphyData(json.data))
        } catch (e) {
          if (!cancelled) {
            setErr(e instanceof Error ? e.message : 'Errore rete')
            setItems([])
          }
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()
    }, delay)
    return () => {
      cancelled = true
      window.clearTimeout(id)
    }
  }, [open, q, apiKey])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Scegli una GIF"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex max-h-[min(85dvh,32rem)] w-full max-w-lg flex-col rounded-t-3xl border-[3px] border-[#1A1A1A] border-b-0 bg-[#faf8f5] shadow-[0_-4px_0_#1A1A1A] sm:rounded-3xl sm:border-b-[3px] sm:shadow-[5px_5px_0px_#1A1A1A]">
        <div className="flex items-center justify-between border-b-2 border-[#1A1A1A]/10 px-4 py-3">
          <div>
            <p className="font-['Space_Grotesk',sans-serif] text-lg font-bold text-[#162327]">GIF da Giphy</p>
            <p className="mt-0.5 text-[11px] font-medium text-[#5c6b72]">
              Scegli dalla griglia o incolla un link da{' '}
              <a
                href="https://giphy.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#162327] underline decoration-2 underline-offset-2"
              >
                giphy.com
              </a>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border-2 border-[#1A1A1A] bg-white px-3 py-1 text-sm font-bold"
          >
            Chiudi
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
          {!apiKey ?
            <div className="rounded-xl border-2 border-dashed border-[#1A1A1A]/25 bg-white/80 p-3 text-sm leading-relaxed text-[#374550]">
              <p>
                Per la <strong>griglia con ricerca</strong> serve una chiave gratuita: creala su{' '}
                <a
                  href="https://developers.giphy.com/dashboard/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#162327] underline decoration-2 underline-offset-2"
                >
                  developers.giphy.com
                </a>{' '}
                e aggiungi <code className="rounded bg-[#f4f0ea] px-1 text-xs">VITE_GIPHY_API_KEY</code> nel file env,
                poi ricostruisci l&apos;app.
              </p>
              <p className="mt-2">
                <strong>Senza chiave:</strong> apri{' '}
                <a
                  href="https://giphy.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#162327] underline decoration-2 underline-offset-2"
                >
                  Giphy
                </a>
                , scegli una GIF → Condividi → Copia link e incollalo qui sotto: la convertiamo in immagine inviabile.
              </p>
            </div>
          : (
            <>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cerca…"
                className="w-full rounded-xl border-2 border-[#1A1A1A] bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1A1A1A]/25"
              />
              {err ?
                <p className="text-sm font-medium text-red-700">{err}</p>
              : null}
              {loading ?
                <p className="text-sm text-gray-600">Carico…</p>
              : null}
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {items.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => onPick(g.url)}
                    className="aspect-square overflow-hidden rounded-xl border-2 border-[#1A1A1A]/20 bg-white transition hover:border-[#1A1A1A] hover:shadow-[2px_2px_0_#1A1A1A]"
                    title={g.title}
                  >
                    <img src={g.preview} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="border-t-2 border-dashed border-[#1A1A1A]/15 pt-3">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#5c6b72]">
              Incolla link Giphy o URL .gif (media.giphy.com)
            </p>
            {pasteErr ?
              <p className="mt-2 text-sm font-medium text-red-700">{pasteErr}</p>
            : null}
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                value={pasteUrl}
                onChange={(e) => setPasteUrl(e.target.value)}
                placeholder="https://giphy.com/gifs/… oppure https://media.giphy.com/…/giphy.gif"
                className="min-w-0 flex-1 rounded-xl border-2 border-[#1A1A1A] bg-white px-3 py-2 text-sm"
              />
              <button
                type="button"
                disabled={!canSendPaste || pasteBusy}
                onClick={() => {
                  void (async () => {
                    const p = pasteUrl.trim()
                    if (!p) return
                    setPasteBusy(true)
                    setPasteErr(null)
                    try {
                      const media = isAllowedCommunityGifUrl(p) ? p : await resolveGiphyPasteToMediaGifUrl(p)
                      if (media) {
                        onPick(media)
                        return
                      }
                      setPasteErr(
                        'Non siamo riusciti a ottenere la GIF da questo link. Prova «Copia link» dalla pagina Giphy, oppure un URL che finisca in .gif (media.giphy.com).',
                      )
                    } finally {
                      setPasteBusy(false)
                    }
                  })()
                }}
                className="shrink-0 rounded-xl border-[3px] border-[#1A1A1A] bg-[#f9e784] px-4 py-2 text-sm font-bold shadow-[2px_2px_0_#1A1A1A] disabled:opacity-40"
              >
                {pasteBusy ? 'Attendi…' : 'Usa questo link'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
