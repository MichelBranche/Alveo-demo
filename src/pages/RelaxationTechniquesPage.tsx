import type { NavId } from '../nav'

type Props = {
  onSelectNav: (id: NavId) => void
}

export default function RelaxationTechniquesPage({ onSelectNav }: Props) {
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-10 pb-6 md:gap-12 md:pb-4">
      <header className="rounded-3xl border-[3px] border-[#1A1A1A] bg-gradient-to-br from-[#f5edd0] via-white to-[#dcecf2] p-8 shadow-[5px_5px_0px_#1A1A1A] md:p-10">
        <p className="mb-4 inline-flex items-center rounded-lg border-2 border-[#1A1A1A] bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#2a383f] shadow-[2px_2px_0px_#1A1A1A]">
          Corpo · attenzione · respiro
        </p>
        <h1 className="font-['Space_Grotesk',sans-serif] text-3xl font-bold tracking-tight text-[#162327] md:text-[2.25rem]">
          Tecniche di rilassamento
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#374550] md:text-base">
          Un punto fisso per rilassamento, respirazione guidata e mindfulness pratica: parti da ciò che è già nell’app,
          con spazio riservato a nuovi protocolli (muscolatura, grounding, allenamenti più brevi).
        </p>
      </header>

      <section aria-labelledby="relax-active-heading">
        <h2
          id="relax-active-heading"
          className="mb-6 font-['Space_Grotesk',sans-serif] text-xl font-bold text-[#1A1A1A] md:text-2xl"
        >
          Disponibile ora
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onSelectNav('med')}
            className="flex h-full flex-col rounded-2xl border-[3px] border-[#1A1A1A] bg-gradient-to-br from-[#e8e0f0] to-[#faf8f5] p-6 text-left shadow-[4px_4px_0px_#1A1A1A] transition hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1A1A1A] active:translate-y-px"
          >
            <span className="text-3xl" aria-hidden>
              🌿
            </span>
            <span className="mt-4 font-['Space_Grotesk',sans-serif] text-lg font-bold text-[#162327]">
              Respirazione e meditazioni guidate
            </span>
            <span className="mt-2 text-sm leading-relaxed text-[#374550]">
              Sessioni con voce e animazione del respiro: ideale quando vuoi allenare rallentamento e presenza senza
              etichette rigide.
            </span>
            <span className="mt-5 text-xs font-bold uppercase tracking-[0.1em] text-[#1e2f38] underline decoration-[#1A1A1A]/30 underline-offset-4">
              Vai alle meditazioni →
            </span>
          </button>
          <button
            type="button"
            onClick={() => onSelectNav('tools')}
            className="flex h-full flex-col rounded-2xl border-[3px] border-[#1A1A1A] bg-white p-6 text-left shadow-[4px_4px_0px_#d8cde6] transition hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#d8cde6] active:translate-y-px"
          >
            <span className="text-3xl" aria-hidden>
              🎧
            </span>
            <span className="mt-4 font-['Space_Grotesk',sans-serif] text-lg font-bold text-[#162327]">
              Ascolti lunghi · audiolibri
            </span>
            <span className="mt-2 text-sm leading-relaxed text-[#374550]">
              Capitoli vocali quando preferisci essere accompagnata o accompagnato da una narrazione: utile anche come
              sottofondo rilassante.
            </span>
            <span className="mt-5 text-xs font-bold uppercase tracking-[0.1em] text-[#1e2f38] underline decoration-[#1A1A1A]/30 underline-offset-4">
              Vai agli strumenti →
            </span>
          </button>
        </div>
      </section>

      <section
        aria-labelledby="relax-coming-heading"
        className="rounded-3xl border-[3px] border-[#1A1A1A] bg-[#faf8f5] p-6 shadow-[5px_5px_0px_#f9e784] md:p-8"
      >
        <h2
          id="relax-coming-heading"
          className="font-['Space_Grotesk',sans-serif] text-xl font-bold text-[#1A1A1A] md:text-2xl"
        >
          In arrivo nella stessa sezione
        </h2>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-gray-700">
          Stiamo predisponendo contenuti più brevi e strutturati: mindfulness quotidiana, rilassamento muscolare
          progressivo, esercizi di grounding multisensoriali e capsule audio dedicate.
        </p>
        <ul className="mt-8 grid list-none gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <li className="rounded-2xl border-[3px] border-dashed border-[#1A1A1A]/40 bg-white/85 p-5">
            <p className="font-['Space_Grotesk',sans-serif] font-bold text-[#162327]">Mindfulness</p>
            <p className="mt-2 text-sm leading-snug text-gray-600">
              Micro-esercizi per notare pensieri e sensazioni con curiosità gentile.
            </p>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500">In lavorazione</p>
          </li>
          <li className="rounded-2xl border-[3px] border-dashed border-[#1A1A1A]/40 bg-white/85 p-5">
            <p className="font-['Space_Grotesk',sans-serif] font-bold text-[#162327]">Rilassamento muscolare</p>
            <p className="mt-2 text-sm leading-snug text-gray-600">
              Sequenze guidate tensione‑rilascio gruppi muscolari, adatte alla sera o dopo stress fisico.
            </p>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500">In lavorazione</p>
          </li>
          <li className="rounded-2xl border-[3px] border-dashed border-[#1A1A1A]/40 bg-white/85 p-5 sm:col-span-2 lg:col-span-1">
            <p className="font-['Space_Grotesk',sans-serif] font-bold text-[#162327]">Grounding · 5 sensi</p>
            <p className="mt-2 text-sm leading-snug text-gray-600">
              Ancoraggi rapidi quando la mente corre: suoni, punti di contatto, respiro contato.
            </p>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500">In lavorazione</p>
          </li>
        </ul>
      </section>
    </div>
  )
}
