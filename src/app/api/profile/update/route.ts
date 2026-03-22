import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'
import { getActiveSessionId } from '@/lib/supabase/session-guard'
import type { PrivacyConstraints, CommunicationStyle, Availability, UserProfile } from '@/lib/supabase/schema'

// Fields allowed to update even during an active session (set via Care Mode chat)
const SESSION_EXEMPT_FIELDS = new Set(['master_preference', 'session_intent', 'privacy_constraints'])

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            userId,
            tier,
            ai_personality,
            interests,
            hard_limits,
            soft_limits,
            preferred_regimens,
            physical_details,
            initial_lock_goal_hours,
            safeword,
            master_preference,
            privacy_constraints,
            session_intent,
            communication_style,
            availability,
            psych_profile,
        } = body as {
            userId: string
            tier?: string
            ai_personality?: string
            interests?: string[]
            hard_limits?: string[]
            soft_limits?: string[]
            preferred_regimens?: string[]
            physical_details?: UserProfile['physical_details']
            initial_lock_goal_hours?: number
            safeword?: string
            master_preference?: string
            privacy_constraints?: PrivacyConstraints
            session_intent?: string
            communication_style?: CommunicationStyle
            availability?: Availability
            psych_profile?: string
        }

        if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

        // Determine which fields are being updated
        const updatedKeys = Object.keys(body).filter(k => k !== 'userId')
        const allExempt = updatedKeys.every(k => SESSION_EXEMPT_FIELDS.has(k))

        // Block during active session unless all updated fields are exempt
        if (!allExempt) {
            const activeSessionId = await getActiveSessionId(userId)
            if (activeSessionId) {
                return NextResponse.json(
                    { error: 'Settings locked during active session' },
                    { status: 403 }
                )
            }
        }

        const supabase = getServerSupabase()
        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

        if (tier !== undefined) updates.tier = tier
        if (ai_personality !== undefined) updates.ai_personality = ai_personality
        if (interests !== undefined) updates.interests = interests
        if (hard_limits !== undefined) updates.hard_limits = hard_limits
        if (soft_limits !== undefined) updates.soft_limits = soft_limits
        if (preferred_regimens !== undefined) updates.preferred_regimens = preferred_regimens
        if (physical_details !== undefined) updates.physical_details = physical_details
        if (initial_lock_goal_hours !== undefined) updates.initial_lock_goal_hours = initial_lock_goal_hours
        if (safeword !== undefined) updates.safeword = safeword
        if (master_preference !== undefined) updates.master_preference = master_preference
        if (privacy_constraints !== undefined) updates.privacy_constraints = privacy_constraints
        if (session_intent !== undefined) updates.session_intent = session_intent
        if (communication_style !== undefined) updates.communication_style = communication_style
        if (availability !== undefined) updates.availability = availability
        if (psych_profile !== undefined) updates.psych_profile = psych_profile

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
