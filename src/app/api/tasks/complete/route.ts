import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'
import { checkAchievements } from '@/lib/engines/rewards'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { taskId, userId, sessionId, difficulty, selfReport } = body as {
            taskId: string
            userId: string
            sessionId?: string
            difficulty?: number
            selfReport?: boolean
        }

        if (!taskId || !userId) {
            return NextResponse.json({ error: 'taskId and userId are required' }, { status: 400 })
        }

        const supabase = getServerSupabase()

        // Verify task belongs to userId (server-side ownership check)
        const { data: task, error: taskError } = await supabase
            .from('tasks')
            .select('id, user_id, difficulty, status, session_id')
            .eq('id', taskId)
            .single()

        if (taskError || !task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 })
        }

        if (task.user_id !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        if (task.status === 'completed') {
            return NextResponse.json({ message: 'Task already completed' }, { status: 200 })
        }

        // Mark task completed (Direct Completion)
        await supabase
            .from('tasks')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                // Clear verification pending state if it existed
                verification_submitted_at: null,
            })
            .eq('id', taskId)

        const taskDifficulty = difficulty ?? task.difficulty ?? 2

        // Update willpower score — increase on completion
        const { data: profile } = await supabase
            .from('profiles')
            .select('willpower_score')
            .eq('id', userId)
            .single()

        const currentWillpower = profile?.willpower_score ?? 50
        const willpowerDelta = Math.ceil(taskDifficulty * 3)
        const newWillpower = Math.min(100, currentWillpower + willpowerDelta)

        await supabase
            .from('profiles')
            .update({ willpower_score: newWillpower })
            .eq('id', userId)

        // Update session task count
        const effectiveSessionId = sessionId || task.session_id
        if (effectiveSessionId) {
            const { data: sessionData } = await supabase
                .from('sessions')
                .select('total_tasks_completed')
                .eq('id', effectiveSessionId)
                .single()

            await supabase
                .from('sessions')
                .update({ total_tasks_completed: (sessionData?.total_tasks_completed || 0) + 1 })
                .eq('id', effectiveSessionId)
        }

        // Update daily_task_log completed count
        const today = new Date().toISOString().split('T')[0]
        const { data: dailyLog } = await supabase
            .from('daily_task_log')
            .select('tasks_completed')
            .eq('user_id', userId)
            .eq('task_date', today)
            .maybeSingle()

        await supabase
            .from('daily_task_log')
            .upsert(
                {
                    user_id: userId,
                    task_date: today,
                    tasks_completed: (dailyLog?.tasks_completed ?? 0) + 1,
                },
                { onConflict: 'user_id,task_date' },
            )

        // Check achievements (Temporarily disabled for stability)
        // const achievements = await checkAchievements(supabase, userId)
        const achievements: string[] = []

        return NextResponse.json({
            success: true,
            newWillpower,
            willpowerDelta,
            achievements,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        console.error('[Task Complete API] Error:', error)
        return NextResponse.json({ error: 'Failed to complete task' }, { status: 500 })
    }
}
