/**
 * Catalogo audiolibri (client). Aggiungi voci conservando gli `id` univoci.
 * Copertine: PNG/WebP/JPG in `public/covers/` e campo `coverSrc` → `/covers/nome.webp`
 */

export type AudiobookAccent = 'sea' | 'lavender' | 'sand' | 'sage'

export type AudiobookItem = {
  id: string
  title: string
  author: string
  synopsis: string
  /** Percorso assoluto sotto `/public`, es. `/covers/mio-audiolibro.webp`. Se omesso viene mostrato un segnaposto. */
  coverSrc?: string
  durationMinutes?: number
  /** Colore fallback copertina (senza immagine). */
  accent?: AudiobookAccent
}

/** Palette fallback allineata al resto di Alveo */
export const AUDIOBOOK_ACCENTS: Record<
  AudiobookAccent,
  { gradient: string; pattern: string }
> = {
  sea: {
    gradient: 'from-[#c9dce6] via-[#dcecf2] to-[#eae5df]',
    pattern: 'from-transparent via-[#162327]/6 to-transparent',
  },
  lavender: {
    gradient: 'from-[#d8cde6] via-[#e8e0f0] to-[#f4f0ea]',
    pattern: 'from-transparent via-[#1A1A1A]/8 to-transparent',
  },
  sand: {
    gradient: 'from-[#f5edd0] via-[#eae5df] to-[#f9e784]/65',
    pattern: 'from-transparent via-[#162327]/7 to-transparent',
  },
  sage: {
    gradient: 'from-[#cfdcc8] via-[#eae5df] to-[#c9dce6]/80',
    pattern: 'from-transparent via-[#162327]/6 to-transparent',
  },
}

export const AUDIOBOOK_CATALOG: AudiobookItem[] = [
  {
    id: 'defusion-notte',
    title: 'Luci basse sulla defusione',
    author: 'Serie Alveo · voce fuori campo',
    synopsis:
      'Capitoli brevi per nominare il pensiero e lasciarlo scorrere, quando la mente non smette di commentare.',
    durationMinutes: 42,
    accent: 'lavender',
  },
  {
    id: 'ansia-presenza',
    title: 'Tornare ai sensi quando l\'attesa stringe',
    author: 'Guidato · ACT',
    synopsis:
      'Ascolti da camminare: piedi sulla terra, respiro, micro-esercizi di presenza durante i picchi di tensione.',
    durationMinutes: 55,
    accent: 'sea',
  },
  {
    id: 'valori-mattino',
    title: 'Tre domande sul mattino che vuoi davvero',
    author: 'Micro-capitoli',
    synopsis:
      'Frasi tratteggiate sulla direzione dei valori, senza liste da completare: solo uno spazio per ricordarsi perché sei qui.',
    durationMinutes: 28,
    accent: 'sand',
  },
]
