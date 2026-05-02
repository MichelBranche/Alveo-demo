import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const playlistDir = path.join(root, 'public', 'meditation-playlist')
const outFile = path.join(root, 'src', 'content', 'guidedMeditationTracks.ts')

const names = fs
  .readdirSync(playlistDir)
  .filter((f) => f.endsWith('.mp3'))
  .sort((a, b) => a.localeCompare(b, 'it'))

const lines = names.map((n) => `  ${JSON.stringify(n)},`).join('\n')
const header = `/**
 * Elenco tracce in public/meditation-playlist/
 * Rigenera: node scripts/sync-guided-meditation-tracks.mjs
 */
export const GUIDED_MEDITATION_TRACK_FILENAMES: string[] = [
`

fs.writeFileSync(outFile, `${header}${lines}\n]\n`, 'utf8')
console.log(`Wrote ${names.length} tracks to ${path.relative(root, outFile)}`)
