'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signUp, signInWithGoogle } from '@/lib/supabase/auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function SignupPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [ageConfirmed, setAgeConfirmed] = useState(false)
    const [termsAccepted, setTermsAccepted] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            setLoading(false)
            return
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            setLoading(false)
            return
        }

        if (!ageConfirmed || !termsAccepted) {
            setError('You must confirm your age and accept terms')
            setLoading(false)
            return
        }

        const { user, error: authError } = await signUp(email, password)

        if (authError) {
            setError(authError)
            setLoading(false)
            return
        }

        if (user) {
            // Success
            // If email confirmation is off or not required, user is logged in.
            // RouteGuard will handle redirect to onboarding.
            // We can push to /onboarding/welcome directly to be helpful.
            router.refresh()
            router.push('/onboarding/welcome')
            // Don't set loading false immediately to prevent form flash
        } else {
            // User created but needs email confirmation (if configured)
            // But signUp function returns user if session is established?
            // Usually returns user with null session if confirmation needed.
            // My auth.ts wrapper returns user if data.user is present.
            // If session is null, AuthContext won't see user.
            setError('Account created. Please check your email to confirm, then sign in.')
            setLoading(false)
        }
    }

    const handleGoogleSignUp = async () => {
        setLoading(true)
        setError(null)
        const { error: authError } = await signInWithGoogle()
        if (authError) {
            setError(authError)
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-bg-primary relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-red-primary/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md animate-fade-in-up">
                {/* Back button */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-8 cursor-pointer"
                >
                    <ArrowLeft size={16} />
                    Back
                </Link>

                <Card variant="hero" className="space-y-6">
                    {/* Header */}
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="w-14 h-14 rounded-full bg-bg-tertiary shadow-inset flex items-center justify-center">
                                <Lock size={24} className="text-red-primary animate-lock-glow" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold font-mono">
                            Locked<span className="text-red-primary">In</span>
                        </h1>
                        <p className="text-text-secondary mt-2">Create your account. Surrender control.</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            id="signup-email"
                            type="email"
                            label="Email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <Input
                            id="signup-password"
                            type="password"
                            label="Password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <Input
                            id="signup-confirm-password"
                            type="password"
                            label="Confirm Password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />

                        {/* Checkboxes */}
                        <div className="space-y-3 pt-2">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={ageConfirmed}
                                    onChange={(e) => setAgeConfirmed(e.target.checked)}
                                    className="w-5 h-5 rounded mt-0.5 accent-red-primary"
                                />
                                <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                                    I am 18+ years old and consent to explicit adult content
                                </span>
                            </label>
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={termsAccepted}
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                    className="w-5 h-5 rounded mt-0.5 accent-red-primary"
                                />
                                <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                                    I accept all Terms & Conditions, including AI-driven psychological conditioning
                                </span>
                            </label>
                        </div>

                        {error && (
                            <div className="bg-red-primary/10 border border-red-primary/30 rounded-[var(--radius-md)] p-3">
                                <p className="text-sm text-red-primary">{error}</p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            className="w-full"
                            disabled={loading || !ageConfirmed || !termsAccepted}
                        >
                            {loading ? 'Creating Account...' : 'Submit Yourself'}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-xs text-text-tertiary uppercase tracking-wide">or</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Google Sign Up */}
                    <button
                        onClick={handleGoogleSignUp}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 py-3 px-6 rounded-[var(--radius-pill)] bg-bg-secondary shadow-raised hover:shadow-raised-hover active:shadow-inset border border-white/5 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        <span className="text-sm font-semibold text-text-primary">Continue with Google</span>
                    </button>

                    {/* Footer */}
                    <p className="text-center text-sm text-text-tertiary">
                        Already locked?{' '}
                        <Link href="/login" className="text-purple-primary hover:text-purple-hover transition-colors cursor-pointer">
                            Sign in
                        </Link>
                    </p>
                </Card>
            </div>
        </div>
    )
}
