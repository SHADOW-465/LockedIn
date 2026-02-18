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
        pct < 50 ? 'bg-teal-primary' : pct < 80 ? 'bg-yellow-500' : 'bg-red-primary'

    return (
        <div
            className="hidden lg:flex flex-col gap-0.5 min-w-[110px]"
            title={`${usage.month.total.toLocaleString()} / ${usage.limit.toLocaleString()} tokens this month`}
        >
            <div className="flex justify-between items-center text-[10px] text-text-tertiary font-mono">
                <span>Tokens</span>
                <span>{pct}%</span>
            </div>
            <div className="w-full h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                    className={`h-full ${barColor} rounded-full transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <div className="text-[9px] text-text-tertiary font-mono text-right">
                {usage.month.total.toLocaleString()} / {(usage.limit / 1000).toFixed(0)}k
            </div>
        </div>
    )
}
