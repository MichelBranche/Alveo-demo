import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AudiobookAlbumListenView } from '../components/AudiobookAlbumListenView'
import { AudiobookCover } from '../components/AudiobookCover'
import { AUDIOBOOK_CATALOG, type AudiobookItem } from '../content/audiobooks'
import { takeAudiobookOpenIntent } from '../lib/audiobookOpenIntent'
import type { NavId } from '../nav'

const AUDIOBOOK_PREVIEW_COUNT = 3

function CatalogMiniCard({
  item,
  onOpen,
}: {
  item: AudiobookItem
  onOpen: (id: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item.id)}
      aria-label={`Apri «${item.title}» di ${item.author}`}
      className="group flex w-full flex-col text-left [-webkit-tap-highlight-color:transparent]"
    >
      <AudiobookCover
        title={item.title}
        author={item.author}
        coverSrc={item.coverSrc}
        accent={item.accent}
        decorativeInLabel
        className="transition group-hover:-translate-y-1 group-hover:shadow-[8px_8px_0px_#1A1A1A] group-active:translate-y-0 group-active:shadow-[4px_4px_0px_#1A1A1A]"
      />
      <h3 className="mt-3 line-clamp-2 font-['Space_Grotesk',sans-serif] text-[0.95rem] font-bold leading-snug text-[#162327] sm:text-base">
        {item.title}
      </h3>
      <p className="mt-1 line-clamp-2 text-[12px] font-semibold uppercase leading-snug tracking-[0.08em] text-gray-600">
        {item.author}
      </p>
    </button>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

type Props = {
  onSelectNav?: (id: NavId) => void
}

export default function ToolsAudiobooksPage({ onSelectNav }: Props) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [chapterOpenIntent, setChapterOpenIntent] = useState<number | null>(null)
  const [fullAudiobookCatalog, setFullAudiobookCatalog] = useState(false)
  const scrollAnchorRef = useRef<HTMLDivElement>(null)

  const opened = useMemo(() => AUDIOBOOK_CATALOG.find((x) => x.id === openId) ?? null, [openId])
  const totalAudiobooks = AUDIOBOOK_CATALOG.length
  const hasMoreAudiobooks = totalAudiobooks > AUDIOBOOK_PREVIEW_COUNT
  const previewItems = useMemo(
    () => AUDIOBOOK_CATALOG.slice(0, AUDIOBOOK_PREVIEW_COUNT),
    [],
  )
  const extraAudiobookCount = Math.max(0, totalAudiobooks - AUDIOBOOK_PREVIEW_COUNT)

  useEffect(() => {
    const intent = takeAudiobookOpenIntent()
    if (!intent?.audiobookId) return
    if (!AUDIOBOOK_CATALOG.some((x) => x.id === intent.audiobookId)) return
    setOpenId(intent.audiobookId)
    setFullAudiobookCatalog(true)
    if (typeof intent.chapterIndex === 'number' && Number.isFinite(intent.chapterIndex)) {
      setChapterOpenIntent(Math.max(0, Math.floor(intent.chapterIndex)))
    }
  }, [])

  const handleOpen = useCallback((id: string) => {
    setChapterOpenIntent(null)
    setOpenId(id)
  }, [])

  const handleBack = useCallback(() => {
    setOpenId(null)
  }, [])

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [openId])

  if (opened) {
    return (
      <div ref={scrollAnchorRef}>
        <AudiobookAlbumListenView
          item={opened}
          onBack={handleBack}
          pendingChapterIndex={chapterOpenIntent ?? undefined}
          onPendingChapterApplied={() => setChapterOpenIntent(null)}
        />
      </div>
    )
  }

  return (
    <div ref={scrollAnchorRef} className="mx-auto flex w-full max-w-5xl flex-col gap-12 pb-6 md:gap-14 md:pb-4">
      <header className="rounded-3xl border-[3px] border-[#1A1A1A] bg-gradient-to-br from-[#dcecf2] via-white to-[#eae5df] p-8 shadow-[5px_5px_0px_#1A1A1A] md:p-10">
        <p className="mb-4 inline-flex items-center rounded-lg border-2 border-[#1A1A1A] bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#2a383f] shadow-[2px_2px_0px_#1A1A1A]">
          Strumenti
        </p>
        <h1 className="font-['Space_Grotesk',sans-serif] text-3xl font-bold tracking-tight text-[#162327] md:text-[2.25rem]">
          Strumenti e audiolibri
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#374550] md:text-base">
          Audiolibri in evidenza, catalogo completo su richiesta e spazio per altri percorsi audio (respiro, esercizi,
          meditazioni in stile podcast).
        </p>
      </header>

      <section aria-labelledby="tools-audiobooks-heading" className="flex flex-col gap-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h2 id="tools-audiobooks-heading" className="font-['Space_Grotesk',sans-serif] text-xl font-bold text-[#1A1A1A] md:text-2xl">
            Audiolibri
          </h2>
          <p className="text-sm font-medium text-gray-600">
            {fullAudiobookCatalog ?
              `${totalAudiobooks} ${totalAudiobooks === 1 ? 'titolo' : 'titoli'} nel catalogo`
            : `In evidenza · ${Math.min(AUDIOBOOK_PREVIEW_COUNT, totalAudiobooks)} di ${totalAudiobooks}`}
          </p>
        </div>

        <ul className="grid list-none gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 md:gap-x-8">
          {(fullAudiobookCatalog ? AUDIOBOOK_CATALOG : previewItems).map((item) => (
            <li key={item.id}>
              <CatalogMiniCard item={item} onOpen={handleOpen} />
            </li>
          ))}
        </ul>

        {hasMoreAudiobooks && !fullAudiobookCatalog ?
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setFullAudiobookCatalog(true)}
              className="group flex w-full max-w-xl items-center justify-between gap-4 rounded-2xl border-[3px] border-[#1A1A1A] bg-[#F9E784] px-5 py-4 text-left shadow-[4px_4px_0px_#1A1A1A] transition hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1A1A1A] active:translate-y-px active:shadow-[3px_3px_0px_#1A1A1A] sm:px-6 sm:py-5"
              aria-label={`Apri il catalogo completo: altri ${extraAudiobookCount} audiolibri`}
            >
              <span className="min-w-0">
                <span className="block font-['Space_Grotesk',sans-serif] text-lg font-bold text-[#162327] sm:text-xl">
                  Catalogo completo audiolibri
                </span>
                <span className="mt-1 block text-sm font-semibold text-[#374550]">
                  Altri {extraAudiobookCount} {extraAudiobookCount === 1 ? 'titolo' : 'titoli'} oltre a quelli in evidenza
                </span>
              </span>
              <ChevronRightIcon className="h-8 w-8 shrink-0 text-[#1A1A1A] transition group-hover:translate-x-0.5" />
            </button>
          </div>
        : null}

        {hasMoreAudiobooks && fullAudiobookCatalog ?
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setFullAudiobookCatalog(false)}
              className="text-sm font-bold uppercase tracking-[0.08em] text-[#2a4855] underline decoration-[#2a4855]/35 underline-offset-4 transition hover:text-[#1e2f38]"
            >
              Mostra solo i titoli in evidenza
            </button>
          </div>
        : null}
      </section>

      <section
        aria-labelledby="tools-more-heading"
        className="rounded-3xl border-[3px] border-[#1A1A1A] bg-white p-6 shadow-[5px_5px_0px_#d8cde6] md:p-8"
      >
        <h2 id="tools-more-heading" className="font-['Space_Grotesk',sans-serif] text-xl font-bold text-[#1A1A1A] md:text-2xl">
          Altri strumenti audio
        </h2>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-gray-600">
          Qui predisponiamo i percorsi oltre agli audiolibri: tecniche di respiro, esercizi guidati e meditazioni in
          formato podcast. Alcune voci si collegheranno alle sezioni già presenti in app.
        </p>

        <ul className="mt-8 grid list-none gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <li>
            <button
              type="button"
              onClick={() => onSelectNav?.('relax')}
              className="flex h-full w-full flex-col rounded-2xl border-[3px] border-[#1A1A1A] bg-gradient-to-br from-[#dcecf2] to-[#eae5df] p-5 text-left shadow-[3px_3px_0px_#1A1A1A] transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1A1A1A] active:translate-y-px"
            >
              <span className="text-2xl" aria-hidden>
                ◎
              </span>
              <span className="mt-3 font-['Space_Grotesk',sans-serif] text-lg font-bold text-[#162327]">
                Tecniche respiratorie
              </span>
              <span className="mt-2 text-sm leading-snug text-[#374550]">
                Hub su rilassamento e respiro: da qui entri anche nelle meditazioni guidate con voce e ritmo di
                inspirazione‑espirazione.
              </span>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.1em] text-[#1e2f38]">
                Apri sezione
                <ChevronRightIcon className="h-4 w-4" />
              </span>
            </button>
          </li>
          <li>
            <div className="flex h-full flex-col rounded-2xl border-[3px] border-dashed border-[#1A1A1A]/45 bg-[#f4f0ea]/80 p-5">
              <span className="text-2xl opacity-70" aria-hidden>
                ▢
              </span>
              <span className="mt-3 font-['Space_Grotesk',sans-serif] text-lg font-bold text-[#162327]">Esercizi</span>
              <span className="mt-2 text-sm leading-snug text-gray-600">
                Serie audio di esercizi ACT e regolazione emotiva: struttura podcast, in arrivo.
              </span>
              <span className="mt-4 inline-block rounded-md border border-[#1A1A1A]/25 bg-white/80 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500">
                In arrivo
              </span>
            </div>
          </li>
          <li>
            <div className="flex h-full flex-col rounded-2xl border-[3px] border-dashed border-[#1A1A1A]/45 bg-[#f4f0ea]/80 p-5">
              <span className="text-2xl opacity-70" aria-hidden>
                🎧
              </span>
              <span className="mt-3 font-['Space_Grotesk',sans-serif] text-lg font-bold text-[#162327]">
                Meditazioni guidate · podcast
              </span>
              <span className="mt-2 text-sm leading-snug text-gray-600">
                Episodi lunghi, scaletta e continuità tra sessioni: canale dedicato, separato dagli audiolibri.
              </span>
              <span className="mt-4 inline-block rounded-md border border-[#1A1A1A]/25 bg-white/80 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500">
                In arrivo
              </span>
            </div>
          </li>
        </ul>
      </section>
    </div>
  )
}
