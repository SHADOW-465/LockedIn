# Phase 1 Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Mood Check-in, Session Replay, Calendar Upgrade, and Punishment Wheel to LockedIn.

**Architecture:** Sequential build order — Mood Check-in (new table + API + UI) → Session Replay (client-only IndexedDB UI) → Calendar Upgrade (overlays + day panel using mood data) → Punishment Wheel (new table + weighted engine + API + UI). API routes use TDD; UI components are manually verified. Pure business logic extracted into engine files for unit testing.

**Tech Stack:** Next.js 15 App Router, Supabase (service_role via `getServerSupabase()`), Vitest (node env, `@/` alias to `src/`), date-fns, Dexie.js (IndexedDB), Tailwind CSS, `lucide-react`.

**Spec:** `docs/superpowers/specs/2026-03-20-phase1-features-design.md`

---

## File Map

**Create:**
- `supabase/migrations/20260320_mood_checkins.sql`
- `supabase/migrations/20260320_punishment_pool.sql`
- `src/lib/engines/punishment-wheel.ts` — `buildWeightedPool()` pure fn + `DEFAULT_POOL_SEED`
- `src/app/api/mood/checkin/route.ts`
- `src/app/api/punishment-pool/route.ts` (GET + POST)
- `src/app/api/punishment-pool/[id]/route.ts` (DELETE)
- `src/app/api/punishment-wheel/spin/route.ts`
- `src/components/features/mood/mood-checkin-modal.tsx`
- `src/app/(dashboard)/history/page.tsx`
- `src/app/(dashboard)/history/[sessionId]/page.tsx`
- `src/components/features/history/session-list.tsx`
- `src/components/features/history/session-detail.tsx`
- `src/components/features/punishment/punishment-wheel-modal.tsx`
- `src/components/features/punishment/punishment-pool-editor.tsx`
- `src/__tests__/mood-checkin.test.ts`
- `src/__tests__/punishment-wheel.test.ts`
- `src/__tests__/punishment-pool.test.ts`

**Modify:**
- `src/lib/supabase/schema.ts` — add `MoodCheckin`, `PunishmentPoolItem`, extend `TableName`
- `src/lib/ai/context-builder.ts` — add optional `latestMood` param
- `src/app/api/sessions/start/route.ts` — seed punishment pool after session insert
- `src/app/api/chat/route.ts` — fetch `latestMood`, pass to `buildProfileSummary`
- `src/app/(dashboard)/home/page.tsx` — mood modal trigger + quick-action cards
- `src/app/(dashboard)/calendar/page.tsx` — overlays + day detail panel + history link
- `src/app/(dashboard)/settings/page.tsx` — pool editor section + history link

---

## Task 1: DB Migrations + TypeScript Types

**Files:**
- Create: `supabase/migrations/20260320_mood_checkins.sql`
- Create: `supabase/migrations/20260320_punishment_pool.sql`
- Modify: `src/lib/supabase/schema.ts`

- [ ] **Step 1: Write mood_checkins migration**

Create `supabase/migrations/20260320_mood_checkins.sql`:

```sql
create table if not exists mood_checkins (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references profiles(id) on delete cascade,
  session_id        uuid not null references sessions(id) on delete cascade,
  date              date not null,
  submission_depth  int not null check (submission_depth between 1 and 10),
  frustration_level int not null check (frustration_level between 1 and 10),
  headspace_tags    text[] not null default '{}',
  notes             text,
  created_at        timestamptz not null default now(),
  unique (user_id, date)
);

alter table mood_checkins enable row level security;

create policy "users own their checkins"
  on mood_checkins for all using (auth.uid() = user_id);
```

- [ ] **Step 2: Write punishment_pool migration**

Create `supabase/migrations/20260320_punishment_pool.sql`:

```sql
create table if not exists punishment_pool (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  title          text not null,
  description    text not null,
  severity       int not null check (severity between 1 and 5),
  requires_proof boolean not null default true,
  is_custom      boolean not null default false,
  created_at     timestamptz not null default now(),
  unique (user_id, title, is_custom)
);

alter table punishment_pool enable row level security;

create policy "users own their pool"
  on punishment_pool for all using (auth.uid() = user_id);
```

- [ ] **Step 3: Apply migrations in Supabase dashboard**

Go to Supabase Dashboard → SQL Editor → run each file in order. Confirm both tables appear in Table Editor.

- [ ] **Step 4: Add TypeScript types to schema.ts**

Read `src/lib/supabase/schema.ts`. Append after the last interface:

```typescript
export interface MoodCheckin {
  id: string
  user_id: string
  session_id: string
  date: string  // 'yyyy-MM-dd'
  submission_depth: number  // 1–10
  frustration_level: number  // 1–10
  headspace_tags: string[]
  notes: string | null
  created_at: string
}

export interface PunishmentPoolItem {
  id: string
  user_id: string
  title: string
  description: string
  severity: number  // 1–5
  requires_proof: boolean
  is_custom: boolean
  created_at: string
}
```

Also extend `TableName`:
```typescript
// Change the TableName type to add the two new tables:
export type TableName =
    | 'profiles'
    | 'sessions'
    | 'tasks'
    | 'chat_messages'
    | 'calendars'
    | 'achievements'
    | 'user_feedback'
    | 'journal_entries'
    | 'notifications'
    | 'regimens'
    | 'calendar_adjustments'
    | 'session_events'
    | 'proof_documents'
    | 'mood_checkins'
    | 'punishment_pool'
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/ src/lib/supabase/schema.ts
git commit -m "feat: add mood_checkins and punishment_pool migrations + TS types"
```

---

## Task 2: Punishment Pool Seed Engine

**Files:**
- Create: `src/lib/engines/punishment-wheel.ts`
- Modify: `src/app/api/sessions/start/route.ts`

- [ ] **Step 1: Create punishment-wheel engine with seed data and pure weighting function**

Create `src/lib/engines/punishment-wheel.ts`:

```typescript
import type { PunishmentPoolItem } from '@/lib/supabase/schema'

export const DEFAULT_POOL_SEED: Omit<PunishmentPoolItem, 'id' | 'user_id' | 'created_at'>[] = [
  { title: 'Corner Time',           description: 'Stand facing a corner for 20 minutes. No phone, no distractions.',                             severity: 1, requires_proof: false, is_custom: false },
  { title: 'Writing Lines',         description: 'Write "I am a locked, obedient slave" 50 times. Submit photo proof.',                         severity: 2, requires_proof: true,  is_custom: false },
  { title: 'Cold Shower',           description: 'Take a 3-minute cold shower immediately. Submit audio proof of discomfort.',                   severity: 2, requires_proof: true,  is_custom: false },
  { title: 'Mirror Inspection',     description: 'Stand naked before a mirror for 10 minutes. Recite your rules aloud.',                        severity: 2, requires_proof: true,  is_custom: false },
  { title: 'Humiliation Essay',     description: 'Write a 100-word essay on why you deserve to be locked. Submit text proof.',                  severity: 2, requires_proof: true,  is_custom: false },
  { title: 'Orgasm Denial Extension', description: 'No touching permitted for 24 hours.',                                                       severity: 3, requires_proof: false, is_custom: false },
  { title: 'Mantra Recording',      description: 'Record yourself saying "I am owned and grateful" 10 times. Submit audio.',                    severity: 3, requires_proof: true,  is_custom: false },
  { title: 'Exposure Challenge',    description: 'Take a mirror selfie (face not required). Saved locally only. Self-report.',                  severity: 3, requires_proof: false, is_custom: false },
  { title: 'Lock Time Extension',   description: '+2 hours added to session duration.',                                                          severity: 4, requires_proof: false, is_custom: false },
  { title: 'Edging Tease',          description: 'Edge yourself exactly 3 times without release. Submit text proof describing each.',           severity: 4, requires_proof: true,  is_custom: false },
  { title: 'Severe Extension',      description: '+4 hours added to session duration.',                                                          severity: 5, requires_proof: false, is_custom: false },
  { title: 'Ruins Only',            description: 'If you edge today, it must be a ruin. No clean orgasms for 48 hours.',                       severity: 5, requires_proof: false, is_custom: false },
]

/**
 * Builds a weighted punishment pool based on violation count.
 * Violations 0–2: uniform weight.
 * Violations 3–5: severity 1–2 halved, severity 4–5 doubled.
 * Violations 6+:  severity 1–2 excluded, severity 5 tripled.
 *
 * Uses integer repetitions (×2 base) to avoid floating-point sampling issues.
 */
export function buildWeightedPool(
  pool: PunishmentPoolItem[],
  violations: number,
): PunishmentPoolItem[] {
  return pool.flatMap((item) => {
    let weight: number
    if (violations <= 2) {
      weight = 1
    } else if (violations <= 5) {
      weight = item.severity <= 2 ? 0.5 : item.severity >= 4 ? 2 : 1
    } else {
      weight = item.severity <= 2 ? 0 : item.severity === 5 ? 3 : 1
    }
    const reps = Math.round(weight * 2)
    return Array<PunishmentPoolItem>(reps).fill(item)
  })
}

/** Pick a random item from a weighted pool. Throws if pool is empty. */
export function pickFromWeightedPool(pool: PunishmentPoolItem[]): PunishmentPoolItem {
  if (pool.length === 0) throw new Error('empty_pool')
  return pool[Math.floor(Math.random() * pool.length)]
}
```

