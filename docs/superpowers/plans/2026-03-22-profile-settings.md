# Profile & Settings Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 13 editable profile cards to `/settings`, a Master Preference hard constraint injected into every AI prompt, Care Mode chat-based preference updates, and a Profile Strength Ring.

**Architecture:** Data layer first (migration + types), then AI integration (profile summary + conflict detection + chat parser), then Settings UI (cards + bottom sheets), then chat UX (pref-update confirmation sheet). Each phase is gated on the previous — do not skip ahead.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (PostgreSQL + JSONB), Tailwind CSS, Vitest, `@supabase/ssr` for SSR auth, `groq-sdk` via `src/lib/ai/ai-service.ts`

**Spec:** `docs/superpowers/specs/2026-03-22-profile-settings-design.md`

---

## File Map

### Created
- `supabase/migrations/20260322_profile_preferences.sql` — DB columns
- `src/lib/ai/preference-conflicts.ts` — `conflictsWithPreferences()` pure function
- `src/lib/profile-strength.ts` — `calcProfileStrength()` pure function (no JSX, testable in Node)
- `src/app/api/profile/suggestions/route.ts` — POST endpoint
- `src/components/features/profile/profile-strength-ring.tsx` — SVG ring component (imports from `src/lib/profile-strength.ts`)
- `src/components/features/profile/profile-card.tsx` — tappable card with badge
- `src/components/features/profile/editors/master-preference-editor.tsx`
- `src/components/features/profile/editors/session-intent-editor.tsx`
- `src/components/features/profile/editors/tier-editor.tsx`
- `src/components/features/profile/editors/persona-editor.tsx`
- `src/components/features/profile/editors/limits-editor.tsx` (shared for hard + soft)
- `src/components/features/profile/editors/interests-editor.tsx`
- `src/components/features/profile/editors/regimens-editor.tsx`
- `src/components/features/profile/editors/psych-profile-editor.tsx`
- `src/components/features/profile/editors/physical-details-editor.tsx`
- `src/components/features/profile/editors/communication-style-editor.tsx`
- `src/components/features/profile/editors/lock-params-editor.tsx`
- `src/components/features/profile/editors/availability-editor.tsx`
- `src/components/features/chat/pref-update-sheet.tsx` — Care Mode preference confirmation
- `src/__tests__/preference-conflicts.test.ts`
- `src/__tests__/profile-strength.test.ts` — tests for `calcProfileStrength()` (pure Node, no JSX)
- `src/__tests__/profile-update.test.ts` — TDD tests for the PATCH handler logic
- `src/__tests__/profile-suggestions.test.ts`
- `src/__tests__/pref-update-parsing.test.ts`

### Modified
- `src/lib/supabase/schema.ts` — new interfaces + extended `UserProfile`
- `src/app/api/profile/update/route.ts` — extended PATCH handler
- `src/lib/ai/context-builder.ts` — inject new fields into `buildProfileSummary()`
- `src/app/api/tasks/generate/route.ts` — conflict validation after generation
- `src/app/api/chat/route.ts` — PREF_UPDATE injection + parser for Care Mode
- `src/lib/ai/guide-knowledge.ts` — add Profile & Preferences section
- `src/app/(dashboard)/settings/page.tsx` — full overhaul: ring, cards, editors

---

## Phase 1: Data Layer

### Task 1: Migration + TypeScript interfaces

**Files:**
- Create: `supabase/migrations/20260322_profile_preferences.sql`
- Modify: `src/lib/supabase/schema.ts`

- [ ] **Step 1: Create migration file**

```sql
-- supabase/migrations/20260322_profile_preferences.sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS master_preference    text    DEFAULT '',
  ADD COLUMN IF NOT EXISTS privacy_constraints  jsonb   DEFAULT '{"no_public_humiliation":false,"no_face_revealing":false,"no_outdoor_tasks":false,"no_involving_others":false}'::jsonb,
  ADD COLUMN IF NOT EXISTS session_intent       text    DEFAULT '',
  ADD COLUMN IF NOT EXISTS communication_style  jsonb   DEFAULT '{"feedback_frequency":"moderate","tone_preference":"balanced","punishment_sensitivity":"moderate"}'::jsonb,
  ADD COLUMN IF NOT EXISTS availability         jsonb   DEFAULT '{"active_hours":[],"timezone":""}'::jsonb,
  ADD COLUMN IF NOT EXISTS safeword             text    DEFAULT 'MERCY',
  ADD COLUMN IF NOT EXISTS psych_profile        text    DEFAULT '';
```

- [ ] **Step 2: Apply migration via Supabase MCP**

Run the migration via `mcp__supabase__apply_migration` or the Supabase dashboard SQL editor. Verify no errors.

- [ ] **Step 3: Add new interfaces to `src/lib/supabase/schema.ts`**

Add these three interfaces above the `UserProfile` interface:

```typescript
export interface PrivacyConstraints {
    no_public_humiliation: boolean
    no_face_revealing: boolean
    no_outdoor_tasks: boolean
    no_involving_others: boolean
}

export interface CommunicationStyle {
    feedback_frequency: 'minimal' | 'moderate' | 'frequent'
    tone_preference: 'strict' | 'balanced' | 'encouraging'
    punishment_sensitivity: 'mild' | 'moderate' | 'severe'
}

export interface Availability {
    active_hours: { start: string; end: string }[]
    timezone: string
}
```

- [ ] **Step 4: Extend `UserProfile` interface in `src/lib/supabase/schema.ts`**

Add these fields inside the `UserProfile` interface after `initial_lock_goal_hours`:

```typescript
    // Preferences (added 20260322)
    master_preference: string
    privacy_constraints: PrivacyConstraints | null
    session_intent: string
    communication_style: CommunicationStyle | null
    availability: Availability | null
    safeword: string
    psych_profile: string
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260322_profile_preferences.sql src/lib/supabase/schema.ts
git commit -m "feat(profile): add preference columns migration and TypeScript interfaces"
```

---

### Task 2: Extend PATCH /api/profile/update

**Files:**
- Modify: `src/app/api/profile/update/route.ts`

- [ ] **Step 1: Write the failing tests for the handler logic**

Create `src/__tests__/profile-update.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'

// Test the session-exemption logic in isolation (pure logic, no HTTP)
const SESSION_EXEMPT_FIELDS = new Set(['master_preference', 'session_intent', 'privacy_constraints'])

function isAllExempt(bodyKeys: string[]): boolean {
    return bodyKeys.filter(k => k !== 'userId').every(k => SESSION_EXEMPT_FIELDS.has(k))
}

describe('Profile update active-session exemption logic', () => {
    it('allows master_preference alone (exempt)', () => {
        expect(isAllExempt(['userId', 'master_preference'])).toBe(true)
    })

    it('allows session_intent alone (exempt)', () => {
        expect(isAllExempt(['userId', 'session_intent'])).toBe(true)
    })

    it('allows privacy_constraints alone (exempt)', () => {
        expect(isAllExempt(['userId', 'privacy_constraints'])).toBe(true)
    })

    it('blocks tier change (non-exempt) during session', () => {
        expect(isAllExempt(['userId', 'tier'])).toBe(false)
    })

    it('blocks mixed exempt + non-exempt update', () => {
        expect(isAllExempt(['userId', 'master_preference', 'tier'])).toBe(false)
    })

    it('allows all three exempt fields together', () => {
        expect(isAllExempt(['userId', 'master_preference', 'session_intent', 'privacy_constraints'])).toBe(true)
    })
})
```

Run: `npx vitest run src/__tests__/profile-update.test.ts`
Expected: All PASS (pure logic test, no route import needed)

- [ ] **Step 2: Read the current route**

Read `src/app/api/profile/update/route.ts` in full before editing. Note the existing field names.

- [ ] **Step 3: Rewrite the route to accept all new fields**

