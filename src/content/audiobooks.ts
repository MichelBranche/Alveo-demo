/**
 * Catalogo audiolibri in `public/audiobooks/`.
 * Copertine: PNG/WebP/JPG/SVG in `public/covers/` e campo `coverSrc` → `/covers/nome.ext`.
 * Playlist: `.m3u` nella cartella titolo (`playlistFilename`).
 */

export type AudiobookAccent = 'sea' | 'lavender' | 'sand' | 'sage'

/** Cartelle sotto `public/audiobooks/` nell’ordine [autore | cartella alto, libro | sottocartella]. */
export type AudiobookAudioSource = {
  folderSegments: readonly [string, string]
  playlistFilename: string
}

export type AudiobookItem = {
  id: string
  title: string
  author: string
  synopsis: string
  /** Copertina sotto `/public`, es. `/covers/mio.webp` */
  coverSrc?: string
  durationMinutes?: number
  accent?: AudiobookAccent
  /** Se presente, la UI carica la playlist e gli MP3 referenziati. */
  audio?: AudiobookAudioSource
}

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
    id: 'russ-harris-trappola-felicita',
    title: 'La trappola della felicità',
    author: 'Russ Harris',
    synopsis:
      'Per corso ACT: rapporto con pensieri spiacevoli e valori, con esempi chiari sulla “trappola” di inseguire la felicità come obiettivo unico.',
    accent: 'sand',
    coverSrc: '/covers/russ-harris-trappola-felicita.png',
    audio: {
      folderSegments: ['Russ Harris', 'La trappola della felicità'],
      playlistFilename: 'Russ Harris - La trappola della felicità.m3u',
    },
  },
  {
    id: 'richard-schwartz-allearsi-parti',
    title: 'Come allearsi con le parti «cattive» di sé',
    author: 'Richard C. Schwartz',
    synopsis:
      'Introduzione a un modo di rapportarsi alle parti interne della mente, con tono compassione e sistemico.',
    accent: 'lavender',
    coverSrc: '/covers/richard-schwartz-allearsi-parti.png',
    audio: {
      folderSegments: ['Richard C. Schwartz', 'Come allearsi con le parti'],
      playlistFilename: 'Richard C. Schwartz - Come allearsi con le parti.m3u',
    },
  },
  {
    id: 'seneca-brevita-vita',
    title: 'La brevità della vita',
    author: 'Lucio Anneo Seneca',
    synopsis:
      'Riflessioni stoiche sul tempo, distrazioni e scelte: testo compatto pensato come ascolto calmo.',
    accent: 'sage',
    coverSrc: '/covers/seneca-brevita-vita.png',
    audio: {
      folderSegments: ['Lucio Anneo Seneca', 'La brevità della vita'],
      playlistFilename: 'Lucio Anneo Seneca - La brevità della vita.m3u',
    },
  },
  {
    id: 'eva-spencer-codipendenza',
    title: 'Codipendenza e abuso narcisistico',
    author: 'Eva Spencer',
    synopsis:
      'Materiali sulla dinamiche di relazione, confini emotivi e riconoscere schemi disfunzionali con calma informativa.',
    accent: 'sea',
    coverSrc: '/covers/eva-spencer-codipendenza-abuso-narcisistico.png',
    audio: {
      folderSegments: ['Eva Spencer', 'Codipendenza e abuso narcisistico'],
      playlistFilename: 'Eva Spencer - Codipendenza e abuso narcisistico.m3u',
    },
  },
  {
    id: 'michele-mezzanotte-addio',
    title: 'È ora di dire addio',
    author: 'Michele Mezzanotte',
    synopsis:
      'Percorso verso chiudere relazioni e abitudini pesanti senza slogan: spazio dedicato alla parola parlata.',
    accent: 'lavender',
    coverSrc: '/covers/michele-mezzanotte-addio.png',
    audio: {
      folderSegments: ['Michele Mezzanotte', 'È ora di dire addio'],
      playlistFilename: 'Michele Mezzanotte - È ora di dire addio.m3u',
    },
  },
  {
    id: 'roberto-morelli-riprogrammazione',
    title: 'Riprogrammazione mentale',
    author: 'Roberto Morelli',
    synopsis:
      'Sugli schemi di pensiero che si rinforzano nel tempo e su come proporre gradualmente punti di vista più utili.',
    accent: 'sea',
    coverSrc: '/covers/roberto-morelli-riprogrammazione-mentale.png',
    audio: {
      folderSegments: ['Roberto Morelli', 'Riprogrammazione mentale'],
      playlistFilename: 'Roberto Morelli - Riprogrammazione mentale.m3u',
    },
  },
  {
    id: 'samuel-goleman-psicologia-nera',
    title: 'Psicologia nera e manipolazione mentale',
    author: 'Samuel Goleman',
    synopsis:
      'Orientamento difensivo: riconoscere leve di influenza e prendere coscienza dal punto di vista ascoltatore.',
    accent: 'sand',
    coverSrc: '/covers/samuel-goleman-psicologia-nera-manipolazione.png',
    audio: {
      folderSegments: ['Samuel Goleman', 'Psicologia Nera E Manipolazione Mentale'],
      playlistFilename: 'Samuel Goleman - Psicologia Nera E Manipolazione Mentale.m3u',
    },
  },
]

export function getAudiobookById(id: string): AudiobookItem | undefined {
  return AUDIOBOOK_CATALOG.find((x) => x.id === id)
}
