'use client'

import { useState } from 'react'
import { TIERS, PERSONAS } from '@/lib/stores/onboarding-store'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

const DURATIONS = [
  { label: '12 hours', minutes: 12 * 60 },
  { label: '24 hours', minutes: 24 * 60 },
  { label: '3 days', minutes: 3 * 24 * 60 },
  { label: '7 days', minutes: 7 * 24 * 60 },
  { label: '14 days', minutes: 14 * 24 * 60 },
  { label: '30 days', minutes: 30 * 24 * 60 },
] as const

export type SessionStartConfig = {
  tier: string
  ai_personality: string
  desired_duration_minutes: number
}

type Props = {
  open: boolean
  onClose: () => void
  defaults: {
    tier?: string
    ai_personality?: string | null
    initial_lock_goal_hours?: number | null
  }
  onStart: (config: SessionStartConfig) => Promise<void>
}

/**
 * Compact session start wizard — duration, tier, persona before lock.
 */
export function SessionStartModal({ open, onClose, defaults, onStart }: Props) {
  const defaultMinutes = (defaults.initial_lock_goal_hours || 168) * 60
  const closest =
    DURATIONS.find((d) => d.minutes === defaultMinutes) ||
    DURATIONS.find((d) => d.minutes >= defaultMinutes) ||
    DURATIONS[3]

  const [tier, setTier] = useState(defaults.tier || 'Newbie')
  const [persona, setPersona] = useState(defaults.ai_personality || 'Strict Master')
  const [minutes, setMinutes] = useState(closest.minutes)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  async function handleStart() {
    setLoading(true)
    setError('')
    try {
      await onStart({
        tier,
        ai_personality: persona,
        desired_duration_minutes: minutes,
      })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-white/10 bg-surface p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="font-label-caps text-[10px] tracking-widest text-primary-fixed">
              LOCK PROTOCOL
            </p>
            <h2 className="mt-1 text-xl font-semibold text-on-surface">Start session</h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Settings freeze while locked. Choose carefully.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container"
            aria-label="Close"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="space-y-5">
          <fieldset>
            <legend className="mb-2 font-label-caps text-[11px] text-on-surface-variant">
              Duration
            </legend>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d.minutes}
                  type="button"
                  onClick={() => setMinutes(d.minutes)}
                  className={cn(
                    'rounded-full px-3 py-2 text-xs font-bold',
                    minutes === d.minutes
                      ? 'bg-primary-fixed text-on-primary-fixed'
                      : 'border border-white/10 text-on-surface-variant',
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="block space-y-1">
            <span className="font-label-caps text-[11px] text-on-surface-variant">Tier</span>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-surface-container-lowest px-4 py-3 text-sm"
            >
              {TIERS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="font-label-caps text-[11px] text-on-surface-variant">Master</span>
            <select
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-surface-container-lowest px-4 py-3 text-sm"
            >
              {PERSONAS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && <p className="mt-4 text-sm text-error">{error}</p>}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 flex-1 rounded-full border border-white/10 text-xs font-bold"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => void handleStart()}
            className="min-h-11 flex-1 rounded-full bg-primary-fixed text-xs font-bold text-on-primary-fixed disabled:opacity-50"
          >
            {loading ? 'Locking…' : 'Lock in'}
          </button>
        </div>
      </div>
    </div>
  )
}