Replace the entire file content:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'
import { getActiveSessionId } from '@/lib/supabase/session-guard'
import type { PrivacyConstraints, CommunicationStyle, Availability } from '@/lib/supabase/schema'

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
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/profile/update/route.ts
git commit -m "feat(profile): extend PATCH handler with all new preference fields"
```

---

### Task 3: POST /api/profile/suggestions endpoint

**Files:**
- Create: `src/app/api/profile/suggestions/route.ts`

- [ ] **Step 1: Write the failing test first**

Create `src/__tests__/profile-suggestions.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock AI service
vi.mock('@/lib/ai/ai-service', () => ({
    generateWithHistory: vi.fn().mockResolvedValue({
        text: '1. Set a strict chastity duration goal.\n2. Add edging limits to your intent.',
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
    }),
    trackUsage: vi.fn(),
}))

// Rate limit store (in-memory, module-level)
describe('Profile Suggestions Rate Limiting', () => {
    it('allows first call', () => {
        const rateLimitMap = new Map<string, number>()
        const userId = 'user-1'
        const now = Date.now()
        const lastCall = rateLimitMap.get(userId)
        const tooSoon = lastCall && (now - lastCall) < 10 * 60 * 1000
        expect(tooSoon).toBeFalsy()
        rateLimitMap.set(userId, now)
    })

    it('blocks call within 10 minutes', () => {
        const rateLimitMap = new Map<string, number>()
        const userId = 'user-1'
        const nineMinutesAgo = Date.now() - 9 * 60 * 1000
        rateLimitMap.set(userId, nineMinutesAgo)
        const tooSoon = (Date.now() - (rateLimitMap.get(userId) ?? 0)) < 10 * 60 * 1000
        expect(tooSoon).toBe(true)
    })

    it('allows call after 10 minutes', () => {
        const rateLimitMap = new Map<string, number>()
        const userId = 'user-1'
        const elevenMinutesAgo = Date.now() - 11 * 60 * 1000
        rateLimitMap.set(userId, elevenMinutesAgo)
        const tooSoon = (Date.now() - (rateLimitMap.get(userId) ?? 0)) < 10 * 60 * 1000
        expect(tooSoon).toBe(false)
    })
})

describe('Suggestions parsing', () => {
    it('splits numbered list into array', () => {
        const text = '1. Add a goal.\n2. Set daily limits.\n3. Consider edging restriction.'
        const suggestions = text
            .split('\n')
            .map(l => l.replace(/^\d+\.\s*/, '').trim())
            .filter(Boolean)
        expect(suggestions).toHaveLength(3)
        expect(suggestions[0]).toBe('Add a goal.')
    })
})
```

- [ ] **Step 2: Run test to verify it passes (logic-only, no I/O)**

```bash
npx vitest run src/__tests__/profile-suggestions.test.ts
```

Expected: PASS (no imports from the actual route yet)

- [ ] **Step 3: Create the route**

Create `src/app/api/profile/suggestions/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { generateWithHistory, trackUsage } from '@/lib/ai/ai-service'
import type { UserProfile } from '@/lib/supabase/schema'

// In-memory rate limit: one call per 10 minutes per user
const rateLimitMap = new Map<string, number>()
const RATE_LIMIT_MS = 10 * 60 * 1000

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
        )

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Rate limit check
        const lastCall = rateLimitMap.get(user.id)
        if (lastCall && (Date.now() - lastCall) < RATE_LIMIT_MS) {
            const waitMs = RATE_LIMIT_MS - (Date.now() - lastCall)
            const waitMin = Math.ceil(waitMs / 60000)
            return NextResponse.json(
                { error: 'rate_limited', waitMinutes: waitMin },
                { status: 429 }
            )
        }

        const { type, profile } = await request.json() as {
            type: 'full_review' | 'session_intent'
            profile: Partial<UserProfile>
        }

        if (!type || !profile) {
            return NextResponse.json({ error: 'type and profile required' }, { status: 400 })
        }

        const profileSummary = [
            `Tier: ${profile.tier || 'unknown'}`,
            `Persona: ${profile.ai_personality || 'not set'}`,
            `Interests: ${(profile.interests || []).join(', ') || 'none'}`,
            `Hard limits: ${(profile.hard_limits || []).join(', ') || 'none'}`,
            `Soft limits: ${(profile.soft_limits || []).join(', ') || 'none'}`,
            `Regimens: ${(profile.preferred_regimens || []).join(', ') || 'none'}`,
            `Psych profile: ${profile.psych_profile || 'not set'}`,
            `Master preference: ${profile.master_preference || 'not set'}`,
            `Session intent: ${profile.session_intent || 'not set'}`,
        ].join('\n')

        const systemPrompt = type === 'full_review'
            ? `You are the AI Master in a chastity training app reviewing a slave's profile. Be in character — dominant, precise, critical. Identify 3–5 specific, actionable improvements they should make to get the most out of their training. Be concrete, not generic. Address gaps, conflicts, and missed opportunities in their profile. Number each suggestion.`
            : `You are the AI Master in a chastity training app. The slave wants to improve their Session Goals & Intent statement. Review what they've written (or the absence of it) and suggest 3–5 specific goal statements they could add. Make them specific to their interests and tier. Number each suggestion.`

        const userPrompt = `Here is my current profile:\n\n${profileSummary}\n\nProvide your suggestions.`

        rateLimitMap.set(user.id, Date.now())

        const { text, usage } = await generateWithHistory(systemPrompt, [], userPrompt)

        // Parse numbered list into array
        const suggestions = text
            .split('\n')
            .map((l: string) => l.replace(/^\d+\.\s*/, '').trim())
            .filter(Boolean)
            .slice(0, 5)

        // Use admin client for token tracking
        const { getServerSupabase } = await import('@/lib/supabase/server')
        const adminSupabase = getServerSupabase()
        await trackUsage(adminSupabase, user.id, 'llama-3.3-70b-versatile', usage, 'profile_suggestions')

        return NextResponse.json({ suggestions })
    } catch (error) {
        console.error('[ProfileSuggestions] Error:', error)
        return NextResponse.json({ suggestions: [] }) // graceful fallback
    }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/profile/suggestions/route.ts src/__tests__/profile-suggestions.test.ts
git commit -m "feat(profile): add POST /api/profile/suggestions endpoint with rate limiting"
```

---

## Phase 2: AI Integration

### Task 4: Preference conflict detection (pure function + tests)

**Files:**
- Create: `src/lib/ai/preference-conflicts.ts`
- Create: `src/__tests__/preference-conflicts.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/__tests__/preference-conflicts.test.ts
import { describe, it, expect } from 'vitest'
import { conflictsWithPreferences } from '@/lib/ai/preference-conflicts'
import type { PrivacyConstraints } from '@/lib/supabase/schema'

const noConstraints: PrivacyConstraints = {
    no_public_humiliation: false,
    no_face_revealing: false,
    no_outdoor_tasks: false,
    no_involving_others: false,
}

