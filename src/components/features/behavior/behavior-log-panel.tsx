'use client'

import { useEffect, useId, useState } from 'react'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

export type BehaviorType = 'urge' | 'touch' | 'removal'

export type BehaviorCounts = {
  urge: number
  touch: number
  removal: number
}

type Props = {
  counts: BehaviorCounts
  logging: string | null
  disabled?: boolean
  /** Compact for mobile card; roomier for desktop bento */
  density?: 'comfortable' | 'compact'
  onLog: (payload: {
    type: BehaviorType
    intensity?: number
    reason?: string
  }) => void | Promise<void>
}

const ACTIONS: {
  type: BehaviorType
  label: string
  short: string
  hint: string
  icon: string
  /** Tailwind-ish token classes for surface / ring / accent */
  tone: {
    idle: string
    active: string
    iconBg: string
    count: string
    glow: string
  }
}[] = [
  {
    type: 'urge',
    label: 'Urge',
    short: 'Feeling it',
    hint: 'Log the spike — stay locked',
    icon: 'whatshot',
    tone: {
      idle: 'border-amber-400/25 bg-gradient-to-br from-amber-500/10 via-surface-container-high/80 to-surface-container-lowest hover:border-amber-400/45 hover:from-amber-500/18',
      active:
        'border-amber-400/70 bg-gradient-to-br from-amber-500/25 via-amber-600/10 to-surface-container-lowest ring-2 ring-amber-400/40',
      iconBg: 'bg-amber-400/15 text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.15)]',
      count: 'text-amber-300',
      glow: 'shadow-[0_0_28px_rgba(251,191,36,0.12)]',
    },
  },
  {
    type: 'touch',
    label: 'Touch',
    short: 'Hands drifted',
    hint: 'Honest slip of attention',
    icon: 'pan_tool',
    tone: {
      idle: 'border-sky-400/20 bg-gradient-to-br from-sky-500/10 via-surface-container-high/80 to-surface-container-lowest hover:border-sky-400/40 hover:from-sky-500/16',
      active:
        'border-sky-400/70 bg-gradient-to-br from-sky-500/25 via-sky-600/10 to-surface-container-lowest ring-2 ring-sky-400/35',
      iconBg: 'bg-sky-400/15 text-sky-300 shadow-[0_0_20px_rgba(56,189,248,0.12)]',
      count: 'text-sky-300',
      glow: 'shadow-[0_0_28px_rgba(56,189,248,0.1)]',
    },
  },
  {
    type: 'removal',
    label: 'Removal',
    short: 'Cage off',
    hint: 'Serious — needs a reason',
    icon: 'lock_open_right',
    tone: {
      idle: 'border-error/30 bg-gradient-to-br from-error/10 via-surface-container-high/80 to-surface-container-lowest hover:border-error/50 hover:from-error/16',
      active:
        'border-error/70 bg-gradient-to-br from-error/20 via-error/10 to-surface-container-lowest ring-2 ring-error/35',
      iconBg: 'bg-error/15 text-error shadow-[0_0_20px_rgba(255,180,171,0.12)]',
      count: 'text-error',
      glow: 'shadow-[0_0_28px_rgba(255,180,171,0.1)]',
    },
  },
]

const REMOVAL_REASONS = [
  'Hygiene / cleaning',
  'Medical / pain',
  'Emergency',
  'Authorized release',
  'Weakness / broke rules',
  'Other',
]

/**
 * Distinct, high-affordance behavior log controls.
 * Urge → intensity step; Removal → reason step; Touch → one-tap.
 */