- [ ] **Step 2: Add pool seeding to `/api/sessions/start`**

Read `src/app/api/sessions/start/route.ts`. After the `session_events` insert (around line 64), add the seed call before the final `return`:

```typescript
    // Seed default punishment pool (idempotent — ON CONFLICT DO NOTHING)
    const { DEFAULT_POOL_SEED } = await import('@/lib/engines/punishment-wheel')
    await supabase.from('punishment_pool').insert(
      DEFAULT_POOL_SEED.map((entry) => ({ ...entry, user_id: userId }))
    ).throwOnError()
    // Note: unique(user_id, title, is_custom) constraint silently ignores duplicates
    // when called on subsequent sessions — no separate count check needed.
```

Wait — Supabase JS `.insert()` doesn't have `ON CONFLICT DO NOTHING` by default. Use `.upsert()` with `ignoreDuplicates: true`:

```typescript
    // Seed default punishment pool (idempotent)
    const { DEFAULT_POOL_SEED } = await import('@/lib/engines/punishment-wheel')
    await supabase.from('punishment_pool').upsert(
      DEFAULT_POOL_SEED.map((entry) => ({ ...entry, user_id: userId })),
      { onConflict: 'user_id,title,is_custom', ignoreDuplicates: true }
    )
    // Errors here are non-fatal — don't block session creation
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/engines/punishment-wheel.ts src/app/api/sessions/start/route.ts
git commit -m "feat: add punishment wheel engine with seed data and weighted pool builder"
```

---

## Task 3: Mood Check-in API + Tests

**Files:**
- Create: `src/app/api/mood/checkin/route.ts`
- Create: `src/__tests__/mood-checkin.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/mood-checkin.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Chainable Supabase mock ─────────────────────────────────────
const mockUpsert = vi.fn()
const mockUpdate = vi.fn()
const mockInsert = vi.fn()
const mockMaybeSingle = vi.fn()
const mockEq = vi.fn()
const mockSelect = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  getServerSupabase: () => ({
    from: vi.fn((table: string) => {
      if (table === 'mood_checkins') return { upsert: mockUpsert }
      if (table === 'sessions') return { select: mockSelect, update: mockUpdate }
      if (table === 'session_events') return { insert: mockInsert }
      return {}
    }),
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  mockMaybeSingle.mockResolvedValue({ data: null, error: null })
  mockSelect.mockReturnValue({ eq: mockEq })
  mockEq.mockReturnValue({ eq: mockEq, maybeSingle: mockMaybeSingle })
  mockUpdate.mockReturnValue({ eq: mockEq })
  mockUpsert.mockResolvedValue({ data: [{ id: 'c1', date: '2026-03-20' }], error: null })
  mockInsert.mockResolvedValue({ error: null })
})

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/mood/checkin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/mood/checkin', () => {
  it('returns 400 when userId is missing', async () => {
    const { POST } = await import('@/app/api/mood/checkin/route')
    const res = await POST(makeRequest({ sessionId: 's1', submissionDepth: 5, frustrationLevel: 3, headspaceTags: [] }) as never)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('missing_fields')
  })

  it('returns 400 when submissionDepth is out of range', async () => {
    const { POST } = await import('@/app/api/mood/checkin/route')
    const res = await POST(makeRequest({ userId: 'u1', sessionId: 's1', submissionDepth: 11, frustrationLevel: 5, headspaceTags: [] }) as never)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('invalid_depth')
  })

  it('returns 400 when headspaceTag is not in whitelist', async () => {
    const { POST } = await import('@/app/api/mood/checkin/route')
    const res = await POST(makeRequest({ userId: 'u1', sessionId: 's1', submissionDepth: 5, frustrationLevel: 3, headspaceTags: ['unknown_tag'] }) as never)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('invalid_tag')
  })

  it('returns 403 when no active session found', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
    const { POST } = await import('@/app/api/mood/checkin/route')
    const res = await POST(makeRequest({ userId: 'u1', sessionId: 's1', submissionDepth: 5, frustrationLevel: 3, headspaceTags: [] }) as never)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('no_active_session')
  })

  it('returns 200 and upserts on valid input with active session', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { id: 's1', care_mode_active: false }, error: null })
    const { POST } = await import('@/app/api/mood/checkin/route')
    const res = await POST(makeRequest({ userId: 'u1', sessionId: 's1', submissionDepth: 7, frustrationLevel: 4, headspaceTags: ['needy', 'floaty'] }) as never)
    expect(res.status).toBe(200)
    expect(mockUpsert).toHaveBeenCalledOnce()
  })

  it('triggers care mode when frustration >= 8 and tag is broken', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { id: 's1', care_mode_active: false }, error: null })
    const { POST } = await import('@/app/api/mood/checkin/route')
    await POST(makeRequest({ userId: 'u1', sessionId: 's1', submissionDepth: 3, frustrationLevel: 8, headspaceTags: ['broken'] }) as never)
    expect(mockUpdate).toHaveBeenCalled()
    expect(mockInsert).toHaveBeenCalled()
  })

  it('skips care mode update when care_mode_active is already true', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { id: 's1', care_mode_active: true }, error: null })
    const { POST } = await import('@/app/api/mood/checkin/route')
    await POST(makeRequest({ userId: 'u1', sessionId: 's1', submissionDepth: 3, frustrationLevel: 9, headspaceTags: ['desperate'] }) as never)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('skips care mode when frustration < 8', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { id: 's1', care_mode_active: false }, error: null })
    const { POST } = await import('@/app/api/mood/checkin/route')
    await POST(makeRequest({ userId: 'u1', sessionId: 's1', submissionDepth: 7, frustrationLevel: 7, headspaceTags: ['broken'] }) as never)
    expect(mockUpdate).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests — confirm they all fail**

```bash
npx vitest run src/__tests__/mood-checkin.test.ts
```

Expected: all tests FAIL with "Cannot find module '@/app/api/mood/checkin/route'"

- [ ] **Step 3: Implement the route**

Create `src/app/api/mood/checkin/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'
import { format } from 'date-fns'

