'use client'

import { Icon } from '@/components/ui/icon'

type Props = {
  open: boolean
  archiving: boolean
  summary: Record<string, unknown> | null
  error?: string
  onContinue: () => void
}

export function SessionCompleteOverlay({
  open,
  archiving,
  summary,
  error,
  onContinue,
}: Props) {
  if (!open) return null

  const grade =
    typeof summary?.performance_grade === 'string' ? summary.performance_grade : null
  const compliance =
    typeof summary?.compliance_rate === 'number' ? summary.compliance_rate : null
  const narrative =
    typeof summary?.narrative === 'string' ? summary.narrative : null
  const highlights = Array.isArray(summary?.highlights)
    ? (summary!.highlights as string[])
    : []

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center overflow-y-auto bg-black/90 p-4">
      <div className="my-4 w-full max-w-lg space-y-4 rounded-2xl border border-white/10 bg-surface p-6">
        <div className="text-center">
          <Icon name="lock_open" className="mb-3 text-4xl text-primary-fixed" />
          <h2 className="text-2xl font-bold text-on-surface">Session complete</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            {archiving
              ? 'Archiving to this device…'
              : grade
                ? `Grade ${grade}${compliance != null ? ` · ${compliance}% compliance` : ''}`
                : 'Lock period ended'}
          </p>
        </div>

        {error && (
          <p className="rounded-xl border border-error/30 bg-error/10 p-3 text-sm text-error">
            {error}
          </p>
        )}

        {narrative && (
          <p className="rounded-xl bg-surface-container p-4 text-sm italic leading-relaxed text-on-surface-variant">
            {narrative}
          </p>
        )}

        {highlights.length > 0 && (
          <ul className="space-y-1 text-sm text-on-surface-variant">
            {highlights.map((h) => (
              <li key={h}>· {h}</li>
            ))}
          </ul>
        )}

        {!archiving && (
          <button
            type="button"
            onClick={onContinue}
            className="w-full min-h-11 rounded-full bg-primary-fixed text-sm font-bold text-on-primary-fixed"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  )
}
