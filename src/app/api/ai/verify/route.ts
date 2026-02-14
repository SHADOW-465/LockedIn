import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyTaskPhoto } from '@/lib/ai/gemini'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
    try {
        const { taskId, imageBase64, userId } = await request.json()

        if (!taskId || !imageBase64) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Fetch task details
        const { data: task, error: taskError } = await supabaseAdmin
            .from('tasks')
            .select('*')
            .eq('id', taskId)
            .single()

        if (taskError || !task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 })
        }

        // Verify with Gemini Vision
        const result = await verifyTaskPhoto(
            imageBase64,
            task.verification_requirement ?? 'Task completion evidence'
        )

        // Update task status
        const newStatus = result.passed ? 'completed' : 'failed'
        await supabaseAdmin
            .from('tasks')
            .update({
                status: newStatus,
                ai_verification_result: result.feedback,
                completed_at: result.passed ? new Date().toISOString() : null,
            })
            .eq('id', taskId)

        // If failed, apply punishment
        if (!result.passed && task.session_id && task.punishment_on_fail) {
            const punishment = task.punishment_on_fail as { hours: number }
            await supabaseAdmin.rpc('add_lock_time', {
                p_session_id: task.session_id,
                p_hours: punishment.hours ?? 4,
                p_reason: `Task failed: ${task.title}`,
            })
        }

        // Notification
        await supabaseAdmin.from('notifications').insert({
            user_id: userId ?? task.user_id,
            type: result.passed ? 'reward' : 'punishment',
            title: result.passed ? '✅ Task Verified' : '❌ Verification Failed',
            body: result.feedback,
        })

        return NextResponse.json({
            passed: result.passed,
            feedback: result.feedback,
            status: newStatus,
        })
    } catch (err) {
        console.error('Verification error:', err)
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Verification failed' },
            { status: 500 }
        )
    }
}
