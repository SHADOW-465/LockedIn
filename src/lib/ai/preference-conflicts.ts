import type { PrivacyConstraints } from '@/lib/supabase/schema'

// Keyword maps for each privacy constraint
const CONSTRAINT_KEYWORDS: Record<keyof PrivacyConstraints, string[]> = {
    no_public_humiliation: ['public', 'humiliate', 'humiliation', 'embarrass', 'degrade in public', 'public display'],
    no_face_revealing: ['face', 'selfie', 'show your face', 'photo of your face', 'face reveal'],
    no_outdoor_tasks: ['outside', 'outdoor', 'public place', 'go out', 'leave the house', 'park', 'street'],
    no_involving_others: ['friend', 'partner', 'someone else', 'another person', 'involve others', 'ask someone', 'with a person'],
}

/**
 * Check if a generated task text conflicts with the user's preferences.
 *
 * @param taskText - The generated task title + description text
 * @param masterPreference - The user's master preference free-text string
 * @param privacyConstraints - The user's privacy constraint flags (null = no constraints)
 * @returns true if the task conflicts with any preference
 */
export function conflictsWithPreferences(
    taskText: string,
    masterPreference: string,
    privacyConstraints: PrivacyConstraints | null,
): boolean {
    const lowerTask = taskText.toLowerCase()
    const lowerPref = masterPreference.toLowerCase()

    // Check master_preference: if preference text mentions "no X" and task contains X, flag conflict
    if (lowerPref) {
        // Strategy 1: infer implied constraints from preference text by checking if preference
        // mentions any keyword associated with a constraint — if so, apply that constraint's
        // full keyword list against the task (handles synonyms like "outdoor" → "outside")
        for (const [, keywords] of Object.entries(CONSTRAINT_KEYWORDS)) {
            if (keywords.some(kw => lowerPref.includes(kw))) {
                // The preference references this constraint's domain — check task against all its keywords
                if (keywords.some(kw => lowerTask.includes(kw))) {
                    return true
                }
            }
        }

        // Strategy 2: extract "no X" phrases and check exact inclusion in task text
        const noMatches = lowerPref.match(/\bno\s+(\w+(?:\s+\w+)?)/g) || []
        for (const noPhrase of noMatches) {
            const keyword = noPhrase.replace(/^no\s+/, '').trim()
            if (keyword.length > 2 && lowerTask.includes(keyword)) {
                return true
            }
        }
    }

    // Check privacy constraints
    if (!privacyConstraints) return false

    for (const [constraint, active] of Object.entries(privacyConstraints) as [keyof PrivacyConstraints, boolean][]) {
        if (!active) continue
        const keywords = CONSTRAINT_KEYWORDS[constraint] || []
        if (keywords.some(kw => lowerTask.includes(kw))) {
            return true
        }
    }

    return false
}