export function BehaviorLogPanel({
  counts,
  logging,
  disabled,
  density = 'comfortable',
  onLog,
}: Props) {
  const baseId = useId()
  const [panel, setPanel] = useState<BehaviorType | null>(null)
  const [intensity, setIntensity] = useState(5)
  const [reason, setReason] = useState(REMOVAL_REASONS[0])
  const [flash, setFlash] = useState<BehaviorType | null>(null)

  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(null), 1200)
    return () => clearTimeout(t)
  }, [flash])

  async function commit(type: BehaviorType) {
    if (disabled || logging) return
    if (type === 'urge') {
      await onLog({ type, intensity })
    } else if (type === 'removal') {
      await onLog({ type, reason })
    } else {
      await onLog({ type })
    }
    setFlash(type)
    setPanel(null)
    setIntensity(5)
    setReason(REMOVAL_REASONS[0])
  }

  function onPrimaryClick(type: BehaviorType) {
    if (disabled || logging) return
    if (type === 'touch') {
      void commit('touch')
      return
    }
    setPanel((p) => (p === type ? null : type))
  }

  const compact = density === 'compact'
  const total = counts.urge + counts.touch + counts.removal

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-label-caps text-[10px] tracking-[0.18em] text-primary-fixed-dim">
            IN THE MOMENT
          </p>
          <h3
            className={cn(
              'font-semibold text-primary',
              compact ? 'text-lg' : 'font-headline-md text-lg',
            )}
          >
            Quick log
          </h3>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-on-surface-variant">
            Tap when it hits. Honesty builds the score — not perfection.
          </p>
        </div>
        <div
          className="shrink-0 rounded-2xl border border-white/10 bg-surface-container-lowest/80 px-3 py-2 text-center"
          aria-live="polite"
        >
          <p className="font-mono-data text-lg font-semibold tabular-nums text-on-surface">
            {total}
          </p>
          <p className="font-label-caps text-[9px] tracking-wider text-on-surface-variant">
            today
          </p>
        </div>
      </div>

      <div
        className={cn('grid gap-3', compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3')}
        role="group"
        aria-label="Log urge, touch, or removal"
      >
        {ACTIONS.map((action) => {
          const count = counts[action.type]
          const isOpen = panel === action.type
          const isBusy = logging === action.type
          const justLogged = flash === action.type

          return (
            <div key={action.type} className="min-w-0">
              <button
                type="button"
                id={`${baseId}-${action.type}`}
                disabled={disabled || Boolean(logging)}
                aria-expanded={action.type === 'touch' ? undefined : isOpen}
                aria-controls={
                  action.type !== 'touch' ? `${baseId}-${action.type}-panel` : undefined
                }
                aria-label={`${action.label}: ${action.hint}. Today: ${count}`}
                onClick={() => onPrimaryClick(action.type)}
                className={cn(
                  'group relative flex w-full min-h-[4.5rem] items-center gap-3 overflow-hidden rounded-2xl border px-3.5 py-3 text-left transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45',
                  isOpen || justLogged ? action.tone.active : action.tone.idle,
                  (isOpen || justLogged) && action.tone.glow,
                )}
              >
                <span
                  className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-active:scale-95',
                    action.tone.iconBg,
                  )}
                >
                  {isBusy ? (
                    <span className="font-mono-data text-xs animate-pulse">…</span>
                  ) : justLogged ? (
                    <Icon name="check" className="text-[22px]" />
                  ) : (
                    <Icon name={action.icon} className="text-[22px]" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-bold tracking-tight text-on-surface">
                      {action.label}
                    </span>
                    {action.type !== 'touch' && (
                      <span className="rounded-full bg-black/25 px-1.5 py-0.5 font-label-caps text-[9px] text-on-surface-variant">
                        {isOpen ? 'close' : 'tap'}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-on-surface-variant">
                    {justLogged ? 'Logged' : action.short}
                  </span>
                </span>
                <span
                  className={cn(
                    'flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/25 px-2 font-mono-data text-sm font-semibold tabular-nums',
                    action.tone.count,
                  )}
                >
                  {count}
                </span>
              </button>

              {/* Urge intensity */}
              {action.type === 'urge' && isOpen && (
                <div
                  id={`${baseId}-urge-panel`}
                  className="mt-2 rounded-2xl border border-amber-400/20 bg-surface-container-lowest/90 p-4"
                  role="region"
                  aria-label="Urge intensity"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-amber-200/90">How strong?</p>
                    <p className="font-mono-data text-lg font-bold tabular-nums text-amber-300">
                      {intensity}
                      <span className="text-xs font-medium text-on-surface-variant">/10</span>
                    </p>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={intensity}
                    onChange={(e) => setIntensity(Number(e.target.value))}
                    className="mb-2 w-full accent-amber-400"
                    aria-valuemin={1}
                    aria-valuemax={10}
                    aria-valuenow={intensity}
                    aria-label="Urge intensity from 1 to 10"
                  />
                  <div className="mb-4 flex justify-between font-label-caps text-[9px] tracking-wide text-on-surface-variant">
                    <span>Whisper</span>
                    <span>Crushing</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[2, 5, 8, 10].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setIntensity(n)}
                        className={cn(
                          'min-h-9 min-w-11 rounded-full px-3 text-xs font-bold transition',
                          intensity === n
                            ? 'bg-amber-400 text-on-primary-fixed'
                            : 'border border-white/10 text-on-surface-variant hover:border-amber-400/40',
                        )}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={Boolean(logging)}
                      onClick={() => void commit('urge')}
                      className="ml-auto min-h-11 rounded-full bg-amber-400 px-5 text-xs font-bold text-on-primary-fixed shadow-[0_0_20px_rgba(251,191,36,0.25)] disabled:opacity-50"
                    >
                      {logging === 'urge' ? 'Saving…' : 'Log urge'}
                    </button>
                  </div>
                </div>
              )}

              {/* Removal reason */}
              {action.type === 'removal' && isOpen && (
                <div
                  id={`${baseId}-removal-panel`}
                  className="mt-2 rounded-2xl border border-error/25 bg-surface-container-lowest/90 p-4"
                  role="region"
                  aria-label="Removal reason"
                >
                  <p className="mb-1 text-xs font-semibold text-error">Why is it off?</p>
                  <p className="mb-3 text-[11px] text-on-surface-variant">
                    Logged permanently for this day&apos;s chronicle.
                  </p>
                  <div className="mb-4 flex flex-wrap gap-2" role="listbox" aria-label="Reasons">
                    {REMOVAL_REASONS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        role="option"
                        aria-selected={reason === r}
                        onClick={() => setReason(r)}
                        className={cn(
                          'min-h-10 rounded-full px-3 text-left text-[11px] font-semibold transition',
                          reason === r
                            ? 'bg-error text-on-error'
                            : 'border border-white/10 text-on-surface-variant hover:border-error/40',
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={Boolean(logging) || !reason}
                    onClick={() => void commit('removal')}
                    className="flex w-full min-h-12 items-center justify-center gap-2 rounded-full bg-error px-5 text-xs font-bold text-on-error disabled:opacity-50"
                  >
                    <Icon name="warning" className="text-[16px]" />
                    {logging === 'removal' ? 'Saving…' : 'Confirm removal log'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="flex items-start gap-2 text-[11px] leading-relaxed text-on-surface-variant/80">
        <Icon name="auto_awesome" className="mt-0.5 shrink-0 text-primary-fixed-dim text-sm" />
        <span>
          <span className="text-amber-300/90">Urge</span> needs strength ·{' '}
          <span className="text-sky-300/90">Touch</span> is one tap ·{' '}
          <span className="text-error/90">Removal</span> asks why. Your Master can use this pattern.
        </span>
      </p>
    </div>
  )
}
