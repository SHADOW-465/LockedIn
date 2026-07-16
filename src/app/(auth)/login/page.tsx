'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn, signInWithGoogle } from '@/lib/supabase/auth'
import { Icon } from '@/components/ui/icon'

/** Stitch-adjacent auth — olive surface + lime CTA (welcome splash DNA). */
export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { user, error: err } = await signIn(email, password)
    if (err) {
      setError(err)
      setLoading(false)
      return
    }
    if (user) router.replace('/home')
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-12 text-on-surface">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-primary-fixed/5 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-primary-fixed/5 blur-[100px]" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-surface/80 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-fixed">
            <Icon name="shield_with_heart" filled className="text-2xl text-on-primary-fixed" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">LOCKEDIN</h1>
          <p className="mt-1 font-label-caps text-[10px] tracking-[0.2em] text-primary-fixed">
            DISCIPLINE. IDENTITY. FREEDOM.
          </p>
          <p className="mt-4 text-sm text-on-surface-variant">Welcome back. Sign in to continue.</p>
        </div>

        {error && (
          <p className="mb-4 rounded-xl border border-error/30 bg-error/10 p-3 text-sm text-error">
            {error}
          </p>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="font-label-caps text-[11px] text-on-surface-variant">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-surface-container-lowest px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-fixed"
              placeholder="you@example.com"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="font-label-caps text-[11px] text-on-surface-variant">Password</span>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-surface-container-lowest px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-primary-fixed"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <Icon name={showPassword ? 'visibility_off' : 'visibility'} className="text-xl" />
              </button>
            </div>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-12 rounded-full bg-primary-fixed text-sm font-bold text-on-primary-fixed transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <button
          type="button"
          onClick={() => signInWithGoogle()}
          className="w-full min-h-12 rounded-full border border-white/10 text-sm font-medium transition hover:bg-white/5"
        >
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-on-surface-variant">
          No account?{' '}
          <Link href="/signup" className="font-semibold text-primary-fixed underline-offset-4 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  )
}
