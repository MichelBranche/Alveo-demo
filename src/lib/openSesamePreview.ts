import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'

/** Anteprima di ricerca Sesame (agenti voce Maya & Miles). Servizio ospitato fuori da Alveo. */
export const SESAME_PREVIEW_URL = 'https://app.sesame.com/' as const

/** Apre la preview Sesame nel browser di sistema (web) o nel browser in-app (Capacitor). */
export async function openSesamePreview(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url: SESAME_PREVIEW_URL })
    return
  }
  window.open(SESAME_PREVIEW_URL, '_blank', 'noopener,noreferrer')
}