describe('conflictsWithPreferences', () => {
    it('returns false when no constraints set', () => {
        expect(conflictsWithPreferences('Do 20 pushups', '', noConstraints)).toBe(false)
    })

    it('flags public humiliation task when constraint is on', () => {
        const pc = { ...noConstraints, no_public_humiliation: true }
        expect(conflictsWithPreferences('Humiliate yourself in public', '', pc)).toBe(true)
    })

    it('flags outdoor task when outdoor constraint is on', () => {
        const pc = { ...noConstraints, no_outdoor_tasks: true }
        expect(conflictsWithPreferences('Go outside and jog', '', pc)).toBe(true)
    })

    it('does NOT flag indoor task when outdoor constraint is on', () => {
        const pc = { ...noConstraints, no_outdoor_tasks: true }
        expect(conflictsWithPreferences('Do 50 kegels in your room', '', pc)).toBe(false)
    })

    it('flags unlock task when master preference says no unlock', () => {
        expect(conflictsWithPreferences(
            'Unlock and edge for 10 minutes',
            'Complete chastity — no unlock except hygiene',
            noConstraints
        )).toBe(true)
    })

    it('flags orgasm task when master preference says no orgasm', () => {
        expect(conflictsWithPreferences(
            'Allow yourself a ruined orgasm',
            'no orgasm under any circumstances',
            noConstraints
        )).toBe(true)
    })

    it('does not flag neutral task against chastity preference', () => {
        expect(conflictsWithPreferences(
            'Write 3 lines of gratitude in your journal',
            'Complete chastity — no unlock except hygiene',
            noConstraints
        )).toBe(false)
    })

    it('handles null/empty preference gracefully', () => {
        expect(conflictsWithPreferences('Any task', '', noConstraints)).toBe(false)
        expect(() => conflictsWithPreferences('Any task', '', noConstraints)).not.toThrow()
    })

    it('handles involving others constraint', () => {
        const pc = { ...noConstraints, no_involving_others: true }
        expect(conflictsWithPreferences('Do this with a partner', '', pc)).toBe(true)
    })
})
```

- [ ] **Step 2: Run to confirm all fail**

```bash
npx vitest run src/__tests__/preference-conflicts.test.ts
```

Expected: FAIL — `conflictsWithPreferences` not found

- [ ] **Step 3: Create the pure function**

```typescript
// src/lib/ai/preference-conflicts.ts
import type { PrivacyConstraints } from '@/lib/supabase/schema'

/**
 * Returns true if a generated task text conflicts with the user's
 * master_preference text or privacy_constraints toggles.
 * Conservative — only flags obvious conflicts to avoid false positives.
 */
export function conflictsWithPreferences(
    taskText: string,
    masterPreference: string,
    privacyConstraints: PrivacyConstraints,
): boolean {
    const lower = taskText.toLowerCase()

    // Privacy constraint checks
    if (privacyConstraints.no_public_humiliation &&
        (lower.includes('public') || lower.includes('stranger'))) return true

    if (privacyConstraints.no_face_revealing && lower.includes('face')) return true

    if (privacyConstraints.no_outdoor_tasks &&
        (lower.includes('outside') || lower.includes('outdoor') || lower.includes('go outside'))) return true

    if (privacyConstraints.no_involving_others &&
        (lower.includes('partner') || lower.includes('someone') || lower.includes('person') ||
         lower.includes('with a '))) return true

    // Master preference checks — only well-known denial phrases
    if (!masterPreference.trim()) return false
    const pref = masterPreference.toLowerCase()

    const DENIAL_TRIGGERS: { prefPhrase: string; taskTerms: string[] }[] = [
        { prefPhrase: 'no unlock', taskTerms: ['unlock'] },
        { prefPhrase: 'no orgasm', taskTerms: ['orgasm', 'ejaculat', 'cum', 'climax'] },
        { prefPhrase: 'complete denial', taskTerms: ['orgasm', 'ejaculat', 'cum', 'climax', 'release'] },
        { prefPhrase: 'no release', taskTerms: ['release', 'orgasm', 'ejaculat'] },
        { prefPhrase: 'complete chastity', taskTerms: ['unlock', 'touch', 'release'] },
        { prefPhrase: 'no touch', taskTerms: ['touch yourself', 'stroke', 'edge'] },
        { prefPhrase: 'no penetrat', taskTerms: ['penetrat', 'insert', 'plug'] },
    ]

    for (const { prefPhrase, taskTerms } of DENIAL_TRIGGERS) {
        if (pref.includes(prefPhrase) && taskTerms.some(t => lower.includes(t))) return true
    }

    return false
}
```

- [ ] **Step 4: Run tests and verify all pass**

```bash
npx vitest run src/__tests__/preference-conflicts.test.ts
```

Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/preference-conflicts.ts src/__tests__/preference-conflicts.test.ts
git commit -m "feat(ai): add conflictsWithPreferences pure function with tests"
```

---

### Task 5: Update buildProfileSummary + task generation conflict check

**Files:**
- Modify: `src/lib/ai/context-builder.ts`
- Modify: `src/app/api/tasks/generate/route.ts`

- [ ] **Step 0: Read both files before editing**

Read `src/lib/ai/context-builder.ts` and `src/app/api/tasks/generate/route.ts` in full. Note the exact variable names used for the system prompt and user prompt passed to `generateSimpleText` in the generate route — you will need these exact names in Step 2.

- [ ] **Step 1: Update `buildProfileSummary()` in `src/lib/ai/context-builder.ts`**

Add the new fields after the existing `summary` string is built (before the `return`):

```typescript
// After:  let summary = `${tier} | ${persona} | WP:${willpower} | ...`
// Add:

    // Master Preference — inject as hard constraint block
    if (profile.master_preference?.trim()) {
        summary += ` | HARD CONSTRAINTS — NEVER VIOLATE: ${profile.master_preference}`
    }
    // Privacy constraints
    const pc = profile.privacy_constraints
    if (pc) {
        const pcLines: string[] = []
        if (pc.no_public_humiliation) pcLines.push('no public humiliation')
        if (pc.no_face_revealing)     pcLines.push('no face revealing in proofs')
        if (pc.no_outdoor_tasks)      pcLines.push('no outdoor tasks')
        if (pc.no_involving_others)   pcLines.push('no tasks involving others')
        if (pcLines.length) summary += ` | Privacy: ${pcLines.join(', ')}`
    }
    // Session intent
    if (profile.session_intent?.trim()) {
        summary += ` | Intent: ${profile.session_intent}`
    }
```

- [ ] **Step 2: Add conflict validation to `/api/tasks/generate/route.ts`**

Import the helper at the top:
```typescript
import { conflictsWithPreferences } from '@/lib/ai/preference-conflicts'
import type { PrivacyConstraints } from '@/lib/supabase/schema'
```

After the task JSON is parsed from the AI response, add (before inserting into DB):

```typescript
// Conflict check — re-generate once if needed
const masterPref: string = body.masterPreference || ''
const privacyConstraints: PrivacyConstraints = body.privacyConstraints || {
    no_public_humiliation: false,
    no_face_revealing: false,
    no_outdoor_tasks: false,
    no_involving_others: false,
}

const taskTextForCheck = `${task.title} ${task.description}`
if (conflictsWithPreferences(taskTextForCheck, masterPref, privacyConstraints)) {
    console.warn('[TaskGenerate] Task conflicts with master preference — regenerating once')
    const constrainedPrompt = userPrompt + `\n\nCONSTRAINT: Do NOT generate tasks involving unlocking, orgasm, public situations, or anything that conflicts with: "${masterPref}"`
    try {
        const { text: retryText } = await generateSimpleText(systemPrompt, constrainedPrompt)
        const retryTask = JSON.parse(retryText)
        if (retryTask.title) Object.assign(task, retryTask)
    } catch {
        console.warn('[TaskGenerate] Retry parse failed — using original task')
    }
}
```

Also extend the request body destructuring to accept `masterPreference` and `privacyConstraints`:
```typescript
const { userId, sessionId, tier, fetishes, regimens, hardLimits, personality,
        masterPreference, privacyConstraints } = body as { ...existing..., masterPreference?: string, privacyConstraints?: PrivacyConstraints }
```

- [ ] **Step 3: Run existing task generation tests to ensure nothing broken**

```bash
npx vitest run src/__tests__/task-generation.test.ts
```

