export const NAV = [
  { id: 'home', emoji: '◆', label: 'Home', shortTitle: 'Home' },
  { id: 'oasi', emoji: '🏠', label: 'Oasi personale', shortTitle: 'Oasi' },
  { id: 'med', emoji: '🧘‍♀️', label: 'Meditazioni Guidate', shortTitle: 'Meditazioni' },
  { id: 'tools', emoji: '📚', label: 'Strumenti e Audiolibri', shortTitle: 'Strumenti' },
  { id: 'diary', emoji: '✍️', label: 'Diario di Defusione', shortTitle: 'Diario' },
] as const

export type NavId = (typeof NAV)[number]['id']
