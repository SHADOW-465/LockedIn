import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { taskId, userId, sessionId } = body as {
            taskId: string
            userId: string
            sessionId?: string
        }

        if (!taskId || !userId) {
            return NextResponse.json({ error: 'taskId and userId are required' }, { status: 400 })
        }

        const supabase = getServerSupabase()

        // Verify task belongs to userId
        const { data: task, error: taskError } = await supabase
            .from('tasks')
            .select('id, user_id, status, session_id, difficulty')
            .eq('id', taskId)
            .single()

        if (taskError || !task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 })
        }

        if (task.user_id !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        if (task.status === 'failed') {
            return NextResponse.json({ message: 'Task already marked as failed' }, { status: 200 })
        }

        if (task.status === 'completed') {
            return NextResponse.json({ error: 'Cannot fail a completed task' }, { status: 400 })
        }

        // Mark task failed
        await supabase
            .from('tasks')
            .update({
                status: 'failed',
                completed_at: new Date().toISOString(), // We treat failure as a form of completion timestamp-wise
            })
            .eq('id', taskId)

        // Punishment: Deduct Willpower
        const PUNISHMENT_AMOUNT = 5 + (task.difficulty * 2) // Base 5 + scaling with difficulty

        const { data: profile } = await supabase
            .from('profiles')
            .select('willpower_score')
            .eq('id', userId)
            .single()

        const currentWillpower = profile?.willpower_score ?? 50
        const newWillpower = Math.max(0, currentWillpower - PUNISHMENT_AMOUNT)

        await supabase
            .from('profiles')
            .update({ willpower_score: newWillpower })
            .eq('id', userId)

        // Update session task count
        const effectiveSessionId = sessionId || task.session_id
        if (effectiveSessionId) {
            const { data: sessionData } = await supabase
                .from('sessions')
                .select('total_tasks_failed')
                .eq('id', effectiveSessionId)
                .single()

            await supabase
                .from('sessions')
                .update({ total_tasks_failed: (sessionData?.total_tasks_failed || 0) + 1 })
                .eq('id', effectiveSessionId)
        }

        return NextResponse.json({
            success: true,
            newWillpower,
            willpowerDelta: -PUNISHMENT_AMOUNT,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        console.error('[Task Fail API] Error:', error)
        return NextResponse.json({ error: 'Failed to fail task' }, { status: 500 })
    }
}
