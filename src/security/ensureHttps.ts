/**
 * In produzione web, blocca endpoint API su HTTP chiaro (mitiga MITM degli access token).
 * Capacitor / localhost restano consentiti senza HTTPS esplicito sull’URL interno.
 */
export function assertSecureApiOrigin(urlStr: string): void {
  if (!import.meta.env.PROD) return
  try {
    const u = new URL(urlStr, window.location.origin)
    const host = u.hostname.toLowerCase()
    if (host !== 'localhost' && host !== '127.0.0.1' && u.protocol === 'http:') {
      throw new Error('[Alveo] In produzione gli endpoint API devono usare https.')
    }
  } catch (e) {
    if (e instanceof TypeError) {
      throw new Error('[Alveo] URL API non valido.', { cause: e })
    }
    throw e
  }
}