export const VALID_HEADSPACE_TAGS = [
  'needy', 'floaty', 'defiant', 'broken',
  'eager', 'desperate', 'content', 'frustrated',
] as const

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, sessionId, submissionDepth, frustrationLevel, headspaceTags, notes } = body as {
      userId?: string
      sessionId?: string
      submissionDepth?: number
      frustrationLevel?: number
      headspaceTags?: string[]
      notes?: string
    }

    if (!userId || !sessionId || submissionDepth == null || frustrationLevel == null || !headspaceTags) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
    }
    if (submissionDepth < 1 || submissionDepth > 10) {
      return NextResponse.json({ error: 'invalid_depth' }, { status: 400 })
    }
    if (frustrationLevel < 1 || frustrationLevel > 10) {
      return NextResponse.json({ error: 'invalid_frustration' }, { status: 400 })
    }
    for (const tag of headspaceTags) {
      if (!(VALID_HEADSPACE_TAGS as readonly string[]).includes(tag)) {
        return NextResponse.json({ error: 'invalid_tag' }, { status: 400 })
      }
    }
    if (notes && notes.length > 280) {
      return NextResponse.json({ error: 'notes_too_long' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    // Verify active session
    const { data: session } = await supabase
      .from('sessions')
      .select('id, care_mode_active')
      .eq('user_id', userId)
      .eq('id', sessionId)
      .maybeSingle()

    if (!session) {
      return NextResponse.json({ error: 'no_active_session' }, { status: 403 })
    }

    // Upsert check-in
    const today = format(new Date(), 'yyyy-MM-dd')
    const { data: checkin } = await supabase
      .from('mood_checkins')
      .upsert(
        {
          user_id: userId,
          session_id: sessionId,
          date: today,
          submission_depth: submissionDepth,
          frustration_level: frustrationLevel,
          headspace_tags: headspaceTags,
          notes: notes ?? null,
        },
        { onConflict: 'user_id,date' }
      )

    // Care mode auto-trigger
    const careTriggerTags = ['broken', 'desperate']
    const shouldTrigger =
      frustrationLevel >= 8 &&
      headspaceTags.some((t) => careTriggerTags.includes(t)) &&
      !session.care_mode_active

    if (shouldTrigger) {
      await supabase
        .from('sessions')
        .update({ care_mode_active: true })
        .eq('id', sessionId)

      await supabase.from('session_events').insert({
        session_id: sessionId,
        user_id: userId,
        event_type: 'care_mode_triggered',
        payload: { trigger: 'mood_checkin', frustration_level: frustrationLevel },
      })
    }

    return NextResponse.json({ checkin: checkin ?? null }, { status: 200 })
  } catch (err) {
    console.error('[Mood/Checkin]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run tests — confirm they all pass**

```bash
npx vitest run src/__tests__/mood-checkin.test.ts
```

Expected: all 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/mood/ src/__tests__/mood-checkin.test.ts
git commit -m "feat: add mood check-in API with care mode trigger (TDD)"
```

---

## Task 4: Context Builder + Chat Route Update

**Files:**
- Modify: `src/lib/ai/context-builder.ts`
- Modify: `src/app/api/chat/route.ts`

- [ ] **Step 1: Update buildProfileSummary to accept optional mood**

Read `src/lib/ai/context-builder.ts`. The current signature is:
```typescript
export function buildProfileSummary(profile: UserProfile, extras?: { journalTitles?: string[]; userTaskTitles?: string[] }): string
```

Add a `latestMood` optional third parameter. This enables future server-side callers to pass mood directly. The chat route (Step 2) uses a different append approach because it receives a pre-built string from the client — both approaches coexist without conflict.

Replace the function with:

```typescript
import type { UserProfile, MoodCheckin } from '@/lib/supabase/schema'

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
```

All existing callers pass only 1 or 2 args — the optional third param means zero breaking changes.

- [ ] **Step 2: Fetch latestMood in /api/chat and pass to buildProfileSummary**

Read `src/app/api/chat/route.ts`. Find the location where `profileSummary` is used (it's received in the request body). The chat route already accepts a pre-built `profileSummary` string from the client.

The simplest integration: fetch `latestMood` server-side in the chat route and append it to the incoming `profileSummary` string. Find the section where `profileSummary` is used to construct the AI system prompt and insert:

```typescript
    // Fetch latest mood check-in to enrich AI context
    let moodSuffix = ''
    if (userId) {
      const { data: latestMood } = await supabase
        .from('mood_checkins')
        .select('submission_depth, frustration_level, headspace_tags')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (latestMood) {
        moodSuffix = ` | mood:depth=${latestMood.submission_depth},frust=${latestMood.frustration_level},tags=[${latestMood.headspace_tags.join(',')}]`
      }
    }
```

Insert the mood fetch block immediately before the `const compactSystem = profileSummary` line (around line 89 in the current file). Then on the `User: ${profileSummary}` line inside `compactSystem`, change it to `User: ${profileSummary}${moodSuffix}`.

- [ ] **Step 3: Run existing tests to confirm nothing broke**

```bash
npx vitest run src/__tests__/chat-api.test.ts
```

Expected: all existing tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/ai/context-builder.ts src/app/api/chat/route.ts
git commit -m "feat: pass latest mood check-in into AI chat context"
```

---

## Task 5: Mood Check-in Modal + Home Page Integration

**Files:**
- Create: `src/components/features/mood/mood-checkin-modal.tsx`
- Modify: `src/app/(dashboard)/home/page.tsx`

- [ ] **Step 1: Create the mood check-in modal component**

Create `src/components/features/mood/mood-checkin-modal.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

const HEADSPACE_TAGS = ['needy', 'floaty', 'defiant', 'broken', 'eager', 'desperate', 'content', 'frustrated'] as const
type HeadspaceTag = typeof HEADSPACE_TAGS[number]

interface Props {
  userId: string
  sessionId: string
  onClose: () => void
  onSubmitted: () => void
}

export function MoodCheckinModal({ userId, sessionId, onClose, onSubmitted }: Props) {
  const [submissionDepth, setSubmissionDepth] = useState(5)
  const [frustrationLevel, setFrustrationLevel] = useState(5)
  const [selectedTags, setSelectedTags] = useState<HeadspaceTag[]>([])
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const toggleTag = (tag: HeadspaceTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleSkip = () => {
    // Persist skip for this session in sessionStorage so the modal
    // doesn't re-appear on tab switch within the same browser session.
    sessionStorage.setItem(`skip-mood-checkin-${sessionId}`, '1')
    onClose()
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/mood/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sessionId, submissionDepth, frustrationLevel, headspaceTags: selectedTags, notes: notes || undefined }),
      })
      if (!res.ok) throw new Error('Failed to submit check-in')
      onSubmitted()
    } catch (err) {
      console.error('[MoodCheckin]', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-bg-secondary border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold">How are you feeling?</h2>
            <p className="text-xs text-text-tertiary mt-0.5">Daily check-in · Shapes your AI&apos;s tone today</p>
          </div>
          <button onClick={handleSkip} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
            <X size={18} className="text-text-tertiary" />
          </button>
        </div>

        {/* Submission Depth slider */}
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">Submission Depth</span>
            <span className="text-xs font-mono text-purple-primary">{submissionDepth}/10</span>
          </div>
          <input
            type="range" min={1} max={10} value={submissionDepth}
            onChange={(e) => setSubmissionDepth(Number(e.target.value))}
            className="w-full accent-purple-500"
          />
        </div>

        {/* Frustration Level slider */}
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">Frustration Level</span>
            <span className="text-xs font-mono text-red-primary">{frustrationLevel}/10</span>
          </div>
          <input
            type="range" min={1} max={10} value={frustrationLevel}
            onChange={(e) => setFrustrationLevel(Number(e.target.value))}
            className="w-full accent-red-500"
          />
        </div>

        {/* Headspace tags */}
        <div>
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-2">Headspace</p>
          <div className="flex flex-wrap gap-2">
            {HEADSPACE_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-purple-primary/20 border-purple-primary text-purple-primary'
                    : 'bg-bg-tertiary border-white/10 text-text-secondary hover:border-white/20'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">Notes</span>
            <span className="text-xs text-text-tertiary">{notes.length}/280</span>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 280))}
            placeholder="Optional thoughts..."
            rows={2}
            className="w-full bg-bg-tertiary border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary resize-none focus:outline-none focus:border-purple-primary/50"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={handleSkip} className="flex-1 text-sm text-text-tertiary hover:text-text-secondary transition-colors">
            Skip for now
          </button>
          <Button variant="primary" className="flex-1" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Check-in'}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire mood modal into home page**

Read `src/app/(dashboard)/home/page.tsx`. Make these changes:

**A. Add state variables** (near other `useState` declarations):
```typescript
const [hasTodayCheckin, setHasTodayCheckin] = useState(true) // default true to prevent flash
const [showMoodModal, setShowMoodModal] = useState(false)
```

**B. Add mood check-in fetch inside `loadDashboard()`** (parallel with existing fetches):
```typescript
// Inside loadDashboard(), after getActiveSession():
const { data: todayCheckin } = await getSupabase()
  .from('mood_checkins')
  .select('id')
  .eq('user_id', user.id)
  .eq('date', new Date().toISOString().split('T')[0])
  .maybeSingle()

const skipped = sessionStorage.getItem(`skip-mood-checkin-${activeSession?.id}`)
setHasTodayCheckin(!!todayCheckin || !!skipped)
```

**C. Trigger modal after data loads** — after `setLoading(false)`:
```typescript
if (activeSession && !todayCheckin && !skipped) {
  setShowMoodModal(true)
}
```

**D. Add import** at top:
```typescript
import { MoodCheckinModal } from '@/components/features/mood/mood-checkin-modal'
```

**E. Add modal render** before `<BottomNav />`:
```typescript
{showMoodModal && session && user && (
  <MoodCheckinModal
    userId={user.id}
    sessionId={session.id}
    onClose={() => setShowMoodModal(false)}
    onSubmitted={() => { setShowMoodModal(false); setHasTodayCheckin(true) }}
  />
)}
```

**F. Add "Check In" quick-action card** to the BentoGrid (alongside existing Achievements/Regimens links):
```typescript
// Inside the Quick Access BentoItem grid, add:
<button
  onClick={() => setShowMoodModal(true)}
  className="p-3 bg-bg-tertiary hover:bg-bg-hover rounded-[var(--radius-md)] border border-white/5 transition-colors flex items-center gap-2"
>
  <span className="text-base">🧠</span>
  <span className="text-sm font-medium">
    {hasTodayCheckin ? 'Update Mood' : 'Check In'}
  </span>
</button>
```

- [ ] **Step 3: Start dev server and manually verify**

```bash
npm run dev
```

1. Navigate to `/home` with an active session
2. Confirm mood modal appears on first load
3. Submit a check-in — confirm modal closes
4. Refresh — confirm modal does NOT re-appear (today's check-in exists)
5. Click "Check In" card — confirm modal opens again for updating
6. Click "Skip for now" — confirm modal closes and stays closed on tab switch

- [ ] **Step 4: Commit**

```bash
git add src/components/features/mood/ src/app/(dashboard)/home/page.tsx
git commit -m "feat: add mood check-in modal with home page integration"
```

---

## Task 6: Session Replay UI

**Files:**
- Create: `src/components/features/history/session-list.tsx`
- Create: `src/components/features/history/session-detail.tsx`
- Create: `src/app/(dashboard)/history/page.tsx`
- Create: `src/app/(dashboard)/history/[sessionId]/page.tsx`

- [ ] **Step 0: Verify SessionArchive interface**

Read `src/lib/local-storage/session-archive.ts`. Confirm the exported `SessionArchive` interface has these fields: `sessionId`, `session_data`, `session_events`, `tasks`, `chat_messages`, `summary`, `createdAt`. If any field names differ (e.g. `session_id` vs `sessionId`), update all components in the steps below before writing them.

- [ ] **Step 1: Create session-list component**

Create `src/components/features/history/session-list.tsx`:

```typescript
'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { format } from 'date-fns'
import type { SessionArchive } from '@/lib/local-storage/session-archive'

interface Props {
  archives: SessionArchive[]
}

function gradeColor(grade: string) {
  if (!grade) return 'text-text-tertiary'
  if (grade.startsWith('A')) return 'text-teal-primary'
  if (grade.startsWith('B')) return 'text-tier-slave'
  return 'text-red-primary'
}

export function SessionList({ archives }: Props) {
  if (archives.length === 0) {
    return (
      <Card variant="flat" className="text-center py-12">
        <p className="text-text-tertiary mb-2">No archived sessions yet.</p>
        <p className="text-xs text-text-tertiary">Complete your first session to see it here.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {archives.map((archive) => {
        const data = archive.session_data as Record<string, unknown>
        const summary = archive.summary as Record<string, unknown> | null
        const grade = typeof summary?.performance_grade === 'string' ? summary.performance_grade : ''
        const compliance = typeof summary?.compliance_rate === 'number' ? summary.compliance_rate : null
        const personality = typeof data?.ai_personality === 'string' ? data.ai_personality : 'Unknown'
        const startTime = typeof data?.start_time === 'string' ? data.start_time : ''
        const endTime = typeof data?.actual_end_time === 'string' ? data.actual_end_time : ''
        const durationMin = typeof data?.total_duration_minutes === 'number' ? data.total_duration_minutes : 0

        return (
          <Link key={archive.sessionId} href={`/history/${archive.sessionId}`}>
            <Card
              variant="raised"
              className="hover:border-purple-primary/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base">{personality}</h3>
                    {grade && (
                      <span className={`text-lg font-black font-mono ${gradeColor(grade)}`}>{grade}</span>
                    )}
                  </div>
                  <p className="text-xs text-text-tertiary font-mono">
                    {startTime ? format(new Date(startTime), 'MMM d') : '?'}
                    {endTime ? ` → ${format(new Date(endTime), 'MMM d, yyyy')}` : ''}
                    {' · '}
                    {Math.round(durationMin / 60 / 24)} days
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {compliance !== null && (
                    <Badge variant="info">{compliance}% compliance</Badge>
                  )}
                  <Badge variant="genre">
                    {(archive.tasks as unknown[]).length} tasks
                  </Badge>
                </div>
              </div>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Create session-detail component**

Create `src/components/features/history/session-detail.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { exportSessionZip } from '@/lib/local-storage/export'
import type { SessionArchive } from '@/lib/local-storage/session-archive'

type Tab = 'timeline' | 'chat' | 'proofs' | 'export'

interface Props {
  archive: SessionArchive
  userId: string
}

export function SessionDetail({ archive, userId }: Props) {
  const [tab, setTab] = useState<Tab>('timeline')
  const [chatPage, setChatPage] = useState(0)
  const [exporting, setExporting] = useState(false)
  const PAGE_SIZE = 50

  const data = archive.session_data as Record<string, unknown>
  const summary = archive.summary as Record<string, unknown> | null
  const events = (archive.session_events as Array<Record<string, unknown>>).sort(
    (a, b) => new Date(a.created_at as string).getTime() - new Date(b.created_at as string).getTime()
  )
  const tasks = archive.tasks as Array<Record<string, unknown>>
  const messages = (archive.chat_messages as Array<Record<string, unknown>>).sort(
    (a, b) => new Date(a.created_at as string).getTime() - new Date(b.created_at as string).getTime()
  )
  const chatSlice = messages.slice(chatPage * PAGE_SIZE, (chatPage + 1) * PAGE_SIZE)

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportSessionZip(archive.sessionId, userId)
    } finally {
      setExporting(false)
    }
  }

  const dotColor = (eventType: string, status?: string) => {
    if (eventType === 'mood_checkin') return 'bg-tier-slave'
    if (status === 'completed' || status === 'verified') return 'bg-teal-primary'
    if (status === 'failed' || status === 'overdue') return 'bg-red-primary'
    return 'bg-purple-primary'
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card variant="hero" className="space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold">{String(data.ai_personality ?? 'Session')}</h2>
            <p className="text-xs text-text-tertiary font-mono mt-0.5">
              {data.start_time ? format(new Date(data.start_time as string), 'MMM d') : '?'}
              {' → '}
              {data.actual_end_time ? format(new Date(data.actual_end_time as string), 'MMM d, yyyy') : 'ongoing'}
            </p>
          </div>
          {summary?.performance_grade && (
            <span className="text-3xl font-black font-mono text-teal-primary">
              {String(summary.performance_grade)}
            </span>
          )}
        </div>
        {summary?.narrative && (
          <p className="text-sm text-text-secondary italic leading-relaxed">
            {String(summary.narrative)}
          </p>
        )}
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-0">
        {(['timeline', 'chat', 'proofs', 'export'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
              tab === t ? 'border-purple-primary text-purple-primary' : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Timeline tab */}
      {tab === 'timeline' && (
        <div className="space-y-2">
          {events.map((ev, i) => {
            const relatedTask = tasks.find((t) => t.id === (ev.payload as Record<string, unknown>)?.task_id)
            return (
              <div key={i} className="flex gap-3 items-start">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dotColor(ev.event_type as string, relatedTask?.status as string)}`} />
                <div>
                  <p className="text-sm font-medium capitalize">
                    {String(ev.event_type).replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-text-tertiary font-mono">
                    {ev.created_at ? format(new Date(ev.created_at as string), 'MMM d · h:mm a') : ''}
                  </p>
                </div>
              </div>
            )
          })}
          {events.length === 0 && (
            <p className="text-sm text-text-tertiary">No events recorded.</p>
          )}
        </div>
      )}

      {/* Chat tab */}
      {tab === 'chat' && (
        <div className="space-y-3">
          {chatSlice.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                msg.sender === 'user'
                  ? 'bg-purple-primary/20 text-text-primary'
                  : 'bg-bg-tertiary text-text-secondary'
              }`}>
                {String(msg.content)}
              </div>
            </div>
          ))}
          <div className="flex justify-between pt-2">
            <Button variant="ghost" size="sm" disabled={chatPage === 0} onClick={() => setChatPage(p => p - 1)}>← Prev</Button>
            <span className="text-xs text-text-tertiary self-center">
              {chatPage * PAGE_SIZE + 1}–{Math.min((chatPage + 1) * PAGE_SIZE, messages.length)} of {messages.length}
            </span>
            <Button variant="ghost" size="sm" disabled={(chatPage + 1) * PAGE_SIZE >= messages.length} onClick={() => setChatPage(p => p + 1)}>Next →</Button>
          </div>
        </div>
      )}

      {/* Proofs tab */}
      {tab === 'proofs' && (
        <div>
          <p className="text-sm text-text-tertiary">
            Proofs are stored locally on your device in OPFS. Use Export to download them.
          </p>
        </div>
      )}

      {/* Export tab */}
      {tab === 'export' && (
        <div className="text-center py-8 space-y-4">
          <p className="text-sm text-text-secondary">
            Download a ZIP containing the full session transcript, task log, events, and any stored proof files.
          </p>
          <Button variant="primary" onClick={handleExport} disabled={exporting}>
            {exporting ? 'Preparing ZIP...' : '📦 Download Session ZIP'}
          </Button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create /history page**

Create `src/app/(dashboard)/history/page.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { TopBar } from '@/components/layout/top-bar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { SessionList } from '@/components/features/history/session-list'
import { listUserArchives } from '@/lib/local-storage/session-archive'
import { useAuth } from '@/lib/contexts/auth-context'
import { Loader2 } from 'lucide-react'
import type { SessionArchive } from '@/lib/local-storage/session-archive'

export default function HistoryPage() {
  const { user } = useAuth()
  const [archives, setArchives] = useState<SessionArchive[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    listUserArchives(user.id)
      .then((data) => setArchives(data.sort((a, b) => b.createdAt - a.createdAt)))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  return (
    <>
      <TopBar />
      <div className="min-h-screen pb-24 lg:pb-8 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold">Session History</h1>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-purple-primary" />
            </div>
          ) : (
            <SessionList archives={archives} />
          )}
        </div>
      </div>
      <BottomNav />
    </>
  )
}
```

- [ ] **Step 4: Create /history/[sessionId] page**

Create `src/app/(dashboard)/history/[sessionId]/page.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TopBar } from '@/components/layout/top-bar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { SessionDetail } from '@/components/features/history/session-detail'
import { getSessionArchive } from '@/lib/local-storage/session-archive'
import { useAuth } from '@/lib/contexts/auth-context'
import { Loader2, ChevronLeft } from 'lucide-react'
import type { SessionArchive } from '@/lib/local-storage/session-archive'

export default function SessionDetailPage() {
  const { user } = useAuth()
  const { sessionId } = useParams<{ sessionId: string }>()
  const router = useRouter()
  const [archive, setArchive] = useState<SessionArchive | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) return
    getSessionArchive(sessionId)
      .then(setArchive)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [sessionId])

  return (
    <>
      <TopBar />
      <div className="min-h-screen pb-24 lg:pb-8 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-secondary transition-colors"
          >
            <ChevronLeft size={16} /> Back to History
          </button>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-purple-primary" />
            </div>
          ) : archive && user ? (
            <SessionDetail archive={archive} userId={user.id} />
          ) : (
            <p className="text-text-tertiary text-center py-12">Session not found in local storage.</p>
          )}
        </div>
      </div>
      <BottomNav />
    </>
  )
}
```

- [ ] **Step 5: Manually verify**

```bash
npm run dev
```

Navigate to `/history`. With no archives: confirm empty state. After completing a session and seeing it archived, confirm it appears in the list. Click a session → confirm detail page loads with timeline tab showing events.

- [ ] **Step 6: Commit**

```bash
git add src/components/features/history/ src/app/(dashboard)/history/
git commit -m "feat: add session replay UI (/history + /history/[sessionId])"
```

---

## Task 7: Calendar Upgrade

**Files:**
- Modify: `src/app/(dashboard)/calendar/page.tsx`

- [ ] **Step 1: Read the existing calendar page in full**

Read `src/app/(dashboard)/calendar/page.tsx`. Understand all existing state, fetches, and render logic before editing.

- [ ] **Step 2: Add new state and data fetching**

Add imports at the top:
```typescript
import { useRouter } from 'next/navigation'
import type { MoodCheckin } from '@/lib/supabase/schema'
```

Add state variables:
```typescript
const router = useRouter()
const [overlays, setOverlays] = useState<Set<string>>(new Set(['tasks']))
const [moodByDate, setMoodByDate] = useState<Record<string, MoodCheckin>>({})
const [sessionDaySet, setSessionDaySet] = useState<Set<string>>(new Set())
const [punishDaySet, setPunishDaySet] = useState<Set<string>>(new Set())
const [selectedDay, setSelectedDay] = useState<Date | null>(null)
const [taskDetailByDate, setTaskDetailByDate] = useState<Record<string, { completed: number; failed: number }>>({})
```

Inside `loadCalendar()`, add parallel fetches after existing ones:
```typescript
// Mood check-ins (all time — for any month the user navigates to)
const { data: moods } = await supabase
  .from('mood_checkins')
  .select('date, submission_depth, frustration_level, headspace_tags')
  .eq('user_id', user!.id)

const moodMap: Record<string, MoodCheckin> = {}
for (const m of moods ?? []) {
  moodMap[m.date] = m as MoodCheckin
}
setMoodByDate(moodMap)

// All sessions for ring overlay
const { data: allSessions } = await supabase
  .from('sessions')
  .select('id, start_time, scheduled_end_time')
  .eq('user_id', user!.id)
  .order('start_time', { ascending: false })
  .limit(50)

const daySet = new Set<string>()
for (const s of allSessions ?? []) {
  const start = new Date(s.start_time)
  const end = new Date(s.scheduled_end_time)
  const curr = new Date(start)
  while (curr <= end) {
    daySet.add(format(curr, 'yyyy-MM-dd'))
    curr.setDate(curr.getDate() + 1)
  }
}
setSessionDaySet(daySet)

// Build taskDetailByDate alongside existing dayRatings (same task fetch)
// The existing loop builds dayRatings (net score). Add detail tracking:
const detailMap: Record<string, { completed: number; failed: number }> = {}
for (const task of tasks ?? []) {
  const date = format(new Date(task.created_at), 'yyyy-MM-dd')
  if (!detailMap[date]) detailMap[date] = { completed: 0, failed: 0 }
  if (task.status === 'completed') detailMap[date].completed += 1
  if (task.status === 'failed') detailMap[date].failed += 1
}
setTaskDetailByDate(detailMap)

// Note: the existing dayRatings loop remains unchanged — both run over the same `tasks` array.

// Punishment day set from adjustments (already loaded as `adjusts`)
const pSet = new Set<string>()
for (const a of adjusts ?? []) {
  if (a.hours_added > 0) pSet.add(format(new Date(a.created_at), 'yyyy-MM-dd'))
}
setPunishDaySet(pSet)
```

- [ ] **Step 3: Add overlay toggle chips above the calendar grid**

Inside the `Card variant="raised"` that contains the calendar, add before the day headers grid:

```typescript
{/* Overlay toggles */}
<div className="flex flex-wrap gap-2 mb-3">
  {[
    { key: 'tasks', label: 'Tasks' },
    { key: 'mood', label: 'Mood' },
    { key: 'sessions', label: 'Sessions' },
    { key: 'punish', label: 'Punish' },
  ].map(({ key, label }) => (
    <button
      key={key}
      onClick={() => setOverlays((prev) => {
        const next = new Set(prev)
        next.has(key) ? next.delete(key) : next.add(key)
        return next
      })}
      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
        overlays.has(key)
          ? 'bg-purple-primary/20 border-purple-primary text-purple-primary'
          : 'bg-bg-tertiary border-white/10 text-text-tertiary'
      }`}
    >
      {label}
    </button>
  ))}
</div>
```

- [ ] **Step 4: Enrich day cells with overlay dots and click handler**

Replace the existing day cell render block. The existing code renders a `<div>` per day. Add overlays and click handler:

```typescript
{daysInMonth.map((day) => {
  const isReleaseDay = releaseDate && isSameDay(day, releaseDate)
  const isToday = isSameDay(day, new Date())
  const dayType = getDayType(day)
  const dateKey = format(day, 'yyyy-MM-dd')
  const mood = moodByDate[dateKey]
  const inSession = sessionDaySet.has(dateKey)
  const hasPunish = punishDaySet.has(dateKey)

  const moodDotColor = (tags: string[]) => {
    if (tags.some(t => ['broken', 'frustrated', 'defiant'].includes(t))) return 'bg-red-primary'
    if (tags.some(t => ['needy', 'desperate'].includes(t))) return 'bg-tier-slave'
    return 'bg-teal-primary'
  }

  const dayColors = {
    good: 'bg-tier-newbie/20 text-tier-newbie',
    mixed: 'bg-tier-slave/20 text-tier-slave',
    bad: 'bg-red-primary/20 text-red-primary',
  }

  return (
    <div
      key={day.toString()}
      onClick={() => setSelectedDay(isSameDay(day, selectedDay ?? new Date('invalid')) ? null : day)}
      className={`aspect-square flex items-center justify-center rounded-[var(--radius-sm)] text-sm font-mono transition-all cursor-pointer hover:ring-1 hover:ring-purple-primary/30 relative ${
        isToday
          ? 'bg-purple-primary text-white font-bold ring-2 ring-purple-primary/50'
          : isReleaseDay
          ? 'bg-red-primary text-white font-bold glow-red'
          : overlays.has('tasks') && dayType
          ? dayColors[dayType]
          : 'text-text-secondary hover:bg-bg-tertiary'
      } ${overlays.has('sessions') && inSession ? 'ring-1 ring-purple-primary/40' : ''}`}
    >
      {format(day, 'd')}
      {/* Mood dot */}
      {overlays.has('mood') && mood && (
        <span className={`absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${moodDotColor(mood.headspace_tags)}`} />
      )}
      {/* Punish indicator */}
      {overlays.has('punish') && hasPunish && (
        <span className="absolute top-0.5 left-0.5 text-[8px] leading-none">⚠</span>
      )}
    </div>
  )
})}
```

- [ ] **Step 5: Add day detail slide-up panel**

Add after the calendar Card's closing tag (before the Adjustment Log section):

```typescript
{/* Day detail panel */}
{selectedDay && (
  <Card variant="raised" className="animate-fade-in">
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-semibold">{format(selectedDay, 'MMMM d, yyyy')}</h3>
      {sessionDaySet.has(format(selectedDay, 'yyyy-MM-dd')) && (
        <button
          onClick={() => router.push('/history')}
          className="text-xs text-teal-primary hover:underline"
        >
          ↗ Past Sessions
        </button>
      )}
    </div>
    {selectedDay > new Date() ? (
      <p className="text-sm text-text-tertiary">No data yet for future dates.</p>
    ) : (
      <div className="space-y-3 text-sm">
        {/* Task counts */}
        {(() => {
          const dateKey = format(selectedDay, 'yyyy-MM-dd')
          const detail = taskDetailByDate[dateKey]
          if (!detail) return <p className="text-text-tertiary text-xs">No tasks recorded for this day.</p>
          return (
            <div className="flex gap-4 text-sm">
              <span className="text-teal-primary">✅ {detail.completed} completed</span>
              <span className="text-red-primary">❌ {detail.failed} failed</span>
            </div>
          )
        })()}
        {/* Mood check-in */}
        {(() => {
          const m = moodByDate[format(selectedDay, 'yyyy-MM-dd')]
          if (!m) return <p className="text-text-tertiary text-xs">No mood check-in for this day.</p>
          return (
            <div className="bg-bg-tertiary rounded-lg p-3 space-y-1">
              <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">Mood Check-in</p>
              <div className="flex gap-3 text-xs">
                <span className="text-purple-primary">Depth {m.submission_depth}/10</span>
                <span className="text-red-primary">Frust {m.frustration_level}/10</span>
              </div>
              {m.headspace_tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {m.headspace_tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] bg-purple-primary/10 text-purple-primary">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )
        })()}
        {/* Punishment adjustments */}
        {adjustments.filter(a => format(new Date(a.created_at), 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd')).map(a => (
          <div key={a.id} className="text-xs text-red-primary">
            ⚠ +{a.hours_added}h — {a.reason}
          </div>
        ))}
      </div>
    )}
  </Card>
)}
```

- [ ] **Step 6: Add "Past Sessions" button to calendar header**

Find the `<h1 className="text-3xl font-bold">Calendar</h1>` and replace with:
```typescript
<div className="flex items-center justify-between">
  <h1 className="text-3xl font-bold">Calendar</h1>
  <button
    onClick={() => router.push('/history')}
    className="text-sm text-text-tertiary hover:text-text-secondary transition-colors flex items-center gap-1"
  >
    Past Sessions ↗
  </button>
</div>
```

- [ ] **Step 7: Manually verify in dev**

```bash
npm run dev
```

1. Navigate to `/calendar`
2. Toggle each overlay chip — confirm day cells react (mood dots, session rings, punish icons)
3. Click a past day — confirm detail panel slides in with tasks/mood data
4. Click "Past Sessions" → confirm navigates to `/history`

- [ ] **Step 8: Commit**

```bash
git add src/app/(dashboard)/calendar/page.tsx
git commit -m "feat: calendar upgrade with overlays and day detail panel"
```

---

## Task 8: Punishment Pool CRUD API + Tests

**Files:**
- Create: `src/app/api/punishment-pool/route.ts`
- Create: `src/app/api/punishment-pool/[id]/route.ts`
- Create: `src/__tests__/punishment-pool.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/punishment-pool.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockDelete = vi.fn()
const mockEq = vi.fn()
const mockMaybeSingle = vi.fn()
const mockCount = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  getServerSupabase: () => ({
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      delete: mockDelete,
    })),
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  mockSelect.mockReturnValue({ eq: mockEq })
  mockEq.mockReturnValue({ eq: mockEq, maybeSingle: mockMaybeSingle, data: [], error: null })
  mockMaybeSingle.mockResolvedValue({ data: null, error: null })
  mockInsert.mockReturnValue({ select: mockSelect })
  mockDelete.mockReturnValue({ eq: mockEq })
})

describe('GET /api/punishment-pool', () => {
  it('returns 403 when userId is missing', async () => {
    const { GET } = await import('@/app/api/punishment-pool/route')
    const req = new Request('http://localhost/api/punishment-pool', { method: 'GET' })
    const res = await GET(req as never)
    expect(res.status).toBe(403)
  })

  it('returns 200 with pool data', async () => {
    mockEq.mockReturnValueOnce({ data: [{ id: 'p1', title: 'Corner Time', is_custom: false }], error: null })
    const { GET } = await import('@/app/api/punishment-pool/route')
    const req = new Request('http://localhost/api/punishment-pool?userId=u1', { method: 'GET' })
    const res = await GET(req as never)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.pool).toBeDefined()
  })
})

describe('POST /api/punishment-pool', () => {
  it('returns 400 when title is missing', async () => {
    const { POST } = await import('@/app/api/punishment-pool/route')
    const req = new Request('http://localhost/api/punishment-pool', {
      method: 'POST',
      body: JSON.stringify({ userId: 'u1', description: 'desc', severity: 2, requiresProof: true }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })

  it('returns 400 when severity is out of range', async () => {
    const { POST } = await import('@/app/api/punishment-pool/route')
    const req = new Request('http://localhost/api/punishment-pool', {
      method: 'POST',
      body: JSON.stringify({ userId: 'u1', title: 'My Punishment', description: 'desc', severity: 6, requiresProof: true }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/punishment-pool/[id]', () => {
  it('returns 403 when entry is not custom', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { id: 'p1', is_custom: false, user_id: 'u1' }, error: null })
    const { DELETE } = await import('@/app/api/punishment-pool/[id]/route')
    const req = new Request('http://localhost/api/punishment-pool/p1', { method: 'DELETE', body: JSON.stringify({ userId: 'u1' }) })
    const res = await DELETE(req as never, { params: Promise.resolve({ id: 'p1' }) })
    expect(res.status).toBe(403)
  })

  it('returns 404 when entry belongs to different user', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
    const { DELETE } = await import('@/app/api/punishment-pool/[id]/route')
    const req = new Request('http://localhost/api/punishment-pool/p1', { method: 'DELETE', body: JSON.stringify({ userId: 'u1' }) })
    const res = await DELETE(req as never, { params: Promise.resolve({ id: 'p1' }) })
    expect(res.status).toBe(404)
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npx vitest run src/__tests__/punishment-pool.test.ts
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Implement GET + POST route**

Create `src/app/api/punishment-pool/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'missing_userId' }, { status: 403 })

  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('punishment_pool')
    .select('*')
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: 'db_error' }, { status: 500 })
  return NextResponse.json({ pool: data ?? [] })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, title, description, severity, requiresProof } = body as {
      userId?: string; title?: string; description?: string; severity?: number; requiresProof?: boolean
    }

    if (!userId || !title || !description || severity == null || requiresProof == null) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
    }
    if (severity < 1 || severity > 5) {
      return NextResponse.json({ error: 'invalid_severity' }, { status: 400 })
    }
    if (title.length > 100) return NextResponse.json({ error: 'title_too_long' }, { status: 400 })
    if (description.length > 500) return NextResponse.json({ error: 'description_too_long' }, { status: 400 })

    const supabase = getServerSupabase()

    // Enforce 20 custom entry limit
    const { data: existing } = await supabase
      .from('punishment_pool')
      .select('id')
      .eq('user_id', userId)
      .eq('is_custom', true)

    if ((existing?.length ?? 0) >= 20) {
      return NextResponse.json({ error: 'custom_pool_limit_reached' }, { status: 400 })
    }

    const { data: item, error } = await supabase
      .from('punishment_pool')
      .insert({ user_id: userId, title, description, severity, requires_proof: requiresProof, is_custom: true })
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'db_error' }, { status: 500 })
    return NextResponse.json({ item }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Implement DELETE route**

Create `src/app/api/punishment-pool/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId } = body as { userId?: string }

    if (!userId) return NextResponse.json({ error: 'missing_userId' }, { status: 400 })

    const supabase = getServerSupabase()

    const { data: entry } = await supabase
      .from('punishment_pool')
      .select('id, is_custom, user_id')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle()

    if (!entry) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    if (!entry.is_custom) return NextResponse.json({ error: 'cannot_delete_system_entry' }, { status: 403 })

    await supabase.from('punishment_pool').delete().eq('id', id)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 5: Run tests — confirm they pass**

```bash
npx vitest run src/__tests__/punishment-pool.test.ts
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/punishment-pool/ src/__tests__/punishment-pool.test.ts
git commit -m "feat: add punishment pool CRUD API (TDD)"
```

---

## Task 9: Punishment Wheel Engine Tests + Spin API

**Files:**
- Create: `src/__tests__/punishment-wheel.test.ts`
- Create: `src/app/api/punishment-wheel/spin/route.ts`

- [ ] **Step 1: Write failing tests for the pure engine and spin API**

Create `src/__tests__/punishment-wheel.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildWeightedPool } from '@/lib/engines/punishment-wheel'
import type { PunishmentPoolItem } from '@/lib/supabase/schema'

