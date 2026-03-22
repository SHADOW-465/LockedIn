import type { UserProfile } from '@/lib/supabase/schema'

/**
 * Calculate profile completeness score (0–100).
 * Used for the Profile Strength Ring in the settings page.
 *
 * Field weights (total = 100):
 * - master_preference: 20pts
 * - tier: 10pts
 * - ai_personality: 10pts
 * - hard_limits (non-empty): 10pts
 * - interests (non-empty): 10pts
 * - preferred_regimens (non-empty): 10pts
 * - psych_profile: 10pts
 * - initial_lock_goal_hours: 5pts
 * - physical_details (non-null): 5pts
 * - communication_style (non-null): 5pts
 * - availability (non-empty active_hours): 5pts
 */
export function calcProfileStrength(profile: Partial<UserProfile>): number {
    let score = 0

    if (profile.master_preference) score += 20
    if (profile.tier) score += 10
    if (profile.ai_personality) score += 10
    if (profile.hard_limits?.length) score += 10
    if (profile.interests?.length) score += 10
    if (profile.preferred_regimens?.length) score += 10
    if (profile.psych_profile) score += 10
    if (profile.initial_lock_goal_hours) score += 5
    if (profile.physical_details) score += 5
    if (profile.communication_style) score += 5
    if (profile.availability?.active_hours?.length) score += 5

    return Math.min(score, 100)
}
