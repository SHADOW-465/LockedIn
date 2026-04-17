'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Mail, KeyRound, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

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
            setError('VALIDATION_FAILED: ALL PROTOCOLS MUST BE MET.')
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
            setSuccess(true)
            setTimeout(() => {
                router.replace('/onboarding')
            }, 1500)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-black relative overflow-hidden">
            {/* Scanlines / CRT Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-50 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
            </div>

            <div className="w-full max-w-md relative z-10">
                <Card variant="hero" className="p-8 border-t-4 border-t-[var(--color-accent)] bg-[#050505]">
                    {/* Success State */}
                    {success ? (
                        <div className="flex flex-col items-center gap-6 py-12 text-center">
                            <div className="w-16 h-16 bg-[var(--color-accent)] flex items-center justify-center">
                                <CheckCircle2 size={32} className="text-black" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-display font-bold uppercase tracking-tighter">Account Partitioned</h1>
                                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--color-text-secondary)] mt-2">
                                    Initializing Onboarding Protocol...
                                </p>
                            </div>
                            <div className="w-full h-1 bg-[#141414] relative overflow-hidden">
                                <div className="absolute inset-0 bg-[var(--color-accent)] w-1/2 animate-[shimmer_1s_infinite_linear]" />
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="space-y-6 mb-8 text-left">
                                <div className="inline-block px-3 py-1 bg-[var(--color-accent)] text-black text-[10px] font-bold tracking-[0.3em] uppercase">
                                    New Enlistment Protocol
                                </div>
                                <div>
                                    <h1 className="text-5xl font-display font-bold tracking-tighter uppercase leading-none">
                                        Locked<span className="text-[var(--color-accent)]">In</span>
                                    </h1>
                                    <p className="text-[var(--color-text-secondary)] font-mono text-xs mt-3 uppercase tracking-widest opacity-60">
                                        [ System Status: Awaiting Subject Data ]
                                    </p>
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="p-4 mb-6 bg-[var(--color-accent)]/10 border border-[var(--color-accent)] text-[var(--color-accent)] text-[10px] font-mono uppercase font-bold flex items-start gap-3">
                                    <AlertCircle size={14} className="mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Form */}
                            <form onSubmit={handleSignup} className="space-y-6">
                                <Input
                                    label="Authorized Email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter active ID"
                                    required
                                    className="bg-black"
                                />

                                <div className="relative">
                                    <Input
                                        label="Security Access Key"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Min 8 characters"
                                        required
                                        className="bg-black"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-[38px] text-[var(--color-text-muted)] hover:text-white transition-colors cursor-pointer"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>

                                <Input
                                    label="Confirm Access Key"
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repeat Access Key"
                                    required
                                    className="bg-black"
                                />

                                {/* Password Strength Checkers (Brutalized) */}
                                {password.length > 0 && (
                                    <div className="grid grid-cols-2 gap-2 bg-black p-3 border border-[#141414]">
                                        {[
                                            { label: '8+ CHARS', ok: passwordChecks.length },
                                            { label: 'UPPERCASE', ok: passwordChecks.uppercase },
                                            { label: 'NUMERIC', ok: passwordChecks.number },
                                            { label: 'KEY_MATCH', ok: passwordChecks.match },
                                        ].map((check) => (
                                            <div
                                                key={check.label}
                                                className={`text-[9px] font-bold tracking-widest flex items-center gap-2 ${check.ok ? 'text-white' : 'text-[#333]'}`}
                                            >
                                                <div className={`w-1.5 h-1.5 ${check.ok ? 'bg-[var(--color-accent)]' : 'bg-[#141414]'}`} />
                                                {check.label}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={loading || !allValid}
                                    className="w-full py-6 text-base"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Enlisting...
                                        </>
                                    ) : (
                                        'Commit to Submission'
                                    )}
                                </Button>
                            </form>

                            {/* Divider */}
                            <div className="flex items-center gap-4 my-8">
                                <div className="flex-1 h-px bg-[#141414]" />
                                <span className="text-[var(--color-text-subtle)] text-[10px] font-bold uppercase tracking-widest">OAuth</span>
                                <div className="flex-1 h-px bg-[#141414]" />
                            </div>

                            {/* Google OAuth */}
                            <Button
                                variant="secondary"
                                onClick={async () => {
                                    const { signInWithGoogle } = await import('@/lib/supabase/auth')
                                    await signInWithGoogle()
                                }}
                                className="w-full flex items-center justify-center gap-3 py-4 text-xs tracking-widest"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="currentColor" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor" />
                                </svg>
                                Authenticate via Agency (Google)
                            </Button>

                            <div className="mt-8 text-center bg-black/50 p-4 border border-[#141414]">
                                <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
                                    Already segmented?{' '}
                                    <Link href="/login" className="text-[var(--color-accent)] hover:underline">
                                        Resume Access
                                    </Link>
                                </p>
                            </div>

                            {/* Legal/Age Warning */}
                            <div className="mt-6 p-4 border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5">
                                <p className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-widest leading-loose text-center">
                                    <span className="text-[var(--color-accent)] font-bold">WARNING: 18+ ADULT CONTENT ONLY.</span><br />
                                    SUBJECT CONFIRMS LEGAL AGE AND ABSOLUTE CONSENT BY PROCEEDING.
                                </p>
                            </div>
                        </>
                    )}
                </Card>
            </div>
        </div>
    )
}

    )
}