// ── Pure function tests (no mocks needed) ─────────────────────

function makeItems(severities: number[]): PunishmentPoolItem[] {
  return severities.map((s, i) => ({
    id: `item-${i}`,
    user_id: 'u1',
    title: `Item ${i}`,
    description: 'desc',
    severity: s,
    requires_proof: false,
    is_custom: false,
    created_at: '',
  }))
}

describe('buildWeightedPool', () => {
  it('violations 0–2: all items have equal representation', () => {
    const pool = makeItems([1, 2, 3, 4, 5])
    const weighted = buildWeightedPool(pool, 0)
    const counts = Object.fromEntries(pool.map((_, i) => [`item-${i}`, 0]))
    for (const item of weighted) counts[item.id]++
    const values = Object.values(counts)
    expect(values.every(v => v === values[0])).toBe(true)
  })

  it('violations 3–5: severity 4–5 items appear more than severity 1–2', () => {
    const pool = makeItems([1, 2, 4, 5])
    const weighted = buildWeightedPool(pool, 4)
    const sev1Count = weighted.filter(i => i.severity <= 2).length
    const sev4Count = weighted.filter(i => i.severity >= 4).length
    expect(sev4Count).toBeGreaterThan(sev1Count)
  })

  it('violations 3–5: severity 3 items have medium weight', () => {
    const pool = makeItems([3])
    const weighted = buildWeightedPool(pool, 4)
    expect(weighted.length).toBe(2) // weight=1, reps=1*2=2
  })

  it('violations 6+: severity 1–2 items are excluded', () => {
    const pool = makeItems([1, 2, 3, 4, 5])
    const weighted = buildWeightedPool(pool, 7)
    expect(weighted.filter(i => i.severity <= 2)).toHaveLength(0)
  })

  it('violations 6+: severity 5 items appear most', () => {
    const pool = makeItems([3, 5])
    const weighted = buildWeightedPool(pool, 7)
    const sev3 = weighted.filter(i => i.severity === 3).length
    const sev5 = weighted.filter(i => i.severity === 5).length
    expect(sev5).toBeGreaterThan(sev3)
  })

  it('returns empty array when all items are excluded', () => {
    const pool = makeItems([1, 2]) // All excluded at violations 6+
    const weighted = buildWeightedPool(pool, 10)
    expect(weighted).toHaveLength(0)
  })
})

