'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/contexts/auth-context'
import { getActiveSession } from '@/lib/supabase/sessions'
import { TIERS, PERSONAS, FETISH_GENRES } from '@/lib/stores/onboarding-store'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/supabase/auth'

/**
 * Settings / governance — PATCH /api/profile/update.
 * Locked during active session (except note about care-mode fields).
 */
export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth()
  const [locked, setLocked] = useState(false)
  const [tier, setTier] = useState('Newbie')
  const [persona, setPersona] = useState('Strict Master')
  const [safeword, setSafeword] = useState('MERCY')
  const [hardLimits, setHardLimits] = useState('')
  const [softLimits, setSoftLimits] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [lockHours, setLockHours] = useState(168)
  const [masterPref, setMasterPref] = useState('')
  const [sessionIntent, setSessionIntent] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!profile) return
    setTier(profile.tier || 'Newbie')
    setPersona(profile.ai_personality || 'Strict Master')
    setSafeword(profile.safeword || 'MERCY')
    setHardLimits((profile.hard_limits || []).join(', '))
    setSoftLimits((profile.soft_limits || []).join(', '))
    setInterests(profile.interests || [])
    setLockHours(profile.initial_lock_goal_hours || 168)
    setMasterPref(profile.master_preference || '')
    setSessionIntent(profile.session_intent || '')
  }, [profile])

  useEffect(() => {
    if (!user?.id) return
    getActiveSession(user.id).then((s) => setLocked(Boolean(s)))
  }, [user?.id])

  function parseList(raw: string): string[] {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }

  function toggleInterest(g: string) {
    setInterests((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g],
    )
  }

  async function save(partial?: Record<string, unknown>) {
    if (!user) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const body = partial || {
        userId: user.id,
        tier,
        ai_personality: persona,
        safeword: safeword.trim() || 'MERCY',
        hard_limits: parseList(hardLimits),
        soft_limits: parseList(softLimits),
        interests,
        initial_lock_goal_hours: lockHours,
        master_preference: masterPref,
        session_intent: sessionIntent,
      }
      if (!('userId' in body)) {
        Object.assign(body, { userId: user.id })
      }

      const res = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Save failed')
        return
      }
      setMessage('Saved')
      await refreshProfile()
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-6 py-6 xl:px-8 xl:py-8">
      <header className="mb-6">
        <p className="font-label-caps text-[10px] tracking-widest text-primary-fixed">
          GOVERNANCE
        </p>
        <h1 className="font-headline-md text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          {locked
            ? 'Session active — core settings locked. Preference notes can still be updated in Care Mode via Companion.'
            : 'Configure identity between locks.'}
        </p>
      </header>

      {locked && (
        <div className="mb-6 rounded-2xl border border-primary-fixed/30 bg-primary-fixed/10 p-4 text-sm">
          <Icon name="lock" className="mr-2 inline text-primary-fixed" />
          Settings freeze during lock. Emergency release is on Support / Home.
        </div>
      )}

      <div className="mx-auto max-w-2xl space-y-6">
        <section className="bento-card space-y-4 rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Identity</h2>
          <label className="block space-y-1">
            <span className="font-label-caps text-[11px] text-on-surface-variant">Tier</span>
            <select
              value={tier}
              disabled={locked}
              onChange={(e) => setTier(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-surface-container-lowest px-4 py-3 text-sm disabled:opacity-50"
            >
              {TIERS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="font-label-caps text-[11px] text-on-surface-variant">AI Master</span>
            <select
              value={persona}
              disabled={locked}
              onChange={(e) => setPersona(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-surface-container-lowest px-4 py-3 text-sm disabled:opacity-50"
            >
              {PERSONAS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="font-label-caps text-[11px] text-on-surface-variant">
              Default lock goal (hours)
            </span>
            <input
              type="number"
              min={1}
              max={720}
              value={lockHours}
              disabled={locked}
              onChange={(e) => setLockHours(Number(e.target.value) || 168)}
              className="w-full rounded-xl border border-white/10 bg-surface-container-lowest px-4 py-3 text-sm disabled:opacity-50"
            />
          </label>
          <label className="block space-y-1">
            <span className="font-label-caps text-[11px] text-on-surface-variant">Safeword</span>
            <input
              value={safeword}
              disabled={locked}
              onChange={(e) => setSafeword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-surface-container-lowest px-4 py-3 text-sm uppercase disabled:opacity-50"
            />
          </label>
        </section>

        <section className="bento-card space-y-4 rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Limits</h2>
          <label className="block space-y-1">
            <span className="font-label-caps text-[11px] text-on-surface-variant">
              Hard limits (comma-separated)
            </span>
            <textarea
              value={hardLimits}
              disabled={locked}
              onChange={(e) => setHardLimits(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-white/10 bg-surface-container-lowest px-4 py-3 text-sm disabled:opacity-50"
              placeholder="scat, blood, public…"
            />
          </label>
          <label className="block space-y-1">
            <span className="font-label-caps text-[11px] text-on-surface-variant">
              Soft limits (comma-separated)
            </span>
            <textarea
              value={softLimits}
              disabled={locked}
              onChange={(e) => setSoftLimits(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-white/10 bg-surface-container-lowest px-4 py-3 text-sm disabled:opacity-50"
            />
          </label>
        </section>

        <section className="bento-card space-y-4 rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Interests</h2>
          <div className="flex flex-wrap gap-2">
            {FETISH_GENRES.map((g) => {
              const on = interests.includes(g)
              return (
                <button
                  key={g}
                  type="button"
                  disabled={locked}
                  onClick={() => toggleInterest(g)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-[11px] font-bold disabled:opacity-40',
                    on
                      ? 'bg-primary-fixed text-on-primary-fixed'
                      : 'border border-white/10 text-on-surface-variant',
                  )}
                >
                  {g}
                </button>
              )
            })}
          </div>
        </section>

        <section className="bento-card space-y-4 rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Standing orders</h2>
          <p className="text-xs text-on-surface-variant">
            These can still be updated during a session (Care Mode / preference notes).
          </p>
          <label className="block space-y-1">
            <span className="font-label-caps text-[11px] text-on-surface-variant">
              Master preference
            </span>
            <textarea
              value={masterPref}
              onChange={(e) => setMasterPref(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-white/10 bg-surface-container-lowest px-4 py-3 text-sm"
              placeholder="Never outdoor tasks…"
            />
          </label>
          <label className="block space-y-1">
            <span className="font-label-caps text-[11px] text-on-surface-variant">
              Session intent
            </span>
            <textarea
              value={sessionIntent}
              onChange={(e) => setSessionIntent(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-white/10 bg-surface-container-lowest px-4 py-3 text-sm"
            />
          </label>
          {locked && (
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                void save({
                  userId: user!.id,
                  master_preference: masterPref,
                  session_intent: sessionIntent,
                })
              }
              className="min-h-11 rounded-full border border-primary-fixed/40 px-5 py-2 text-xs font-bold text-primary-fixed"
            >
              Save preference notes only
            </button>
          )}
        </section>

        {error && <p className="text-sm text-error">{error}</p>}
        {message && <p className="text-sm text-primary-fixed">{message}</p>}

        <button
          type="button"
          disabled={saving || locked}
          onClick={() => void save()}
          className="w-full min-h-11 rounded-full bg-primary-fixed text-sm font-bold text-on-primary-fixed disabled:opacity-40"
        >
          {saving ? 'Saving…' : locked ? 'Locked during session' : 'Save settings'}
        </button>

        <div className="flex flex-wrap gap-3 border-t border-white/5 pt-6">
          <Link
            href="/settings/profile"
            className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold"
          >
            Profile
          </Link>
          <Link
            href="/settings/notifications"
            className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold"
          >
            Notifications
          </Link>
          <Link href="/support" className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold">
            Support
          </Link>
          <button
            type="button"
            onClick={() => signOut()}
            className="rounded-full border border-error/40 px-4 py-2 text-xs font-bold text-error"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
