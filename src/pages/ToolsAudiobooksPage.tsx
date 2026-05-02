import { AUDIOBOOK_ACCENTS, AUDIOBOOK_CATALOG, type AudiobookAccent, type AudiobookItem } from '../content/audiobooks'

function initials(title: string) {
  const parts = title
    .replace(/['’]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
  const a = parts[0]?.[0]
  const b = parts.find((_, i) => i > 0)?.[0]
  return `${a ?? '?'}${b ?? ''}`.toUpperCase()
}

function AudiobookCover({
  title,
  coverSrc,
  accent = 'sea',
}: {
  title: string
  coverSrc?: string
  accent?: AudiobookAccent
}) {
  const a = AUDIOBOOK_ACCENTS[accent]

  if (coverSrc) {
    return (
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border-[3px] border-[#1A1A1A] bg-[#1A1A1A]/10 shadow-[3px_3px_0px_#1A1A1A]">
        <img
          src={coverSrc}
          alt={`Copertina «${title}»`}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
    )
  }

  const ini = initials(title)

  return (
    <div
      className={`relative aspect-[3/4] w-full overflow-hidden rounded-xl border-[3px] border-[#1A1A1A] bg-gradient-to-br ${a.gradient} shadow-[3px_3px_0px_#1A1A1A]`}
      aria-hidden
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-t ${a.pattern} opacity-95`}
      />
      <div className="absolute inset-[10%] rounded-lg border-[2px] border-[#1A1A1A]/35 bg-white/20" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <span className="font-['Space_Grotesk',sans-serif] text-4xl font-bold tracking-tight text-[#162327]/90 sm:text-[2.65rem]">
          {ini}
        </span>
      </div>
    </div>
  )
}

function AudiobookCard({ item }: { item: AudiobookItem }) {
  const dur =
    typeof item.durationMinutes === 'number'
      ? `${item.durationMinutes} min · ascolti brevi`
      : 'Durata libera'

  return (
    <article className="flex h-full flex-col rounded-2xl border-[3px] border-[#1A1A1A] bg-white p-4 shadow-[4px_4px_0px_#1A1A1A] sm:p-5">
      <div className="mx-auto mb-5 w-[min(100%,11rem)] sm:w-[min(100%,13rem)]">
        <AudiobookCover title={item.title} coverSrc={item.coverSrc} accent={item.accent} />
      </div>

      <h3 className="font-['Space_Grotesk',sans-serif] text-[1.15rem] font-bold leading-snug tracking-tight text-[#162327] sm:text-lg">
        {item.title}
      </h3>
      <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-gray-600">{item.author}</p>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-700">{item.synopsis}</p>

      <p className="mt-4 rounded-lg border-2 border-dashed border-[#1A1A1A]/40 bg-[#f4f0ea] px-3 py-2 text-center text-xs font-medium text-gray-700">
        {dur} ·{' '}
        <span className="font-semibold text-[#1A1A1A]">Riproduttore in arrivo</span>
      </p>
    </article>
  )
}

export default function ToolsAudiobooksPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 pb-6 md:gap-12 md:pb-4">
      <header className="rounded-3xl border-[3px] border-[#1A1A1A] bg-gradient-to-br from-[#dcecf2] via-white to-[#eae5df] p-8 shadow-[5px_5px_0px_#1A1A1A] md:p-10">
        <p className="mb-4 inline-flex items-center rounded-lg border-2 border-[#1A1A1A] bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#2a383f] shadow-[2px_2px_0px_#1A1A1A]">
          Audiolibri
        </p>
        <h1 className="font-['Space_Grotesk',sans-serif] text-3xl font-bold tracking-tight text-[#162327] md:text-[2.5rem]">
          Strumenti e audiolibri
        </h1>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[#374550] md:text-lg">
          Catalogo degli ascolti curati per Alveo: capitoli contenuti da integrare nei ritmi della giornata. Qui
          raccoglieremo titoli, copertine e note su cosa aspettarsi da ogni percorso audio.
        </p>
      </header>

      <section aria-labelledby="catalogo-audiobooks-heading">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 id="catalogo-audiobooks-heading" className="font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#1A1A1A]">
            In catalogo
          </h2>
          <p className="text-sm font-medium text-gray-600">
            {AUDIOBOOK_CATALOG.length} {AUDIOBOOK_CATALOG.length === 1 ? 'titolo' : 'titoli'}
          </p>
        </div>

        <ul className="grid list-none gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {AUDIOBOOK_CATALOG.map((item) => (
            <li key={item.id}>
              <AudiobookCard item={item} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
