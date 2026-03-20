import type { UserProfile, MoodCheckin } from '@/lib/supabase/schema'

/**
 * Build a compact profile summary string for AI system prompts.
 * Optional extras (journal titles, user task titles) append recent activity context.
 *
 * Example output:
 * "Slave | Cruel Mistress | WP:72 | Interests:sissy,edging | Limits:scat,blood | Training:Endurance Protocol | Notes:Morning thoughts;Day 3 entry | Self:My workout task"
 *
 * @param extras - Optional supplemental context (journal titles, self-assigned task titles)
 * @param latestMood - Optional most-recent mood check-in to append mood context
 */
export function buildProfileSummary(
    profile: UserProfile,
    extras?: { journalTitles?: string[]; userTaskTitles?: string[] },
    latestMood?: Pick<MoodCheckin, 'submission_depth' | 'frustration_level' | 'headspace_tags'> | null,
): string {
    const tier = profile.tier || 'Newbie'
    const persona = profile.ai_personality || 'Strict Master'
    const willpower = profile.willpower_score ?? 50
    const interests = (profile.interests || []).slice(0, 5).join(',') || 'none'
    const limits = (profile.hard_limits || []).slice(0, 3).join(',') || 'none'
    const regimens = (profile.preferred_regimens || []).slice(0, 3).join(',') || 'none'

    let summary = `${tier} | ${persona} | WP:${willpower} | Interests:${interests} | Limits:${limits} | Training:${regimens}`

    if (extras?.journalTitles?.length) {
        summary += ` | Notes:${extras.journalTitles.slice(0, 5).join(';')}`
    }
    if (extras?.userTaskTitles?.length) {
        summary += ` | Self:${extras.userTaskTitles.slice(0, 3).join(';')}`
    }
    if (latestMood) {
        summary += ` | mood:depth=${latestMood.submission_depth},frust=${latestMood.frustration_level},tags=[${latestMood.headspace_tags.join(',')}]`
    }

    return summary
}
