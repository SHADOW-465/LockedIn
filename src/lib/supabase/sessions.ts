import { getSupabase } from './client'
import type { Session } from './schema'

export async function createSession(
    userId: string,
    tier: string,
    durationHours: number = 168,
    aiPersonality: string | null = null
): Promise<Session | null> {
    const supabase = getSupabase()
    const endTime = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
        .from('sessions')
        .insert({
            user_id: userId,
            tier,
            ai_personality: aiPersonality,
            lock_goal_hours: durationHours,
            scheduled_end_time: endTime,
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating session:', error)
        return null
    }

    return data as Session
}

export async function getActiveSession(userId: string): Promise<Session | null> {
    const supabase = getSupabase()
    const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (error) {
        console.error('Error fetching session:', error)
        return null
    }

    return data as Session | null
}

export async function endSession(sessionId: string): Promise<boolean> {
    const supabase = getSupabase()
    const { error } = await supabase
        .from('sessions')
        .update({
            status: 'completed',
            actual_end_time: new Date().toISOString(),
        })
        .eq('id', sessionId)

    if (error) {
        console.error('Error ending session:', error)
        return false
    }

    return true
}

export async function emergencyRelease(sessionId: string): Promise<boolean> {
    const supabase = getSupabase()
    const { error } = await supabase
        .from('sessions')
        .update({
            status: 'emergency_released',
            actual_end_time: new Date().toISOString(),
        })
        .eq('id', sessionId)

    if (error) {
        console.error('Error emergency releasing:', error)
        return false
    }

    return true
}

export async function addLockTime(sessionId: string, hours: number, reason: string) {
    const supabase = getSupabase()
    const { data, error } = await supabase.rpc('add_lock_time', {
        p_session_id: sessionId,
        p_hours: hours,
        p_reason: reason,
    })

    if (error) {
        console.error('Error adding lock time:', error)
        return null
    }

    return data
}

export async function subtractLockTime(sessionId: string, hours: number, reason: string) {
    const supabase = getSupabase()
    const { data, error } = await supabase.rpc('subtract_lock_time', {
        p_session_id: sessionId,
        p_hours: hours,
        p_reason: reason,
    })

    if (error) {
        console.error('Error subtracting lock time:', error)
        return null
    }

    return data
}
