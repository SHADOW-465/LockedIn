'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/contexts/auth-context'
import { getActiveSession } from '@/lib/supabase/sessions'
import { useEffect } from 'react'
import type { Session } from '@/lib/supabase/schema'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

type RitualKind = 'morning' | 'evening'

/**
 * Daily ritual — Stitch morning_ritual DNA, wired to POST /api/ritual/submit.
 */
export default function RitualPage() {
  const { user, profile } = useAuth()
  const [session, setSession] = useState<Session | null>(null)
  const [kind, setKind] = useState<RitualKind>(() => {
    const h = new Date().getHours()
    return h < 14 ? 'morning' : 'evening'
  })
  const [mood, setMood] = useState('focused')
  const [intention, setIntention] = useState('')
  const [notes, setNotes] = useState('')
  const [energy, setEnergy] = useState(6)
  const [difficulty, setDifficulty] = useState(5)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [narration, setNarration] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    getActiveSession(user.id).then(setSession)
  }, [user?.id])

  async function submit() {
    if (!user) return
    setSaving(true)
    setError('')
    setNarration('')
    try {
      const res = await fetch('/api/ritual/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          sessionId: session?.id,
          type: kind,
          mood: kind === 'morning' ? mood : undefined,
          intention: kind === 'morning' ? intention : undefined,
          notes: kind === 'evening' ? notes : undefined,
          energyLevel: kind === 'evening' ? energy : undefined,
          difficultyLevel: kind === 'evening' ? difficulty : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Could not save ritual')
        return
      }
      setDone(true)
      setNarration(data.aiNarration || '')
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  const streak = profile?.compliance_streak ?? 0
  const willpower = profile?.willpower_score ?? 0

  return (
    <div className="px-6 py-6 xl:px-8 xl:py-8">
      <header className="mb-8 flex flex-wrap items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high">
          <Icon
            name={kind === 'morning' ? 'wb_sunny' : 'nightlight'}
            className="text-primary-fixed"
          />
        </span>
        <div>
          <h1 className="font-headline-md text-2xl font-semibold text-on-surface">
            {kind === 'morning' ? 'Morning Ritual' : 'Evening Ritual'}
          </h1>
          <p className="text-sm text-on-surface-variant">Architecture of intention & reflection</p>
        </div>
      </header>

      <div className="mb-6 flex gap-2">
        {(['morning', 'evening'] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setKind(k)
              setDone(false)
              setNarration('')
            }}
            className={cn(
              'rounded-full px-5 py-2 text-xs font-bold capitalize',
              kind === k
                ? 'bg-primary-fixed text-on-primary-fixed'
                : 'border border-white/10 text-on-surface-variant',
            )}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="bento-card flex flex-col justify-between rounded-2xl p-6 xl:col-span-4">
          <div>
            <p className="font-label-caps text-[11px] tracking-widest text-on-surface-variant">
              PROMISES KEPT
            </p>
            <div className="my-6 flex justify-center">
              <div className="relative flex h-36 w-36 items-center justify-center">
                <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#323630" strokeWidth="10" />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#c3f400"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${(willpower / 100) * 314} 314`}
                  />
                </svg>
                <div className="text-center">
                  <span className="text-3xl font-bold">{willpower}</span>
                  <p className="font-label-caps text-[9px] text-on-surface-variant">WILLPOWER</p>
                </div>
              </div>
            </div>
          </div>
          <p className="text-center text-sm italic text-on-surface-variant opacity-70">
            &ldquo;You are not your urges. You are your decisions.&rdquo;
          </p>
          <p className="mt-4 text-center font-mono-data text-xs text-on-surface-variant">
            Streak {streak}d · {session ? 'Session active' : 'No lock session'}
          </p>
        </section>

        <section className="bento-card rounded-2xl p-6 xl:col-span-8">
          <h3 className="mb-1 font-headline-md text-lg font-semibold">
            {kind === 'morning' ? 'Morning blocks' : 'Evening reflection'}
          </h3>
          <p className="mb-6 text-sm text-on-surface-variant">
            {kind === 'morning'
              ? 'Set mood and intention for the day under lock.'
              : 'Log difficulty, energy, and a short journal line.'}
          </p>

          {kind === 'morning' ? (
            <div className="space-y-4">
              <label className="block space-y-1">
                <span className="font-label-caps text-[11px] text-on-surface-variant">Mood</span>
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-surface-container-lowest px-4 py-3 text-sm"
                >
                  {['focused', 'calm', 'anxious', 'aroused', 'submissive', 'restless'].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="font-label-caps text-[11px] text-on-surface-variant">
                  Intention
                </span>
                <textarea
                  value={intention}
                  onChange={(e) => setIntention(e.target.value)}
                  rows={3}
                  placeholder="To remain locked and obedient…"
                  className="w-full rounded-xl border border-white/10 bg-surface-container-lowest px-4 py-3 text-sm"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block space-y-2">
                <span className="font-label-caps text-[11px] text-on-surface-variant">
                  Difficulty today: {difficulty}/10
                </span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={difficulty}
                  onChange={(e) => setDifficulty(Number(e.target.value))}
                  className="w-full accent-primary-fixed"
                />
              </label>
              <label className="block space-y-2">
                <span className="font-label-caps text-[11px] text-on-surface-variant">
                  Energy: {energy}/10
                </span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={energy}
                  onChange={(e) => setEnergy(Number(e.target.value))}
                  className="w-full accent-primary-fixed"
                />
              </label>
              <label className="block space-y-1">
                <span className="font-label-caps text-[11px] text-on-surface-variant">Journal</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="What tested you today?"
                  className="w-full rounded-xl border border-white/10 bg-surface-container-lowest px-4 py-3 text-sm"
                />
              </label>
            </div>
          )}

          {error && <p className="mt-4 text-sm text-error">{error}</p>}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={saving || !user}
              onClick={() => void submit()}
              className="min-h-11 rounded-full bg-primary-fixed px-6 py-2 text-xs font-bold text-on-primary-fixed disabled:opacity-50"
            >
              {saving ? 'Saving…' : `Complete ${kind} ritual`}
            </button>
            <Link
              href="/tasks"
              className="min-h-11 rounded-full border border-white/10 px-5 py-2 text-xs font-bold hover:bg-white/5"
            >
              Check-in photos
            </Link>
            <Link
              href="/memoir"
              className="min-h-11 rounded-full border border-white/10 px-5 py-2 text-xs font-bold hover:bg-white/5"
            >
              Memoir
            </Link>
          </div>

          {done && (
            <div className="mt-6 rounded-xl border border-primary-fixed/25 bg-primary-fixed/10 p-5">
              <p className="font-label-caps text-[10px] tracking-widest text-primary-fixed">
                MEMOIR PAGE WRITTEN
              </p>
              {narration ? (
                <p className="mt-3 text-sm italic leading-relaxed text-on-surface">{narration}</p>
              ) : (
                <p className="mt-3 text-sm text-on-surface-variant">Ritual saved.</p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
