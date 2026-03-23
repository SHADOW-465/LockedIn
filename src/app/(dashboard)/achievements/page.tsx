'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TopBar } from '@/components/layout/top-bar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Trophy, Flame, Zap } from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
import { getSupabase } from '@/lib/supabase/client'
import type { Achievement } from '@/lib/supabase/schema'

export default function AchievementsPage() {
    const { user, profile } = useAuth()
    const [achievements, setAchievements] = useState<Achievement[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) return
        const supabase = getSupabase()
        supabase
            .from('achievements')
            .select('*')
            .eq('user_id', user.id)
            .order('awarded_at', { ascending: false })
            .then(({ data }: { data: Achievement[] | null }) => {
                setAchievements((data ?? []) as Achievement[])
                setLoading(false)
            })
    }, [user])

    const totalXp = achievements.reduce((sum, a) => sum + a.xp_awarded, 0)

    return (
        <>
            <TopBar />

            <div className="min-h-screen bg-black pb-24 lg:pb-8 p-4">
                <div className="max-w-2xl mx-auto space-y-6">
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <Trophy size={28} className="text-[var(--accent)]" />
                        Achievements
                    </h1>

                    {/* XP Summary */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <Zap size={20} className="mx-auto text-[var(--accent)] mb-1" />
                                <div className="text-2xl font-bold font-mono text-white">{totalXp}</div>
                                <div className="text-[10px] text-white/30 uppercase">Total XP</div>
                            </div>
                            <div>
                                <Trophy size={20} className="mx-auto text-[var(--accent)] mb-1" />
                                <div className="text-2xl font-bold font-mono text-white">{achievements.length}</div>
                                <div className="text-[10px] text-white/30 uppercase">Unlocked</div>
                            </div>
                            <div>
                                <Flame size={20} className="mx-auto text-[var(--accent)] mb-1" />
                                <div className="text-2xl font-bold font-mono text-white">{profile?.compliance_streak ?? 0}</div>
                                <div className="text-[10px] text-white/30 uppercase">Streak</div>
                            </div>
                        </div>
                    </div>

                    {/* Achievement List */}
                    {loading ? (
                        <div className="text-center py-8 text-white/30 text-sm">Loading...</div>
                    ) : achievements.length === 0 ? (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center py-12">
                            <Trophy size={40} className="mx-auto text-white/30 mb-3" />
                            <p className="text-white/30 text-sm mb-2">No achievements unlocked yet.</p>
                            <p className="text-[10px] text-white/30">Complete tasks and maintain streaks to earn badges.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {achievements.map((achievement, idx) => (
                                <div
                                    key={achievement.id}
                                    className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 animate-card-in"
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">{achievement.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-semibold text-white truncate">{achievement.name}</h4>
                                                <Badge variant="info" className="shrink-0">+{achievement.xp_awarded} XP</Badge>
                                            </div>
                                            {achievement.description && (
                                                <p className="text-xs text-white/30 mt-0.5">{achievement.description}</p>
                                            )}
                                            <span className="text-[10px] text-white/30">
                                                {new Date(achievement.awarded_at).toLocaleDateString('en-US', {
                                                    month: 'short', day: 'numeric', year: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <BottomNav />
        </>
    )
}
