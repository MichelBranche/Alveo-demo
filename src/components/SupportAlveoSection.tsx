import supportHeartImg from '../assets/support-alveo-heart.png'

/**
 * Sezione home: sostegno ricorrente (es. 1 €/mese) e benefici in anteprima.
 * Opzionale: `VITE_ALVEO_SUPPORT_URL` → link esterno (Stripe, Ko-fi, Patreon, ecc.).
 */

export default function SupportAlveoSection() {
  const checkoutUrl = import.meta.env.VITE_ALVEO_SUPPORT_URL?.trim()

  return (
    <section
      className="rounded-3xl border-[3px] border-[#1A1A1A] bg-gradient-to-br from-[#fef6d8] via-[#faf8f5] to-[#d4ebe0] p-6 shadow-[5px_5px_0px_#1A1A1A] md:p-10"
      aria-labelledby="support-alveo-heading"
    >
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-10">
        <div
          className="mx-auto flex h-[5.5rem] w-[5.5rem] shrink-0 items-center justify-center rounded-2xl border-[3px] border-[#1A1A1A] bg-transparent shadow-[3px_3px_0px_#1A1A1A] md:mx-0 md:h-32 md:w-32"
          aria-hidden
        >
          <img
            src={supportHeartImg}
            alt=""
            width={128}
            height={128}
            className="max-h-full max-w-full object-contain object-center"
            decoding="async"
            fetchPriority="low"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-3 inline-flex items-center rounded-lg border-2 border-[#1A1A1A] bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#2a383f] shadow-[2px_2px_0px_#1A1A1A]">
            Sostegno · indipendenza del progetto
          </p>
          <h2
            id="support-alveo-heading"
            className="font-['Space_Grotesk',sans-serif] text-2xl font-bold tracking-tight text-[#162327] md:text-[1.85rem]"
          >
            Sostieni Alveo con 1 € al mese
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#374550] md:text-base">
            Un abbonamento simbolico per tenere vivi contenuti pensati con calma, senza pubblicità invasiva e con
            attenzione alla privacy. Il tuo contributo ci aiuta a pubblicare, testare e migliorare gli strumenti che già
            usi o che stanno arrivando.
          </p>
          <ul className="mt-6 max-w-2xl space-y-2.5 text-sm font-medium text-[#2d3f46] md:text-[15px]">
            <li className="flex gap-2">
              <span className="sparkle-diamond shrink-0 self-start leading-none select-none" aria-hidden>
                ◆
              </span>
              <span>
                <strong className="font-semibold text-[#162327]">Anteprima completa:</strong> accesso anticipato a tutti
                i contenuti in roadmap (ascolti, esercizi, novità dell&apos;area personale) mentre vengono rilasciati a
                tutti.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="sparkle-diamond shrink-0 self-start leading-none select-none" aria-hidden>
                ◆
              </span>
              <span>
                <strong className="font-semibold text-[#162327]">Priorità leggera:</strong> le idee e i feedback delle
                persone che sostengono il progetto pesano di più nelle scelte su cosa costruire per primo.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="sparkle-diamond shrink-0 self-start leading-none select-none" aria-hidden>
                ◆
              </span>
              <span>
                <strong className="font-semibold text-[#162327]">Flessibilità:</strong> puoi interrompere quando vuoi;
                l&apos;account gratuito e i contenuti base restano come oggi.
              </span>
            </li>
          </ul>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {checkoutUrl ?
              <a
                href={checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-2xl border-[3px] border-[#1A1A1A] bg-[#1A1A1A] px-8 py-4 text-center font-['Space_Grotesk',sans-serif] text-base font-bold text-white shadow-[4px_4px_0px_#ffffff] transition hover:bg-[#2a383f] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#ffffff]"
              >
                Attiva il sostegno (1 € / mese)
              </a>
            : <p className="text-[15px] font-medium text-[#374550]">
                A breve: da qui il link per attivare l&apos;abbonamento.
              </p>}
            <p className="max-w-md text-xs leading-relaxed text-[#5c6b72] sm:ml-1">
              Il pagamento sarà gestito da un fornitore esterno sicuro (es. Stripe); Alveo non conserva i dati della
              carta.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
