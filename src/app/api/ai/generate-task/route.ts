import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateTask } from '@/lib/ai/gemini'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
    try {
        const { userId, sessionId, tier, fetishTags, personality, hardLimits } = await request.json()

        if (!userId || !tier) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Generate task via Gemini AI
        const task = await generateTask(
            tier,
            fetishTags ?? [],
            personality ?? 'Cruel Mistress',
            hardLimits ?? []
        )

        // Calculate deadline
        const deadline = new Date(Date.now() + task.duration_minutes * 60 * 1000).toISOString()

        // Insert into database
        const { data, error } = await supabaseAdmin
            .from('tasks')
            .insert({
                user_id: userId,
                session_id: sessionId || null,
                title: task.title,
                description: task.description,
                genres: task.genres,
                difficulty: task.difficulty,
                cage_status: task.cage_status,
                status: 'pending',
                duration_minutes: task.duration_minutes,
                deadline,
                verification_type: task.verification_type,
                verification_requirement: task.verification_requirement,
                punishment_on_fail: task.punishment_on_fail,
            })
            .select()
            .single()

        if (error) {
            console.error('Failed to insert task:', error)
            return NextResponse.json({ error: 'Failed to save task' }, { status: 500 })
        }

        // Update session task count and award XP
        if (sessionId) {
            await supabaseAdmin.rpc('award_xp', {
                p_user_id: userId,
                p_amount: 2,
                p_reason: 'New task generated'
            })
        }

        return NextResponse.json({ task: data })
    } catch (err) {
        console.error('Task generation error:', err)
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Failed to generate task' },
            { status: 500 }
        )
    }
}
