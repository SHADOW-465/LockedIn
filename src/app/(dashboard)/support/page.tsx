'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/contexts/auth-context'
import { getActiveSession, invalidateSessionCache } from '@/lib/supabase/sessions'
import { invalidateHubCache } from '@/lib/hooks/use-session-hub'
import type { Session } from '@/lib/supabase/schema'
import { Icon } from '@/components/ui/icon'

/**
 * Support / Care Mode — Stitch mobile support_mode DNA + desktop layout.
 */
export default function SupportPage() {
  const { user, profile } = useAuth()
  const [session, setSession] = useState<Session | null>(null)
  const [releasing, setReleasing] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [coolSeconds, setCoolSeconds] = useState(15 * 60)

  const safeword = profile?.safeword || 'MERCY'

  useEffect(() => {
    if (!user?.id) return
    getActiveSession(user.id).then(setSession)
  }, [user?.id])

  useEffect(() => {
    const id = window.setInterval(() => {
      setCoolSeconds((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  const mm = String(Math.floor(coolSeconds / 60)).padStart(2, '0')
  const ss = String(coolSeconds % 60).padStart(2, '0')

  async function emergencyRelease() {
    if (!user || !session) return
    setReleasing(true)
    setError('')
    try {
      const res = await fetch('/api/sessions/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          sessionId: session.id,
          reason: 'User emergency release from Support',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Release failed')
        return
      }
      setMessage('Emergency release complete. You are free. Rest.')
      invalidateSessionCache(user.id)
      invalidateHubCache(user.id)
      setSession(null)
      setConfirm(false)
    } catch {
      setError('Network error')
    } finally {
      setReleasing(false)
    }
  }

  return (
    <div className="px-6 pb-8 pt-2 xl:px-8 xl:py-8">
      {/* Mobile header strip */}
      <header className="mb-6 flex items-center justify-between xl:hidden">
        <div>
          <p className="font-label-caps text-[10px] tracking-widest text-primary-fixed-dim">
            SUPPORT MODE
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-primary">You are safe</h1>
        </div>
        <Link
          href="/home"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-on-surface-variant"
          aria-label="Close support"
        >
          <Icon name="close" />
        </Link>
      </header>

      <header className="mb-8 hidden xl:block">
        <p className="font-label-caps text-[10px] tracking-widest text-teal-300">SAFE SPACE</p>
        <h1 className="font-headline-md text-2xl font-semibold text-on-surface">Support Mode</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-on-surface-variant">
          You can stop the dynamic at any time. Care Mode is not failure — it is control.
        </p>
      </header>

      <div className="mx-auto grid max-w-4xl gap-4">
        {/* Breathing hero — Stitch mobile */}
        <section className="relative flex h-[min(360px,50dvh)] items-center justify-center overflow-hidden rounded-3xl bg-surface-container-low">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="breathing-circle absolute h-64 w-64 rounded-full border-2 border-primary-fixed-dim/20" />
            <div
              className="breathing-circle absolute h-48 w-48 rounded-full border-2 border-primary-fixed-dim/40"
              style={{ animationDelay: '-2s' }}
            />
            <div
              className="breathing-circle absolute h-32 w-32 rounded-full border-2 border-primary-fixed-dim/60"
              style={{ animationDelay: '-4s' }}
            />
          </div>
          <div className="relative z-10 space-y-3 text-center">
            <h2 className="text-4xl font-bold text-primary">Breathe</h2>
            <p className="font-label-caps text-[11px] tracking-widest text-on-surface-variant">
              INHALE · HOLD · EXHALE
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Cool-down timer */}
          <section className="glass-card flex flex-col justify-between rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-[11px] text-on-surface-variant">
                Cool down
              </span>
              <Icon name="timer" className="text-primary-fixed-dim" />
            </div>
            <div className="py-6">
              <div className="text-5xl font-bold tracking-tight text-primary">
                {mm}:{ss}
              </div>
              <p className="mt-2 text-sm text-on-surface-variant">
                Pause before any hard decision.
              </p>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
              <div
                className="h-full rounded-full bg-primary-fixed-dim transition-all"
                style={{ width: `${(coolSeconds / (15 * 60)) * 100}%` }}
              />
            </div>
          </section>

          {/* Care mode CTA */}
          <section className="flex flex-col justify-between rounded-3xl bg-primary-fixed p-6 text-on-primary-fixed">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-[11px] font-bold">Care mode</span>
              <Icon name="shield_with_heart" filled />
            </div>
            <div className="py-6">
              <h3 className="text-xl font-semibold">Safeword: {safeword}</h3>
              <p className="mt-1 text-sm opacity-80">
                Type it in Companion. Training pauses. No judgment.
              </p>
            </div>
            <Link
              href="/chat"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-on-primary-fixed px-6 text-xs font-bold uppercase tracking-wide text-primary-fixed"
            >
              Open companion
            </Link>
          </section>
        </div>

        {/* Reason / manifesto */}
        <section className="glass-card rounded-3xl p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-highest">
              <Icon name="menu_book" className="text-primary-fixed-dim" />
            </div>
            <div>
              <h4 className="font-semibold">Your reason</h4>
              <p className="font-label-caps text-[10px] text-on-surface-variant">
                From your profile intent
              </p>
            </div>
          </div>
          <blockquote className="border-l-2 border-primary-fixed-dim/30 py-2 pl-4 text-base italic text-on-surface-variant">
            {profile?.session_intent ||
              profile?.master_preference ||
              'I am building a life where I control my impulses — not the other way around.'}
          </blockquote>
          <Link
            href="/settings"
            className="mt-4 inline-flex items-center gap-2 font-label-caps text-[11px] text-primary-fixed-dim"
          >
            Edit in settings <Icon name="north_east" className="text-sm" />
          </Link>
        </section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link href="/ritual" className="glass-card flex flex-col gap-3 rounded-3xl p-6">
            <Icon name="edit" className="text-primary-fixed-dim" />
            <h4 className="font-semibold">Quick ritual</h4>
            <p className="text-sm text-on-surface-variant">
              Dump the feeling into morning or evening pages.
            </p>
            <span className="mt-auto font-label-caps text-[11px] text-primary-fixed">
              Open ritual →
            </span>
          </Link>
          <Link href="/chat" className="glass-card flex flex-col gap-3 rounded-3xl p-6">
            <Icon name="psychology" className="text-primary-fixed-dim" />
            <h4 className="font-semibold">Talk to Master</h4>
            <p className="text-sm text-on-surface-variant">
              Care Mode available. Type {safeword} anytime.
            </p>
            <span className="mt-auto font-label-caps text-[11px] text-primary-fixed">
              Chat now →
            </span>
          </Link>
        </div>

        {/* Grounding */}
        <section className="glass-card relative overflow-hidden rounded-3xl p-6">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          <div className="relative z-10">
            <h5 className="text-xl font-semibold text-primary">Stay grounded.</h5>
            <p className="mt-1 text-sm text-on-surface-variant">
              This feeling is temporary. Your progress is permanent.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-on-surface-variant">
              <li>Breathe in 4 · hold 4 · out 6. Repeat three times.</li>
              <li>You own the offline keys. The app is software.</li>
              <li>Hard limits in Settings are never intentionally crossed.</li>
              <li>Real distress: contact local emergency services.</li>
            </ul>
          </div>
        </section>

        {/* Emergency release */}
        <section className="rounded-3xl border border-error/30 bg-error/5 p-6">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-error">
            <Icon name="warning" />
            Emergency release
          </h2>
          <p className="mb-4 text-sm text-on-surface-variant">
            Ends the active lock on the server immediately. Use when you need out — not as play.
          </p>
          {!session ? (
            <p className="text-sm text-on-surface-variant">No active session to release.</p>
          ) : !confirm ? (
            <button
              type="button"
              onClick={() => setConfirm(true)}
              className="min-h-12 rounded-full border border-error/50 px-6 text-xs font-bold text-error"
            >
              I need emergency release
            </button>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={releasing}
                onClick={() => void emergencyRelease()}
                className="min-h-12 rounded-full bg-error px-6 text-xs font-bold text-on-error disabled:opacity-50"
              >
                {releasing ? 'Releasing…' : 'Confirm release'}
              </button>
              <button
                type="button"
                onClick={() => setConfirm(false)}
                className="min-h-12 rounded-full border border-white/10 px-5 text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          )}
          {error && <p className="mt-3 text-sm text-error">{error}</p>}
          {message && <p className="mt-3 text-sm text-teal-300">{message}</p>}
        </section>
      </div>
    </div>
  )
}
