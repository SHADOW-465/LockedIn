import type { SupabaseClient } from '@supabase/supabase-js'

// ── Punishment severity table ─────────────────────────────────
// Maps (violationType, tier) → punishment hours to add to lock time
export const PUNISHMENT_TABLE: Record<string, Record<string, number>> = {
    task_failed: {
        Newbie: 2,
        Slave: 4,
        Hardcore: 8,
        Extreme: 16,
        'Total Destruction': 24,
    },
    rude_chat: {
        Newbie: 1,
        Slave: 2,
        Hardcore: 4,
        Extreme: 8,
        'Total Destruction': 12,
    },
    failed_verification: {
        Newbie: 2,
        Slave: 4,
        Hardcore: 8,
        Extreme: 12,
        'Total Destruction': 24,
    },
    missed_deadline: {
        Newbie: 1,
        Slave: 3,
        Hardcore: 6,
        Extreme: 12,
        'Total Destruction': 24,
    },
    unauthorized_release: {
        Newbie: 12,
        Slave: 24,
        Hardcore: 48,
        Extreme: 72,
        'Total Destruction': 168,
    },
    skipped_task: {
        Newbie: 1,
        Slave: 2,
        Hardcore: 4,
        Extreme: 8,
        'Total Destruction': 16,
    },
}

/**
 * Get punishment hours for a given violation type and tier.
 */
export function getPunishmentHours(violationType: string, tier: string): number {
    return PUNISHMENT_TABLE[violationType]?.[tier] ?? 4
}

/**
 * Apply a punishment: extend lock time + create notification.
 * @param supabase - Server Supabase client (passed in from API route)
 */
export async function applyPunishment(
    supabase: SupabaseClient,
    userId: string,
    sessionId: string,
    violationType: string,
    tier: string,
    reason?: string,
): Promise<{ hours: number; reason: string } | null> {
    const hours = getPunishmentHours(violationType, tier)
    const punishmentReason = reason || `Punishment for ${violationType} (tier: ${tier})`

    try {
        // Extend lock time using RPC
        const { error: rpcError } = await supabase.rpc('add_lock_time', {
            p_session_id: sessionId,
            p_hours: hours,
            p_reason: punishmentReason,
        })

        if (rpcError) {
            console.error('[Punishment] RPC failed:', rpcError)

            // Fallback: direct update if RPC doesn't exist
            const { data: session } = await supabase
                .from('sessions')
                .select('target_end_time')
                .eq('id', sessionId)
                .single()

            if (session?.target_end_time) {
                const currentEnd = new Date(session.target_end_time)
                currentEnd.setHours(currentEnd.getHours() + hours)

                await supabase
                    .from('sessions')
                    .update({ target_end_time: currentEnd.toISOString() })
                    .eq('id', sessionId)
            }
        }

        // Log in calendar_adjustments
        await supabase.from('calendar_adjustments').insert({
            user_id: userId,
            session_id: sessionId,
            adjustment_type: 'punishment',
            hours_added: hours,
            reason: punishmentReason,
        })

        // Create notification
        await supabase.from('notifications').insert({
            user_id: userId,
            type: 'punishment',
            title: `⛓️ Punishment Applied`,
            message: `+${hours}h added to your lock time — ${punishmentReason}`,
            read: false,
        })

        return { hours, reason: punishmentReason }
    } catch (error) {
        console.error('[Punishment] Failed:', error)
        return null
    }
}
