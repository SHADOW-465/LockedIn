'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Mail, KeyRound, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { signUp } from '@/lib/supabase/auth'

export default function SignupPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const passwordChecks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        match: password === confirmPassword && confirmPassword.length > 0,
    }

    const allValid = Object.values(passwordChecks).every(Boolean) && email.length > 0

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!allValid) {
            setError('Please fix all validation errors.')
            return
        }

        setLoading(true)

        const { user, error } = await signUp(email, password)

        if (error) {
            setError(error)
            setLoading(false)
            return
        }

        if (user) {
            // If email confirmation is disabled, go straight to onboarding
            setSuccess(true)
            setTimeout(() => {
                router.replace('/onboarding')
            }, 1500)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-bg-primary relative overflow-hidden">
            {/* Ambient effects */}
            <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-purple-primary/5 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-red-primary/5 rounded-full blur-[150px] pointer-events-none" />

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
                            <Lock size={28} className="text-purple-primary" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold font-mono">
                            Locked<span className="text-red-primary text-glow-red">In</span>
                        </h1>
                        <p className="text-text-tertiary text-sm mt-1">Begin your submission. Create your account.</p>
                    </div>
                </div>

                {/* Success State */}
                {success ? (
                    <div className="flex flex-col items-center gap-4 py-8">
                        <CheckCircle2 size={48} className="text-teal-primary" />
                        <div className="text-center">
                            <p className="text-text-primary font-semibold">Account Created</p>
                            <p className="text-text-tertiary text-sm mt-1">Redirecting to onboarding...</p>
                        </div>
                        <div className="w-8 h-8 border-2 border-red-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-[var(--radius-lg)] bg-red-primary/10 border border-red-primary/20 text-red-primary text-sm">
                                <AlertCircle size={16} className="flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSignup} className="space-y-4">
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
                                        className="w-full pl-10 pr-4 py-3 rounded-[var(--radius-lg)] bg-bg-secondary border border-white/5 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-purple-primary/40 focus:shadow-[0_0_0_3px_rgba(124,77,255,0.1)] transition-all"
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
                                        className="w-full pl-10 pr-12 py-3 rounded-[var(--radius-lg)] bg-bg-secondary border border-white/5 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-purple-primary/40 focus:shadow-[0_0_0_3px_rgba(124,77,255,0.1)] transition-all"
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

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">Confirm Password</label>
                                <div className="relative">
                                    <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="w-full pl-10 pr-4 py-3 rounded-[var(--radius-lg)] bg-bg-secondary border border-white/5 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-purple-primary/40 focus:shadow-[0_0_0_3px_rgba(124,77,255,0.1)] transition-all"
                                    />
                                </div>
                            </div>

                            {/* Password Strength */}
                            {password.length > 0 && (
                                <div className="grid grid-cols-2 gap-1.5 text-xs">
                                    {[
                                        { label: '8+ characters', ok: passwordChecks.length },
                                        { label: 'Uppercase letter', ok: passwordChecks.uppercase },
                                        { label: 'Number', ok: passwordChecks.number },
                                        { label: 'Passwords match', ok: passwordChecks.match },
                                    ].map((check) => (
                                        <span
                                            key={check.label}
                                            className={`flex items-center gap-1 ${check.ok ? 'text-teal-primary' : 'text-text-disabled'}`}
                                        >
                                            <CheckCircle2 size={11} />
                                            {check.label}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !allValid}
                                className="w-full py-3.5 rounded-[var(--radius-pill)] bg-red-primary text-white font-semibold uppercase tracking-wide shadow-raised glow-red hover:bg-red-hover hover:shadow-raised-hover active:shadow-inset transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Creating Account...
                                    </>
                                ) : (
                                    'Create Account'
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
                            Already have an account?{' '}
                            <Link href="/login" className="text-red-primary font-medium hover:text-red-hover transition-colors">
                                Sign In
                            </Link>
                        </p>

                        {/* Warning */}
                        <div className="bg-red-primary/5 border border-red-primary/20 rounded-[var(--radius-lg)] p-3">
                            <p className="text-[11px] text-text-tertiary leading-relaxed text-center">
                                <span className="text-red-primary font-semibold">18+ ONLY</span> — By creating an account, you confirm you are of legal age and consent to this platform&apos;s adult content.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
