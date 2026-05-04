import { useCallback, useEffect, useState } from 'react'
import { useDiaryAuth } from '../context/DiaryAuthContext'
import { getDiarySupabase } from '../lib/diaryCloud'
import { fetchUpcomingCommunityEvents, type CommunityEventRow } from '../lib/communityEventsCloud'
import type { NavId } from '../nav'

function formatEventWhen(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString('it-IT', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export default function CommunityEventsHomeSection({ onSelectNav }: { onSelectNav: (id: NavId) => void }) {
  const { cloudEnabled, session } = useDiaryAuth()
  const sb = getDiarySupabase()
  const [events, setEvents] = useState<CommunityEventRow[]>([])
  const [loading, setLoading] = useState(false)
  const [hadError, setHadError] = useState(false)

  const load = useCallback(async () => {
    if (!sb) {
      setEvents([])
      return
    }
    setLoading(true)
    setHadError(false)
    try {
      setEvents(await fetchUpcomingCommunityEvents(sb))
    } catch {
      setHadError(true)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [sb])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <section
      className="min-w-0 rounded-3xl border-[3px] border-[#1A1A1A] bg-gradient-to-br from-[#e8e0f0] via-[#faf8f5] to-[#dcecf2] p-6 shadow-[5px_5px_0px_#1A1A1A] md:p-10"
      aria-labelledby="community-events-home-heading"
    >
      <p className="mb-3 inline-flex items-center rounded-lg border-2 border-[#1A1A1A] bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#2a383f] shadow-[2px_2px_0px_#1A1A1A]">
        Community · calendario
      </p>
      <h2
        id="community-events-home-heading"
        className="font-['Space_Grotesk',sans-serif] text-2xl font-bold tracking-tight text-[#162327] md:text-[1.75rem]"
      >
        Eventi in arrivo, organizzati insieme
      </h2>
      <p className="mt-3 max-w-2xl text-[15px] font-medium leading-relaxed text-[#374550] md:text-base">
        <span className="font-['Space_Grotesk',sans-serif] text-[1.05rem] font-bold italic text-[#162327] md:text-lg">
          «Tra simili ci si capisce, fatti sentire!»
        </span>{' '}
        Qui trovi i prossimi appuntamenti organizzati dalla community: incontri online, gruppi di ascolto, laboratori.
        Controlla data, luogo o link; in Community puoi proporre idee e restare aggiornato.
      </p>

      <div className="mt-6 space-y-3">
        {loading ?
          <p className="text-sm font-medium text-[#5c6b72]">Carico il calendario…</p>
        : hadError ?
          <p className="break-words text-sm font-medium text-[#8b4513]">
            Calendario non disponibile (tabella non creata o errore di rete). Quando avrai eseguito{' '}
            <code className="break-all rounded bg-white/80 px-1 text-xs">supabase/community_events.sql</code>, ricarica
            la pagina.
          </p>
        : events.length === 0 ?
          <div className="rounded-2xl border-2 border-dashed border-[#1A1A1A]/35 bg-white/50 px-4 py-8 text-center">
            <p className="text-[15px] font-medium text-[#374550]">
              Nessun evento pubblicato in questo momento. In Community potrete proporre date e idee; qui compariranno i
              prossimi appuntamenti confermati.
            </p>
            {cloudEnabled && session ?
              <button
                type="button"
                onClick={() => onSelectNav('community')}
                className="mt-5 rounded-xl border-[3px] border-[#1A1A1A] bg-[#1A1A1A] px-6 py-3 font-['Space_Grotesk',sans-serif] text-sm font-bold text-white shadow-[3px_3px_0px_#ffffff] transition hover:bg-[#2a383f]"
              >
                Apri la Community
              </button>
            : cloudEnabled ?
              <button
                type="button"
                onClick={() => onSelectNav('oasi')}
                className="mt-5 rounded-xl border-[3px] border-[#1A1A1A] bg-[#D8CDE6] px-6 py-3 text-sm font-bold text-[#162327] shadow-[3px_3px_0px_#1A1A1A]"
              >
                Accedi per entrare in Community
              </button>
            : null}
          </div>
        : events.map((ev) => (
            <article
              key={ev.id}
              className="rounded-2xl border-[3px] border-[#1A1A1A] bg-white px-4 py-4 shadow-[3px_3px_0px_#1A1A1A] md:flex md:items-start md:justify-between md:gap-6 md:px-5 md:py-5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#5c6b72]">
                  {formatEventWhen(ev.starts_at)}
                </p>
                <h3 className="mt-1 font-['Space_Grotesk',sans-serif] text-lg font-bold text-[#162327]">{ev.title}</h3>
                {ev.description ?
                  <p className="mt-2 text-sm leading-relaxed text-[#374550]">{ev.description}</p>
                : null}
                {ev.location_hint ?
                  <p className="mt-2 text-xs font-semibold text-[#2d3f46]">
                    📍 {ev.location_hint}
                  </p>
                : null}
              </div>
              <div className="mt-3 flex shrink-0 flex-col gap-2 md:mt-0">
                {ev.external_url ?
                  <a
                    href={ev.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex justify-center rounded-xl border-2 border-[#1A1A1A] bg-[#f9e784] px-4 py-2 text-center text-xs font-bold text-[#162327] shadow-[2px_2px_0px_#1A1A1A] transition hover:brightness-105"
                  >
                    Dettagli / iscrizione
                  </a>
                : null}
              </div>
            </article>
          ))}
      </div>

      {events.length > 0 ?
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {cloudEnabled && session ?
            <button
              type="button"
              onClick={() => onSelectNav('community')}
              className="rounded-xl border-[3px] border-[#1A1A1A] bg-white px-5 py-2.5 text-sm font-bold text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] transition hover:bg-[#f4f0ea]"
            >
              Vai alla Community
            </button>
          : cloudEnabled ?
            <button
              type="button"
              onClick={() => onSelectNav('oasi')}
              className="rounded-xl border-[3px] border-[#1A1A1A] bg-white px-5 py-2.5 text-sm font-bold text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]"
            >
              Accedi per partecipare
            </button>
          : null}
        </div>
      : null}
    </section>
  )
}
