import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { userId } = body as { userId: string }

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 })
        }

        const supabase = getServerSupabase()
        const now = new Date().toISOString()

        // 1. Fetch overdue tasks
        const { data: overdueTasks, error: fetchError } = await supabase
            .from('tasks')
            .select('id, title, difficulty, status')
            .eq('user_id', userId)
            .in('status', ['pending', 'active'])
            .lt('deadline', now)

        if (fetchError) {
            console.error('Error fetching overdue tasks:', fetchError)
            return NextResponse.json({ error: 'Failed to fetch overdue tasks' }, { status: 500 })
        }

        if (!overdueTasks || overdueTasks.length === 0) {
            return NextResponse.json({ processed: 0, punishment: 0 })
        }

        // 2. Mark tasks as failed
        const taskIds = overdueTasks.map(t => t.id)
        const { error: updateError } = await supabase
            .from('tasks')
            .update({
                status: 'failed',
                completed_at: now, // Mark "completion" time as now (failure time)
            })
            .in('id', taskIds)

        if (updateError) {
            console.error('Error updating overdue tasks:', updateError)
            return NextResponse.json({ error: 'Failed to update overdue tasks' }, { status: 500 })
        }

        // 3. Calculate Punishment
        let totalPunishment = 0
        overdueTasks.forEach(task => {
            // Base 5 + (Difficulty * 2)
            totalPunishment += 5 + (task.difficulty * 2)
        })

        // 4. Update Profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('willpower_score')
            .eq('id', userId)
            .single()

        const currentScore = profile?.willpower_score ?? 50
        const newScore = Math.max(0, currentScore - totalPunishment)

        await supabase
            .from('profiles')
            .update({ willpower_score: newScore })
            .eq('id', userId)

        return NextResponse.json({
            processed: overdueTasks.length,
            punishment: totalPunishment,
            newWillpower: newScore,
            failedTasks: overdueTasks.map(t => t.title)
        })

    } catch (error) {
        console.error('[Task Expiration API] Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
