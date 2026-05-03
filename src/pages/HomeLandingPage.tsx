import { CurtainLink } from '../components/NavigationTransition'
import { useDiaryAuth } from '../context/DiaryAuthContext'
import CommunityEventsHomeSection from '../components/CommunityEventsHomeSection'
import LandingServiceProposals from '../components/LandingServiceProposals'
import SesameHomeTeaser from '../components/SesameHomeTeaser'
import SupportAlveoSection from '../components/SupportAlveoSection'
import TeletherapyPartnersSection from '../components/TeletherapyPartnersSection'
import type { NavId } from '../nav'

export default function HomeLandingPage({
  onEnterOasis,
  onSelectNav,
}: {
  onEnterOasis: () => void
  onSelectNav: (id: NavId) => void
}) {
  const { canUseOasis } = useDiaryAuth()

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 pb-14 md:gap-14 md:pb-16">
      <section className="relative overflow-hidden rounded-3xl border-[3px] border-[#1A1A1A] bg-gradient-to-br from-[#c9dce6] via-[#eae5df] to-[#f9e784]/90 shadow-[5px_5px_0px_#1A1A1A]">
        <div className="pointer-events-none absolute -left-24 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full border-[3px] border-[#1A1A1A]/12 bg-white/35 blur-sm md:h-72 md:w-72" />
        <div className="pointer-events-none absolute -right-12 -top-8 h-32 w-32 rounded-full border-[3px] border-[#1A1A1A]/18 bg-[#d8cde6]/55 md:h-40 md:w-40" />

        <div className="relative px-6 py-10 md:px-12 md:py-14">
          <p className="mb-5 inline-flex items-center rounded-lg border-2 border-[#1A1A1A] bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#2a383f] shadow-[2px_2px_0px_#1A1A1A]">
            Spazio sicuro · ACT per l'ansia
          </p>

          <h1 className="font-['Space_Grotesk',sans-serif] text-4xl font-bold leading-[1.06] tracking-tight text-[#162327] md:text-[2.85rem]">
            Alveo
            <span className="mt-4 block font-['Space_Grotesk',sans-serif] text-3xl md:text-[2rem] md:leading-snug">
              Un passo alla volta, vicino al presente.
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-[15px] font-medium leading-relaxed text-[#2d3f46] md:text-lg">
            Dopo il respiro iniziale puoi orientarti dalla home senza fretta. L&apos;area personale è riservata a chi è
            registrato e ha effettuato l&apos;accesso sul servizio sicuro cloud: dentro trovi ascolti, piccoli strumenti
            e un punto fisso dove tornare nei momenti più agitati.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={onEnterOasis}
              title={
                canUseOasis ?
                  undefined
                : "Servizio riservato agli utenti registrati. All'ingresso trovi accesso o registrazione con account cloud."
              }
              className="rounded-2xl border-[3px] border-[#1A1A1A] bg-[#1A1A1A] px-8 py-4 font-['Space_Grotesk',sans-serif] text-base font-bold text-white shadow-[4px_4px_0px_#ffffff] outline-none ring-offset-[#eae5df] transition hover:bg-[#2a383f] focus-visible:ring-2 focus-visible:ring-[#1A1A1A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#ffffff]"
            >
              {canUseOasis ? "Apri l'area personale" : "Verso l'area personale (solo utenti registrati)"}
            </button>
            <button
              type="button"
              onClick={() => onSelectNav('med')}
              className="rounded-2xl border-[3px] border-[#1A1A1A] bg-white px-8 py-4 font-semibold text-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1A1A1A] active:translate-x-[1px] active:translate-y-[1px]"
            >
              Apri le meditazioni
            </button>
          </div>
        </div>
      </section>

      <LandingServiceProposals onSelectNav={onSelectNav} />

      <SesameHomeTeaser />

      <CommunityEventsHomeSection onSelectNav={onSelectNav} />

      <section
        className="rounded-3xl border-[3px] border-[#1A1A1A] bg-white p-6 shadow-[5px_5px_0px_#1A1A1A] md:flex md:flex-row md:items-center md:justify-between md:gap-10 md:p-10"
        aria-labelledby="landing-account-heading"
      >
        <div className="max-w-xl md:min-w-0 md:flex-1">
          <h2
            id="landing-account-heading"
            className="font-['Space_Grotesk',sans-serif] text-2xl font-bold tracking-tight text-[#162327] md:text-3xl"
          >
            Creare un account
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-gray-700 md:text-base">
            Registrarsi e accedere sul cloud di Alveo sbloccano l&apos;area personale e il diario; meditazioni e strumenti
            restano fruibili anche senza accesso mentre si integra gradualmente tutto il percorso.
          </p>
          <ul className="landing-account-benefits mt-5 space-y-2 text-sm font-medium text-gray-600 md:text-[15px]">
            <li className="flex gap-2">
              <span className="sparkle-diamond shrink-0 self-start leading-none select-none" aria-hidden>
                ◆
              </span>
              <span>Elenchi salvati di meditazioni e materiali suggeriti</span>
            </li>
            <li className="flex gap-2">
              <span className="sparkle-diamond shrink-0 self-start leading-none select-none" aria-hidden>
                ◆
              </span>
              <span>Diario ed esercizi con continuità nel tempo</span>
            </li>
            <li className="flex gap-2">
              <span className="sparkle-diamond shrink-0 self-start leading-none select-none" aria-hidden>
                ◆
              </span>
              <span>Notifiche soft (solo dopo consenso), quando saranno pronte</span>
            </li>
          </ul>
        </div>
        <div className="mt-8 flex w-full shrink-0 flex-col gap-3 md:mt-0 md:w-auto md:min-w-[260px]">
          <CurtainLink
            to="/registrazione"
            className="w-full rounded-2xl border-[3px] border-[#1A1A1A] bg-[#D8CDE6] px-6 py-4 text-center font-['Space_Grotesk',sans-serif] text-base font-bold text-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1A1A1A] active:translate-x-[2px] active:translate-y-[2px]"
          >
            Registrarsi ad Alveo
          </CurtainLink>
          <CurtainLink
            to="/accedi"
            className="w-full rounded-2xl border-[3px] border-[#1A1A1A] bg-[#F4F0EA] px-6 py-3.5 text-center text-sm font-bold text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] transition hover:bg-[#eae5df]"
          >
            Accedere
          </CurtainLink>
          <p className="text-center text-xs leading-relaxed text-gray-500">
            L'accesso effettivo all'account sarà attivo con il backend; la registrazione raccoglie già i
            dati lato interfaccia.
          </p>
        </div>
      </section>

      <TeletherapyPartnersSection />

      <SupportAlveoSection />

    </div>
  )
}
