'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'
import { getSupabase } from '@/lib/supabase/client'
import { ACHIEVEMENT_CATALOG } from '@/lib/achievements-catalog'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

type Unlocked = { achievement_id: string; name?: string; awarded_at: string; xp_awarded?: number }

/**
 * Insights / achievements grid — catalog + unlocked rows from DB.
 */
export default function AchievementsPage() {
  const { user, profile } = useAuth()
  const [unlocked, setUnlocked] = useState<Unlocked[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    void (async () => {
      const { data } = await getSupabase()
        .from('achievements')
        .select('achievement_id, name, awarded_at, xp_awarded')
        .eq('user_id', user.id)
        .order('awarded_at', { ascending: false })
      setUnlocked((data as Unlocked[] | null) || [])
      setLoading(false)
    })()
  }, [user?.id])

  const unlockedNames = new Set(
    unlocked.map((u) => (u.name || u.achievement_id || '').toLowerCase()),
  )

  const unlockedCount = ACHIEVEMENT_CATALOG.filter((a) =>
    unlockedNames.has(a.name.toLowerCase()),
  ).length

  return (
    <div className="px-6 py-6 xl:px-8 xl:py-8">
      <header className="mb-6">
        <p className="font-label-caps text-[10px] tracking-widest text-primary-fixed">INSIGHTS</p>
        <h1 className="font-headline-md text-2xl font-semibold">Achievements</h1>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total XP" value={String(profile?.xp_total ?? 0)} />
        <Stat label="Unlocked" value={`${unlockedCount}/${ACHIEVEMENT_CATALOG.length}`} />
        <Stat label="Streak" value={`${profile?.compliance_streak ?? 0}d`} />
        <Stat label="Willpower" value={String(profile?.willpower_score ?? 0)} />
      </div>

      {loading ? (
        <p className="text-sm text-on-surface-variant">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ACHIEVEMENT_CATALOG.map((a) => {
            const got = unlockedNames.has(a.name.toLowerCase())
            return (
              <div
                key={a.id}
                className={cn(
                  'bento-card rounded-2xl p-5',
                  !got && 'opacity-45',
                )}
              >
                <div className="mb-3 flex items-start justify-between">
                  <Icon
                    name={a.icon}
                    filled={got}
                    className={got ? 'text-primary-fixed' : 'text-on-surface-variant'}
                  />
                  {got && (
                    <span className="font-label-caps text-[10px] text-primary-fixed">UNLOCKED</span>
                  )}
                </div>
                <h3 className="font-semibold text-on-surface">{a.name}</h3>
                <p className="mt-1 text-sm text-on-surface-variant">{a.description}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bento-card rounded-xl p-4">
      <p className="font-label-caps text-[10px] text-on-surface-variant">{label}</p>
      <p className="mt-1 text-xl font-bold text-on-surface">{value}</p>
    </div>
  )
}