Expected: All PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/ai/context-builder.ts src/app/api/tasks/generate/route.ts
git commit -m "feat(ai): inject master preference into profile summary and validate task conflicts"
```

---

### Task 6: PREF_UPDATE parser and Care Mode injection in /api/chat

**Files:**
- Modify: `src/app/api/chat/route.ts`
- Create: `src/__tests__/pref-update-parsing.test.ts`

- [ ] **Step 1: Write the parsing tests**

```typescript
// src/__tests__/pref-update-parsing.test.ts
import { describe, it, expect } from 'vitest'

// Inline the parser logic for isolated testing
function parsePrefUpdates(text: string): Array<{ field: string; action: string; value: string | string[] }> {
    const results: Array<{ field: string; action: string; value: string | string[] }> = []
    const regex = /\[PREF_UPDATE:([\s\S]*?)\]/g
    let match
    while ((match = regex.exec(text)) !== null) {
        try {
            const parsed = JSON.parse(match[1])
            if (!parsed.field || !parsed.action || parsed.value === undefined) continue
            // Coerce array values to first element for append actions
            if (Array.isArray(parsed.value)) parsed.value = parsed.value[0] ?? ''
            results.push(parsed)
        } catch {
            console.warn('[parsePrefUpdates] Malformed JSON in PREF_UPDATE marker — skipping')
        }
    }
    return results
}

function stripPrefUpdates(text: string): string {
    return text.replace(/\[PREF_UPDATE:[\s\S]*?\]/g, '').trim()
}

describe('parsePrefUpdates', () => {
    it('parses a single valid marker', () => {
        const text = 'I hear you. Your wish is noted.[PREF_UPDATE:{"field":"master_preference","action":"set","value":"Complete denial"}]'
        const updates = parsePrefUpdates(text)
        expect(updates).toHaveLength(1)
        expect(updates[0].field).toBe('master_preference')
        expect(updates[0].value).toBe('Complete denial')
    })

    it('strips marker from reply text', () => {
        const text = 'Good. Noted.[PREF_UPDATE:{"field":"session_intent","action":"set","value":"30 day lock"}]'
        expect(stripPrefUpdates(text)).toBe('Good. Noted.')
    })

    it('silently discards malformed JSON', () => {
        const text = 'Reply.[PREF_UPDATE:{bad json here}]'
        expect(parsePrefUpdates(text)).toHaveLength(0)
    })

    it('coerces array value to first element', () => {
        const text = 'Noted.[PREF_UPDATE:{"field":"hard_limits","action":"append","value":["no pain","no wax"]}]'
        const updates = parsePrefUpdates(text)
        expect(updates[0].value).toBe('no pain')
    })

    it('parses multiple markers', () => {
        const text = 'Good.[PREF_UPDATE:{"field":"master_preference","action":"set","value":"Denial"}][PREF_UPDATE:{"field":"session_intent","action":"set","value":"30 days"}]'
        expect(parsePrefUpdates(text)).toHaveLength(2)
    })

    it('returns empty array when no markers present', () => {
        expect(parsePrefUpdates('Normal reply, no markers here.')).toHaveLength(0)
    })
})
```

- [ ] **Step 2: Run tests — expect all to pass (pure logic, no imports)**

```bash
npx vitest run src/__tests__/pref-update-parsing.test.ts
```

Expected: All PASS

- [ ] **Step 3: Add PREF_UPDATE logic to `/api/chat/route.ts`**

In the imports, add nothing new — use existing logic only.

**a) Add the Care Mode PREF_UPDATE instruction string** (near the top, alongside `CARE_MODE_PROMPT`):

```typescript
const PREF_UPDATE_INSTRUCTION = `

PREFERENCE CAPTURE (Care Mode only):
If the user clearly and explicitly states a preference that should be permanently saved
(e.g., "I want complete denial", "add no public tasks to my limits", "my main goal is 30 days"),
respond naturally AND append ONE marker at the very end of your reply:

[PREF_UPDATE:{"field":"<field_name>","action":"set|append","value":"<value>"}]

Valid fields: master_preference, session_intent, soft_limits, hard_limits, interests
For text fields (master_preference, session_intent): action = "set", value = the full statement
For list fields (soft_limits, hard_limits, interests): action = "append", value = single string
Only emit when the user clearly states a preference. Do not guess. Do not emit multiple markers.`
```

**b) Add a helper function** to parse/strip markers (add below the CARE_MODE_PROMPT constant):

```typescript
function parsePrefUpdates(text: string): Array<{ field: string; action: string; value: string }> {
    const results: Array<{ field: string; action: string; value: string }> = []
    const regex = /\[PREF_UPDATE:([\s\S]*?)\]/g
    let match
    while ((match = regex.exec(text)) !== null) {
        try {
            const parsed = JSON.parse(match[1])
            if (!parsed.field || !parsed.action || parsed.value === undefined) continue
            if (Array.isArray(parsed.value)) parsed.value = parsed.value[0] ?? ''
            results.push(parsed)
        } catch {
            console.warn('[Chat] Malformed PREF_UPDATE JSON — skipping')
        }
    }
    return results
}

function stripPrefUpdates(text: string): string {
    return text.replace(/\[PREF_UPDATE:[\s\S]*?\]/g, '').trim()
}
```

**c) In the Care Mode branch** (inside `if (isSafeword)`), modify the system prompt passed to `generateText`:

```typescript
// Replace:
const { text, usage } = await generateText(message, aiContext, CARE_MODE_PROMPT)
// With:
const { text, usage } = await generateText(message, aiContext, CARE_MODE_PROMPT + PREF_UPDATE_INSTRUCTION)
```

**d) For ongoing Care Mode** — after the `if (isSafeword)` block, before the normal reply path, check if session is in Care Mode. First, read the existing normal-reply branch in `/api/chat/route.ts` to understand how the system prompt is assembled (`compactSystem` or equivalent variable) before inserting this code:

```typescript
// Check if session is already in Care Mode (from a prior message)
let sessionInCareMode = false
if (sessionId && !isSafeword && !isResume) {
    const { data: sess } = await supabase
        .from('sessions')
        .select('care_mode_active')
        .eq('id', sessionId)
        .maybeSingle()
    sessionInCareMode = sess?.care_mode_active ?? false
}
```

Then in the normal reply generation, if `sessionInCareMode`, append the instruction to the system prompt. Use this pattern (avoids the `undefined + string` TypeScript error):

```typescript
// In the normal reply path — append PREF_UPDATE instruction when in Care Mode
const effectiveSystem = (sessionInCareMode && compactSystem)
    ? compactSystem + '\n' + PREF_UPDATE_INSTRUCTION
    : compactSystem || undefined
// Pass effectiveSystem to generateText instead of compactSystem
```

**e) Parse and strip PREF_UPDATE markers from ALL replies** before saving to DB or returning:

After `reply` is set in each branch, add:

```typescript
const prefUpdates = parsePrefUpdates(reply)
if (prefUpdates.length > 0) {
    reply = stripPrefUpdates(reply)
}
```

**f) Return `prefUpdates` in the response JSON** alongside the existing `reply` field:

```typescript
return NextResponse.json({
    reply,
    messageType,
    careMode,
    masterTask: /* existing */,
    prefUpdates: prefUpdates.length > 0 ? prefUpdates : undefined,
})
```

- [ ] **Step 4: Run existing chat API tests**

```bash
npx vitest run src/__tests__/chat-api.test.ts
```

Expected: All PASS (new behavior is additive)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/chat/route.ts src/__tests__/pref-update-parsing.test.ts
git commit -m "feat(chat): add PREF_UPDATE marker parsing and Care Mode preference injection"
```

---

### Task 7: Update guide knowledge

**Files:**
- Modify: `src/lib/ai/guide-knowledge.ts`

- [ ] **Step 1: Append the new section to `APP_KNOWLEDGE`**

At the end of the existing `APP_KNOWLEDGE` template string (before the closing backtick), add:

