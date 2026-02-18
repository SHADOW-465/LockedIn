import type { UserProfile } from '@/lib/supabase/schema'

/**
 * Build a compact (~80 token) profile summary string for AI system prompts.
 * Called once per chat session and cached — replaces injecting the full AIContext
 * into every message, reducing system prompt tokens by ~60%.
 *
 * Example output:
 * "Slave | Cruel Mistress | WP:72 | Interests:sissy,edging | Limits:scat,blood | Training:Endurance Protocol"
 */
export function buildProfileSummary(profile: UserProfile): string {
    const tier = profile.tier || 'Newbie'
    const persona = profile.ai_personality || 'Strict Master'
    const willpower = profile.willpower_score ?? 50
    const interests = (profile.interests || []).slice(0, 5).join(',') || 'none'
    const limits = (profile.hard_limits || []).slice(0, 3).join(',') || 'none'
    const regimens = (profile.preferred_regimens || []).slice(0, 3).join(',') || 'none'

    return `${tier} | ${persona} | WP:${willpower} | Interests:${interests} | Limits:${limits} | Training:${regimens}`
}
