import { CurtainLink } from '../components/NavigationTransition'

/** Data di ultimo aggiornamento testo (aggiornare al cambio sostanziale). */
export const PRIVACY_POLICY_UPDATED_ISO = '2026-05-02'

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-dvh w-full min-w-0 flex-col bg-[#F4F0EA] text-gray-900">
      <header className="shrink-0 border-b-2 border-[#1A1A1A] bg-[#F4F0EA]">
        <div className="alveo-px-screen alveo-pt-screen flex items-center gap-3 pb-3 md:pb-4">
          <CurtainLink
            to="/"
            className="flex shrink-0 items-center gap-1.5 rounded-lg border-2 border-[#1A1A1A] bg-white px-2 py-2 text-sm font-semibold text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] transition hover:bg-[#eae5df] md:px-3"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Torna all&apos;app</span>
          </CurtainLink>
          <p className="font-['Space_Grotesk',sans-serif] text-xl font-bold md:text-2xl">Alveo.</p>
        </div>
      </header>

      <main className="alveo-px-screen mx-auto w-full min-w-0 max-w-3xl flex-1 py-8 pb-[max(2.5rem,calc(1rem+env(safe-area-inset-bottom,0px)))] md:py-12">
        <article className="rounded-2xl border-[3px] border-[#1A1A1A] bg-white p-6 shadow-[4px_4px_0px_#1A1A1A] md:p-10">
          <p className="font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-[0.14em] text-gray-600">
            Documento legale
          </p>
          <h1 className="mt-2 font-['Space_Grotesk',sans-serif] text-3xl font-bold tracking-tight text-[#162327] md:text-4xl">
            Informativa sulla privacy
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Versione aggiornata al {new Date(PRIVACY_POLICY_UPDATED_ISO).toLocaleDateString('it-IT', { dateStyle: 'long' })}
          </p>

          <aside className="mt-8 rounded-xl border-2 border-dashed border-[#1A1A1A]/50 bg-[#f4f0ea] p-4 text-sm leading-relaxed text-gray-800">
            <p className="font-bold text-[#1A1A1A]">Da personalizzare prima della pubblicazione</p>
            <p className="mt-2">
              Sostituire i segnaposto tra parentesi quadre con i dati del <strong>titolare del trattamento</strong>{' '}
              (es. società o professionista), indirizzo, PEC o email dedicata alla privacy, eventuale{' '}
              <strong>DPO</strong>, fornitori infrastrutturali effettivi e Paesi di ubicazione server. Questo testo è
              una base informativa e <strong>non sostituisce una consulenza legale</strong>.
            </p>
          </aside>

          <div className="prose-alveo mt-10 space-y-8 text-[15px] leading-relaxed text-gray-800 md:text-base">
            <section id="intro" aria-labelledby="h-intro">
              <h2 id="h-intro" className="font-['Space_Grotesk',sans-serif] text-xl font-bold text-[#1A1A1A]">
                1. Premessa
              </h2>
              <p className="mt-3">
                La presente informativa descrive come vengono trattati i dati personali degli utenti che utilizzano
                l&apos;applicazione <strong>Alveo</strong> (di seguito, l&apos;«App»), dedicata a strumenti di supporto
                psicologico nel solco di approcci come l&apos;<strong>ACT</strong> (Acceptance and Commitment Therapy)
                e alla gestione dell&apos;<strong>ansia</strong>, senza costituire diagnosi, terapia o relazione
                clinica. L&apos;App non sostituisce il parere di un medico o di un professionista della salute mentale.
              </p>
              <p className="mt-3">
                Il trattamento dei dati si svolge nel rispetto del <strong>Regolamento (UE) 2016/679</strong> (GDPR) e
                della normativa italiana applicabile in materia di protezione dei dati personali e, ove pertinente, in
                materia di servizi della società dell&apos;informazione.
              </p>
            </section>

            <section id="titolare" aria-labelledby="h-titolare">
              <h2 id="h-titolare" className="font-['Space_Grotesk',sans-serif] text-xl font-bold text-[#1A1A1A]">
                2. Titolare del trattamento
              </h2>
              <p className="mt-3">
                Il titolare del trattamento è: <strong>[Denominazione / nome e cognome]</strong>, con sede in{' '}
                <strong>[indirizzo completo]</strong>, contattabile ai seguenti recapiti:{' '}
                <strong>[email / PEC dedicata alla privacy]</strong>.
              </p>
              <p className="mt-3">
                Ove nominato, il <strong>DPO</strong> (Responsabile della protezione dei dati) è raggiungibile a:{' '}
                <strong>[indirizzo e-mail del DPO, se applicabile]</strong>.
              </p>
            </section>

            <section id="tipi-dati" aria-labelledby="h-dati">
              <h2 id="h-dati" className="font-['Space_Grotesk',sans-serif] text-xl font-bold text-[#1A1A1A]">
                3. Categorie di dati trattati
              </h2>
              <p className="mt-3">A seconda delle funzioni attivate dall&apos;utente, possono essere trattati:</p>
              <ul className="mt-3 list-inside list-disc space-y-2 pl-1">
                <li>
                  <strong>Dati di registrazione e account</strong>: indirizzo email, identificativi tecnici dell&apos;
                  account, nome o denominazione sociale eventualmente indicata come nome mostrato, credenziali
                  protette mediante misure appropriate sul server (la password non deve essere memorizzata in chiaro).
                </li>
                <li>
                  <strong>Dati relativi alla salute o a informazioni sensibili</strong> (categoria particolare ai sensi
                  dell&apos;art. 9 GDPR): solo se l&apos;utente inserisce volontariamente contenuti nei diari,
                  note, questionari o campi liberi dentro l&apos;App. Tale trattamento avviene solo con{' '}
                  <strong>consenso esplicito</strong> dell&apos;interessato o, ove applicabile, su altra base prevista
                  dalla legge, e merita misure di sicurezza e minimizzazione dedicate.
                </li>
                <li>
                  <strong>Dati di utilizzo e tecnici</strong>: log di sicurezza, indirizzo IP, identificativi del
                  dispositivo, data/ora di accesso, crash report anonimizzati o aggregati, preferenze di lingua, eventuali
                  statistiche di utilizzo delle sezioni dell&apos;App.
                </li>
                <li>
                  <strong>Dati raccolti tramite cookies o tecnologie simili</strong> nel sito web o nella webview, se
                  presenti, secondo quanto specificato in una cookie policy separata ove necessario.
                </li>
              </ul>
            </section>

            <section id="finalita" aria-labelledby="h-finalita">
              <h2 id="h-finalita" className="font-['Space_Grotesk',sans-serif] text-xl font-bold text-[#1A1A1A]">
                4. Finalità e basi giuridiche
              </h2>
              <ul className="mt-3 list-inside list-disc space-y-2 pl-1">
                <li>
                  <strong>Erogazione dell&apos;App</strong>, creazione e gestione dell&apos;account, assistenza tecnica:
                  base giuridica <strong>esecuzione del contratto</strong> (art. 6(1)(b) GDPR).
                </li>
                <li>
                  <strong>Adempimenti legali</strong>, risposte all&apos;autorità giudiziaria quando obbligatori:{' '}
                  <strong>obbligo di legge</strong> (art. 6(1)(c) GDPR).
                </li>
                <li>
                  <strong>Sicurezza, prevenzione abusi e frodi, integrità dei sistemi</strong>:{' '}
                  <strong>legittimo interesse</strong> del titolare (art. 6(1)(f) GDPR), con equilibrio rispetto ai diritti
                  dell&apos;utente.
                </li>
                <li>
                  <strong>Contenuti facoltativi connessi alla sfera della salute</strong> introdotti dall&apos;utente:
                  base giuridica <strong>consenso esplicito</strong> (art. 9(2)(a) GDPR), revocabile come indicato più
                  sotto.
                </li>
                <li>
                  <strong>Funzioni di analisi o miglioramento prodotto non strettamente necessarie</strong> (se
                  attivate): <strong>consenso</strong> (art. 6(1)(a) GDPR), ove previsto dalla normativa applicabile.
                </li>
              </ul>
            </section>

            <section id="modalita" aria-labelledby="h-modalita">
              <h2 id="h-modalita" className="font-['Space_Grotesk',sans-serif] text-xl font-bold text-[#1A1A1A]">
                5. Modalità del trattamento
              </h2>
              <p className="mt-3">
                I dati sono trattati anche con strumenti informatici, con logiche correlate alle finalità indicate e nel
                rispetto dei principi di <strong>liceità, correttezza, trasparenza, minimizzazione, limitazione della
                conservazione, accuratezza</strong>. Sono applicate misure tecniche e organizzative adeguate (es.
                connessioni cifrate TLS, segregazione degli ambienti, controllo degli accessi, backup), proporzionate al
                rischio, in particolare per i dati particolari.
              </p>
            </section>

            <section id="conservazione" aria-labelledby="h-conservazione">
              <h2 id="h-conservazione" className="font-['Space_Grotesk',sans-serif] text-xl font-bold text-[#1A1A1A]">
                6. Conservazione
              </h2>
              <p className="mt-3">
                I dati sono conservati per il tempo necessario alle finalità per cui sono raccolti, salvo periodi più
                lunghi imposti da obblighi legali o da tutela dei diritti in sede giudiziaria. I criteri specifici di
                conservazione per categoria (es. account inattivi, log, contenuti del diario) saranno pubblicati nella
                versione definitiva dopo allineamento con l&apos;<strong>infrastruttura effettivamente utilizzata</strong>{' '}
                e con la conservazione tecnica sui sistemi di backup.
              </p>
            </section>

            <section id="comunicazione" aria-labelledby="h-comunicazione">
              <h2 id="h-comunicazione" className="font-['Space_Grotesk',sans-serif] text-xl font-bold text-[#1A1A1A]">
                7. Comunicazione a terzi e responsabilità esterne
              </h2>
              <p className="mt-3">
                I dati possono essere comunicati a <strong>fornitori di servizi</strong> strettamente funzionali
                all&apos;esercizio dell&apos;App (es. hosting, infrastruttura cloud, servizi email transazionale,
                gestione sicurezza, analytics se attivati con consenso), nominati dove necessario{' '}
                <strong>responsabili del trattamento</strong> ex art. 28 GDPR mediante contratto.
              </p>
              <p className="mt-3">
                L&apos;elenco aggiornato dei principali responsabili, i Paesi di ubicazione delle infrastrutture e
                eventuali trasferimenti extra-UE sulla base delle <strong>Clausole contrattuali tipo</strong> o altre
                misure idonee saranno dettagliati nella versione operativa dopo la scelta effettiva dei fornitori.
              </p>
            </section>

            <section id="trasferimenti" aria-labelledby="h-trasferimenti">
              <h2 id="h-trasferimenti" className="font-['Space_Grotesk',sans-serif] text-xl font-bold text-[#1A1A1A]">
                8. Trasferimenti internazionali
              </h2>
              <p className="mt-3">
                Qualora i dati fossero trasferiti verso Paesi non soggetti a decisione di adeguatezza, il titolare
                adotta le garanzie previste dagli articoli 45 e 46 GDPR e informa l&apos;utente nei dettagli operativi
                ([fornitore]: base giuridica del trasferimento e copia delle garanzie su richiesta).
              </p>
            </section>

            <section id="diritti" aria-labelledby="h-diritti">
              <h2 id="h-diritti" className="font-['Space_Grotesk',sans-serif] text-xl font-bold text-[#1A1A1A]">
                9. Diritti degli interessati
              </h2>
              <p className="mt-3">
                Ai sensi degli artt. da 15 a 22 GDPR, l&apos;utente può esercitare i diritti di{' '}
                <strong>
                  accesso, rettifica, cancellazione, limitazione del trattamento, portabilità, opposizione
                </strong>{' '}
                ove previsto e <strong>revoca del consenso</strong> senza pregiodizio per la liceità dei trattamenti
                precedenti alla revoca. Per i contenuti sanitari eventualmente conferiti tramite App, alcuni diritti
                possono coesistere con obblighi di conservazione documentale prescritti dalla legge: il titolare
                fornisce riscontro motivato nei casi di rifiuto parziale o differito.
              </p>
              <p className="mt-3">
                Le richieste vanno rivolte ai contatti indicati al §2. È sempre possibile proporre reclamo all&apos;
                <strong>Autorità Garante per la protezione dei dati personali</strong> (
                <a
                  href="https://www.garanteprivacy.it"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#1A1A1A] underline underline-offset-2"
                >
                  www.garanteprivacy.it
                </a>
                ).
              </p>
            </section>

            <section id="minori" aria-labelledby="h-minori">
              <h2 id="h-minori" className="font-['Space_Grotesk',sans-serif] text-xl font-bold text-[#1A1A1A]">
                10. Minori
              </h2>
              <p className="mt-3">
                L&apos;App non è destinata a minori di 14 anni (o all&apos;età diversa stabilita dal diritto applicabile).
                Qualora venissero accidentalmente raccolti dati di minori senza adeguato consenso del titolo di
                responsabilità genitoriale ove richiesto, il titolare provvederà alla loro rimozione.
              </p>
            </section>

            <section id="modifiche" aria-labelledby="h-modifiche">
              <h2 id="h-modifiche" className="font-['Space_Grotesk',sans-serif] text-xl font-bold text-[#1A1A1A]">
                11. Modifiche all&apos;informativa
              </h2>
              <p className="mt-3">
                Il titolare può aggiornare questa informativa: la versione più recente è pubblicata nell&apos;App con
                indicazione della data di revisione [es. mediante avviso in-app o comunicazione via email per modifiche
                sostanziali, ove previsto dalla legge].
              </p>
            </section>
          </div>

          <footer className="mt-12 border-t-2 border-[#eae5df] pt-6 text-center text-sm text-gray-600">
            <CurtainLink to="/registrazione" className="font-semibold text-[#1A1A1A] underline underline-offset-2">
              Torna alla registrazione
            </CurtainLink>
            <span className="mx-2" aria-hidden>
              ·
            </span>
            <CurtainLink to="/" className="font-semibold text-[#1A1A1A] underline underline-offset-2">
              Home app
            </CurtainLink>
          </footer>
        </article>
      </main>
    </div>
  )
}
