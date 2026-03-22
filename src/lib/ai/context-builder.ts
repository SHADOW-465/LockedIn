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

    // Build HARD CONSTRAINTS segment first — must appear near the top, right after tier/persona
    const hardConstraints = profile.master_preference
        ? ` | HARD CONSTRAINTS — NEVER VIOLATE: ${profile.master_preference}`
        : ''

    let summary = `${tier} | ${persona}${hardConstraints} | WP:${willpower} | Interests:${interests} | Limits:${limits} | Training:${regimens}`

    // Inject active privacy constraints
    if (profile.privacy_constraints) {
        const activeConstraints: string[] = []
        if (profile.privacy_constraints.no_public_humiliation) activeConstraints.push('no public humiliation')
        if (profile.privacy_constraints.no_face_revealing) activeConstraints.push('no face revealing')
        if (profile.privacy_constraints.no_outdoor_tasks) activeConstraints.push('no outdoor tasks')
        if (profile.privacy_constraints.no_involving_others) activeConstraints.push('no involving others')
        if (activeConstraints.length > 0) {
            summary += ` | Privacy: ${activeConstraints.join(', ')}`
        }
    }

    // Inject session intent
    if (profile.session_intent) {
        summary += ` | Session intent: ${profile.session_intent}`
    }

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
