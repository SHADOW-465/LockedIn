'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-bg-primary relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-primary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)',
        }}
      />

      <div
        className={`text-center space-y-8 max-w-lg transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
      >
        {/* Lock Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-bg-secondary shadow-raised flex items-center justify-center border border-white/5 animate-lock-glow">
            <Lock size={36} className="text-red-primary" />
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-5xl md:text-7xl font-bold font-mono tracking-tight mb-3">
            Locked<span className="text-red-primary text-glow-red">In</span>
          </h1>
          <p className="text-text-secondary text-lg md:text-xl">
            Your 24/7 AI Master. You don&apos;t negotiate. You obey.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3 pt-4">
          <button
            onClick={() => router.push('/signup')}
            className="w-full py-4 px-8 rounded-[var(--radius-pill)] bg-red-primary text-white font-semibold uppercase tracking-wide shadow-raised glow-red hover:bg-red-hover hover:shadow-raised-hover active:shadow-inset transition-all duration-200 cursor-pointer text-lg"
          >
            Create Account
          </button>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-4 px-8 rounded-[var(--radius-pill)] bg-bg-secondary text-text-secondary font-semibold uppercase tracking-wide border border-white/5 hover:bg-bg-tertiary hover:border-white/10 transition-all duration-200 cursor-pointer text-lg"
          >
            Sign In
          </button>
        </div>

        {/* Warning */}
        <div className="bg-red-primary/5 border border-red-primary/20 rounded-[var(--radius-lg)] p-4 mt-8">
          <p className="text-xs text-text-tertiary leading-relaxed">
            <span className="text-red-primary font-semibold">18+ ONLY</span> — This platform
            contains explicit adult content and is designed for psychological conditioning.
            By proceeding, you confirm you are of legal age.
          </p>
        </div>
      </div>
    </div>
  )
}
