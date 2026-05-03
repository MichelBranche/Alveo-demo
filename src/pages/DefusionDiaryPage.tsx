import { type FormEvent, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { CloudMemberAuthPanel } from '../components/CloudMemberAuthPanel'
import { useDiaryAuth } from '../context/DiaryAuthContext'
import type { DiaryEntry, DiaryPromptId } from '../lib/diaryCloud'
import {
  deleteDiaryEntryCloud,
  fetchDiaryEntriesCloud,
  mergeDiaryEntries,
  normalizePromptId,
  upsertDiaryEntriesCloud,
  upsertOneDiaryEntryCloud,
} from '../lib/diaryCloud'

const STORAGE_KEY = 'alveo-defusion-diary-v1'
const SCROLL_MARGIN = '\n────────────────\n'

const PROMPTS: readonly {
  id: DiaryPromptId
  title: string
  hint: string
  scaffold: string
}[] = [
  {
    id: 'having',
    title: 'Sto avendo il pensiero che…',
    hint: 'Ripeti la frase in testa aggiungendo il prefisso: non serve crederci né combatterla, è un esercizio di distanza dalle parole.',
    scaffold: 'Sto avendo il pensiero che ',
  },
  {
    id: 'label-funny',
    title: 'Titolo alla storia',
    hint: 'Dai alla scena mentale un titolo fuori luogo o gentile (tipo locandina cinematografica), per smussare il tono tragico.',
    scaffold: `Titolo provvisorio (giocoso):${SCROLL_MARGIN}« `,
  },
  {
    id: 'body-room',
    title: 'Stanze: parole e corpo',
    hint: 'Scrivi in poche righe cosa dice la mente, poi dove lo senti nel corpo mentre resti seduto o in piedi qui.',
    scaffold: `La mente propone:${SCROLL_MARGIN}Nel corpo noto:${SCROLL_MARGIN}`,
  },
  {
    id: 'guest',
    title: 'Ospite in visita',
    hint: `Immagini il contenuto più insistente come un ospite sulla soglia (non sei tu l'ospite): come lo saluti senza convincerlo?`,
    scaffold: '',
  },
  {
    id: 'thanks-brain',
    title: 'Grazie, cervello',
    hint: 'Ringrazia la mente per aver cercato di proteggerti con quella narrazione, anche se ora non vuoi darle carta bianca.',
    scaffold: '',
  },
]

function loadEntries(): DiaryEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as DiaryEntry[]
    if (!Array.isArray(parsed)) return []
    return parsed.map((e) => ({
      ...e,
      promptId: normalizePromptId(String(e.promptId)),
      id: String(e.id),
      createdAt: String(e.createdAt),
      promptTitle: String(e.promptTitle),
      body: String(e.body),
    }))
  } catch {
    return []
  }
}

function persistEntries(entries: DiaryEntry[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    /* spazio disco / modalità privata */
  }
}

