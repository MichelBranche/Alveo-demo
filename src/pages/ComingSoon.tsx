import type { NavId } from '../nav'
import { NAV } from '../nav'

export default function ComingSoon({
  navId,
}: {
  navId: Exclude<NavId, 'home' | 'oasi' | 'tools' | 'med' | 'diary' | 'relax' | 'community'>
}) {
  const meta = NAV.find((n) => n.id === navId)
  const title = meta?.label ?? 'Sezione'

  return (
    <div className="mx-auto flex min-h-[50vh] w-full min-w-0 max-w-xl flex-col items-center justify-center px-4 text-center">
      <span className="mb-6 text-5xl" aria-hidden>
        {meta?.emoji ?? '✨'}
      </span>
      <p className="mb-3 font-['Space_Grotesk',sans-serif] text-sm font-semibold uppercase tracking-[0.12em] text-gray-600">
        In arrivo
      </p>
      <h1 className="mb-4 font-['Space_Grotesk',sans-serif] text-3xl font-bold text-[#1A1A1A]">{title}</h1>
      <p className="text-gray-600">
        Questa parte di Alveo è ancora in lavorazione. Dalla barra di navigazione si può tornare alla home o
        all&apos;area personale.
      </p>
    </div>
  )
}
