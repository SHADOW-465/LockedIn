import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json()
        const { userId, tier, ai_personality, interests, hard_limits, soft_limits } = body as {
            userId: string
            tier?: string
            ai_personality?: string
            interests?: string[]
            hard_limits?: string[]
            soft_limits?: string[]
        }

        if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

        const supabase = getServerSupabase()
        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

        if (tier !== undefined) updates.tier = tier
        if (ai_personality !== undefined) updates.ai_personality = ai_personality
        if (interests !== undefined) updates.interests = interests
        if (hard_limits !== undefined) updates.hard_limits = hard_limits
        if (soft_limits !== undefined) updates.soft_limits = soft_limits

        const { error } = await supabase.from('profiles').update(updates).eq('id', userId)

        if (error) {
            console.error('[ProfileUpdate] DB error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error('[ProfileUpdate] Error:', error)
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }
}