```
PROFILE & PREFERENCES:
- Settings page shows all your profile data across 13 cards. Tap any card to edit it.
- Profile Strength Ring at the top shows how complete your profile is (0-100%). The more complete, the more personalized your training.
- Master Preference (Card 4) — the most important card. Write your permanent training philosophy and absolute rules here. This is injected into every AI decision as a hard constraint. Example: "Complete chastity. No unlocking except for hygiene. No orgasm tasks ever." The Master will never violate this.
- Session Goals & Intent (Card 5) — describe what you want from your training. Tap "Get Suggestions" inside the editor to have the AI Master suggest specific goals based on your profile.
- AI Master Review button (top of Settings) — sends your full profile to the AI for in-character feedback. Available once every 10 minutes.
- Updating preferences through chat — while in Care Mode (after typing your safeword), you can tell the Master your preferences in natural language. The Master may offer to save them to your profile. You confirm or dismiss — nothing saves automatically.
- Cards 4 and 5 (Master Preference and Session Intent) can be edited even during an active session. All other cards are locked while a session is active.
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ai/guide-knowledge.ts
git commit -m "feat(guide): add Profile & Preferences section to APP_KNOWLEDGE"
```

---

## Phase 3: Settings Page UI

### Task 8: Profile Strength Ring component

**Files:**
- Create: `src/lib/profile-strength.ts` — pure function, no JSX, testable in Vitest Node environment
- Create: `src/__tests__/profile-strength.test.ts`
- Create: `src/components/features/profile/profile-strength-ring.tsx` — imports from `src/lib/profile-strength.ts`

> **Why the split:** Vitest runs in Node environment. React component files (JSX) cannot be imported in tests without a browser environment. The score calculation is pure logic — extract it to a plain `.ts` file so it can be tested without mocking React.

- [ ] **Step 1: Create the pure score module**

```typescript
// src/lib/profile-strength.ts
import type { UserProfile } from '@/lib/supabase/schema'

export function calcProfileStrength(profile: Partial<UserProfile>): number {
    let score = 0
    if (profile.tier) score += 5
    if (profile.ai_personality) score += 5
    if ((profile.hard_limits?.length ?? 0) >= 1) score += 10
    if ((profile.interests?.length ?? 0) >= 3) score += 10
    const physFields = Object.values(profile.physical_details ?? {}).filter(Boolean).length
    if (physFields >= 3) score += 10
    if ((profile.psych_profile?.length ?? 0) >= 20) score += 10
    if ((profile.preferred_regimens?.length ?? 0) >= 1) score += 10
    if ((profile.master_preference?.length ?? 0) >= 20) score += 20
    if ((profile.session_intent?.length ?? 0) >= 20) score += 10
    if ((profile.soft_limits?.length ?? 0) >= 1) score += 5
    const cs = profile.communication_style
    if (cs && (cs.feedback_frequency !== 'moderate' || cs.tone_preference !== 'balanced')) score += 5
    return Math.min(score, 100)
}

interface Props {
    profile: Partial<UserProfile>
    size?: number
}

export function ProfileStrengthRing({ profile, size = 80 }: Props) {
    const score = calcProfileStrength(profile)
    const radius = (size - 8) / 2
    const circumference = 2 * Math.PI * radius
    const filled = (score / 100) * circumference

    const color = score >= 70 ? '#2dd4bf' : score >= 40 ? '#f59e0b' : '#ef4444'

    return (
        <div className="flex flex-col items-center gap-1">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="-rotate-90">
                    <circle
                        cx={size / 2} cy={size / 2} r={radius}
                        fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6}
                    />
                    <circle
                        cx={size / 2} cy={size / 2} r={radius}
                        fill="none" stroke={color} strokeWidth={6}
                        strokeDasharray={`${filled} ${circumference}`}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dasharray 0.4s ease' }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold" style={{ color }}>{score}%</span>
                </div>
            </div>
            <span className="text-[10px] text-text-tertiary uppercase tracking-wide">Profile Strength</span>
        </div>
    )
}
```

- [ ] **Step 2: Write unit tests for the score calculation**

Create `src/__tests__/profile-strength.test.ts`:

```typescript
import { calcProfileStrength } from '@/lib/profile-strength'

describe('calcProfileStrength', () => {
    it('returns 0 for empty profile', () => {
        expect(calcProfileStrength({})).toBe(0)
    })

    it('awards 5 for tier', () => {
        expect(calcProfileStrength({ tier: 'Slave' })).toBe(5)
    })

    it('awards 20 for master_preference ≥20 chars', () => {
        expect(calcProfileStrength({ master_preference: 'Complete chastity only' })).toBe(20)
    })

    it('caps at 100', () => {
        const full = {
            tier: 'Slave',
            ai_personality: 'Strict Master',
            hard_limits: ['blood'],
            interests: ['a', 'b', 'c'],
            physical_details: { bodyType: 'slim', orientation: 'straight', genderIdentity: 'male' },
            psych_profile: 'I submit completely to my Master always',
            preferred_regimens: ['Chastity'],
            master_preference: 'Complete denial — no unlocking except hygiene ever',
            session_intent: 'Reach 30 days of continuous lock',
            soft_limits: ['mild pain'],
            communication_style: { feedback_frequency: 'frequent' as const, tone_preference: 'strict' as const, punishment_sensitivity: 'moderate' as const },
        }
        expect(calcProfileStrength(full)).toBe(100)
    })
})
```

- [ ] **Step 3: Run tests — expect failure (module not created yet)**

```bash
npx vitest run src/__tests__/profile-strength.test.ts
```

Expected: FAIL — `calcProfileStrength` not found

- [ ] **Step 4: Create `src/lib/profile-strength.ts`** (the code from Step 1 above)

- [ ] **Step 5: Run tests again**

```bash
npx vitest run src/__tests__/profile-strength.test.ts
```

Expected: All PASS

- [ ] **Step 6: Create the React component that imports from the pure module**

```typescript
// src/components/features/profile/profile-strength-ring.tsx
'use client'
import { calcProfileStrength } from '@/lib/profile-strength'
import type { UserProfile } from '@/lib/supabase/schema'
```

Then the rest of the SVG component (same code as before, just importing `calcProfileStrength` instead of defining it inline).

- [ ] **Step 7: Commit**

```bash
git add src/lib/profile-strength.ts src/__tests__/profile-strength.test.ts src/components/features/profile/profile-strength-ring.tsx
git commit -m "feat(profile): add ProfileStrengthRing with pure calcProfileStrength and tests"
```

---

### Task 9: Settings page overhaul

**Files:**
- Create: `src/components/features/profile/profile-card.tsx`
- Create: `src/components/features/profile/editors/master-preference-editor.tsx`
- Create: `src/components/features/profile/editors/session-intent-editor.tsx`
- Create: `src/components/features/profile/editors/tier-editor.tsx`
- Create: `src/components/features/profile/editors/persona-editor.tsx`
- Create: `src/components/features/profile/editors/limits-editor.tsx`
- Create: `src/components/features/profile/editors/interests-editor.tsx`
- Create: `src/components/features/profile/editors/regimens-editor.tsx`
- Create: `src/components/features/profile/editors/psych-profile-editor.tsx`
- Create: `src/components/features/profile/editors/physical-details-editor.tsx`
- Create: `src/components/features/profile/editors/communication-style-editor.tsx`
- Create: `src/components/features/profile/editors/lock-params-editor.tsx`
- Create: `src/components/features/profile/editors/availability-editor.tsx`
- Modify: `src/app/(dashboard)/settings/page.tsx`

- [ ] **Step 0: Read the current settings page**

Read `src/app/(dashboard)/settings/page.tsx` in full. Note all existing state variables (session check, emergency release state, processing state), the emergency release handler, the logout handler, and all existing imports. These must all be preserved in the rewrite — do not lose the emergency release UI or logout logic.

- [ ] **Step 1: Create the ProfileCard reusable component**

