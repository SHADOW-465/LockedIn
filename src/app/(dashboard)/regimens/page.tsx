'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'
import { getUserRegimens, createRegimen } from '@/lib/supabase/regimens'
import { REGIMEN_OPTIONS } from '@/lib/stores/onboarding-store'
import type { Regimen } from '@/lib/supabase/schema'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

/**
 * Training regimens — enroll + advance day via /api/regimens/complete-day.
 */
export default function RegimensPage() {
  const { user, profile } = useAuth()
  const [regimens, setRegimens] = useState<Regimen[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showCatalog, setShowCatalog] = useState(false)

  const refresh = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    const list = await getUserRegimens(user.id)
    setRegimens(list)
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function enroll(opt: (typeof REGIMEN_OPTIONS)[number]) {
    if (!user) return
    setBusy(opt.id)
    setError('')
    setMessage('')
    try {
      const existing = regimens.find((r) => r.name === opt.name && r.status === 'active')
      if (existing) {
        setError('Already enrolled in this regimen')
        return
      }
      const created = await createRegimen(user.id, opt.name, opt.description, 14)
      if (!created) {
        setError('Could not create regimen')
        return
      }
      setMessage(`Enrolled: ${opt.name}`)
      setShowCatalog(false)
      await refresh()
    } finally {
      setBusy(null)
    }
  }

  async function completeDay(r: Regimen) {
    if (!user) return
    setBusy(r.id)
    setError('')
    setMessage('')
    try {
      const res = await fetch('/api/regimens/complete-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regimenId: r.id,
          userId: user.id,
          currentDay: r.current_day,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Advance failed')
        return
      }
      if (data.allowed === false) {
        setError(data.reason || 'Not enough tasks completed today')
        return
      }
      setMessage(
        data.nextDayTask
          ? `Day advanced. Next focus: ${data.nextDayTask.title || data.nextDayTask}`
          : data.message || 'Day complete',
      )
      await refresh()
    } finally {
      setBusy(null)
    }
  }

  const preferred = profile?.preferred_regimens || []

  return (
    <div className="px-6 py-6 xl:px-8 xl:py-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-label-caps text-[10px] tracking-widest text-primary-fixed">TRAINING</p>
          <h1 className="font-headline-md text-2xl font-semibold">Regimens</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Multi-day programs. Advance requires daily task quota for your tier.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCatalog((v) => !v)}
          className="min-h-11 rounded-full bg-primary-fixed px-5 py-2 text-xs font-bold text-on-primary-fixed"
        >
          {showCatalog ? 'Hide catalog' : 'Enroll'}
        </button>
      </header>

      {preferred.length > 0 && (
        <p className="mb-4 text-xs text-on-surface-variant">
          Onboarding prefs: {preferred.join(', ')}
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </p>
      )}
      {message && (
        <p className="mb-4 rounded-xl border border-primary-fixed/30 bg-primary-fixed/10 px-4 py-3 text-sm">
          {message}
        </p>
      )}

      {showCatalog && (
        <div className="mb-8 grid max-h-96 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
          {REGIMEN_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              disabled={busy === opt.id}
              onClick={() => void enroll(opt)}
              className="bento-card rounded-xl p-4 text-left transition hover:border-primary-fixed/30"
            >
              <p className="text-sm font-semibold">{opt.name}</p>
              <p className="mt-1 text-xs text-on-surface-variant">{opt.description}</p>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-on-surface-variant">Loading…</p>
      ) : regimens.length === 0 ? (
        <div className="bento-card rounded-2xl p-8 text-sm text-on-surface-variant">
          No regimens yet. Enroll from the catalog to start a 14-day track.
        </div>
      ) : (
        <ul className="space-y-3">
          {regimens.map((r) => {
            const pct = Math.min(100, Math.round((r.current_day / Math.max(1, r.total_days)) * 100))
            return (
              <li key={r.id} className="bento-card rounded-2xl p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{r.name}</h3>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 font-label-caps text-[10px]',
                          r.status === 'active' && 'bg-primary-fixed/15 text-primary-fixed',
                          r.status === 'completed' && 'bg-white/10 text-on-surface-variant',
                          r.status === 'paused' && 'bg-white/5 text-on-surface-variant',
                        )}
                      >
                        {r.status}
                      </span>
                    </div>
                    {r.description && (
                      <p className="text-sm text-on-surface-variant">{r.description}</p>
                    )}
                    <p className="mt-2 font-mono-data text-xs text-on-surface-variant">
                      Day {r.current_day} / {r.total_days}
                    </p>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-container-highest">
                      <div
                        className="h-full rounded-full bg-primary-fixed"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  {r.status === 'active' && (
                    <button
                      type="button"
                      disabled={busy === r.id}
                      onClick={() => void completeDay(r)}
                      className="min-h-11 shrink-0 rounded-full bg-primary-fixed px-4 py-2 text-xs font-bold text-on-primary-fixed disabled:opacity-50"
                    >
                      {busy === r.id ? '…' : 'Complete day'}
                    </button>
                  )}
                  {r.status === 'completed' && (
                    <Icon name="check_circle" filled className="text-primary-fixed" />
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
