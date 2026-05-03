import { useRef } from 'react'
import { useDiaryAuth } from '../context/DiaryAuthContext'
import { useServiceCardTilt } from '../hooks/useServiceCardTilt'
import type { NavId } from '../nav'

type Props = {
  onSelectNav: (id: NavId) => void
}

export default function LandingServiceProposals({ onSelectNav }: Props) {
  const listRef = useRef<HTMLUListElement>(null)
  const { cloudEnabled: diaryCloudOn, canUseDiary } = useDiaryAuth()
  useServiceCardTilt(listRef)

  return (
    <section
      className="rounded-3xl border-[3px] border-[#1A1A1A] bg-[#faf8f5] px-6 py-9 shadow-[5px_5px_0px_#1A1A1A] md:px-10 md:py-11"
      aria-labelledby="landing-services-heading"
    >
      <div className="mb-8 max-w-2xl md:mb-10">
        <p className="mb-4 inline-flex items-center rounded-lg border-2 border-[#1A1A1A] bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#2a383f] shadow-[2px_2px_0px_#1A1A1A]">
          Percorsi e ascolti
        </p>
        <h2
          id="landing-services-heading"
          className="font-['Space_Grotesk',sans-serif] text-2xl font-bold tracking-tight text-[#162327] md:text-3xl"
        >
          Proposte in Alveo
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-[#374550] md:text-base">
          Contenuti pensati da affrontare senza affanno: parole da ascolto, allenamenti di attenzione e piccoli esercizi
          per accompagnare corpo e respiro. L&apos;area personale e il diario di defusione si aprono dopo registrazione
          e login sul cloud (quando configurato): due spazi dove tornare nei momenti agitati o annotare prendendo distanza,
          ispirati all'ACT.
        </p>
      </div>

      {/* Larghezza card come la vecchia grid a 3 colonne: calc((container - 2×gap)/3); scorrimento orizzontale con 4 voci */}
      <div className="@container min-w-0 w-full touch-pan-x">
        <ul
          ref={listRef}
          role="list"
          aria-label="Proposte contenuti · scorrimento orizzontale"
          className="flex snap-x snap-proximity list-none gap-6 overflow-x-auto overflow-y-visible overscroll-x-contain pb-3 pt-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] [scrollbar-color:rgba(26,26,26,0.35)_transparent]"
        >
        <li className="snap-start perspective-[1000px] w-[clamp(17rem,calc((100cqw-3rem)/3),24rem)] shrink-0">
          <article
            data-service-card
            className="flex h-full flex-col rounded-2xl border-[3px] border-[#1A1A1A] bg-gradient-to-br from-[#dcecf2] via-white to-[#eae5df] p-6 shadow-[4px_4px_0px_#1A1A1A] [transform-style:preserve-3d]"
          >
            <span className="mb-5 block text-2xl md:text-[1.85rem]" aria-hidden>
              🎧
            </span>
            <h3 className="font-['Space_Grotesk',sans-serif] text-lg font-bold text-[#162327]">Audiolibri</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-800 md:text-[15px]">
              Narrative e materiali parlati suddivisi in capitoli corti: per camminare, riposarsi o tenere bassa la
              richiesta di concentrazione.
            </p>
            <button
              type="button"
              onClick={() => onSelectNav('tools')}
              className="mt-6 w-full cursor-pointer rounded-xl border-[3px] border-[#1A1A1A] bg-white py-3.5 text-sm font-bold text-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1A1A1A] active:translate-x-[1px] active:translate-y-[1px]"
            >
              Vai agli strumenti
            </button>
          </article>
        </li>
        <li className="snap-start perspective-[1000px] w-[clamp(17rem,calc((100cqw-3rem)/3),24rem)] shrink-0">
          <article
            data-service-card
            className="flex h-full flex-col rounded-2xl border-[3px] border-[#1A1A1A] bg-gradient-to-br from-[#e8e0f0] via-white to-[#f4f0ea] p-6 shadow-[4px_4px_0px_#1A1A1A] [transform-style:preserve-3d]"
          >
            <span className="mb-5 block text-2xl md:text-[1.85rem]" aria-hidden>
              🌿
            </span>
            <h3 className="font-['Space_Grotesk',sans-serif] text-lg font-bold text-[#162327]">
              Meditazione e mindfulness
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-800 md:text-[15px]">
              Sessioni guidate per osservare respiro, sensazioni e pensieri senza giudizio, con uno stile legato anche
              all'ACT e alla gentilezza verso sé.
            </p>
            <button
              type="button"
              onClick={() => onSelectNav('med')}
              className="mt-6 w-full cursor-pointer rounded-xl border-[3px] border-[#1A1A1A] bg-[#1A1A1A] py-3.5 text-sm font-bold text-white shadow-[3px_3px_0px_#d8cde6] transition hover:bg-[#2a383f] active:translate-x-[1px] active:translate-y-[1px]"
            >
              Apri meditazioni
            </button>
          </article>
        </li>
        <li className="snap-start perspective-[1000px] w-[clamp(17rem,calc((100cqw-3rem)/3),24rem)] shrink-0">
          <article
            data-service-card
            className="flex h-full flex-col rounded-2xl border-[3px] border-[#1A1A1A] bg-gradient-to-br from-[#f5edd0] via-white to-[#e8dfd4] p-6 shadow-[4px_4px_0px_#1A1A1A] [transform-style:preserve-3d]"
          >
            <span className="mb-5 block text-2xl md:text-[1.85rem]" aria-hidden>
              🌊
            </span>
            <h3 className="font-['Space_Grotesk',sans-serif] text-lg font-bold text-[#162327]">
              Tecniche di rilassamento
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-800 md:text-[15px]">
              Pagina dedicata a rilassamento, respirazione, mindfulness e micro-esercizi: hub separato dall&apos;area
              personale, con ciò che è già disponibile e spazio per nuovi protocolli.
            </p>
            <button
              type="button"
              onClick={() => onSelectNav('relax')}
              className="mt-6 w-full cursor-pointer rounded-xl border-[3px] border-[#1A1A1A] bg-[#f9e784] py-3.5 text-sm font-bold text-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1A1A1A] active:translate-x-[1px] active:translate-y-[1px]"
            >
              Apri le tecniche di rilassamento
            </button>
          </article>
        </li>
        <li className="snap-start perspective-[1000px] w-[clamp(17rem,calc((100cqw-3rem)/3),24rem)] shrink-0">
          <article
            data-service-card
            className="flex h-full flex-col rounded-2xl border-[3px] border-[#1A1A1A] bg-gradient-to-br from-[#e8eef4] via-white to-[#ede8f7] p-6 shadow-[4px_4px_0px_#1A1A1A] [transform-style:preserve-3d]"
          >
            <span className="mb-5 block text-2xl md:text-[1.85rem]" aria-hidden>
              ✍️
            </span>
            <h3 className="font-['Space_Grotesk',sans-serif] text-lg font-bold text-[#162327]">
              Diario di defusione
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-800 md:text-[15px]">
              Un piccolo spazio ispirato all'ACT: annotare prendendo distanza dalle parole. È uso dedicato dopo
              registrazione e accesso sicuro alle annotazioni sul cloud quando è configurato per il progetto.
            </p>
            <button
              type="button"
              onClick={() => onSelectNav('diary')}
              title={
                canUseDiary
                  ? 'Apri il tuo diario'
                  : 'Servizio riservato agli utenti registrati. Da questa pagina puoi raggiungere accesso e iscrizione.'
              }
              className="mt-6 flex min-h-[4.25rem] w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-[3px] border-[#1A1A1A] bg-[#d8cde6] px-2 py-3 text-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1A1A1A] active:translate-x-[1px] active:translate-y-[1px]"
            >
              {canUseDiary ? (
                <span className="text-sm font-bold">Apri il diario</span>
              ) : (
                <>
                  <span className="text-center text-xs font-bold leading-snug md:text-[13px]">
                    Servizio riservato agli utenti registrati
                  </span>
                  <span className="text-center text-[11px] font-semibold uppercase tracking-[0.08em] opacity-95">
                    {diaryCloudOn ? 'Accedi per usare il diario' : 'Scopri requisiti e accesso sulla pagina del diario'}
                  </span>
                </>
              )}
            </button>
          </article>
        </li>
      </ul>
      </div>
    </section>
  )
}
