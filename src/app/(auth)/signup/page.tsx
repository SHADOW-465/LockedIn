'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp, signInWithGoogle } from '@/lib/supabase/auth'
import { Icon } from '@/components/ui/icon'

/** Stitch-adjacent signup — commitment-adjacent chrome. */
export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [ageOk, setAgeOk] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ageOk) {
      setError('Confirm you are 18+ to continue.')
      return
    }
    setError('')
    setLoading(true)
    const { user, error: err } = await signUp(email, password)
    if (err) {
      setError(err)
      setLoading(false)
      return
    }
    if (user) router.replace('/onboarding')
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-12 text-on-surface">
      <div className="pointer-events-none absolute -right-24 top-1/4 h-72 w-72 rounded-full bg-primary-fixed/5 blur-[100px]" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-surface/80 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-fixed">
            <Icon name="lock" filled className="text-2xl text-on-primary-fixed" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Begin commitment</h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Create an account. Onboarding calibrates your Master.
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-xl border border-error/30 bg-error/10 p-3 text-sm text-error">
            {error}
          </p>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="font-label-caps text-[11px] text-on-surface-variant">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-surface-container-lowest px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-fixed"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="font-label-caps text-[11px] text-on-surface-variant">
              Password (min 6)
            </span>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-surface-container-lowest px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-fixed"
            />
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={ageOk}
              onChange={(e) => setAgeOk(e.target.checked)}
              className="mt-1 accent-primary-fixed"
            />
            <span className="text-on-surface-variant">
              I confirm I am 18 years or older and consent to adult training content.
            </span>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-12 rounded-full bg-primary-fixed text-sm font-bold text-on-primary-fixed transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => signInWithGoogle()}
          className="mt-4 w-full min-h-12 rounded-full border border-white/10 text-sm font-medium hover:bg-white/5"
        >
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-on-surface-variant">
          Already locked in?{' '}
          <Link href="/login" className="font-semibold text-primary-fixed hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