// ── Spin API tests ─────────────────────────────────────────────

const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockEq = vi.fn()
const mockMaybeSingle = vi.fn()
const mockSingle = vi.fn()
const mockUpdate = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  getServerSupabase: () => ({
    from: vi.fn((table: string) => {
      if (table === 'sessions') return { select: mockSelect }
      if (table === 'punishment_pool') return { select: mockSelect }
      if (table === 'tasks') return { insert: mockInsert }
      if (table === 'session_events') return { insert: mockInsert }
      return {}
    }),
  }),
}))

vi.mock('@/lib/ai/ai-service', () => ({
  generateSimpleText: vi.fn().mockResolvedValue({ text: 'You have been punished.', usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 } }),
  trackUsage: vi.fn().mockResolvedValue(undefined),
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  mockSelect.mockReturnValue({ eq: mockEq })
  mockEq.mockReturnValue({ eq: mockEq, maybeSingle: mockMaybeSingle, single: mockSingle, data: [], error: null })
  mockMaybeSingle.mockResolvedValue({ data: null, error: null })
  mockSingle.mockResolvedValue({ data: null, error: null })
  mockInsert.mockReturnValue({ select: mockSelect, data: null, error: null })
  mockSelect.mockReturnValue({ eq: mockEq, single: mockSingle })
})

