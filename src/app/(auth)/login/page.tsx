'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Mail, KeyRound, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { signIn } from '@/lib/supabase/auth'

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

        const { user, error } = await signIn(email, password)

        if (error) {
            setError(error)
            setLoading(false)
            return
        }

        if (user) {
            router.replace('/home')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-bg-primary relative overflow-hidden">
            {/* Ambient effects */}
            <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-red-primary/5 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-purple-primary/5 rounded-full blur-[150px] pointer-events-none" />

            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
                style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.04) 2px, rgba(255,255,255,0.04) 4px)',
                }}
            />

            <div className="w-full max-w-md space-y-8 relative z-10">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="w-16 h-16 rounded-full bg-bg-secondary shadow-raised flex items-center justify-center border border-white/5">
                            <Lock size={28} className="text-red-primary" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold font-mono">
                            Locked<span className="text-red-primary text-glow-red">In</span>
                        </h1>
                        <p className="text-text-tertiary text-sm mt-1">Welcome back. Your Master awaits.</p>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="flex items-center gap-2 p-3 rounded-[var(--radius-lg)] bg-red-primary/10 border border-red-primary/20 text-red-primary text-sm">
                        <AlertCircle size={16} className="flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">Email</label>
                        <div className="relative">
                            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                required
                                className="w-full pl-10 pr-4 py-3 rounded-[var(--radius-lg)] bg-bg-secondary border border-white/5 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-red-primary/40 focus:shadow-[0_0_0_3px_rgba(211,47,47,0.1)] transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">Password</label>
                        <div className="relative">
                            <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full pl-10 pr-12 py-3 rounded-[var(--radius-lg)] bg-bg-secondary border border-white/5 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-red-primary/40 focus:shadow-[0_0_0_3px_rgba(211,47,47,0.1)] transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-secondary transition-colors cursor-pointer"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-[var(--radius-pill)] bg-red-primary text-white font-semibold uppercase tracking-wide shadow-raised glow-red hover:bg-red-hover hover:shadow-raised-hover active:shadow-inset transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Authenticating...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/5" />
                    <span className="text-text-disabled text-xs uppercase tracking-wider">or</span>
                    <div className="flex-1 h-px bg-white/5" />
                </div>

                {/* Google OAuth */}
                <button
                    onClick={async () => {
                        const { signInWithGoogle } = await import('@/lib/supabase/auth')
                        await signInWithGoogle()
                    }}
                    className="w-full py-3 rounded-[var(--radius-pill)] bg-bg-secondary border border-white/5 text-text-secondary font-medium hover:bg-bg-tertiary hover:border-white/10 transition-all duration-200 cursor-pointer flex items-center justify-center gap-3"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                </button>

                {/* Footer */}
                <p className="text-center text-sm text-text-tertiary">
                    New slave?{' '}
                    <Link href="/signup" className="text-red-primary font-medium hover:text-red-hover transition-colors">
                        Create Account
                    </Link>
                </p>
            </div>
        </div>
    )
}