```typescript
// src/components/features/profile/profile-card.tsx
'use client'
import { ChevronRight } from 'lucide-react'

interface ProfileCardProps {
    title: string
    summary: string
    badge?: string
    badgeColor?: 'red' | 'purple' | 'teal' | 'amber' | 'gray'
    onClick: () => void
    locked?: boolean
}

const BADGE_STYLES: Record<string, string> = {
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    purple: 'bg-purple-primary/10 text-purple-primary border-purple-primary/20',
    teal: 'bg-teal-primary/10 text-teal-primary border-teal-primary/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    gray: 'bg-white/5 text-text-tertiary border-white/10',
}

export function ProfileCard({ title, summary, badge, badgeColor = 'gray', onClick, locked }: ProfileCardProps) {
    return (
        <button
            onClick={onClick}
            disabled={locked}
            className="w-full flex items-center justify-between p-4 bg-bg-secondary border border-white/10 rounded-2xl hover:bg-bg-tertiary transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-left"
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold">{title}</span>
                    {badge && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${BADGE_STYLES[badgeColor]}`}>
                            {badge}
                        </span>
                    )}
                </div>
                <p className="text-xs text-text-tertiary truncate">{summary}</p>
            </div>
            <ChevronRight size={16} className="text-text-tertiary ml-3 shrink-0" />
        </button>
    )
}
```

- [ ] **Step 2: Create the Master Preference editor**

```typescript
// src/components/features/profile/editors/master-preference-editor.tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { PrivacyConstraints, UserProfile } from '@/lib/supabase/schema'

interface Props {
    profile: UserProfile
    onSave: (updates: Partial<UserProfile>) => Promise<void>
    onClose: () => void
}

const DEFAULT_PC: PrivacyConstraints = {
    no_public_humiliation: false,
    no_face_revealing: false,
    no_outdoor_tasks: false,
    no_involving_others: false,
}

export function MasterPreferenceEditor({ profile, onSave, onClose }: Props) {
    const [text, setText] = useState(profile.master_preference || '')
    const [pc, setPc] = useState<PrivacyConstraints>(profile.privacy_constraints ?? DEFAULT_PC)
    const [saving, setSaving] = useState(false)
    const [dirty, setDirty] = useState(false)

    const toggle = (key: keyof PrivacyConstraints) => {
        setPc(prev => ({ ...prev, [key]: !prev[key] }))
        setDirty(true)
    }

    const handleSave = async () => {
        setSaving(true)
        await onSave({ master_preference: text, privacy_constraints: pc })
        setSaving(false)
        onClose()
    }

    const handleCancel = () => {
        if (dirty && !confirm('Discard changes?')) return
        onClose()
    }

    return (
        <div className="space-y-5">
            <div>
                <p className="text-xs font-bold uppercase text-red-400 mb-2">Permanent Constraint</p>
                <p className="text-xs text-text-tertiary mb-3">The AI Master treats this as law. It overrides all other preferences and is checked before every task, chat response, and punishment.</p>
                <textarea
                    value={text}
                    onChange={e => { setText(e.target.value); setDirty(true) }}
                    rows={5}
                    className="w-full bg-bg-tertiary border border-white/10 rounded-xl p-3 text-sm text-text-primary resize-none focus:outline-none focus:border-red-primary/40"
                    placeholder="e.g., Complete chastity — I must not touch or unlock under any circumstances except hygiene. No tasks involving orgasm or ejaculation of any kind."
                />
            </div>

            <div>
                <p className="text-xs font-bold uppercase text-text-tertiary mb-3">Privacy & Safety Boundaries</p>
                <div className="space-y-2">
                    {([
                        ['no_public_humiliation', 'No public humiliation tasks'],
                        ['no_face_revealing', 'No face-revealing in proof photos'],
                        ['no_outdoor_tasks', 'No outdoor tasks'],
                        ['no_involving_others', 'No tasks involving other people'],
                    ] as [keyof PrivacyConstraints, string][]).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => toggle(key)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors text-sm ${pc[key] ? 'bg-red-primary/10 border-red-primary/30 text-red-400' : 'bg-bg-tertiary border-white/10 text-text-secondary'}`}
                        >
                            <span>{label}</span>
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${pc[key] ? 'bg-red-primary border-red-primary' : 'border-text-tertiary'}`}>
                                {pc[key] && <span className="text-white text-xs">✓</span>}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex gap-3 pt-2">
                <Button variant="ghost" className="flex-1" onClick={handleCancel}>Cancel</Button>
                <Button variant="primary" className="flex-1" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                </Button>
            </div>
        </div>
    )
}
```

- [ ] **Step 3: Create the Session Intent editor**

```typescript
// src/components/features/profile/editors/session-intent-editor.tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import type { UserProfile } from '@/lib/supabase/schema'

interface Props {
    profile: UserProfile
    onSave: (updates: Partial<UserProfile>) => Promise<void>
    onClose: () => void
}

export function SessionIntentEditor({ profile, onSave, onClose }: Props) {
    const [text, setText] = useState(profile.session_intent || '')
    const [saving, setSaving] = useState(false)
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [loadingSuggestions, setLoadingSuggestions] = useState(false)
    const [dirty, setDirty] = useState(false)

    const getSuggestions = async () => {
        setLoadingSuggestions(true)
        try {
            const res = await fetch('/api/profile/suggestions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'session_intent', profile }),
            })
            const data = await res.json()
            if (res.status === 429) {
                setSuggestions([`Rate limited — check back in ${data.waitMinutes} minutes.`])
            } else {
                setSuggestions(data.suggestions || [])
            }
        } catch {
            setSuggestions(['Suggestions unavailable. Try again in a moment.'])
        } finally {
            setLoadingSuggestions(false)
        }
    }

    const appendSuggestion = (s: string) => {
        setText(prev => prev ? `${prev} ${s}` : s)
        setDirty(true)
    }

    const handleSave = async () => {
        setSaving(true)
        await onSave({ session_intent: text })
        setSaving(false)
        onClose()
    }

    const handleCancel = () => {
        if (dirty && !confirm('Discard changes?')) return
        onClose()
    }

    return (
        <div className="space-y-4">
            <p className="text-xs text-text-tertiary">Describe what you want to achieve in your training. The more specific, the better the AI tailors your sessions.</p>
            <textarea
                value={text}
                onChange={e => { setText(e.target.value); setDirty(true) }}
                rows={5}
                className="w-full bg-bg-tertiary border border-white/10 rounded-xl p-3 text-sm text-text-primary resize-none focus:outline-none focus:border-purple-primary/40"
                placeholder="e.g., Reach 30 days of continuous lock. Build mental submission through daily mantras. No release ever — permanent chastity is the goal."
            />
            <Button variant="ghost" size="sm" className="w-full" onClick={getSuggestions} disabled={loadingSuggestions}>
                {loadingSuggestions ? <><Loader2 size={13} className="mr-1 animate-spin" /> Getting suggestions...</> : '✦ Get Suggestions from Master'}
            </Button>
            {suggestions.length > 0 && (
                <div className="space-y-2">
                    <p className="text-[10px] text-text-tertiary uppercase font-bold">Tap to append:</p>
                    {suggestions.map((s, i) => (
                        <button key={i} onClick={() => appendSuggestion(s)}
                            className="w-full text-left text-xs p-2 bg-purple-primary/5 border border-purple-primary/20 rounded-lg hover:bg-purple-primary/10 transition-colors">
                            {s}
                        </button>
                    ))}
                </div>
            )}
            <div className="flex gap-3 pt-2">
                <Button variant="ghost" className="flex-1" onClick={handleCancel}>Cancel</Button>
                <Button variant="primary" className="flex-1" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                </Button>
            </div>
        </div>
    )
}
```

- [ ] **Step 4: Create the remaining simple editors**

For editors that follow the same pattern (text area or multi-select), create minimal versions. These all share the same structure: local state, Save/Cancel buttons, call `onSave()`.

Create `src/components/features/profile/editors/tier-editor.tsx`:
- Radio list of 5 tiers. Save calls `onSave({ tier })`.

Create `src/components/features/profile/editors/persona-editor.tsx`:
- Radio list of 10 personas. Save calls `onSave({ ai_personality })`.

Create `src/components/features/profile/editors/limits-editor.tsx`:
- Props: `field: 'hard_limits' | 'soft_limits'`, `values: string[]`.
- Text input to add items, list of existing with remove button.
- Save calls `onSave({ [field]: newValues })`.

Create `src/components/features/profile/editors/interests-editor.tsx`:
- 18-option multi-select grid (the same fetish interests from onboarding).
- Save calls `onSave({ interests })`.

Create `src/components/features/profile/editors/regimens-editor.tsx`:
- 25-option multi-select (same regimens from onboarding).
- Save calls `onSave({ preferred_regimens })`.

Create `src/components/features/profile/editors/psych-profile-editor.tsx`:
- Textarea. Save calls `onSave({ psych_profile })`.

Create `src/components/features/profile/editors/physical-details-editor.tsx`:
- Form fields for bodyType, orientation, genderIdentity, age, notes + penis measurements.
- Save calls `onSave({ physical_details })`.

Create `src/components/features/profile/editors/communication-style-editor.tsx`:
- Three radio groups (feedback_frequency, tone_preference, punishment_sensitivity).
- Save calls `onSave({ communication_style })`.

Create `src/components/features/profile/editors/lock-params-editor.tsx`:
- Text input for safeword. Number input for initial_lock_goal_hours.
- Save calls `onSave({ safeword, initial_lock_goal_hours })`.

Create `src/components/features/profile/editors/availability-editor.tsx`:
- Time range inputs + timezone select.
- Save calls `onSave({ availability })`.

> **Implementation note for simple editors:** Each editor receives `profile: UserProfile`, `onSave: (updates: Partial<UserProfile>) => Promise<void>`, `onClose: () => void`. Initialize local state from `profile` fields. On Save, call `onSave()` and then `onClose()`. On Cancel with changes, confirm discard. Use `'use client'` directive.

- [ ] **Step 5: Rewrite `/settings/page.tsx`**

The new page structure:

```typescript
'use client'
// All imports...
import { ProfileStrengthRing } from '@/components/features/profile/profile-strength-ring'
import { ProfileCard } from '@/components/features/profile/profile-card'
// Import all editors...

