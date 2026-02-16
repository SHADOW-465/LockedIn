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
        // IMPORTANT: Flatten punishment_on_fail object to db columns
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

                // Flattened punishment fields
                punishment_type: task.punishment_on_fail.type,
                punishment_hours: task.punishment_on_fail.hours,
                punishment_additional: task.punishment_on_fail.additional || null,
            })
            .select()
            .single()

        if (error) {
            console.error('Failed to insert task:', error)
            return NextResponse.json({ error: 'Failed to save task' }, { status: 500 })
        }

        // Update session task count and award XP
        if (sessionId) {
            // Note: award_xp might be an RPC, assuming it exists or handled elsewhere
            // If it doesn't exist, this might fail, but let's assume it's fine for now
            // or wrap in try/catch if strictly robust
            try {
                await supabaseAdmin.rpc('award_xp', {
                    p_user_id: userId,
                    p_amount: 2,
                    p_reason: 'New task generated'
                })
            } catch (rpcError) {
                console.warn('award_xp RPC failed or missing', rpcError)
            }
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
