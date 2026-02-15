import { getSupabase } from '@/lib/supabase/client'

/**
 * XP awarded per task difficulty level.
 */
const XP_PER_DIFFICULTY: Record<number, number> = {
    1: 5,
    2: 10,
    3: 15,
    4: 25,
    5: 40,
}

/**
 * Streak milestone bonuses.
 */
const STREAK_BONUSES: { days: number; xp: number; achievementName: string }[] = [
    { days: 3, xp: 10, achievementName: '3-Day Streak' },
    { days: 7, xp: 25, achievementName: 'One Week Warrior' },
    { days: 14, xp: 50, achievementName: 'Two Week Champion' },
    { days: 30, xp: 100, achievementName: 'Monthly Master' },
    { days: 60, xp: 200, achievementName: 'Unbreakable' },
    { days: 100, xp: 500, achievementName: 'Century of Obedience' },
]

/**
 * Achievement definitions with unlock conditions.
 */
const ACHIEVEMENT_DEFS: { name: string; description: string; icon: string; check: (stats: UserStats) => boolean }[] = [
    { name: 'First Task', description: 'Completed your first task', icon: '🎯', check: (s) => s.tasksCompleted >= 1 },
    { name: '10 Tasks', description: 'Completed 10 tasks', icon: '⚡', check: (s) => s.tasksCompleted >= 10 },
    { name: '50 Tasks', description: 'Completed 50 tasks', icon: '🔥', check: (s) => s.tasksCompleted >= 50 },
    { name: '100 Tasks', description: 'Completed 100 tasks', icon: '💀', check: (s) => s.tasksCompleted >= 100 },
    { name: 'Willpower 80+', description: 'Reached 80+ willpower', icon: '💪', check: (s) => s.willpower >= 80 },
    { name: 'Willpower 100', description: 'Max willpower achieved', icon: '👑', check: (s) => s.willpower >= 100 },
    { name: '24h Denial', description: '24+ hours of denial', icon: '⏰', check: (s) => s.denialHours >= 24 },
    { name: '168h Denial', description: 'One full week of denial', icon: '🗓️', check: (s) => s.denialHours >= 168 },
    { name: '5 Sessions', description: 'Completed 5 sessions', icon: '🔒', check: (s) => s.totalSessions >= 5 },
]

interface UserStats {
    tasksCompleted: number
    willpower: number
    denialHours: number
    totalSessions: number
    streak: number
}

/**
 * Award XP for completing a task based on its difficulty.
 */
export async function awardCompletion(userId: string, difficulty: number): Promise<number> {
    const xp = XP_PER_DIFFICULTY[difficulty] ?? 5
    const supabase = getSupabase()

    await supabase.rpc('award_xp', {
        p_user_id: userId,
        p_amount: xp,
        p_reason: `Task completed (difficulty ${difficulty})`,
    })

    // Notify
    await supabase.from('notifications').insert({
        user_id: userId,
        type: 'reward',
        title: `✨ +${xp} XP Earned`,
        body: `Task completed! Difficulty ${difficulty}/5`,
    })

    return xp
}

/**
 * Check and award streak milestone achievements.
 */
export async function awardStreak(userId: string, currentStreak: number): Promise<string[]> {
    const supabase = getSupabase()
    const awarded: string[] = []

    for (const milestone of STREAK_BONUSES) {
        if (currentStreak >= milestone.days) {
            // Check if already awarded
            const { data: existing } = await supabase
                .from('achievements')
                .select('id')
                .eq('user_id', userId)
                .eq('name', milestone.achievementName)
                .maybeSingle()

            if (!existing) {
                await supabase.from('achievements').insert({
                    user_id: userId,
                    name: milestone.achievementName,
                    description: `${milestone.days}-day compliance streak`,
                    icon: '🔥',
                    xp_awarded: milestone.xp,
                })

                await supabase.rpc('award_xp', {
                    p_user_id: userId,
                    p_amount: milestone.xp,
                    p_reason: `Streak milestone: ${milestone.achievementName}`,
                })

                await supabase.from('notifications').insert({
                    user_id: userId,
                    type: 'reward',
                    title: `🏆 Achievement: ${milestone.achievementName}`,
                    body: `+${milestone.xp} XP for ${milestone.days}-day streak!`,
                })

                awarded.push(milestone.achievementName)
            }
        }
    }

    return awarded
}

/**
 * Scan user stats and unlock any earned achievements.
 */
export async function checkAchievements(userId: string): Promise<string[]> {
    const supabase = getSupabase()

    // Gather stats
    const { data: profile } = await supabase
        .from('profiles')
        .select('willpower_score, total_sessions, total_denial_hours, compliance_streak')
        .eq('id', userId)
        .single()

    const { count: tasksCompleted } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed')

    const stats: UserStats = {
        tasksCompleted: tasksCompleted ?? 0,
        willpower: profile?.willpower_score ?? 0,
        denialHours: profile?.total_denial_hours ?? 0,
        totalSessions: profile?.total_sessions ?? 0,
        streak: profile?.compliance_streak ?? 0,
    }

    // Check existing achievements
    const { data: existing } = await supabase
        .from('achievements')
        .select('name')
        .eq('user_id', userId)

    const existingNames = new Set((existing ?? []).map((a: { name: string }) => a.name))
    const awarded: string[] = []

    for (const def of ACHIEVEMENT_DEFS) {
        if (!existingNames.has(def.name) && def.check(stats)) {
            await supabase.from('achievements').insert({
                user_id: userId,
                name: def.name,
                description: def.description,
                icon: def.icon,
                xp_awarded: 10,
            })

            await supabase.from('notifications').insert({
                user_id: userId,
                type: 'reward',
                title: `${def.icon} Achievement: ${def.name}`,
                body: def.description,
            })

            awarded.push(def.name)
        }
    }

    return awarded
}