// Bottom sheet state: which card is open
type OpenCard = 'tier' | 'persona' | 'hard_limits' | 'master_preference' | 'session_intent'
    | 'soft_limits' | 'interests' | 'regimens' | 'psych_profile' | 'physical_details'
    | 'communication_style' | 'lock_params' | 'availability' | 'ai_review' | null

export default function SettingsPage() {
    const { user, profile, refreshProfile } = useAuth()
    const [openCard, setOpenCard] = useState<OpenCard>(null)
    const [hasActiveSession, setHasActiveSession] = useState(false)
    const [reviewSuggestions, setReviewSuggestions] = useState<string[]>([])
    const [loadingReview, setLoadingReview] = useState(false)
    // ...existing session + emergency state...

    const handleSave = async (updates: Partial<UserProfile>) => {
        if (!user || !profile) return
        await fetch('/api/profile/update', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, ...updates }),
        })
        await refreshProfile()
    }

    const handleAIReview = async () => {
        setLoadingReview(true)
        setOpenCard('ai_review')
        const res = await fetch('/api/profile/suggestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'full_review', profile }),
        })
        const data = await res.json()
        setReviewSuggestions(data.suggestions || [])
        setLoadingReview(false)
    }

    // Bottom sheet overlay
    const renderBottomSheet = () => {
        if (!openCard || !profile) return null
        // ... switch on openCard, render appropriate editor inside a slide-up overlay ...
    }

    return (
        <>
            <TopBar />
            <div className="min-h-screen pb-32 p-4">
                <div className="max-w-2xl mx-auto space-y-6">
                    {/* Header: ring + name + review button */}
                    <div className="flex items-center gap-4 pt-2">
                        <ProfileStrengthRing profile={profile ?? {}} />
                        <div className="flex-1">
                            <p className="font-bold">{username}</p>
                            <p className="text-xs text-text-tertiary">{profile?.tier ?? 'Newbie'} · {profile?.ai_personality ?? 'Strict Master'}</p>
                        </div>
                    </div>

                    <button onClick={handleAIReview} disabled={loadingReview}
                        className="w-full p-3 rounded-xl bg-purple-primary/10 border border-purple-primary/20 text-sm text-purple-primary font-semibold hover:bg-purple-primary/20 transition-colors disabled:opacity-50">
                        {loadingReview ? 'Master is reviewing...' : '✦ Get AI Feedback on Your Profile'}
                    </button>

                    {/* Info hint */}
                    <p className="text-xs text-text-tertiary text-center px-4">
                        Your profile is read before every AI interaction. Master Preference and Session Intent have the strongest effect.
                    </p>

                    {hasActiveSession && (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                            ⚠ Settings locked during active session. Master Preference and Session Intent can still be edited.
                        </div>
                    )}

                    {/* 13 cards */}
                    <div className="space-y-2">
                        <ProfileCard title="Training Tier" summary={profile?.tier ?? 'Not set'} badge="HIGH AI IMPACT" badgeColor="purple" onClick={() => setOpenCard('tier')} locked={hasActiveSession} />
                        <ProfileCard title="AI Master Persona" summary={profile?.ai_personality ?? 'Not set'} badge="HIGH AI IMPACT" badgeColor="purple" onClick={() => setOpenCard('persona')} locked={hasActiveSession} />
                        <ProfileCard title="Hard Limits" summary={(profile?.hard_limits?.length ?? 0) > 0 ? `${profile?.hard_limits?.length} limits set` : 'None set'} badge="CRITICAL" badgeColor="red" onClick={() => setOpenCard('hard_limits')} />
                        <ProfileCard title="Master Preference" summary={profile?.master_preference?.slice(0, 60) || 'Not set — highest AI impact'} badge="PERMANENT" badgeColor="red" onClick={() => setOpenCard('master_preference')} />
                        <ProfileCard title="Session Goals & Intent" summary={profile?.session_intent?.slice(0, 60) || 'Not set'} badge="HIGH AI IMPACT" badgeColor="purple" onClick={() => setOpenCard('session_intent')} />
                        <ProfileCard title="Soft Limits" summary={(profile?.soft_limits?.length ?? 0) > 0 ? `${profile?.soft_limits?.length} limits set` : 'None set'} badge="MEDIUM" badgeColor="amber" onClick={() => setOpenCard('soft_limits')} locked={hasActiveSession} />
                        <ProfileCard title="Fetish Interests" summary={(profile?.interests ?? []).slice(0, 3).join(', ') || 'None selected'} badge="HIGH AI IMPACT" badgeColor="purple" onClick={() => setOpenCard('interests')} locked={hasActiveSession} />
                        <ProfileCard title="Training Regimens" summary={(profile?.preferred_regimens ?? []).slice(0, 2).join(', ') || 'None selected'} badge="HIGH AI IMPACT" badgeColor="purple" onClick={() => setOpenCard('regimens')} locked={hasActiveSession} />
                        <ProfileCard title="Psych Profile" summary={profile?.psych_profile?.slice(0, 60) || 'Not set'} badge="HIGH AI IMPACT" badgeColor="purple" onClick={() => setOpenCard('psych_profile')} locked={hasActiveSession} />
                        <ProfileCard title="Physical Details" summary={profile?.physical_details?.bodyType ?? 'Not set'} badge="MEDIUM" badgeColor="amber" onClick={() => setOpenCard('physical_details')} locked={hasActiveSession} />
                        <ProfileCard title="Communication Style" summary="Stored (not yet injected)" badge="FUTURE" badgeColor="gray" onClick={() => setOpenCard('communication_style')} locked={hasActiveSession} />
                        <ProfileCard title="Lock Parameters" summary={`Safeword: ${profile?.safeword ?? 'MERCY'}`} onClick={() => setOpenCard('lock_params')} locked={hasActiveSession} />
                        <ProfileCard title="Availability & Schedule" summary="Stored (future use)" badge="FUTURE" badgeColor="gray" onClick={() => setOpenCard('availability')} locked={hasActiveSession} />
                    </div>

                    {/* Existing: emergency release + logout */}
                </div>
            </div>

            {/* Bottom sheet overlay */}
            {renderBottomSheet()}
            <BottomNav />
        </>
    )
}
```

The `renderBottomSheet()` function renders a fixed full-screen overlay with a slide-up panel containing the appropriate editor. Pattern:

```typescript
const renderBottomSheet = () => {
    if (!openCard || !profile) return null
    const editorMap: Record<string, React.ReactNode> = {
        master_preference: <MasterPreferenceEditor profile={profile} onSave={handleSave} onClose={() => setOpenCard(null)} />,
        session_intent: <SessionIntentEditor profile={profile} onSave={handleSave} onClose={() => setOpenCard(null)} />,
        // ... other editors ...
        ai_review: (
            <div className="space-y-3">
                <p className="text-sm font-semibold">AI Master's Assessment</p>
                {loadingReview ? <div className="text-center py-8"><Loader2 className="animate-spin mx-auto" /></div>
                    : reviewSuggestions.length === 0 ? <p className="text-sm text-text-tertiary">No suggestions available. Try again.</p>
                    : reviewSuggestions.map((s, i) => <p key={i} className="text-sm text-text-secondary border-l-2 border-purple-primary/40 pl-3">{s}</p>)}
                <Button variant="ghost" className="w-full" onClick={() => setOpenCard(null)}>Close</Button>
            </div>
        ),
    }
    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setOpenCard(null)}>
            <div className="absolute bottom-0 left-0 right-0 bg-bg-secondary rounded-t-2xl max-h-[85vh] overflow-y-auto p-5"
                onClick={e => e.stopPropagation()}>
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
                {editorMap[openCard] ?? null}
            </div>
        </div>
    )
}
```

- [ ] **Step 6: Run lint to catch type errors**

```bash
npm run lint
```

Fix any TypeScript errors before committing.

- [ ] **Step 7: Commit**

```bash
git add src/components/features/profile/ src/app/(dashboard)/settings/page.tsx
git commit -m "feat(settings): full profile settings overhaul — 13 cards, strength ring, editors"
```

---

## Phase 4: Chat Preference Update UX

### Task 10: PrefUpdate confirmation sheet in chat

**Files:**
- Create: `src/components/features/chat/pref-update-sheet.tsx`
- Modify: `src/app/(dashboard)/chat/page.tsx`

- [ ] **Step 1: Create the confirmation sheet component**

```typescript
// src/components/features/chat/pref-update-sheet.tsx
'use client'
import { Button } from '@/components/ui/button'

