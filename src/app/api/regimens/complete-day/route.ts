import { NextRequest, NextResponse } from 'next/server'
import { generateSimpleText, trackUsage } from '@/lib/ai/ai-service'
import { getServerSupabase } from '@/lib/supabase/server'

// Minimum completed tasks required per day to advance regimen, by tier
const TIER_TASK_THRESHOLDS: Record<string, number> = {
    Newbie: 2,
    Slave: 3,
    Hardcore: 4,
    Extreme: 5,
    'Total Destruction': 5,
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { regimenId, userId, currentDay } = body as {
            regimenId: string
            userId: string
            currentDay: number
        }

        if (!regimenId || !userId) {
            return NextResponse.json({ error: 'regimenId and userId are required' }, { status: 400 })
        }

        const supabase = getServerSupabase()

        // Fetch regimen and verify ownership
        const { data: regimen, error: regimenError } = await supabase
            .from('regimens')
            .select('*')
            .eq('id', regimenId)
            .single()

        if (regimenError || !regimen) {
            return NextResponse.json({ error: 'Regimen not found' }, { status: 404 })
        }

        if (regimen.user_id !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        // Get user tier for threshold calculation
        const { data: profile } = await supabase
            .from('profiles')
            .select('tier')
            .eq('id', userId)
            .single()

        const tier = profile?.tier || 'Newbie'
        const requiredCompletions = TIER_TASK_THRESHOLDS[tier] ?? 2

        // Count today's completed tasks
        const today = new Date().toISOString().split('T')[0]
        const { data: dailyLog } = await supabase
            .from('daily_task_log')
            .select('tasks_completed')
            .eq('user_id', userId)
            .eq('task_date', today)
            .maybeSingle()

        const completedToday = dailyLog?.tasks_completed ?? 0

        if (completedToday < requiredCompletions) {
            return NextResponse.json({
                allowed: false,
                reason: `You need to complete at least ${requiredCompletions} tasks today before advancing. You've completed ${completedToday} so far.`,
                completedToday,
                required: requiredCompletions,
            })
        }

        const isComplete = currentDay >= regimen.total_days
        const nextDay = isComplete ? regimen.total_days : currentDay + 1
        let nextDayTask = null

        // Generate next day task via AI (only if regimen isn't finishing)
        if (!isComplete) {
            const systemPrompt = `You are managing a "${regimen.name}" training program for a LockedIn chastity user.`
            const userPrompt = `Generate a specific task for Day ${nextDay} of ${regimen.total_days}.
The user's tier is "${tier}". ${regimen.description ? `Program: ${regimen.description}.` : ''}
Keep it concrete, completable in one day, and appropriate for submission/chastity training.
Return valid JSON only, no markdown fences: { "title": "...", "description": "...", "difficulty": 1-5 }`

            try {
                const { text, usage } = await generateSimpleText(systemPrompt, userPrompt)
                await trackUsage(supabase, userId, 'llama-3.3-70b-versatile', usage, 'regimen')
                const cleaned = text.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()
                nextDayTask = JSON.parse(cleaned)
            } catch {
                nextDayTask = {
                    title: `Day ${nextDay} Training`,
                    description: `Continue your ${regimen.name} training for Day ${nextDay}. Stay disciplined and obedient.`,
                    difficulty: 2,
                }
            }
        }

        // Advance the regimen in DB
        await supabase
            .from('regimens')
            .update({
                current_day: nextDay,
                status: isComplete ? 'completed' : 'active',
                completed_at: isComplete ? new Date().toISOString() : null,
            })
            .eq('id', regimenId)

        return NextResponse.json({
            advanced: true,
            isComplete,
            nextDay,
            nextDayTask,
            message: isComplete
                ? `Regimen complete! You've finished "${regimen.name}" — all ${regimen.total_days} days.`
                : `Day ${currentDay} complete. Tomorrow's task is ready.`,
            completedToday,
            required: requiredCompletions,
        })
    } catch (error) {
        console.error('[Regimen Complete Day API] Error:', error)
        return NextResponse.json({ error: 'Failed to advance regimen' }, { status: 500 })
    }
}
