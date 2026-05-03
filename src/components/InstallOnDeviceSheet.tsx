import { useCallback, useEffect, useMemo, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { isWebAppStandalone } from '../lib/isWebAppStandalone'

type BeforeInstallPromptEventLike = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function detectMobileKind(): 'ios' | 'android' | 'other' {
  if (typeof navigator === 'undefined') return 'other'
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/i.test(ua)) return 'ios'
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return 'other'
}

type Props = {
  open: boolean
  onClose: () => void
}

export default function InstallOnDeviceSheet({ open, onClose }: Props) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEventLike | null>(null)
  const [installing, setInstalling] = useState(false)
  const mobile = useMemo(() => detectMobileKind(), [])

  useEffect(() => {
    const onEvt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEventLike)
    }
    window.addEventListener('beforeinstallprompt', onEvt)
    return () => window.removeEventListener('beforeinstallprompt', onEvt)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const runChromeInstall = useCallback(async () => {
    if (!deferred) return
    setInstalling(true)
    try {
      await deferred.prompt()
      await deferred.userChoice
    } catch {
      /* ignore */
    } finally {
      setInstalling(false)
      setDeferred(null)
      onClose()
    }
  }, [deferred, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Chiudi"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-sheet-title"
        className="relative z-[61] w-full max-w-md rounded-2xl border-[3px] border-[#1A1A1A] bg-[#faf8f5] p-6 shadow-[6px_6px_0px_#1A1A1A]"
      >
        <h2
          id="install-sheet-title"
          className="font-['Space_Grotesk',sans-serif] text-xl font-bold tracking-tight text-[#162327]"
        >
          Salva Alveo sul dispositivo
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-[#374550]">
          Così apri l&apos;app dalla schermata Home, a tutto schermo, senza cercare ogni volta tra i tab del browser.
        </p>

        {mobile === 'ios' ?
          <ol className="mt-5 list-decimal space-y-3 pl-5 text-[14px] font-medium leading-relaxed text-[#2d3f46]">
            <li>
              Tocca il pulsante <strong className="text-[#162327]">Condividi</strong> (quadrato con freccia verso l&apos;alto)
              nella barra in basso di Safari.
            </li>
            <li>
              Scorri e scegli <strong className="text-[#162327]">Aggiungi a Home</strong> (o &quot;Aggiungi a schermata
              Home&quot;).
            </li>
            <li>
              Conferma con <strong className="text-[#162327]">Aggiungi</strong> in alto a destra.
            </li>
          </ol>
        : mobile === 'android' ?
          deferred ?
            <div className="mt-5 space-y-3">
              <p className="text-[14px] leading-relaxed text-[#374550]">
                Il browser può installare l&apos;app per te. Se preferisci farlo a mano: menu ⋮ del browser →{' '}
                <strong className="text-[#162327]">Installa app</strong> o <strong className="text-[#162327]">Aggiungi a
                schermata Home</strong>.
              </p>
              <button
                type="button"
                disabled={installing}
                onClick={() => void runChromeInstall()}
                className="w-full rounded-xl border-[3px] border-[#1A1A1A] bg-[#1A1A1A] px-4 py-3.5 font-['Space_Grotesk',sans-serif] text-sm font-bold text-white shadow-[3px_3px_0px_#ffffff] transition hover:bg-[#2a383f] disabled:opacity-60"
              >
                {installing ? 'Installazione…' : 'Installa Alveo'}
              </button>
            </div>
          : <ol className="mt-5 list-decimal space-y-3 pl-5 text-[14px] font-medium leading-relaxed text-[#2d3f46]">
              <li>
                Apri il menu del browser (di solito <strong className="text-[#162327]">⋮</strong> in alto o in basso).
              </li>
              <li>
                Cerca <strong className="text-[#162327]">Installa app</strong>,{' '}
                <strong className="text-[#162327]">Aggiungi a schermata Home</strong> o voce simile.
              </li>
              <li>Conferma: Alveo comparirà tra le app come un&apos;icona.</li>
            </ol>
        : <p className="mt-5 text-[14px] leading-relaxed text-[#374550]">
            Dal menu del browser (Chrome, Edge, Safari su desktop) cerca la voce per{' '}
            <strong className="text-[#162327]">installare</strong> o{' '}
            <strong className="text-[#162327]">creare un&apos;app</strong> da questo sito. Su iPhone e Android usa il
            telefono: le istruzioni sono diverse e più semplici.
          </p>}

        <p className="mt-4 text-xs leading-relaxed text-[#6b7a82]">
          Richiede di solito Safari su iPhone. Altri browser su iOS possono non offrire &quot;Aggiungi a Home&quot;.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl border-2 border-[#1A1A1A] bg-white py-3 text-sm font-bold text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] transition hover:bg-[#f4f0ea]"
        >
          Ho capito
        </button>
      </div>
    </div>
  )
}

/** Pulsante per il drawer: nascosto se già app nativa Capacitor o già in modalità standalone. */
export function InstallOnDeviceDrawerButton({ onOpen }: { onOpen: () => void }) {
  const [standalone, setStandalone] = useState(false)

  useEffect(() => {
    setStandalone(isWebAppStandalone())
  }, [])

  if (Capacitor.isNativePlatform()) return null
  if (standalone) {
    return (
      <p className="mt-6 rounded-xl border-2 border-[#1A1A1A]/20 bg-white/60 px-3 py-2 text-center text-[12px] font-medium text-[#3d524d]">
        Alveo è aperto dalla schermata Home.
      </p>
    )
  }

  return (
    <button
      type="button"
      className="mt-6 w-full rounded-xl border-[3px] border-[#1A1A1A] bg-[#dcecf2] px-4 py-3.5 text-left font-['Space_Grotesk',sans-serif] text-sm font-bold text-[#162327] shadow-[3px_3px_0px_#1A1A1A] transition hover:-translate-y-0.5 hover:brightness-[1.02] active:translate-y-px active:shadow-[2px_2px_0px_#1A1A1A]"
      onClick={onOpen}
    >
      Salva sulla schermata Home
      <span className="mt-1 block text-xs font-semibold normal-case tracking-normal text-[#374550]">
        iPhone, Android · apre come app
      </span>
    </button>
  )
}
