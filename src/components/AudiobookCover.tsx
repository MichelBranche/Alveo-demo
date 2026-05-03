import { AUDIOBOOK_ACCENTS, type AudiobookAccent } from '../content/audiobooks'

function initials(title: string) {
  const parts = title
    .replace(/['’]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
  const a = parts[0]?.[0]
  const b = parts.find((_, i) => i > 0)?.[0]
  return `${a ?? '?'}${b ?? ''}`.toUpperCase()
}

type AudiobookCoverProps = {
  title: string
  author?: string
  coverSrc?: string
  accent?: AudiobookAccent
  /** Se la copertina è dentro un controllo già etichettato (es. pulsante griglia catalogo). */
  decorativeInLabel?: boolean
  /**
   * `catalog`: formato quadrato compatto tipo “tile” (liste orizzontali / mobile densi).
   * `album`: ritratto 3:4 (pagina libro, griglia desktop).
   */
  layout?: 'album' | 'catalog'
  className?: string
}

export function AudiobookCover({
  title,
  author,
  coverSrc,
  accent = 'sea',
  decorativeInLabel = false,
  layout = 'album',
  className = '',
}: AudiobookCoverProps) {
  const a = AUDIOBOOK_ACCENTS[accent]
  const isCatalog = layout === 'catalog'
  const frameClass = isCatalog
    ? 'relative aspect-square w-full overflow-hidden rounded-md border-2 border-[#1A1A1A] bg-[#1A1A1A]/08 shadow-[2px_2px_0px_#1A1A1A]'
    : 'relative aspect-[3/4] w-full overflow-hidden rounded-2xl border-[3px] border-[#1A1A1A] bg-[#1A1A1A]/10 shadow-[6px_6px_0px_#1A1A1A]'

  if (coverSrc) {
    const a11yAuthor = author?.trim()
    const alt = decorativeInLabel
      ? ''
      : `Copertina: ${title}${a11yAuthor ? ` — ${a11yAuthor}` : ''}`
    return (
      <div className={`${frameClass} ${className}`}>
        <img
          src={coverSrc}
          alt={alt}
          aria-hidden={decorativeInLabel}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
    )
  }

  const ini = initials(title)

  return (
    <div className={`${frameClass} bg-gradient-to-br ${a.gradient} ${className}`} aria-hidden>
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-t opacity-95 ${a.pattern}`} />
      <div
        className={
          isCatalog ?
            'absolute inset-[12%] rounded-md border-[1.5px] border-[#1A1A1A]/35 bg-white/18'
          : 'absolute inset-[10%] rounded-xl border-[2px] border-[#1A1A1A]/35 bg-white/20'
        }
      />
      <div className="absolute inset-0 flex items-center justify-center p-3">
        <span
          className={
            isCatalog ?
              "font-['Space_Grotesk',sans-serif] text-3xl font-bold tracking-tight text-[#162327]/90"
            : "font-['Space_Grotesk',sans-serif] text-4xl font-bold tracking-tight text-[#162327]/90 sm:text-5xl md:text-6xl"
          }
        >
          {ini}
        </span>
      </div>
    </div>
  )
}