export interface PrefUpdate {
    field: string
    action: 'set' | 'append'
    value: string
}

const FIELD_LABELS: Record<string, string> = {
    master_preference: 'Master Preference',
    session_intent: 'Session Intent',
    hard_limits: 'Hard Limits',
    soft_limits: 'Soft Limits',
    interests: 'Interests',
}

interface Props {
    updates: PrefUpdate[]
    onConfirm: () => void
    onDismiss: () => void
    saving?: boolean
}

export function PrefUpdateSheet({ updates, onConfirm, onDismiss, saving }: Props) {
    return (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm">
            <div className="w-full bg-bg-secondary rounded-t-2xl p-5 space-y-4">
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto" />
                <p className="text-sm font-semibold text-center">Your Master wants to save these preferences</p>
                <div className="space-y-2">
                    {updates.map((u, i) => (
                        <div key={i} className="bg-bg-tertiary border border-white/10 rounded-xl p-3">
                            <p className="text-[10px] text-text-tertiary uppercase font-bold mb-1">
                                {FIELD_LABELS[u.field] ?? u.field} — {u.action === 'append' ? 'Add' : 'Set'}
                            </p>
                            <p className="text-xs text-text-secondary">{String(u.value)}</p>
                        </div>
                    ))}
                </div>
                <div className="flex gap-3">
                    <Button variant="ghost" className="flex-1" onClick={onDismiss} disabled={saving}>Dismiss</Button>
                    <Button variant="primary" className="flex-1" onClick={onConfirm} disabled={saving}>
                        {saving ? 'Saving...' : 'Confirm & Save'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
```

- [ ] **Step 2: Wire into chat page**

In `src/app/(dashboard)/chat/page.tsx`:

**a)** Import the new component and type:
```typescript
import { PrefUpdateSheet, type PrefUpdate } from '@/components/features/chat/pref-update-sheet'
```

**b)** Add state:
```typescript
const [pendingPrefUpdates, setPendingPrefUpdates] = useState<PrefUpdate[]>([])
const [savingPrefs, setSavingPrefs] = useState(false)
```

**c)** After receiving the chat API response, check for `prefUpdates`:
```typescript
const data = await res.json()
// ... existing handling ...
if (data.prefUpdates?.length) {
    setPendingPrefUpdates(data.prefUpdates)
}
```

**d)** Handle confirm:
```typescript
const handlePrefConfirm = async () => {
    if (!user || !pendingPrefUpdates.length) return
    setSavingPrefs(true)
    // Build the update object from the pref updates
    const updates: Record<string, unknown> = {}
    for (const u of pendingPrefUpdates) {
        if (u.action === 'set') {
            updates[u.field] = u.value
        } else if (u.action === 'append') {
            // For list fields, get current value and append
            const currentVal = (profile as Record<string, unknown>)[u.field]
            const current = Array.isArray(currentVal) ? currentVal : []
            updates[u.field] = [...current, u.value]
        }
    }
    await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...updates }),
    })
    await refreshProfile()
    setSavingPrefs(false)
    setPendingPrefUpdates([])
    // Show success toast (use your existing toast mechanism)
}
```

**e)** Render the sheet when there are pending updates:
```typescript
{pendingPrefUpdates.length > 0 && (
    <PrefUpdateSheet
        updates={pendingPrefUpdates}
        onConfirm={handlePrefConfirm}
        onDismiss={() => setPendingPrefUpdates([])}
        saving={savingPrefs}
    />
)}
```

- [ ] **Step 3: Run all tests**

```bash
npm run test
```

Expected: All PASS

- [ ] **Step 4: Final commit**

```bash
git add src/components/features/chat/pref-update-sheet.tsx src/app/(dashboard)/chat/page.tsx
git commit -m "feat(chat): add Care Mode preference update confirmation sheet"
```

---

## Final: Run and verify

- [ ] Start dev server: `npm run dev`
- [ ] Navigate to `/settings` — verify ring renders, 13 cards visible, locked cards show disabled state during active session
- [ ] Tap Master Preference card — verify editor opens, can type, save calls API
- [ ] Tap Session Intent card — verify "Get Suggestions" button works, suggestions appear as pills
- [ ] Click "Get AI Feedback" — verify review sheet opens with AI suggestions
- [ ] In `/chat`, type safeword — enter Care Mode, tell Master a preference — verify confirmation sheet appears, confirm saves to profile
- [ ] Run `npm run test` — all tests pass
- [ ] Run `npm run build` — no TypeScript errors

```bash
git add -A
git commit -m "feat: profile settings overhaul complete — all phases"
```
