'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'

interface UsageData {
    today: { prompt: number; completion: number; total: number }
    month: { total: number }
    limit: number
    remaining: number
}

export function UsageMeter() {
    const { user } = useAuth()
    const [usage, setUsage] = useState<UsageData | null>(null)

    const fetchUsage = useCallback(async () => {
        if (!user) return
        try {
            const res = await fetch(`/api/usage?userId=${user.id}`)
            if (res.ok) setUsage(await res.json())
        } catch {
            // Silent fail — meter is non-critical
        }
    }, [user])

    useEffect(() => {
        fetchUsage()
        const interval = setInterval(fetchUsage, 60_000)
        return () => clearInterval(interval)
    }, [fetchUsage])

    if (!usage) return null

    const pct = Math.min(100, Math.round((usage.month.total / usage.limit) * 100))
    const barColor =
        pct < 50 ? 'bg-white' : pct < 80 ? 'bg-white/40' : 'bg-[var(--color-accent)]'

    return (
        <div
            className="hidden lg:flex flex-col gap-1 min-w-[120px] p-2 border border-[#141414] bg-black"
            title={`${usage.month.total.toLocaleString()} / ${usage.limit.toLocaleString()} tokens this month`}
        >
            <div className="flex justify-between items-center text-[8px] text-[var(--color-text-secondary)] font-mono font-bold uppercase tracking-widest">
                <span>SIGNAL_LOAD</span>
                <span className={pct > 80 ? 'text-[var(--color-accent)]' : ''}>{pct}%</span>
            </div>
            <div className="w-full h-1 bg-[#141414] overflow-hidden">
                <div
                    className={`h-full ${barColor} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <div className="text-[7px] text-[#444] font-mono font-bold text-right uppercase tracking-tighter">
                VOL: {usage.month.total.toLocaleString()} / {(usage.limit / 1000).toFixed(0)}K
            </div>
        </div>
    )
}
