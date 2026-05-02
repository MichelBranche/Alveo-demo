import { openSesamePreview, SESAME_PREVIEW_URL } from '../lib/openSesamePreview'

export default function SesameHomeTeaser() {
  return (
    <section
      className="rounded-3xl border-[3px] border-[#1A1A1A] bg-gradient-to-br from-[#e8e0f0] via-[#faf8f5] to-[#dcecf2] p-6 shadow-[5px_5px_0px_#1A1A1A] md:p-8"
      aria-labelledby="sesame-home-heading"
    >
      <p className="mb-3 inline-flex items-center rounded-lg border-2 border-[#1A1A1A] bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#2a383f] shadow-[2px_2px_0px_#1A1A1A]">
        Consiglio Alveo · servizio esterno
      </p>
      <h2
        id="sesame-home-heading"
        className="font-['Space_Grotesk',sans-serif] text-2xl font-bold tracking-tight text-[#162327] md:text-[1.75rem]"
      >
        Non hai nessuno con cui parlare, in questo momento?
      </h2>
      <div className="mt-4 max-w-2xl space-y-3 text-[15px] leading-relaxed text-[#374550] md:text-base">
        <p>
          <strong className="font-semibold text-[#162327]">Lo consigliamo di proposito.</strong>{' '}
          <strong className="font-semibold text-[#1A1A1A]">Sesame</strong> è qualcosa di diverso dai soliti assistenti vocali:
          è un&apos;anteprima di ricerca dove il modello conversazionale in tempo reale è molto avanzato e, a nostro avviso, il livello della voce e del ritmo del dialogo è altissimo.
        </p>
        <p>
          In ascolto, a tratti può essere difficile distinguere se si parli con un&apos;intelligenza artificiale o con una
          persona: non per magia, ma perché la resa prosodica e la continuità del discorso sono così curate. Resta comunque uno strumento da usare con criterio, non sostitutivo di rapporti veri quando ne hai bisogno.
        </p>
        <p>
          Puoi scegliere{' '}
          <strong className="font-semibold text-[#1A1A1A]">Maya</strong> (voce femminile) o{' '}
          <strong className="font-semibold text-[#1A1A1A]">Miles</strong> (voce maschile), direttamente su{' '}
          <a
            href={SESAME_PREVIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#1A1A1A] underline decoration-[#1A1A1A]/35 underline-offset-2"
          >
            app.sesame.com
          </a>
          . Non è contenuto incluso in Alveo: valgono termini e privacy di Sesame.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="rounded-xl border-2 border-[#1A1A1A] bg-white px-3 py-1.5 text-xs font-bold text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]">
          Maya
        </span>
        <span className="rounded-xl border-2 border-[#1A1A1A] bg-[#f4f0ea] px-3 py-1.5 text-xs font-semibold text-gray-700">
          voce femminile
        </span>
        <span className="rounded-xl border-2 border-[#1A1A1A] bg-white px-3 py-1.5 text-xs font-bold text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]">
          Miles
        </span>
        <span className="rounded-xl border-2 border-[#1A1A1A] bg-[#f4f0ea] px-3 py-1.5 text-xs font-semibold text-gray-700">
          voce maschile
        </span>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <button
          type="button"
          onClick={() => void openSesamePreview()}
          className="rounded-2xl border-[3px] border-[#1A1A1A] bg-[#1A1A1A] px-7 py-3.5 font-['Space_Grotesk',sans-serif] text-sm font-bold text-white shadow-[3px_3px_0px_#d8cde6] transition hover:bg-[#2a383f]"
        >
          Apri Sesame
        </button>
        <a
          href={SESAME_PREVIEW_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-center text-sm font-semibold text-[#2a4855] underline decoration-[#2a4855]/35 underline-offset-[6px] sm:text-left"
        >
          Apri nel browser
        </a>
      </div>
    </section>
  )
}