describe('POST /api/punishment-wheel/spin', () => {
  it('returns 400 when userId is missing', async () => {
    const { POST } = await import('@/app/api/punishment-wheel/spin/route')
    const req = new Request('http://localhost/api/punishment-wheel/spin', {
      method: 'POST', body: JSON.stringify({ sessionId: 's1' }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })

  it('returns 403 when session not found', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
    const { POST } = await import('@/app/api/punishment-wheel/spin/route')
    const req = new Request('http://localhost/api/punishment-wheel/spin', {
      method: 'POST', body: JSON.stringify({ userId: 'u1', sessionId: 's1' }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(403)
  })
})
```

- [ ] **Step 2: Run tests — confirm pure function tests pass, API tests fail**

```bash
npx vitest run src/__tests__/punishment-wheel.test.ts
```

Expected: `buildWeightedPool` tests PASS (engine already written in Task 2). Spin API tests FAIL with module not found.

- [ ] **Step 3: Implement the spin API route**

Create `src/app/api/punishment-wheel/spin/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'
import { generateSimpleText, trackUsage } from '@/lib/ai/ai-service'
import { buildWeightedPool, pickFromWeightedPool } from '@/lib/engines/punishment-wheel'
import type { PunishmentPoolItem } from '@/lib/supabase/schema'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, sessionId } = body as { userId?: string; sessionId?: string }

    if (!userId || !sessionId) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    // Verify session + get violation count
    const { data: session } = await supabase
      .from('sessions')
      .select('id, total_tasks_failed, tier, ai_personality')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .maybeSingle()

    if (!session) {
      return NextResponse.json({ error: 'no_active_session' }, { status: 403 })
    }

    // Load punishment pool
    const { data: pool } = await supabase
      .from('punishment_pool')
      .select('*')
      .eq('user_id', userId)

    if (!pool || pool.length === 0) {
      return NextResponse.json({ error: 'empty_pool' }, { status: 400 })
    }

    // Select weighted punishment
    const violations = session.total_tasks_failed ?? 0
    const weighted = buildWeightedPool(pool as PunishmentPoolItem[], violations)
    if (weighted.length === 0) {
      return NextResponse.json({ error: 'empty_pool' }, { status: 400 })
    }
    const selected = pickFromWeightedPool(weighted)

    // Create punishment task
    const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const { data: task } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        session_id: sessionId,
        task_type: 'punishment',
        source: 'system',
        title: selected.title,
        description: selected.description,
        genres: [],
        difficulty: selected.severity,
        cage_status: 'caged',
        verification_type: selected.requires_proof ? 'self-report' : 'none',
        verification_requirement: selected.requires_proof ? 'Submit proof of completion.' : '',
        status: 'active',
        assigned_at: new Date().toISOString(),
        deadline,
      })
      .select()
      .single()

    // Write session event
    await supabase.from('session_events').insert({
      session_id: sessionId,
      user_id: userId,
      event_type: 'punishment_applied',
      payload: {
        source: 'wheel',
        punishment_title: selected.title,
        severity: selected.severity,
        task_id: (task as Record<string, unknown> | null)?.id,
      },
    })

    // Generate AI narration (≤100 tokens)
    const persona = session.ai_personality || 'Strict Master'
    const { text: narration, usage } = await generateSimpleText(
      `You are ${persona}. Deliver this punishment assignment in character in 1-2 sentences. Be cold, direct, and in persona.`,
      `The punishment is: "${selected.title}" — ${selected.description}. Severity ${selected.severity}/5.`
    )
    await trackUsage(supabase, userId, 'llama-3.3-70b-versatile', usage, 'punishment_wheel')

    return NextResponse.json({
      punishment: selected,
      taskId: (task as Record<string, unknown> | null)?.id ?? null,
      narration,
    })
  } catch (err) {
    console.error('[PunishmentWheel/Spin]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run all tests**

```bash
npx vitest run src/__tests__/punishment-wheel.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Run full test suite to confirm no regressions**

```bash
npx vitest run
```

Expected: all tests across all files PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/punishment-wheel/ src/__tests__/punishment-wheel.test.ts
git commit -m "feat: add punishment wheel spin API with weighted selection (TDD)"
```

---

## Task 10: Punishment Wheel UI + Pool Editor + Settings Integration

**Files:**
- Create: `src/components/features/punishment/punishment-wheel-modal.tsx`
- Create: `src/components/features/punishment/punishment-pool-editor.tsx`
- Modify: `src/app/(dashboard)/home/page.tsx`
- Modify: `src/app/(dashboard)/settings/page.tsx`

- [ ] **Step 1: Create punishment-wheel-modal component**

Create `src/components/features/punishment/punishment-wheel-modal.tsx`:

```typescript
'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Loader2 } from 'lucide-react'

interface SpinResult {
  punishment: { title: string; description: string; severity: number; requiresProof: boolean }
  taskId: string
  narration: string
}

interface Props {
  userId: string
  sessionId: string
  violationCount: number
  onClose: () => void
  onAccepted: () => void
}

export function PunishmentWheelModal({ userId, sessionId, violationCount, onClose, onAccepted }: Props) {
  const [spinning, setSpinning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SpinResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const wheelRef = useRef<HTMLDivElement>(null)

  const severityPips = Math.min(5, Math.ceil(violationCount / 2))

  const handleSpin = async () => {
    if (spinning || loading || result) return
    setSpinning(true)
    setError(null)

    // CSS spin animation: 720–1440 degrees random
    const degrees = 720 + Math.floor(Math.random() * 720)
    if (wheelRef.current) {
      wheelRef.current.style.transition = 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
      wheelRef.current.style.transform = `rotate(${degrees}deg)`
    }

    // Wait for animation then call API
    setTimeout(async () => {
      setSpinning(false)
      setLoading(true)
      try {
        const res = await fetch('/api/punishment-wheel/spin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, sessionId }),
        })
        if (!res.ok) throw new Error('Spin failed')
        const data = await res.json()
        setResult(data)
      } catch {
        setError('Something went wrong — try again')
      } finally {
        setLoading(false)
      }
    }, 3100)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-bg-secondary border border-white/10 rounded-2xl w-full max-w-sm p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">🎰 Punishment Wheel</h2>
            <p className="text-xs text-text-tertiary mt-0.5">Weighted by violation count</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
            <X size={18} className="text-text-tertiary" />
          </button>
        </div>

        {/* Severity bias pips */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-tertiary">Severity bias:</span>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`w-4 h-1.5 rounded-full ${i < severityPips ? 'bg-red-primary' : 'bg-bg-tertiary'}`}
              />
            ))}
          </div>
          <span className="text-xs text-text-tertiary">({violationCount} violations)</span>
        </div>

        {/* Wheel */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10
              w-0 h-0 border-l-[8px] border-r-[8px] border-b-[16px]
              border-l-transparent border-r-transparent border-b-white
              drop-shadow-lg" />
            {/* Wheel */}
            <div
              ref={wheelRef}
              className="w-36 h-36 rounded-full border-4 border-white/15 shadow-lg"
              style={{
                background: 'conic-gradient(#ef4444 0deg 60deg, #f97316 60deg 110deg, #eab308 110deg 170deg, #8b5cf6 170deg 230deg, #ef4444 230deg 280deg, #dc2626 280deg 360deg)',
                boxShadow: '0 0 30px rgba(239,68,68,0.25)',
              }}
            >
              {/* Center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-bg-secondary border border-white/20 flex items-center justify-center text-sm">
                  🎰
                </div>
              </div>
            </div>
          </div>

          {!result && !loading && (
            <Button
              variant="danger"
              className="w-full font-black tracking-wider"
              onClick={handleSpin}
              disabled={spinning}
            >
              {spinning ? 'SPINNING...' : 'SPIN'}
            </Button>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-sm text-text-tertiary">
              <Loader2 size={14} className="animate-spin" />
              Selecting punishment...
            </div>
          )}

          {error && (
            <p className="text-sm text-red-primary text-center">{error}</p>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className="bg-red-primary/10 border border-red-primary/30 rounded-xl p-4 space-y-3 animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-red-primary">⚠ {result.punishment.title}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="locked">Severity {result.punishment.severity}/5</Badge>
                  {result.punishment.requiresProof && <Badge variant="genre">Proof required</Badge>}
                </div>
              </div>
            </div>
            <p className="text-xs text-text-secondary">{result.punishment.description}</p>
            {result.narration && (
              <p className="text-sm text-text-primary italic border-t border-white/5 pt-3">
                "{result.narration}"
              </p>
            )}
            <Button variant="danger" className="w-full" onClick={onAccepted}>
              Accept Punishment →
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create punishment-pool-editor component**

Create `src/components/features/punishment/punishment-pool-editor.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Trash2, Lock, Plus } from 'lucide-react'
import type { PunishmentPoolItem } from '@/lib/supabase/schema'

interface Props {
  userId: string
}

export function PunishmentPoolEditor({ userId }: Props) {
  const [pool, setPool] = useState<PunishmentPoolItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', severity: 3, requiresProof: true })

  const fetchPool = async () => {
    const res = await fetch(`/api/punishment-pool?userId=${userId}`)
    if (res.ok) {
      const { pool: data } = await res.json()
      setPool(data)
    }
    setLoading(false)
  }

  useEffect(() => { fetchPool() }, [userId])

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this punishment from your pool?')) return
    await fetch(`/api/punishment-pool/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    setPool((prev) => prev.filter((p) => p.id !== id))
  }

  const handleAdd = async () => {
    if (!form.title || !form.description) return
    const res = await fetch('/api/punishment-pool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...form }),
    })
    if (res.ok) {
      const { item } = await res.json()
      setPool((prev) => [...prev, item])
      setForm({ title: '', description: '', severity: 3, requiresProof: true })
      setShowAdd(false)
    }
  }

  if (loading) return <p className="text-sm text-text-tertiary">Loading pool...</p>

  return (
    <div className="space-y-3">
      {pool.map((item) => (
        <Card key={item.id} variant="flat" size="sm" className="!min-h-0 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold">{item.title}</span>
                <Badge variant="genre">S{item.severity}</Badge>
                {!item.is_custom && <Lock size={12} className="text-text-tertiary" />}
              </div>
              <p className="text-xs text-text-tertiary line-clamp-2">{item.description}</p>
            </div>
            {item.is_custom && (
              <button
                onClick={() => handleDelete(item.id)}
                className="p-1.5 hover:bg-red-primary/10 rounded-lg transition-colors text-red-primary/60 hover:text-red-primary"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </Card>
      ))}

      {showAdd ? (
        <Card variant="raised" className="space-y-3">
          <input
            placeholder="Punishment title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value.slice(0, 100) }))}
            className="w-full bg-bg-tertiary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-primary/50"
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value.slice(0, 500) }))}
            rows={2}
            className="w-full bg-bg-tertiary border border-white/10 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-purple-primary/50"
          />
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-text-tertiary block mb-1">Severity</label>
              <select
                value={form.severity}
                onChange={(e) => setForm((f) => ({ ...f, severity: Number(e.target.value) }))}
                className="w-full bg-bg-tertiary border border-white/10 rounded-lg px-3 py-2 text-sm"
              >
                {[1,2,3,4,5].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-end gap-2 pb-2">
              <input
                type="checkbox"
                checked={form.requiresProof}
                onChange={(e) => setForm((f) => ({ ...f, requiresProof: e.target.checked }))}
                id="req-proof"
              />
              <label htmlFor="req-proof" className="text-xs text-text-tertiary">Proof required</label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleAdd}>Add Punishment</Button>
          </div>
        </Card>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setShowAdd(true)} className="w-full">
          <Plus size={14} className="mr-1" /> Add Custom Punishment
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Add "Spin Wheel" card to home dashboard**

Read `src/app/(dashboard)/home/page.tsx`. Add to the existing `import` block:
```typescript
import { PunishmentWheelModal } from '@/components/features/punishment/punishment-wheel-modal'
```

Add state near other modal states:
```typescript
const [showWheelModal, setShowWheelModal] = useState(false)
```

In the Quick Access BentoItem grid, add the wheel card (only when session active):
```typescript
{session && (
  <button
    onClick={() => setShowWheelModal(true)}
    className="p-3 bg-bg-tertiary hover:bg-bg-hover rounded-[var(--radius-md)] border border-red-primary/20 transition-colors flex items-center gap-2"
  >
    <span className="text-base">🎰</span>
    <span className="text-sm font-medium">Spin Wheel</span>
  </button>
)}
```

Add modal render before `<BottomNav />`:
```typescript
{showWheelModal && session && user && (
  <PunishmentWheelModal
    userId={user.id}
    sessionId={session.id}
    violationCount={session.total_tasks_failed ?? 0}
    onClose={() => setShowWheelModal(false)}
    onAccepted={() => { setShowWheelModal(false); router.refresh() }}
  />
)}
```

- [ ] **Step 4: Add pool editor and history link to settings**

Read `src/app/(dashboard)/settings/page.tsx`. Add a new "Data & Punishments" section with:
1. Link to `/history` (Session History)
2. `<PunishmentPoolEditor userId={user.id} />` rendered inside an expandable card

Add import:
```typescript
import { PunishmentPoolEditor } from '@/components/features/punishment/punishment-pool-editor'
```

Add section near the bottom of the settings page content:
```typescript
{/* Data & Punishments */}
<div className="space-y-3">
  <h2 className="text-lg font-semibold">Data & Punishments</h2>
  <Card variant="flat" className="!min-h-0 py-3 cursor-pointer hover:border-white/20 transition-colors"
    onClick={() => router.push('/history')}>
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">Session History</span>
      <span className="text-text-tertiary text-sm">↗</span>
    </div>
  </Card>
  <div>
    <p className="text-sm font-semibold text-text-tertiary uppercase tracking-wide mb-3">Punishment Pool</p>
    {user && <PunishmentPoolEditor userId={user.id} />}
  </div>
</div>
```

- [ ] **Step 5: Manual end-to-end verification**

```bash
npm run dev
```

1. Start a session. On `/home`, confirm "Spin Wheel" card is visible.
2. Click Spin Wheel → confirm modal opens with wheel, severity pips, and SPIN button.
3. Click SPIN → confirm wheel animates, then result card appears with punishment title + narration.
4. Click "Accept Punishment →" → confirm modal closes. Navigate to `/tasks` → confirm new punishment task appears.
5. Navigate to `/settings` → confirm "Punishment Pool" section shows 12 default entries (after first session start).
6. Add a custom punishment → confirm it appears in the list. Delete it → confirm it removes.
7. System entries (lock icon) → confirm delete button is absent.

- [ ] **Step 6: Run full test suite one final time**

```bash
npx vitest run
```

Expected: all tests PASS.

- [ ] **Step 7: Final commit**

```bash
git add src/components/features/punishment/ src/app/(dashboard)/home/page.tsx src/app/(dashboard)/settings/page.tsx
git commit -m "feat: add punishment wheel modal and pool editor UI"
```

---

## Done ✓

All four Phase 1 features are implemented:
- **Mood Check-in** — daily modal, care mode trigger, AI context integration
- **Session Replay** — `/history` + `/history/[sessionId]`, IndexedDB-backed
- **Calendar Upgrade** — 4 overlay toggles, day detail panel, history link
- **Punishment Wheel** — weighted spin, AI narration, pool editor in settings
