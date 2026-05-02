import { useRef } from 'react'
import { useServiceCardTilt } from '../hooks/useServiceCardTilt'

const PARTNERS = [
  {
    id: 'serenis',
    name: 'Serenis',
    logoSrc: '/partners/serenis-logo.svg',
    logoClass: 'h-9 w-auto max-w-[min(200px,100%)] md:h-10',
    blurb:
      'Con il codice invito ottieni 1 colloquio conoscitivo gratis e 1 seduta successiva gratis. Dettagli e condizioni sempre su Serenis.',
    href: 'https://www.serenis.it/rfrrl?code=MICHBRANVLFL',
    accent: 'from-[#dcecf2] via-white to-[#eae5df]',
  },
  {
    id: 'unobravo',
    name: 'Unobravo',
    logoSrc: '/partners/unobravo-logo.svg',
    logoClass: 'h-10 w-auto max-w-[min(260px,100%)] md:h-[2.625rem]',
    blurb:
      'Con il codice invito ottieni 1 colloquio conoscitivo gratis e 1 seduta successiva gratis. Dettagli e condizioni sempre su Unobravo.',
    href:
      'https://app.unobravo.com/signup/start?utm_source=mgm&utm_medium=invite-message&utm_campaign=MGM_IT_IT_CONVERSION_PROS_B2C_MGM_INVITE&referralCode=2dnt1-99MUG9Z1',
    accent: 'from-[#e8e0f0] via-white to-[#f4f0ea]',
  },
] as const

export default function TeletherapyPartnersSection() {
  const listRef = useRef<HTMLUListElement>(null)
  useServiceCardTilt(listRef)

  return (
    <section
      className="rounded-3xl border-[3px] border-[#1A1A1A] bg-[#faf8f5] p-6 shadow-[5px_5px_0px_#1A1A1A] md:p-10"
      aria-labelledby="teletherapy-heading"
    >
      <p className="mb-3 inline-flex items-center rounded-lg border-2 border-[#1A1A1A] bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#2a383f] shadow-[2px_2px_0px_#1A1A1A]">
        Supporto professionale
      </p>
      <h2
        id="teletherapy-heading"
        className="font-['Space_Grotesk',sans-serif] text-2xl font-bold tracking-tight text-[#162327] md:text-3xl"
      >
        Psicoterapia online
      </h2>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-gray-700 md:text-base">
        Alveo accompagna con strumenti di benessere e autocomprensione, ma{' '}
        <strong className="font-semibold text-[#1A1A1A]">non sostituisce</strong> un percorso clinico. Se ti serve parlare
        con uno psicologo o uno psicoterapeuta, puoi orientarti verso servizi certificati online. Qui sotto due
        realtà molto usate in Italia.{' '}
        <span className="text-gray-600">
          I due link con invito prevedono 1 colloquio conoscitivo gratuito e 1 seduta successiva gratuita. Restano validi termini e dettagli sui siti Serenis e Unobravo.
        </span>
      </p>

      <ul ref={listRef} className="mt-8 grid list-none gap-5 md:grid-cols-2 md:gap-6">
        {PARTNERS.map((p) => (
          <li key={p.id} className="perspective-[1000px]">
            <article
              data-service-card
              className={`flex h-full flex-col rounded-2xl border-[3px] border-[#1A1A1A] bg-gradient-to-br ${p.accent} p-6 shadow-[4px_4px_0px_#1A1A1A] [transform-style:preserve-3d]`}
            >
              <h3 className="m-0">
                <img
                  src={p.logoSrc}
                  alt={p.name}
                  width={p.id === 'serenis' ? 120 : 164}
                  height={p.id === 'serenis' ? 26 : 35}
                  className={`${p.logoClass} object-contain object-left`}
                  loading="lazy"
                  decoding="async"
                />
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-800 md:text-[15px]">{p.blurb}</p>
              <a
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl border-[3px] border-[#1A1A1A] bg-white py-3.5 text-center text-sm font-bold text-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] transition hover:-translate-y-px hover:shadow-[4px_4px_0px_#1A1A1A]"
              >
                Apri con codice invito
              </a>
            </article>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-center text-xs leading-relaxed text-gray-500 md:text-left">
        In caso di emergenza o pericolo per te o per altri, contatta i servizi di emergenza del tuo territorio (es. 112
        o 118) o le linee di ascolto dedicate.
      </p>
    </section>
  )
}
