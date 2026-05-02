/** Validazione formato email pragmatica (nessuna dipendenza esterna). */
export function validateEmailFormat(email: string): boolean {
  const s = email.trim()
  if (s.length < 3 || s.length > 254) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}
