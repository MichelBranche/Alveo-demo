/** Voce estratta da un file playlist M3U (.m3u) con voci EXTINF relative alla cartella dell’playlist. */

export type M3uTrack = {
  durationSec: number
  title: string
  /** URL assoluto sotto `/` verso `/public`. */
  fileUrl: string
}

function audiobookSegmentsToBasePath(segments: readonly string[]): string {
  return segments.map((s) => encodeURIComponent(s)).join('/')
}

/** Costruisce l’URL del file nella cartella del libro dentro `public/audiobooks/`. */
export function audiobookChapterUrl(bookDirSegments: readonly string[], relativePath: string): string {
  const parts = relativePath.split(/[/\\]/).filter(Boolean).map((p) => encodeURIComponent(p))
  return `/audiobooks/${audiobookSegmentsToBasePath(bookDirSegments)}/${parts.join('/')}`
}

/** URL della playlist nell’asset statico della app. */
export function audiobookPlaylistUrl(bookDirSegments: readonly string[], playlistBasename: string): string {
  return audiobookChapterUrl(bookDirSegments, playlistBasename)
}

/** Directory logica (solo per base URL): stessi segmenti della cartella sotto audiollibri. */
export function parseM3uPlaylist(text: string, bookDirSegments: readonly string[]): M3uTrack[] {
  const lines = text.split(/\r?\n/)
  const out: M3uTrack[] = []
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim()
    if (!line.startsWith('#EXTINF:')) continue

    const rest = line.slice(8)
    const comma = rest.indexOf(',')
    if (comma < 0) continue

    const durationSec = Number.parseFloat(rest.slice(0, comma)) || 0
    const title = rest.slice(comma + 1).trim()
    const hrefLine = lines[i + 1]?.trim()
    if (!hrefLine || hrefLine.startsWith('#')) continue

    const fileUrl = audiobookChapterUrl(bookDirSegments, hrefLine)

    i += 1
    out.push({ durationSec, title, fileUrl })
  }

  return out
}
