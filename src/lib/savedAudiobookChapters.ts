export const SAVED_AUDIO_CHAPTERS_KEY = 'alveo:savedAudiobookChapters:v1'

export type SavedAudiobookChapter = {
  audiobookId: string
  audiobookTitle: string
  author: string
  chapterIndex: number
  chapterTitle: string
  coverSrc?: string
  savedAt: string
}

export const SAVED_CHAPTERS_CHANGED = 'alveo-saved-chapters-changed'

function notifyChanged() {
  try {
    window.dispatchEvent(new CustomEvent(SAVED_CHAPTERS_CHANGED))
  } catch {
    /* ignore */
  }
}

export function chapterSaveKey(audiobookId: string, chapterIndex: number): string {
  return `${audiobookId}::${chapterIndex}`
}

export function loadSavedAudiobookChapters(): SavedAudiobookChapter[] {
  try {
    const raw = localStorage.getItem(SAVED_AUDIO_CHAPTERS_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw) as unknown
    if (!Array.isArray(arr)) return []
    return arr
      .filter(
        (x): x is SavedAudiobookChapter =>
          !!x &&
          typeof (x as SavedAudiobookChapter).audiobookId === 'string' &&
          typeof (x as SavedAudiobookChapter).chapterIndex === 'number' &&
          typeof (x as SavedAudiobookChapter).chapterTitle === 'string',
      )
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
  } catch {
    return []
  }
}

function persist(list: SavedAudiobookChapter[]) {
  try {
    localStorage.setItem(SAVED_AUDIO_CHAPTERS_KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
  notifyChanged()
}

export function isAudiobookChapterSaved(audiobookId: string, chapterIndex: number): boolean {
  const k = chapterSaveKey(audiobookId, chapterIndex)
  return loadSavedAudiobookChapters().some(
    (s) => chapterSaveKey(s.audiobookId, s.chapterIndex) === k,
  )
}

/** Restituisce true se ora è nei preferiti. */
export function toggleSavedAudiobookChapter(entry: Omit<SavedAudiobookChapter, 'savedAt'>): boolean {
  const list = loadSavedAudiobookChapters()
  const k = chapterSaveKey(entry.audiobookId, entry.chapterIndex)
  const i = list.findIndex((s) => chapterSaveKey(s.audiobookId, s.chapterIndex) === k)
  if (i >= 0) {
    list.splice(i, 1)
    persist(list)
    return false
  }
  list.unshift({
    ...entry,
    savedAt: new Date().toISOString(),
  })
  persist(list)
  return true
}

export function removeSavedAudiobookChapter(audiobookId: string, chapterIndex: number) {
  const k = chapterSaveKey(audiobookId, chapterIndex)
  const list = loadSavedAudiobookChapters().filter(
    (s) => chapterSaveKey(s.audiobookId, s.chapterIndex) !== k,
  )
  persist(list)
}
