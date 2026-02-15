'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signInWithGoogle } from '@/lib/supabase/auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { user, error: authError } = await signIn(email, password)

        if (authError) {
            setError(authError)
            setLoading(false)
            return
        }

        if (user) {
            // Check if user has completed onboarding
            const { getSupabase } = await import('@/lib/supabase/client')
            const supabase = getSupabase()
            const { data: profile } = await supabase
                .from('profiles')
                .select('onboarding_completed')
                .eq('id', user.id)
                .single()

            if (profile?.onboarding_completed) {
                router.push('/home')
            } else {
                router.push('/onboarding/welcome')
            }
        }
    }

    const handleGoogleSignIn = async () => {
        setLoading(true)
        setError(null)
        const { error: authError } = await signInWithGoogle()
        if (authError) {
            setError(authError)
            setLoading(false)
        }
        // Google OAuth redirects — no need to handle navigation here
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-bg-primary relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-primary/5 rounded-full blur-[100px] pointer-events-none" />

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
                        <p className="text-text-secondary mt-2">Sign in to continue your training</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            id="login-email"
                            type="email"
                            label="Email"
                            placeholder="slave@lockedin.app"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <Input
                            id="login-password"
                            type="password"
                            label="Password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

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
                            disabled={loading}
                        >
                            {loading ? 'Authenticating...' : 'Sign In'}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-xs text-text-tertiary uppercase tracking-wide">or</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Google Sign In */}
                    <button
                        onClick={handleGoogleSignIn}
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
                        No account?{' '}
                        <Link href="/signup" className="text-purple-primary hover:text-purple-hover transition-colors cursor-pointer">
                            Submit yourself
                        </Link>
                    </p>
                </Card>
            </div>
        </div>
    )
}
