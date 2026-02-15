import { getSupabase } from '@/lib/supabase/client'

/**
 * Tier-scaled punishment hours for each violation type.
 * Higher tiers get harsher penalties.
 */
const PUNISHMENT_TABLE: Record<string, Record<string, number>> = {
    late: { Newbie: 1, Slave: 2, Hardcore: 4, Extreme: 8, Destruction: 12 },
    failed_verification: { Newbie: 2, Slave: 4, Hardcore: 8, Extreme: 16, Destruction: 24 },
    rude_chat: { Newbie: 4, Slave: 8, Hardcore: 16, Extreme: 24, Destruction: 48 },
    missed_checkin: { Newbie: 1, Slave: 2, Hardcore: 6, Extreme: 12, Destruction: 24 },
    task_skipped: { Newbie: 1, Slave: 3, Hardcore: 6, Extreme: 12, Destruction: 18 },
    task_failed: { Newbie: 2, Slave: 4, Hardcore: 8, Extreme: 16, Destruction: 24 },
}

export interface PunishmentResult {
    hours: number
    reason: string
    notificationId: string | null
}

/**
 * Apply a punishment to an active session.
 * 1. Lookup hours from punishment table (tier-scaled)
 * 2. Call add_lock_time RPC (atomically extends session + logs adjustment)
 * 3. Insert a notification for the user
 */
export async function applyPunishment(
    userId: string,
    sessionId: string,
    violationType: string,
    tier: string,
    customReason?: string
): Promise<PunishmentResult | null> {
    const supabase = getSupabase()

    // Lookup hours — fallback to 4 if type/tier not found
    const hours = PUNISHMENT_TABLE[violationType]?.[tier] ?? 4
    const reason = customReason ?? `Punishment: ${violationType.replace(/_/g, ' ')}`

    // Call RPC to extend lock time (also logs calendar_adjustment)
    const { error: rpcError } = await supabase.rpc('add_lock_time', {
        p_session_id: sessionId,
        p_hours: hours,
        p_reason: reason,
    })

    if (rpcError) {
        console.error('Punishment RPC failed:', rpcError)
        return null
    }

    // Increment punishment counter on session
    await supabase.rpc('award_xp', {
        p_user_id: userId,
        p_amount: -5,
        p_reason: reason,
    })

    // Insert notification
    const { data: notification } = await supabase
        .from('notifications')
        .insert({
            user_id: userId,
            type: 'punishment',
            title: `⛓️ +${hours}h Lock Time`,
            body: reason,
        })
        .select('id')
        .single()

    return {
        hours,
        reason,
        notificationId: notification?.id ?? null,
    }
}

/**
 * Get the punishment hours for a violation without applying it.
 * Useful for UI previews / warnings.
 */
export function getPunishmentHours(violationType: string, tier: string): number {
    return PUNISHMENT_TABLE[violationType]?.[tier] ?? 4
}

/**
 * List all violation types with their punishment hours for a given tier.
 */
export function getPunishmentTable(tier: string): { type: string; hours: number }[] {
    return Object.entries(PUNISHMENT_TABLE).map(([type, tiers]) => ({
        type,
        hours: tiers[tier] ?? 4,
    }))
}
