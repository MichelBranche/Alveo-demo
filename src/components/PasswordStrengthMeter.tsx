import type { PasswordStrengthResult, PasswordStrengthTier } from '../security/passwordPolicy'

const TIER_SEGMENT_STYLES: Record<Exclude<PasswordStrengthTier, 0>, string> = {
  1: 'bg-[#E8A598] shadow-[inset_0_-2px_0_rgba(0,0,0,0.12)]',
  2: 'bg-[#F0C878] shadow-[inset_0_-2px_0_rgba(0,0,0,0.12)]',
  3: 'bg-[#9BCFA3] shadow-[inset_0_-2px_0_rgba(0,0,0,0.12)]',
  4: 'bg-[#6BAF76] shadow-[inset_0_-2px_0_rgba(0,0,0,0.12)]',
}

const EMPTY_SEGMENT = 'bg-[#EDE8DE]'

type Props = {
  strength: PasswordStrengthResult
  /** Prefisso univoco per id accessibili (es. useId dal form). */
  idBase: string
}

export default function PasswordStrengthMeter({ strength, idBase }: Props) {
  const { tier, label, score, kind } = strength
  const labelId = `${idBase}-strength-label`

  if (kind === 'empty') return null

  const activeTone: PasswordStrengthTier = tier === 0 ? 1 : tier

  const labelClass =
    kind === 'tooLong'
      ? 'text-red-800'
      : kind === 'tooShort' || kind === 'blocklist'
        ? 'text-amber-900'
        : 'text-[#1A1A1A]'

  return (
    <div className="mt-3 space-y-2" aria-live="polite">
      <div
        className="flex gap-1.5 sm:gap-2"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
        aria-labelledby={labelId}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-sm border-2 border-[#1A1A1A] transition-colors duration-150 ${
              tier > 0 && i <= tier ? TIER_SEGMENT_STYLES[activeTone] : EMPTY_SEGMENT
            }`}
          />
        ))}
      </div>
      <p id={labelId} className={`text-xs font-semibold leading-snug sm:text-[13px] ${labelClass}`}>
        <span className="text-gray-600">Robustezza:</span> {label}
      </p>
    </div>
  )
}