export default function DefusionDiaryPage() {
  const formId = useId()
  const {
    cloudEnabled,
    initializing: authInitializing,
    session,
    supabase: sb,
    canUseDiary,
    devAuthBypass,
  } = useDiaryAuth()

  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [selectedPrompt, setSelectedPrompt] = useState<DiaryPromptId>(PROMPTS[0].id)
  const [draft, setDraft] = useState(PROMPTS[0].scaffold.replace(SCROLL_MARGIN, '\n'))
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [cloudBusy, setCloudBusy] = useState(false)

  const promptMeta = useMemo(() => PROMPTS.find((p) => p.id === selectedPrompt) ?? PROMPTS[0], [selectedPrompt])

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [entries],
  )

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3800)
  }, [])

  useEffect(() => {
    if (!canUseDiary) {
      setEntries([])
      setCloudBusy(false)
      return
    }
    if (!sb || !session) {
      setEntries(loadEntries())
      setCloudBusy(false)
      return
    }
    let cancelled = false
    setCloudBusy(true)
    void (async () => {
      try {
        const local = loadEntries()
        const remote = await fetchDiaryEntriesCloud(sb)
        if (cancelled) return
        const merged = mergeDiaryEntries(remote, local)
        persistEntries(merged)
        await upsertDiaryEntriesCloud(sb, session.user.id, merged)
        if (!cancelled) setEntries(merged)
      } catch (err) {
        console.error(err)
        if (!cancelled) {
          showToast('Sincronizzazione non riuscita: leggiamo almeno le note nella cache locale collegate al tuo account.')
          setEntries(loadEntries())
        }
      } finally {
        if (!cancelled) setCloudBusy(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [sb, session, canUseDiary, showToast])

  const applyPromptSelection = useCallback((id: DiaryPromptId) => {
    setSelectedPrompt(id)
    const next = PROMPTS.find((p) => p.id === id)
    const sc = next?.scaffold ?? ''
    setDraft(sc.replace(SCROLL_MARGIN, '\n'))
  }, [])

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (!canUseDiary) return
      const body = draft.trim()
      if (body.length < 3) {
        showToast('Scrivi almeno qualche parola prima di salvare.')
        return
      }
      const pid = selectedPrompt
      const ptitle = promptMeta.title
      const row: DiaryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        createdAt: new Date().toISOString(),
        promptId: pid,
        promptTitle: ptitle,
        body,
      }
      setEntries((prev) => {
        const next = [row, ...prev]
        persistEntries(next)
        return next
      })
      if (sb && session) {
        try {
          await upsertOneDiaryEntryCloud(sb, session.user.id, row)
          showToast('Voce salvata e sincronizzata.')
        } catch (err) {
          console.error(err)
          showToast('Salvata sul dispositivo invio nel cloud fallito riprova con connessione stabile.')
        }
      } else {
        showToast(devAuthBypass ? 'Voce salvata in locale (modalità sviluppo).' : 'Voce salvata in locale.')
      }
      applyPromptSelection(pid)
    },
    [
      applyPromptSelection,
      canUseDiary,
      devAuthBypass,
      draft,
      promptMeta.title,
      sb,
      selectedPrompt,
      session,
      showToast,
    ],
  )

  const removeEntry = useCallback(
    async (id: string) => {
      if (!canUseDiary) return
      setEntries((prev) => {
        const next = prev.filter((x) => x.id !== id)
        persistEntries(next)
        return next
      })
      if (sb) {
        try {
          await deleteDiaryEntryCloud(sb, id)
        } catch (err) {
          console.error(err)
          showToast('Rimossa in locale errore nell aggiornare il cloud.')
          return
        }
      }
      showToast('Voce rimossa.')
    },
    [canUseDiary, sb, showToast],
  )

  const formattedDateIt = useCallback((iso: string) => {
    try {
      return new Intl.DateTimeFormat('it-IT', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(iso))
    } catch {
      return iso
    }
  }, [])

  const inputClass =
    'mt-2 w-full min-h-[168px] rounded-xl border-[3px] border-[#1A1A1A] bg-white px-4 py-3 text-[15px] text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] outline-none placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-[#1A1A1A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4F0EA]'

  if (!cloudEnabled && !devAuthBypass) {
    return (
      <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-6 pb-10">
        <div className="rounded-2xl border-[3px] border-[#1A1A1A] bg-[#faf8f5] p-8 text-center shadow-[4px_4px_0px_#1A1A1A]">
          <span className="mb-4 inline-flex text-3xl" aria-hidden>
            ✍️
          </span>
          <h1 className="font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#162327]">
            Diario di defusione
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-gray-700">
            Questa area è disponibile{' '}
            <strong className="font-semibold text-[#1A1A1A]">solo per chi ha un account registrato sul servizio
            sicuro di Alveo</strong>. L&apos;infrastruttura non è ancora attiva qui: servono progetto backend e chiavi (
            vedere <code className="rounded bg-white px-1 text-xs">.env.example</code>
            ).
          </p>
        </div>
      </div>
    )
  }

  if (authInitializing && !devAuthBypass) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
        <p className="text-[15px] font-medium text-gray-700">Verifica dell&apos;accesso...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-8 pb-10 md:gap-10">
      {sb ? (
        <CloudMemberAuthPanel
          ariaLabel="Account per il diario"
          headline="Solo utenti registrati"
          description="Accedi o crea un account dedicato allo spazio sicuro sul cloud. Così annotazioni riservate sono collegate alla tua persona e seguono i dispositivi su cui fai login qui."
          logoutButtonLabel="Disconnettiti dal diario"
          supabase={sb}
          session={session}
          memberAuthenticated={canUseDiary}
          authenticatedExtra={
            cloudBusy ?
              <span className="mt-2 block text-xs font-medium text-gray-600">Aggiorno le annotazioni...</span>
            : null
          }
          onToast={showToast}
        />
      ) : null}

      {toast ? (
        <p
          className="-mt-6 rounded-xl border-[3px] border-[#1A1A1A] bg-[#f9e784] px-4 py-2 text-center text-sm font-semibold text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]"
          role="status"
        >
          {toast}
        </p>
      ) : null}

      {!canUseDiary ? (
        <>
          <header className="relative overflow-hidden rounded-2xl border-[3px] border-[#1A1A1A] bg-gradient-to-br from-[#ede8f7] via-white to-[#eae5df] p-6 shadow-[4px_4px_0px_#1A1A1A] md:p-8">
            <span className="mb-4 inline-flex text-3xl md:text-[2rem]" aria-hidden>
              ✍️
            </span>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-gray-600">ACT · uso riservato</p>
            <h1 className="mb-4 font-['Space_Grotesk',sans-serif] text-3xl font-bold tracking-tight text-[#162327] md:text-4xl">
              Diario di defusione
            </h1>
            <p className="max-w-2xl text-[15px] leading-relaxed text-gray-700 md:text-base">
              Le funzioni di scrittura e archivio sono <strong className="font-semibold text-[#1A1A1A]">sbloccate
              dopo l&apos;accesso</strong> con le credenziali cloud Alveo (form qui sopra). Su carta consigliamo comunque
              un quaderno quando fa per te.
            </p>
          </header>
        </>
      ) : (
        <>
          <header className="relative overflow-hidden rounded-2xl border-[3px] border-[#1A1A1A] bg-gradient-to-br from-[#ede8f7] via-white to-[#eae5df] p-6 shadow-[4px_4px_0px_#1A1A1A] md:p-8">
            <span className="mb-4 inline-flex text-3xl md:text-[2rem]" aria-hidden>
              ✍️
            </span>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-gray-600">ACT · distanza dai pensieri</p>
            <h1 className="mb-4 font-['Space_Grotesk',sans-serif] text-3xl font-bold tracking-tight text-[#162327] md:text-4xl">
              Diario di defusione
            </h1>
            <p className="max-w-2xl text-[15px] leading-relaxed text-gray-700 md:text-base">
              In Alveo <strong className="font-semibold text-[#1A1A1A]">consigliamo spesso di tenere un diario sulla
              carta</strong>: tocchi, pagine e pennino aiutano a rallentare e a mettere ordine quando la mente accelera.
              Sappiamo però che <strong className="font-semibold text-[#1A1A1A]">non è uno stile che fa per tutti</strong>
              (tempo, luogo, abitudini diverse), per questo abbiamo predisposto <strong className="font-semibold text-[#1A1A1A]">questa
              sezione dedicata</strong> per annotare con account, con esercizi ispirati alla defusione in Acceptance &amp;
              Commitment Therapy. Non sono terapia sostitutiva né diagnosi.
            </p>
          </header>

          <section
            aria-labelledby="defusion-write-heading"
            className="rounded-2xl border-[3px] border-[#1A1A1A] bg-white p-5 shadow-[4px_4px_0px_#1A1A1A] md:p-7"
          >
            <h2 id="defusion-write-heading" className="font-['Space_Grotesk',sans-serif] text-xl font-bold text-[#162327]">
              Scrivere oggi
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-700 md:text-[15px]">
              Scegli uno schema gentile qui sotto, usa il suggerimento come scorciatoia, poi modifica con parole tue.
            </p>

            <fieldset className="mt-5 border-0 p-0">
              <legend className="sr-only">Schema di scrittura</legend>
              <div className="flex flex-wrap gap-2">
                {PROMPTS.map((p) => {
                  const sel = selectedPrompt === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyPromptSelection(p.id)}
                      aria-pressed={sel}
                      className={
                        sel
                          ? 'rounded-xl border-[3px] border-[#1A1A1A] bg-[#1A1A1A] px-3 py-2 text-xs font-bold text-white shadow-[2px_2px_0px_#d8cde6] md:text-sm'
                          : 'rounded-xl border-[3px] border-[#1A1A1A] bg-[#f4f0ea] px-3 py-2 text-xs font-semibold text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] transition hover:bg-[#eae5df] md:text-sm'
                      }
                    >
                      <span className="line-clamp-2 max-w-[16rem] text-left">{p.title}</span>
                    </button>
                  )
                })}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-gray-800 md:text-[15px]" id={`${formId}-prompt-hint`}>
                {promptMeta.hint}
              </p>
            </fieldset>

            <form id={`${formId}-form`} onSubmit={(e) => void handleSubmit(e)} className="mt-5">
              <label htmlFor={`${formId}-area`} className="sr-only">
                Testo della voce di diario
              </label>
              <textarea
                id={`${formId}-area`}
                name="diary-body"
                className={`${inputClass} resize-y font-[inherit] leading-relaxed`}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                aria-describedby={`${formId}-prompt-hint`}
                spellCheck
                placeholder="Annota liberamente..."
              />

              <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-snug text-gray-600 md:max-w-md">
                  Le voci sono salvate con il tuo account nel cloud copia locale sul dispositivo come appoggio dopo la
                  sincronizzazione. Puoi rimuovere dalla lista con il pulsante sotto.
                </p>
                <button
                  type="submit"
                  className="shrink-0 rounded-xl border-[3px] border-[#1A1A1A] bg-[#d8cde6] px-6 py-3.5 text-sm font-bold text-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1A1A1A] active:translate-x-px active:translate-y-px"
                >
                  Salva voce
                </button>
              </div>
            </form>
          </section>

          <section aria-labelledby="defusion-list-heading">
            <h2 id="defusion-list-heading" className="font-['Space_Grotesk',sans-serif] text-xl font-bold text-[#162327]">
              Le tue annotazioni recenti
            </h2>
            {sortedEntries.length === 0 ? (
              <p className="mt-4 rounded-2xl border-[3px] border-dashed border-[#b8aea2] bg-[#faf8f5] px-5 py-8 text-center text-[15px] text-gray-700">
                Ancora nulla salvato dopo il primo contenuto vedrai qui l&apos;archivio.
              </p>
            ) : (
              <ul className="mt-5 flex list-none flex-col gap-5">
                {sortedEntries.map((en) => (
                  <li key={en.id}>
                    <article className="rounded-2xl border-[3px] border-[#1A1A1A] bg-[#faf8f5] p-5 shadow-[3px_3px_0px_#1A1A1A] md:p-6">
                      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-600">
                            {formattedDateIt(en.createdAt)}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[#1A1A1A]">{en.promptTitle}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void removeEntry(en.id)}
                          className="rounded-lg border-2 border-[#1A1A1A] bg-white px-3 py-1.5 text-xs font-bold text-gray-800 shadow-[2px_2px_0px_#1A1A1A] transition hover:bg-[#f4f0ea]"
                        >
                          Rimuovi
                        </button>
                      </div>
                      <pre className="whitespace-pre-wrap font-[inherit] text-[15px] leading-relaxed text-gray-800">
                        {en.body}
                      </pre>
                    </article>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <p className="text-center text-xs leading-relaxed text-gray-600 md:text-left">
        In caso di emergenza o dolore forte contatta il 112 il 118 o i servizi del tuo territorio.
      </p>
    </div>
  )
}
