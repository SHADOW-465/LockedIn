import type { SupabaseClient } from '@supabase/supabase-js'

// ── XP per difficulty tier ────────────────────────────────────
const XP_PER_DIFFICULTY: Record<number, number> = {
    1: 5,
    2: 10,
    3: 20,
    4: 40,
    5: 80,
}

// ── Achievement definitions ──────────────────────────────────
interface AchievementDef {
    name: string
    description: string
    check: (stats: UserStats) => boolean
}

interface UserStats {
    totalCompleted: number
    totalXp: number
    complianceStreak: number
    totalDenialHours: number
    totalEdges: number
}

const ACHIEVEMENT_DEFS: AchievementDef[] = [
    {
        name: 'First Task',
        description: 'Complete your very first task',
        check: (s) => s.totalCompleted >= 1,
    },
    {
        name: 'Obedient Slave',
        description: 'Complete 10 tasks',
        check: (s) => s.totalCompleted >= 10,
    },
    {
        name: 'Task Machine',
        description: 'Complete 50 tasks',
        check: (s) => s.totalCompleted >= 50,
    },
    {
        name: 'Century Club',
        description: 'Complete 100 tasks',
        check: (s) => s.totalCompleted >= 100,
    },
    {
        name: 'Streak Starter',
        description: 'Maintain a 3-day compliance streak',
        check: (s) => s.complianceStreak >= 3,
    },
    {
        name: 'Week Warrior',
        description: 'Maintain a 7-day compliance streak',
        check: (s) => s.complianceStreak >= 7,
    },
    {
        name: 'Iron Will',
        description: 'Maintain a 30-day compliance streak',
        check: (s) => s.complianceStreak >= 30,
    },
    {
        name: 'XP Apprentice',
        description: 'Earn 100 XP total',
        check: (s) => s.totalXp >= 100,
    },
    {
        name: 'XP Master',
        description: 'Earn 1000 XP total',
        check: (s) => s.totalXp >= 1000,
    },
    {
        name: 'Denial Expert',
        description: 'Accumulate 168 hours of denial',
        check: (s) => s.totalDenialHours >= 168,
    },
    {
        name: 'Edge Lord',
        description: 'Complete 100 edges',
        check: (s) => s.totalEdges >= 100,
    },
]

/**
 * Award XP for a completed task and notify the user.
 * @param supabase - Server Supabase client
 */
export async function awardCompletion(
    supabase: SupabaseClient,
    userId: string,
    difficulty: number,
): Promise<number> {
    const xp = XP_PER_DIFFICULTY[difficulty] ?? 5

    try {
        // Try RPC for atomic XP update
        const { error: rpcError } = await supabase.rpc('award_xp', {
            p_user_id: userId,
            p_amount: xp,
            p_reason: `Task completed (difficulty ${difficulty})`,
        })

        if (rpcError) {
            // Fallback: direct update
            const { data: profile } = await supabase
                .from('profiles')
                .select('xp_total')
                .eq('id', userId)
                .single()

            const currentXp = profile?.xp_total ?? 0
            await supabase
                .from('profiles')
                .update({ xp_total: currentXp + xp })
                .eq('id', userId)
        }

        // Create notification
        await supabase.from('notifications').insert({
            user_id: userId,
            type: 'reward',
            title: `✨ XP Earned`,
            message: `+${xp} XP for completing a difficulty ${difficulty} task!`,
            read: false,
        })

        return xp
    } catch (error) {
        console.error('[Rewards] Failed to award XP:', error)
        return 0
    }
}

/**
 * Check and award streak-based milestones.
 * @param supabase - Server Supabase client
 */
export async function awardStreak(
    supabase: SupabaseClient,
    userId: string,
    currentStreak: number,
): Promise<string[]> {
    const awarded: string[] = []

    try {
        // Get existing achievements
        const { data: existing } = await supabase
            .from('achievements')
            .select('name')
            .eq('user_id', userId)

        const existingNames = new Set((existing || []).map(a => a.name))

        // Check streak achievements
        const streakAchievements = ACHIEVEMENT_DEFS.filter(
            d => d.name.includes('Streak') || d.name.includes('Week') || d.name === 'Iron Will'
        )

        for (const def of streakAchievements) {
            const stats: UserStats = {
                totalCompleted: 0,
                totalXp: 0,
                complianceStreak: currentStreak,
                totalDenialHours: 0,
                totalEdges: 0,
            }

            if (!existingNames.has(def.name) && def.check(stats)) {
                await supabase.from('achievements').insert({
                    user_id: userId,
                    name: def.name,
                    description: def.description,
                    unlocked_at: new Date().toISOString(),
                })

                await supabase.from('notifications').insert({
                    user_id: userId,
                    type: 'achievement',
                    title: `🏆 Achievement Unlocked!`,
                    message: `${def.name}: ${def.description}`,
                    read: false,
                })

                awarded.push(def.name)
            }
        }
    } catch (error) {
        console.error('[Rewards] Failed to check streak achievements:', error)
    }

    return awarded
}

/**
 * Check all achievement conditions against the user's stats.
 * @param supabase - Server Supabase client
 */
export async function checkAchievements(
    supabase: SupabaseClient,
    userId: string,
): Promise<string[]> {
    const awarded: string[] = []

    try {
        // Get user stats
        const { data: profile } = await supabase
            .from('profiles')
            .select('xp_total, compliance_streak, total_denial_hours, total_edges')
            .eq('id', userId)
            .single()

        // Count completed tasks
        const { count: taskCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'completed')

        // Get existing achievements
        const { data: existing } = await supabase
            .from('achievements')
            .select('name')
            .eq('user_id', userId)

        const existingNames = new Set((existing || []).map(a => a.name))

        const stats: UserStats = {
            totalCompleted: taskCount || 0,
            totalXp: profile?.xp_total ?? 0,
            complianceStreak: profile?.compliance_streak ?? 0,
            totalDenialHours: profile?.total_denial_hours ?? 0,
            totalEdges: profile?.total_edges ?? 0,
        }

        for (const def of ACHIEVEMENT_DEFS) {
            if (!existingNames.has(def.name) && def.check(stats)) {
                await supabase.from('achievements').insert({
                    user_id: userId,
                    name: def.name,
                    description: def.description,
                    unlocked_at: new Date().toISOString(),
                })

                await supabase.from('notifications').insert({
                    user_id: userId,
                    type: 'achievement',
                    title: `🏆 Achievement Unlocked!`,
                    message: `${def.name}: ${def.description}`,
                    read: false,
                })

                awarded.push(def.name)
            }
        }
    } catch (error) {
        console.error('[Rewards] Failed to check achievements:', error)
    }

    return awarded
}
