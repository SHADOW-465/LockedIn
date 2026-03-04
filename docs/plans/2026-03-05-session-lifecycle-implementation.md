# Session Lifecycle Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a fully AI-controlled session lifecycle with backend-authoritative timer, master task system, hybrid local/Supabase storage, punishment pipeline, settings lock, and session summary generation.

**Architecture:** Server-authoritative state machine (idle→active→extending→completing→completed). Timer stored as `start_time + total_duration_minutes`. Heavy data (chat, media) stored in IndexedDB/OPFS on-device; Supabase holds metadata and a rolling 500-message chat window only.

**Tech Stack:** Next.js 15 App Router, Supabase (Postgres + Realtime + Edge Functions), Dexie.js (IndexedDB), fflate (ZIP), OPFS File System API, Vitest

**Design doc:** `docs/plans/2026-03-05-session-lifecycle-redesign.md`

---

## Phase 1: Database Foundation

### Task 1: Migration — sessions + tasks columns

**Files:**
- Create: `supabase/migrations/20260305_session_lifecycle.sql`

**Step 1: Write the migration**

```sql
-- supabase/migrations/20260305_session_lifecycle.sql

-- Extend sessions table
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS total_duration_minutes integer NOT NULL DEFAULT 10080,
  ADD COLUMN IF NOT EXISTS session_config         jsonb,
  ADD COLUMN IF NOT EXISTS extension_count        integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_extended_at       timestamptz;

-- Backfill total_duration_minutes from existing scheduled_end_time
UPDATE sessions
SET total_duration_minutes = EXTRACT(EPOCH FROM (scheduled_end_time - start_time)) / 60
WHERE scheduled_end_time IS NOT NULL AND start_time IS NOT NULL;

-- Extend tasks table
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS task_type text NOT NULL DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS source    text NOT NULL DEFAULT 'auto';

-- Constrain values
ALTER TABLE tasks
  ADD CONSTRAINT task_type_check CHECK (task_type IN ('daily', 'master', 'punishment')),
  ADD CONSTRAINT source_check    CHECK (source    IN ('ai_chat', 'auto', 'system'));
```

**Step 2: Apply migration via Supabase MCP**

Use `mcp__supabase__apply_migration` with name `session_lifecycle` and the SQL above.

**Step 3: Verify**

Use `mcp__supabase__list_tables` and confirm `sessions` has `total_duration_minutes`, `session_config`, `extension_count`, `last_extended_at`. Confirm `tasks` has `task_type`, `source`.

**Step 4: Commit**

```bash
git add supabase/migrations/20260305_session_lifecycle.sql
git commit -m "feat(db): add session lifecycle columns to sessions and tasks"
```

---

### Task 2: Migration — session_events + proof_documents tables

**Files:**
- Create: `supabase/migrations/20260305_session_events_proof_docs.sql`

**Step 1: Write the migration**

```sql
-- supabase/migrations/20260305_session_events_proof_docs.sql

CREATE TABLE IF NOT EXISTS session_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id),
  event_type  text NOT NULL,
  payload     jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_events_session
  ON session_events(session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_session_events_user
  ON session_events(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS proof_documents (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id             uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id             uuid NOT NULL REFERENCES profiles(id),
  session_id          uuid REFERENCES sessions(id),
  file_type           text NOT NULL,
  local_storage_key   text,
  verification_status text NOT NULL DEFAULT 'pending',
  verified_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT file_type_check CHECK (file_type IN ('image', 'video', 'text', 'audio')),
  CONSTRAINT verification_status_check CHECK (verification_status IN ('pending', 'passed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_proof_documents_task
  ON proof_documents(task_id);

CREATE INDEX IF NOT EXISTS idx_proof_documents_session
  ON proof_documents(session_id);
```

**Step 2: Apply migration**

Use `mcp__supabase__apply_migration` with name `session_events_proof_docs`.

**Step 3: Update TypeScript schema**

In `src/lib/supabase/schema.ts`, add after the `Notification` interface:

```typescript
export interface SessionEvent {
  id: string
  session_id: string
  user_id: string
  event_type: string
  payload: Record<string, unknown> | null
  created_at: string
}

export interface ProofDocument {
  id: string
  task_id: string
  user_id: string
  session_id: string | null
  file_type: 'image' | 'video' | 'text' | 'audio'
  local_storage_key: string | null
  verification_status: 'pending' | 'passed' | 'failed'
  verified_at: string | null
  created_at: string
}
```

Also update `Session` interface — add new columns:
```typescript
// Add to Session interface:
total_duration_minutes: number
session_config: Record<string, unknown> | null
extension_count: number
last_extended_at: string | null
```

Also update `Task` interface:
```typescript
// Add to Task interface:
task_type: 'daily' | 'master' | 'punishment'
source: 'ai_chat' | 'auto' | 'system'
```

Also update `TableName` union:
```typescript
| 'session_events'
| 'proof_documents'
```

**Step 4: Commit**

```bash
git add supabase/migrations/20260305_session_events_proof_docs.sql src/lib/supabase/schema.ts
git commit -m "feat(db): add session_events, proof_documents tables and update schema types"
```

---

## Phase 2: Session API Routes

### Task 3: POST /api/sessions/start

**Files:**
- Create: `src/app/api/sessions/start/route.ts`
- Create: `src/__tests__/session-start.test.ts`

**Step 1: Write the failing test**

```typescript
// src/__tests__/session-start.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockInsert = vi.fn()
const mockSelect = vi.fn()
const mockMaybeSingle = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  getServerSupabase: () => ({
    from: vi.fn((table: string) => ({
      insert: mockInsert,
      select: vi.fn(() => ({ eq: mockEq, maybeSingle: mockMaybeSingle, single: mockSingle })),
    })),
  }),
}))

describe('POST /api/sessions/start', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 400 when userId missing', async () => {
    const { POST } = await import('@/app/api/sessions/start/route')
    const req = new Request('http://localhost/api/sessions/start', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })

  it('returns 409 when active session already exists', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: 'existing-session' }, error: null })
    mockEq.mockReturnThis()

    const { POST } = await import('@/app/api/sessions/start/route')
    const req = new Request('http://localhost/api/sessions/start', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user-1', config: { tier: 'Slave', desired_duration_minutes: 1440 } }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toBe('active_session_exists')
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/session-start.test.ts
```
Expected: FAIL — module not found

**Step 3: Implement the route**

```typescript
// src/app/api/sessions/start/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'

interface SessionConfig {
  tier: string
  ai_personality?: string
  hard_limits?: string[]
  soft_limits?: string[]
  regimens?: string[]
  desired_duration_minutes: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, config } = body as { userId: string; config: SessionConfig }

    if (!userId || !config?.desired_duration_minutes) {
      return NextResponse.json({ error: 'userId and config.desired_duration_minutes are required' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    // Check for existing active session
    const { data: existing } = await supabase
      .from('sessions')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['active', 'extending', 'completing'])
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'active_session_exists', sessionId: existing.id }, { status: 409 })
    }

    const now = new Date()
    const scheduledEnd = new Date(now.getTime() + config.desired_duration_minutes * 60 * 1000)

    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        status: 'active',
        tier: config.tier || 'Newbie',
        ai_personality: config.ai_personality || null,
        start_time: now.toISOString(),
        scheduled_end_time: scheduledEnd.toISOString(),
        total_duration_minutes: config.desired_duration_minutes,
        session_config: config,
        extension_count: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('[Sessions/Start] Insert error:', error)
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    // Write session_started event
    await supabase.from('session_events').insert({
      session_id: session.id,
      user_id: userId,
      event_type: 'session_started',
      payload: { config, duration_minutes: config.desired_duration_minutes },
    })

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    console.error('[Sessions/Start] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Step 4: Run tests**

```bash
npx vitest run src/__tests__/session-start.test.ts
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/sessions/start/route.ts src/__tests__/session-start.test.ts
git commit -m "feat(api): add POST /api/sessions/start with duplicate prevention"
```

---

### Task 4: POST /api/sessions/extend

**Files:**
- Create: `src/app/api/sessions/extend/route.ts`

**Step 1: Implement**

```typescript
// src/app/api/sessions/extend/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId, deltaMinutes, reason } = await request.json()

    if (!sessionId || !userId || !deltaMinutes) {
      return NextResponse.json({ error: 'sessionId, userId, deltaMinutes required' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    const { data: session, error: fetchError } = await supabase
      .from('sessions')
      .select('id, user_id, total_duration_minutes, start_time, status')
      .eq('id', sessionId)
      .single()

    if (fetchError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (!['active', 'extending'].includes(session.status)) {
      return NextResponse.json({ error: 'Session not extensible' }, { status: 400 })
    }

    const newDuration = session.total_duration_minutes + deltaMinutes
    const newEnd = new Date(new Date(session.start_time).getTime() + newDuration * 60 * 1000)

    const { data: updated, error: updateError } = await supabase
      .from('sessions')
      .update({
        status: 'extending',
        total_duration_minutes: newDuration,
        scheduled_end_time: newEnd.toISOString(),
        extension_count: session.extension_count + 1,
        last_extended_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Failed to extend session' }, { status: 500 })
    }

    await supabase.from('session_events').insert({
      session_id: sessionId,
      user_id: userId,
      event_type: 'timer_extended',
      payload: { delta_minutes: deltaMinutes, reason, new_end: newEnd.toISOString() },
    })

    // Brief extending→active transition (extension applied)
    await supabase
      .from('sessions')
      .update({ status: 'active' })
      .eq('id', sessionId)

    return NextResponse.json({ session: { ...updated, status: 'active' } })
  } catch (error) {
    console.error('[Sessions/Extend] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/sessions/extend/route.ts
git commit -m "feat(api): add POST /api/sessions/extend with event logging"
```

---

### Task 5: POST /api/sessions/complete + /api/sessions/purge + /api/sessions/emergency

**Files:**
- Create: `src/app/api/sessions/complete/route.ts`
- Create: `src/app/api/sessions/purge/route.ts`
- Create: `src/app/api/sessions/emergency/route.ts`

**Step 1: Implement complete**

```typescript
// src/app/api/sessions/complete/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId } = await request.json()

    if (!sessionId || !userId) {
      return NextResponse.json({ error: 'sessionId and userId required' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    const { data: session } = await supabase
      .from('sessions')
      .select('id, user_id, status')
      .eq('id', sessionId)
      .single()

    if (!session || session.user_id !== userId) {
      return NextResponse.json({ error: 'Session not found or unauthorized' }, { status: 404 })
    }

    if (!['completing', 'active'].includes(session.status)) {
      return NextResponse.json({ error: 'Session cannot be completed from current state' }, { status: 400 })
    }

    await supabase
      .from('sessions')
      .update({ status: 'completed', actual_end_time: new Date().toISOString() })
      .eq('id', sessionId)

    await supabase.from('session_events').insert({
      session_id: sessionId,
      user_id: userId,
      event_type: 'session_completed',
      payload: { completed_at: new Date().toISOString() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Sessions/Complete] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Step 2: Implement purge**

```typescript
// src/app/api/sessions/purge/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId } = await request.json()

    if (!sessionId || !userId) {
      return NextResponse.json({ error: 'sessionId and userId required' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    // Verify ownership
    const { data: session } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single()

    if (!session || session.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete heavy data — keep session row, tasks metadata, achievements, notifications
    const [chatResult, proofResult, calResult, eventsResult] = await Promise.all([
      supabase.from('chat_messages').delete().eq('session_id', sessionId),
      supabase.from('proof_documents').delete().eq('session_id', sessionId),
      supabase.from('calendar_adjustments').delete().eq('session_id', sessionId),
      supabase.from('session_events').delete().eq('session_id', sessionId),
    ])

    const errors = [chatResult.error, proofResult.error, calResult.error, eventsResult.error].filter(Boolean)
    if (errors.length > 0) {
      console.error('[Sessions/Purge] Partial errors:', errors)
    }

    return NextResponse.json({ success: true, purged: ['chat_messages', 'proof_documents', 'calendar_adjustments', 'session_events'] })
  } catch (error) {
    console.error('[Sessions/Purge] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Step 3: Implement emergency**

```typescript
// src/app/api/sessions/emergency/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId, reason } = await request.json()

    if (!sessionId || !userId) {
      return NextResponse.json({ error: 'sessionId and userId required' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    const { data: session } = await supabase
      .from('sessions')
      .select('id, user_id')
      .eq('id', sessionId)
      .single()

    if (!session || session.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await supabase
      .from('sessions')
      .update({ status: 'emergency', actual_end_time: new Date().toISOString() })
      .eq('id', sessionId)

    await supabase.from('session_events').insert({
      session_id: sessionId,
      user_id: userId,
      event_type: 'session_emergency',
      payload: { reason: reason || 'User triggered emergency release', released_at: new Date().toISOString() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Sessions/Emergency] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Step 4: Commit**

```bash
git add src/app/api/sessions/complete/route.ts src/app/api/sessions/purge/route.ts src/app/api/sessions/emergency/route.ts
git commit -m "feat(api): add sessions/complete, sessions/purge, sessions/emergency routes"
```

---

### Task 6: POST /api/sessions/summary

**Files:**
- Create: `src/app/api/sessions/summary/route.ts`

**Step 1: Implement**

```typescript
// src/app/api/sessions/summary/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'
import { generateSimpleText, trackUsage } from '@/lib/ai/ai-service'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId, sessionData } = await request.json()

    if (!sessionId || !userId || !sessionData) {
      return NextResponse.json({ error: 'sessionId, userId, sessionData required' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    const systemPrompt = `You are the AI Master of the LockedIn app. A session has just ended.
Generate a psychologically immersive session summary in your dominant persona.
Respond ONLY with valid JSON matching this exact structure:
{
  "narrative": "2-3 paragraph immersive recap in Master's voice",
  "compliance_rate": <number 0-100>,
  "performance_grade": "<S|A|B|C|D>",
  "highlights": ["<achievement 1>", "<achievement 2>"],
  "improvement_areas": ["<area 1>", "<area 2>"],
  "behavioral_insight": "One sentence psychological observation",
  "next_session_recommendation": "One sentence recommendation"
}`

    const userPrompt = `Session data:
- Duration: ${sessionData.actual_minutes} minutes (planned: ${sessionData.planned_minutes})
- Tasks: ${sessionData.tasks_completed} completed / ${sessionData.tasks_assigned} assigned / ${sessionData.tasks_failed} failed
- Master tasks: ${sessionData.master_completed} completed / ${sessionData.master_failed} failed
- Punishments: ${sessionData.punishment_count}
- Compliance rate: ${sessionData.compliance_rate}%
- Willpower: ${sessionData.willpower_start} → ${sessionData.willpower_end}
- Streak change: ${sessionData.streak_change > 0 ? '+' : ''}${sessionData.streak_change} days

Generate the session summary now.`

    const { text, usage } = await generateSimpleText(systemPrompt, userPrompt)
    await trackUsage(supabase, userId, 'llama-3.3-70b-versatile', usage, 'session_summary')

    let summary: Record<string, unknown>
    try {
      const cleaned = text.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()
      summary = JSON.parse(cleaned)
    } catch {
      summary = {
        narrative: text,
        compliance_rate: sessionData.compliance_rate,
        performance_grade: 'B',
        highlights: [],
        improvement_areas: [],
        behavioral_insight: 'Session data recorded.',
        next_session_recommendation: 'Continue training.',
      }
    }

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('[Sessions/Summary] Error:', error)
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/sessions/summary/route.ts
git commit -m "feat(api): add POST /api/sessions/summary with AI-generated recap"
```

---

## Phase 3: Timer Fix

### Task 7: Fix TimerCard — actual duration + completing state

**Files:**
- Modify: `src/components/features/timer/timer-card.tsx`

**Step 1: Read the current file**

Current bugs:
1. Progress hardcoded to 7-day total (`const total = 7 * 24 * 60 * 60 * 1000`)
2. Timer freezes at `00d 00h 00m 00s` with no recovery when session expires
3. No awareness of `session.status`

**Step 2: Rewrite TimerCard**

```typescript
// src/components/features/timer/timer-card.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertTriangle } from 'lucide-react'

interface TimerCardProps {
  endTime: Date
  startTime: Date
  totalDurationMinutes: number
  tier: string
  status: 'active' | 'extending' | 'completing' | 'completed' | 'emergency' | string
  punishmentActive?: boolean
}

export function TimerCard({ endTime, startTime, totalDurationMinutes, tier, status, punishmentActive }: TimerCardProps) {
  const [timeRemaining, setTimeRemaining] = useState('')
  const [progress, setProgress] = useState(0)

  const isComplete = status === 'completed' || status === 'emergency' || status === 'completing'

  useEffect(() => {
    if (isComplete) {
      setTimeRemaining('00d 00h 00m 00s')
      setProgress(100)
      return
    }

    const tick = () => {
      const now = new Date()
      const diff = endTime.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining('00d 00h 00m 00s')
        setProgress(100)
        return
      }

      const days    = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeRemaining(
        `${String(days).padStart(2, '0')}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
      )

      // Use actual session total duration for accurate progress
      const totalMs  = totalDurationMinutes * 60 * 1000
      const elapsedMs = totalMs - diff
      setProgress(Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100)))
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [endTime, startTime, totalDurationMinutes, isComplete])

  const tierVariant = `tier${
    tier === 'Newbie' ? '1' : tier === 'Slave' ? '2' : tier === 'Hardcore' ? '3' : tier === 'Extreme' ? '4' : '5'
  }` as 'tier1'

  if (status === 'completing') {
    return (
      <Card variant="hero" className="relative overflow-hidden text-center py-8">
        <div className="space-y-3">
          <AlertTriangle size={40} className="mx-auto text-tier-slave animate-pulse" />
          <h2 className="text-2xl font-bold font-mono">Session Ending...</h2>
          <p className="text-text-secondary text-sm">Archiving your session data. Please wait.</p>
        </div>
      </Card>
    )
  }

  if (status === 'completed' || status === 'emergency') {
    return (
      <Card variant="hero" className="relative overflow-hidden text-center py-8">
        <div className="space-y-3">
          <CheckCircle size={40} className="mx-auto text-teal-primary" />
          <h2 className="text-2xl font-bold font-mono">
            {status === 'emergency' ? 'Emergency Release' : 'Session Complete'}
          </h2>
          <p className="text-text-secondary text-sm">
            {status === 'emergency' ? 'You have been released.' : 'Your session has ended. Summary available below.'}
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card
      variant="hero"
      className={`relative overflow-hidden ${punishmentActive ? 'animate-timer-pulse' : ''}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-red-primary/5 to-purple-primary/5 pointer-events-none" />

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-bg-tertiary">
        <div
          className="h-full bg-gradient-to-r from-red-primary to-purple-primary transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <Badge variant="locked">🔒 LOCKED IN</Badge>
          <Badge variant={tierVariant}>{tier.toUpperCase()}</Badge>
        </div>

        <div className="text-center py-4">
          <div className="text-5xl md:text-6xl font-mono font-bold mb-4 text-red-primary text-glow-red tracking-wider">
            {timeRemaining || '—'}
          </div>
          <p className="text-text-secondary text-sm">Time Remaining Until Release</p>
        </div>

        {punishmentActive && (
          <div className="mt-4 text-center">
            <Badge variant="locked" className="animate-pulse">
              ⚠ PUNISHMENT MODE ACTIVE
            </Badge>
          </div>
        )}

        {status === 'extending' && (
          <div className="mt-4 text-center">
            <Badge variant="warning" className="animate-pulse">
              ⏱ SESSION EXTENDED
            </Badge>
          </div>
        )}
      </div>
    </Card>
  )
}
```

**Step 3: Update home page to pass new props**

In `src/app/(dashboard)/home/page.tsx`, update the `TimerCard` usage:

```tsx
// Find the TimerCard usage and update:
<TimerCard
  endTime={new Date(session.scheduled_end_time)}
  startTime={new Date(session.start_time)}
  totalDurationMinutes={session.total_duration_minutes}
  tier={tier}
  status={session.status}
  punishmentActive={session.total_punishments > 0}
/>
```

**Step 4: Build check**

```bash
npm run build
```
Expected: compiled successfully

**Step 5: Commit**

```bash
git add src/components/features/timer/timer-card.tsx src/app/(dashboard)/home/page.tsx
git commit -m "fix(timer): use actual session duration for progress, handle completing/completed states"
```

---

## Phase 4: Mini Session Onboarding

### Task 8: SessionStartFlow component

**Files:**
- Create: `src/components/features/session-start-flow.tsx`

**Step 1: Implement**

```typescript
// src/components/features/session-start-flow.tsx
'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Lock, Loader2 } from 'lucide-react'
import type { UserProfile } from '@/lib/supabase/schema'

interface SessionConfig {
  tier: string
  ai_personality: string
  hard_limits: string[]
  soft_limits: string[]
  regimens: string[]
  desired_duration_minutes: number
}

interface SessionStartFlowProps {
  profile: UserProfile
  onStart: (config: SessionConfig) => Promise<void>
  onCancel: () => void
}

const TIERS = ['Newbie', 'Slave', 'Hardcore', 'Extreme', 'Total Destruction']
const PERSONALITIES = ['Strict Master', 'Cruel Mistress', 'Sadistic Dom', 'Cold Authority', 'Nurturing Dom']
const REGIMEN_OPTIONS = ['Edging', 'Orgasm Denial', 'Obedience Training', 'Body Worship', 'Discipline', 'Humiliation', 'Chastity Protocol', 'Service Training']

const STEPS = ['Tier', 'Personality', 'Hard Limits', 'Soft Limits', 'Regimens', 'Duration']

export function SessionStartFlow({ profile, onStart, onCancel }: SessionStartFlowProps) {
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [config, setConfig] = useState<SessionConfig>({
    tier: profile.tier || 'Newbie',
    ai_personality: profile.ai_personality || 'Strict Master',
    hard_limits: profile.hard_limits || [],
    soft_limits: profile.soft_limits || [],
    regimens: profile.preferred_regimens || [],
    desired_duration_minutes: 0,
  })
  const [durationInput, setDurationInput] = useState({ days: 0, hours: 0 })

  const totalMinutes = durationInput.days * 24 * 60 + durationInput.hours * 60
  const isLastStep = step === STEPS.length - 1
  const canProceed = isLastStep ? totalMinutes >= 60 : true

  const handleNext = async () => {
    if (isLastStep) {
      if (totalMinutes < 60) return
      setSubmitting(true)
      try {
        await onStart({ ...config, desired_duration_minutes: totalMinutes })
      } finally {
        setSubmitting(false)
      }
    } else {
      setStep(s => s + 1)
    }
  }

  const toggleLimit = (type: 'hard_limits' | 'soft_limits', value: string) => {
    setConfig(c => ({
      ...c,
      [type]: c[type].includes(value) ? c[type].filter(v => v !== value) : [...c[type], value],
    }))
  }

  const toggleRegimen = (value: string) => {
    setConfig(c => ({
      ...c,
      regimens: c.regimens.includes(value) ? c.regimens.filter(v => v !== value) : [...c.regimens, value],
    }))
  }

  return (
    <div className="fixed inset-0 z-50 bg-bg-primary flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Lock size={16} className="text-red-primary" />
          <span className="font-mono font-bold text-sm">Configure Session</span>
        </div>
        <span className="text-text-tertiary text-xs font-mono">{step + 1} / {STEPS.length}</span>
      </header>

      {/* Progress */}
      <div className="px-6 pt-3 pb-2">
        <div className="flex gap-1">
          {STEPS.map((_, i) => (
            <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
              style={{ background: i <= step ? 'var(--color-red-primary)' : 'var(--color-bg-tertiary)', opacity: i <= step ? 1 : 0.4 }} />
          ))}
        </div>
        <p className="text-xs text-text-tertiary mt-1">{STEPS[step]}</p>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {step === 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold">Select your tier for this session</h2>
            {TIERS.map(t => (
              <button key={t} onClick={() => setConfig(c => ({ ...c, tier: t }))}
                className={`w-full p-4 rounded-lg border text-left font-medium transition-all ${config.tier === t ? 'border-red-primary bg-red-primary/10 text-red-primary' : 'border-white/10 bg-bg-secondary text-text-secondary hover:border-white/20'}`}>
                {t}
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold">Choose AI personality</h2>
            {PERSONALITIES.map(p => (
              <button key={p} onClick={() => setConfig(c => ({ ...c, ai_personality: p }))}
                className={`w-full p-4 rounded-lg border text-left font-medium transition-all ${config.ai_personality === p ? 'border-purple-primary bg-purple-primary/10 text-purple-primary' : 'border-white/10 bg-bg-secondary text-text-secondary hover:border-white/20'}`}>
                {p}
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold">Hard Limits</h2>
            <p className="text-sm text-text-secondary">These will NEVER be included in tasks or punishments.</p>
            <div className="flex flex-wrap gap-2">
              {['Breath Play', 'Blood', 'Extreme Pain', 'Public Exposure', 'Scat', 'Animals', 'Minors', 'Knives'].map(l => (
                <button key={l} onClick={() => toggleLimit('hard_limits', l)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${config.hard_limits.includes(l) ? 'border-red-primary bg-red-primary/20 text-red-primary' : 'border-white/10 bg-bg-secondary text-text-tertiary'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold">Soft Limits</h2>
            <p className="text-sm text-text-secondary">These can be included but approached carefully.</p>
            <div className="flex flex-wrap gap-2">
              {['Watersports', 'Extreme Humiliation', 'Pain', 'Forced Bi', 'Cuckolding', 'Pet Play'].map(l => (
                <button key={l} onClick={() => toggleLimit('soft_limits', l)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${config.soft_limits.includes(l) ? 'border-tier-slave bg-tier-slave/20 text-tier-slave' : 'border-white/10 bg-bg-secondary text-text-tertiary'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold">Training Regimens</h2>
            <p className="text-sm text-text-secondary">Select what types of training you want this session.</p>
            <div className="flex flex-wrap gap-2">
              {REGIMEN_OPTIONS.map(r => (
                <button key={r} onClick={() => toggleRegimen(r)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${config.regimens.includes(r) ? 'border-purple-primary bg-purple-primary/20 text-purple-primary' : 'border-white/10 bg-bg-secondary text-text-tertiary'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold">Set your lock duration</h2>
            <p className="text-sm text-text-secondary">How long will your Master control you? Minimum 1 hour.</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-text-tertiary uppercase tracking-wide">Days</label>
                <input type="number" min={0} max={365} value={durationInput.days}
                  onChange={e => setDurationInput(d => ({ ...d, days: parseInt(e.target.value) || 0 }))}
                  className="w-full p-3 bg-bg-secondary border border-white/10 rounded-lg text-2xl font-mono text-center focus:border-red-primary outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-text-tertiary uppercase tracking-wide">Hours</label>
                <input type="number" min={0} max={23} value={durationInput.hours}
                  onChange={e => setDurationInput(d => ({ ...d, hours: parseInt(e.target.value) || 0 }))}
                  className="w-full p-3 bg-bg-secondary border border-white/10 rounded-lg text-2xl font-mono text-center focus:border-red-primary outline-none" />
              </div>
            </div>
            {totalMinutes >= 60 && (
              <p className="text-center text-red-primary font-mono font-bold text-lg">
                🔒 {durationInput.days}d {durationInput.hours}h locked in
              </p>
            )}
            {totalMinutes > 0 && totalMinutes < 60 && (
              <p className="text-center text-tier-slave text-sm">Minimum duration is 1 hour</p>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-white/5 flex gap-3">
        <Button variant="ghost" onClick={step === 0 ? onCancel : () => setStep(s => s - 1)} className="flex-1">
          <ChevronLeft size={16} className="mr-1" />
          {step === 0 ? 'Cancel' : 'Back'}
        </Button>
        <Button variant="primary" onClick={handleNext} disabled={!canProceed || submitting} className="flex-1">
          {submitting ? (
            <><Loader2 size={16} className="mr-1 animate-spin" /> Locking In...</>
          ) : isLastStep ? (
            <>Lock In 🔒</>
          ) : (
            <>Continue <ChevronRight size={16} className="ml-1" /></>
          )}
        </Button>
      </footer>
    </div>
  )
}
```

**Step 2: Wire into home page**

In `src/app/(dashboard)/home/page.tsx`:

```tsx
// Add import:
import { SessionStartFlow } from '@/components/features/session-start-flow'

// Add state:
const [showStartFlow, setShowStartFlow] = useState(false)

// Replace handleStartSession:
const handleStartSession = async (config: SessionConfig) => {
  try {
    const res = await fetch('/api/sessions/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user!.id, config }),
    })
    if (!res.ok) {
      const err = await res.json()
      if (err.error === 'active_session_exists') {
        // Race condition — reload
        const active = await getActiveSession(user!.id)
        setSession(active)
        return
      }
      throw new Error(err.error)
    }
    const { session: newSession } = await res.json()
    setSession(newSession)
    setShowStartFlow(false)
  } catch (err) {
    console.error('Failed to start session:', err)
    alert('Failed to start session. Please try again.')
  }
}

// Replace "Start Session" button:
<Button variant="primary" onClick={() => setShowStartFlow(true)} className="mx-auto">
  <Play size={16} className="mr-2" />
  Start Session
</Button>

// Add SessionStartFlow at top of return (before <TopBar />):
{showStartFlow && profile && (
  <SessionStartFlow
    profile={profile}
    onStart={handleStartSession}
    onCancel={() => setShowStartFlow(false)}
  />
)}
```

**Step 3: Build check**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/components/features/session-start-flow.tsx src/app/(dashboard)/home/page.tsx
git commit -m "feat(ui): add SessionStartFlow mini-onboarding for new sessions"
```

---

## Phase 5: Master Task System

### Task 9: Update chat API for master task parsing

**Files:**
- Modify: `src/app/api/chat/route.ts`

**Step 1: Add TASK marker parsing**

In `src/app/api/chat/route.ts`, add after the existing imports:

```typescript
const TASK_MARKER_REGEX = /\[TASK:(\{[\s\S]*?\})\]\s*$/

interface MasterTaskPayload {
  title: string
  description: string
  deadline_minutes: number
  difficulty: number
  punishment_hours: number
}

async function extractAndCreateMasterTask(
  reply: string,
  supabase: ReturnType<typeof getServerSupabase>,
  userId: string,
  sessionId: string
): Promise<{ cleanReply: string; masterTask: Record<string, unknown> | null }> {
  const match = reply.match(TASK_MARKER_REGEX)
  if (!match) return { cleanReply: reply, masterTask: null }

  const cleanReply = reply.replace(TASK_MARKER_REGEX, '').trim()

  try {
    const payload = JSON.parse(match[1]) as MasterTaskPayload
    const deadline = new Date(Date.now() + (payload.deadline_minutes || 120) * 60 * 1000)

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        session_id: sessionId,
        task_type: 'master',
        source: 'ai_chat',
        title: payload.title || 'Master Task',
        description: payload.description || '',
        difficulty: Math.min(5, Math.max(1, payload.difficulty || 3)),
        punishment_hours: payload.punishment_hours || 4,
        punishment_type: 'task_failed',
        deadline: deadline.toISOString(),
        status: 'pending',
        assigned_at: new Date().toISOString(),
        duration_minutes: payload.deadline_minutes || 120,
        genres: ['master_command'],
        cage_status: 'caged',
        verification_type: 'photo',
        verification_requirement: 'Provide proof of completion as instructed',
        punishment_additional: null,
      })
      .select()
      .single()

    if (error) {
      console.error('[Chat] Failed to create master task:', error)
      return { cleanReply, masterTask: null }
    }

    // Log event
    await supabase.from('session_events').insert({
      session_id: sessionId,
      user_id: userId,
      event_type: 'task_assigned',
      payload: { task_id: task.id, task_type: 'master', title: task.title },
    })

    return { cleanReply, masterTask: task }
  } catch (err) {
    console.error('[Chat] Failed to parse task marker:', err)
    return { cleanReply, masterTask: null }
  }
}
```

**Step 2: Update the system prompt builder**

In the chat route, update the `compactSystem` prompt to include task instructions:

```typescript
const taskInstructions = sessionId
  ? `\n\nWhen assigning a task, append on its own final line:
[TASK:{"title":"...","description":"...","deadline_minutes":120,"difficulty":3,"punishment_hours":4}]
Only include this when explicitly commanding a task. Never include it in normal conversation.`
  : ''

const compactSystem = profileSummary
  ? `You are the AI Master of the LockedIn chastity app. NEVER break character.\n\nUser profile: ${profileSummary}\n\nBe dominant, strict, and psychologically engaging. Never violate listed limits.${taskInstructions}`
  : undefined
```

**Step 3: Update the normal AI response block**

Replace the normal response section to call `extractAndCreateMasterTask`:

```typescript
} else {
  const { text, usage } = await generateText(message, aiContext, compactSystem)

  // Extract master task if AI issued one
  const { cleanReply, masterTask } = userId && sessionId
    ? await extractAndCreateMasterTask(text, supabase, userId, sessionId)
    : { cleanReply: text, masterTask: null }

  reply = cleanReply
  if (userId) await trackUsage(supabase, userId, 'llama-3.3-70b-versatile', usage, 'chat')

  // ... existing rudeness detection ...

  // Include masterTask in response
  return NextResponse.json({
    reply,
    careMode,
    messageType,
    masterTask,
    timestamp: new Date().toISOString(),
  })
}
```

**Step 4: Build check**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add src/app/api/chat/route.ts
git commit -m "feat(chat): add master task extraction from AI responses via [TASK:{...}] marker"
```

---

## Phase 6: Supabase Edge Function Cron

### Task 10: Auto-expiry + overdue task cron

**Files:**
- Create: `supabase/functions/session-cron/index.ts`

**Step 1: Implement**

```typescript
// supabase/functions/session-cron/index.ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (_req: Request) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const now = new Date().toISOString()
  const results: Record<string, unknown> = {}

  // 1. Auto-expire sessions whose scheduled_end_time has passed
  const { data: expiredSessions, error: expireError } = await supabase
    .from('sessions')
    .update({ status: 'completing' })
    .in('status', ['active', 'extending'])
    .lt('scheduled_end_time', now)
    .select('id, user_id')

  results.expired_sessions = expiredSessions?.length ?? 0

  if (expiredSessions && expiredSessions.length > 0) {
    const events = expiredSessions.map((s: { id: string; user_id: string }) => ({
      session_id: s.id,
      user_id: s.user_id,
      event_type: 'session_completed',
      payload: { auto_expired: true, expired_at: now },
    }))
    await supabase.from('session_events').insert(events)
  }

  // 2. Mark overdue master tasks
  const { data: overdueTasks, error: overdueError } = await supabase
    .from('tasks')
    .update({ status: 'overdue' })
    .eq('task_type', 'master')
    .eq('status', 'pending')
    .lt('deadline', now)
    .select('id, user_id, session_id, difficulty, punishment_hours, title')

  results.overdue_tasks = overdueTasks?.length ?? 0

  // 3. Trigger punishment pipeline for each overdue task
  if (overdueTasks && overdueTasks.length > 0) {
    for (const task of overdueTasks) {
      if (!task.session_id) continue

      // Check session is still active
      const { data: session } = await supabase
        .from('sessions')
        .select('status, total_duration_minutes, start_time, session_config')
        .eq('id', task.session_id)
        .single()

      if (!session || !['active', 'extending'].includes(session.status)) continue

      const tier = (session.session_config as { tier?: string } | null)?.tier ?? 'Newbie'
      const punishmentHours = task.punishment_hours || 4
      const deltaMinutes = punishmentHours * 60

      // Extend session
      const newDuration = session.total_duration_minutes + deltaMinutes
      const newEnd = new Date(
        new Date(session.start_time).getTime() + newDuration * 60 * 1000
      ).toISOString()

      await supabase
        .from('sessions')
        .update({
          total_duration_minutes: newDuration,
          scheduled_end_time: newEnd,
          extension_count: (session.extension_count ?? 0) + 1,
          last_extended_at: now,
        })
        .eq('id', task.session_id)

      // Create punishment task
      await supabase.from('tasks').insert({
        user_id: task.user_id,
        session_id: task.session_id,
        task_type: 'punishment',
        source: 'system',
        title: `Punishment: Overdue task — ${task.title}`,
        description: `You failed to complete "${task.title}" before the deadline. Serve your punishment.`,
        difficulty: Math.min(5, (task.difficulty || 2) + 1),
        punishment_hours: punishmentHours,
        punishment_type: 'task_failed',
        deadline: new Date(Date.now() + deltaMinutes * 60 * 1000).toISOString(),
        status: 'pending',
        assigned_at: now,
        duration_minutes: deltaMinutes,
        genres: ['punishment'],
        cage_status: 'caged',
        verification_type: 'photo',
        verification_requirement: 'Provide proof of punishment completion',
        punishment_additional: null,
      })

      // Write events
      await supabase.from('session_events').insert([
        {
          session_id: task.session_id,
          user_id: task.user_id,
          event_type: 'task_overdue',
          payload: { task_id: task.id, title: task.title },
        },
        {
          session_id: task.session_id,
          user_id: task.user_id,
          event_type: 'punishment_applied',
          payload: { reason: `Overdue master task: ${task.title}`, hours: punishmentHours },
        },
        {
          session_id: task.session_id,
          user_id: task.user_id,
          event_type: 'timer_extended',
          payload: { delta_minutes: deltaMinutes, reason: 'Overdue task punishment', new_end: newEnd },
        },
      ])

      // Notify user
      await supabase.from('notifications').insert({
        user_id: task.user_id,
        type: 'punishment',
        title: '⛓️ Task Overdue — Punishment Applied',
        body: `+${punishmentHours}h added to your lock time for failing: "${task.title}"`,
        read: false,
      })
    }
  }

  if (expireError) console.error('[Cron] Expire error:', expireError)
  if (overdueError) console.error('[Cron] Overdue error:', overdueError)

  return new Response(JSON.stringify({ ok: true, timestamp: now, results }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

**Step 2: Deploy via Supabase MCP**

Use `mcp__supabase__deploy_edge_function` with:
- `name`: `session-cron`
- `verify_jwt`: `false` (called by cron scheduler, not user)
- `files`: the index.ts above

**Step 3: Set up cron schedule in Supabase**

In the Supabase dashboard → Edge Functions → session-cron → Schedule:
Set cron expression: `* * * * *` (every minute)

Or use Supabase's pg_cron extension:
```sql
SELECT cron.schedule(
  'session-expiry-check',
  '* * * * *',
  $$ SELECT net.http_post(
    url := '<YOUR_SUPABASE_URL>/functions/v1/session-cron',
    headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb
  ) $$
);
```

**Step 4: Commit**

```bash
git add supabase/functions/session-cron/index.ts
git commit -m "feat(cron): add session-expiry and overdue-task Edge Function"
```

---

## Phase 7: Local Storage

### Task 11: Install Dexie.js + IndexedDB schema

**Files:**
- Create: `src/lib/local-storage/db.ts`

**Step 1: Install Dexie**

```bash
npm install dexie
```

**Step 2: Implement DB schema**

```typescript
// src/lib/local-storage/db.ts
import Dexie, { type Table } from 'dexie'

export interface LocalChatMessage {
  id: string
  session_id: string
  user_id: string
  sender: 'ai' | 'user'
  content: string
  message_type: string
  created_at: string
}

export interface LocalSessionArchive {
  id: string
  session_id: string
  user_id: string
  config: Record<string, unknown>
  events: Record<string, unknown>[]
  tasks: Record<string, unknown>[]
  chat_messages: LocalChatMessage[]
  summary: Record<string, unknown> | null
  archived_at: string
}

export interface LocalProofMetadata {
  id: string
  task_id: string
  session_id: string
  user_id: string
  file_type: 'image' | 'video' | 'text' | 'audio'
  opfs_path: string
  created_at: string
}

export interface LocalJournalEntry {
  id: string
  user_id: string
  session_id: string | null
  content: string
  mood: string | null
  obedience_rating: number | null
  ai_analysis: string | null
  created_at: string
}

class LockedInDB extends Dexie {
  chat_messages!: Table<LocalChatMessage>
  session_archives!: Table<LocalSessionArchive>
  proof_metadata!: Table<LocalProofMetadata>
  journal_entries!: Table<LocalJournalEntry>

  constructor() {
    super('LockedInDB')
    this.version(1).stores({
      chat_messages:    'id, session_id, user_id, created_at',
      session_archives: 'id, session_id, user_id, archived_at',
      proof_metadata:   'id, task_id, session_id, user_id',
      journal_entries:  'id, user_id, session_id, created_at',
    })
  }
}

// Singleton — safe to call multiple times
let _db: LockedInDB | null = null

export function getLocalDB(): LockedInDB {
  if (typeof window === 'undefined') throw new Error('IndexedDB not available on server')
  if (!_db) _db = new LockedInDB()
  return _db
}

// Request persistent storage permission
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  const persisted = await navigator.storage.persisted()
  if (persisted) return true
  return navigator.storage.persist()
}
```

**Step 3: Commit**

```bash
git add src/lib/local-storage/db.ts
git commit -m "feat(local-storage): add Dexie.js IndexedDB schema"
```

---

### Task 12: OPFS utilities

**Files:**
- Create: `src/lib/local-storage/opfs.ts`

**Step 1: Implement**

```typescript
// src/lib/local-storage/opfs.ts

/**
 * Stores a file in OPFS at /{userId}/{sessionId}/{subfolder}/{filename}
 * Returns the opfs path string used as local_storage_key
 */
export async function saveFileToOPFS(
  userId: string,
  sessionId: string,
  subfolder: 'proofs' | 'videos',
  filename: string,
  data: Blob | ArrayBuffer
): Promise<string> {
  const root = await navigator.storage.getDirectory()
  const userDir    = await root.getDirectoryHandle(userId, { create: true })
  const sessionDir = await userDir.getDirectoryHandle(sessionId, { create: true })
  const subDir     = await sessionDir.getDirectoryHandle(subfolder, { create: true })
  const fileHandle = await subDir.getFileHandle(filename, { create: true })
  const writable   = await fileHandle.createWritable()

  await writable.write(data)
  await writable.close()

  return `/${userId}/${sessionId}/${subfolder}/${filename}`
}

/**
 * Reads a file from OPFS by path
 */
export async function readFileFromOPFS(opfsPath: string): Promise<File | null> {
  try {
    const parts = opfsPath.replace(/^\//, '').split('/')
    // parts: [userId, sessionId, subfolder, filename]
    if (parts.length < 4) return null

    const root       = await navigator.storage.getDirectory()
    const userDir    = await root.getDirectoryHandle(parts[0])
    const sessionDir = await userDir.getDirectoryHandle(parts[1])
    const subDir     = await sessionDir.getDirectoryHandle(parts[2])
    const fileHandle = await subDir.getFileHandle(parts[3])
    return fileHandle.getFile()
  } catch {
    return null
  }
}

/**
 * Lists all files for a session in OPFS
 */
export async function listSessionFiles(
  userId: string,
  sessionId: string
): Promise<{ path: string; name: string; subfolder: string }[]> {
  const files: { path: string; name: string; subfolder: string }[] = []

  try {
    const root       = await navigator.storage.getDirectory()
    const userDir    = await root.getDirectoryHandle(userId)
    const sessionDir = await userDir.getDirectoryHandle(sessionId)

    for await (const [subName, subHandle] of sessionDir as unknown as AsyncIterable<[string, FileSystemDirectoryHandle]>) {
      if (subHandle.kind !== 'directory') continue
      for await (const [fileName] of subHandle as unknown as AsyncIterable<[string, FileSystemFileHandle]>) {
        files.push({
          path: `/${userId}/${sessionId}/${subName}/${fileName}`,
          name: fileName,
          subfolder: subName,
        })
      }
    }
  } catch {
    // Directory doesn't exist yet — no files
  }

  return files
}

/**
 * Deletes all OPFS files for a session
 */
export async function deleteSessionFiles(userId: string, sessionId: string): Promise<void> {
  try {
    const root    = await navigator.storage.getDirectory()
    const userDir = await root.getDirectoryHandle(userId)
    await userDir.removeEntry(sessionId, { recursive: true })
  } catch {
    // Already gone
  }
}
```

**Step 2: Commit**

```bash
git add src/lib/local-storage/opfs.ts
git commit -m "feat(local-storage): add OPFS utilities for proof and video files"
```

---

### Task 13: Rolling 500-message window + chat archival

**Files:**
- Create: `src/lib/local-storage/chat-archive.ts`

**Step 1: Implement**

```typescript
// src/lib/local-storage/chat-archive.ts
import { getLocalDB, type LocalChatMessage } from './db'
import { getSupabase } from '@/lib/supabase/client'

const SUPABASE_WINDOW = 500
const ARCHIVE_BATCH   = 100

/**
 * Called after every chat message insert.
 * Writes to IndexedDB then trims Supabase if over the window.
 */
export async function archiveChatMessage(message: LocalChatMessage): Promise<void> {
  const db = getLocalDB()
  await db.chat_messages.put(message)

  // Check Supabase count for this session
  const supabase = getSupabase()
  const { count } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', message.session_id)

  if ((count ?? 0) > SUPABASE_WINDOW) {
    // Fetch oldest ARCHIVE_BATCH to evict
    const { data: oldest } = await supabase
      .from('chat_messages')
      .select('id')
      .eq('session_id', message.session_id)
      .order('created_at', { ascending: true })
      .limit(ARCHIVE_BATCH)

    if (oldest && oldest.length > 0) {
      const ids = oldest.map(m => m.id)
      await supabase.from('chat_messages').delete().in('id', ids)
    }
  }
}

/**
 * Called at session end. Fetches all remaining Supabase messages
 * and ensures they're all in IndexedDB.
 */
export async function flushSessionChats(sessionId: string): Promise<void> {
  const supabase = getSupabase()
  const db = getLocalDB()

  let page = 0
  const PAGE_SIZE = 200

  while (true) {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (!data || data.length === 0) break

    await db.chat_messages.bulkPut(data as LocalChatMessage[])
    if (data.length < PAGE_SIZE) break
    page++
  }
}

/**
 * Returns full chat history for a session from IndexedDB
 */
export async function getLocalChatHistory(sessionId: string): Promise<LocalChatMessage[]> {
  const db = getLocalDB()
  return db.chat_messages
    .where('session_id')
    .equals(sessionId)
    .sortBy('created_at')
}
```

**Step 2: Commit**

```bash
git add src/lib/local-storage/chat-archive.ts
git commit -m "feat(local-storage): add rolling 500-message Supabase window with IndexedDB archival"
```

---

### Task 14: Session archival + export flow

**Files:**
- Create: `src/lib/local-storage/session-archive.ts`
- Create: `src/lib/local-storage/export.ts`

**Step 1: Install fflate**

```bash
npm install fflate
```

**Step 2: Implement session archival**

```typescript
// src/lib/local-storage/session-archive.ts
import { getLocalDB } from './db'
import { flushSessionChats } from './chat-archive'
import { getSupabase } from '@/lib/supabase/client'
import type { Session } from '@/lib/supabase/schema'

/**
 * Archives all session data to IndexedDB then purges from Supabase.
 * Called when session.status transitions to 'completing'.
 */
export async function archiveSession(
  session: Session,
  userId: string,
  summary: Record<string, unknown> | null
): Promise<void> {
  const supabase = getSupabase()
  const db = getLocalDB()

  // 1. Flush remaining chats to IndexedDB
  await flushSessionChats(session.id)

  // 2. Fetch remaining Supabase data
  const [tasksResult, eventsResult] = await Promise.all([
    supabase.from('tasks').select('*').eq('session_id', session.id),
    supabase.from('session_events').select('*').eq('session_id', session.id),
  ])

  const chatMessages = await db.chat_messages
    .where('session_id').equals(session.id)
    .sortBy('created_at')

  // 3. Write archive to IndexedDB
  await db.session_archives.put({
    id: `archive_${session.id}`,
    session_id: session.id,
    user_id: userId,
    config: (session.session_config as Record<string, unknown>) ?? {},
    events: (eventsResult.data ?? []) as Record<string, unknown>[],
    tasks: (tasksResult.data ?? []) as Record<string, unknown>[],
    chat_messages: chatMessages,
    summary,
    archived_at: new Date().toISOString(),
  })

  // 4. Purge from Supabase
  await fetch('/api/sessions/purge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: session.id, userId }),
  })

  // 5. Finalize session
  await fetch('/api/sessions/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: session.id, userId }),
  })
}
```

**Step 3: Implement export**

```typescript
// src/lib/local-storage/export.ts
import { strToU8, zipSync } from 'fflate'
import { getLocalDB } from './db'
import { listSessionFiles, readFileFromOPFS } from './opfs'

/**
 * Generates a downloadable ZIP for a completed session.
 */
export async function exportSession(sessionId: string, userId: string): Promise<void> {
  const db = getLocalDB()

  const archive = await db.session_archives
    .where('session_id').equals(sessionId)
    .first()

  if (!archive) {
    throw new Error('Session archive not found on this device')
  }

  const files: Record<string, Uint8Array> = {}

  // JSON data files
  files['chat_history.json']    = strToU8(JSON.stringify(archive.chat_messages, null, 2))
  files['tasks.json']           = strToU8(JSON.stringify(archive.tasks, null, 2))
  files['session_events.json']  = strToU8(JSON.stringify(archive.events, null, 2))
  files['session_summary.json'] = strToU8(JSON.stringify(archive.summary ?? {}, null, 2))
  files['session_config.json']  = strToU8(JSON.stringify(archive.config, null, 2))

  // Media files from OPFS
  const opfsFiles = await listSessionFiles(userId, sessionId)
  for (const { path, name, subfolder } of opfsFiles) {
    const file = await readFileFromOPFS(path)
    if (!file) continue
    const buffer = await file.arrayBuffer()
    files[`${subfolder}/${name}`] = new Uint8Array(buffer)
  }

  // Generate ZIP
  const zip = zipSync(files, { level: 0 }) // level 0 = store only (fast)

  // Trigger download
  const blob = new Blob([zip], { type: 'application/zip' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `LockedIn_Session_${sessionId.slice(0, 8)}_${new Date().toISOString().split('T')[0]}.zip`
  a.click()
  URL.revokeObjectURL(url)
}
```

**Step 4: Commit**

```bash
git add src/lib/local-storage/session-archive.ts src/lib/local-storage/export.ts
git commit -m "feat(local-storage): add session archival flow and ZIP export with fflate"
```

---

## Phase 8: Settings Lock

### Task 15: Settings lock — UI + API enforcement

**Files:**
- Modify: `src/app/(dashboard)/settings/page.tsx`
- Create: `src/lib/supabase/session-guard.ts`

**Step 1: Create server-side session guard utility**

```typescript
// src/lib/supabase/session-guard.ts
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Returns the active session ID if one exists, or null.
 * Use in API routes that should be locked during sessions.
 */
export async function getActiveSessionId(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('sessions')
    .select('id')
    .eq('user_id', userId)
    .in('status', ['active', 'extending', 'completing'])
    .maybeSingle()

  return data?.id ?? null
}
```

**Step 2: Update settings page to show lock overlay**

In `src/app/(dashboard)/settings/page.tsx`, add at the top of the component body (after existing hooks):

```tsx
import { Lock } from 'lucide-react'

// Add inside component, after existing state:
const isSessionActive = !!session && ['active', 'extending'].includes(session.status)

// Add BEFORE the settings content (first thing inside the main return):
{isSessionActive && (
  <div className="fixed inset-0 z-40 bg-bg-primary/80 backdrop-blur-sm flex items-center justify-center p-6">
    <div className="text-center space-y-4 max-w-sm">
      <div className="w-16 h-16 rounded-full bg-bg-secondary border border-red-primary/30 flex items-center justify-center mx-auto">
        <Lock size={28} className="text-red-primary" />
      </div>
      <h2 className="text-xl font-bold font-mono">Settings Locked</h2>
      <p className="text-text-secondary text-sm">
        Settings are locked during an active session.
        Your Master controls this space until your release.
      </p>
      <div className="text-xs text-text-tertiary font-mono">
        Session ends: {session?.scheduled_end_time
          ? new Date(session.scheduled_end_time).toLocaleString()
          : '—'}
      </div>
    </div>
  </div>
)}
```

**Step 3: Commit**

```bash
git add src/app/(dashboard)/settings/page.tsx src/lib/supabase/session-guard.ts
git commit -m "feat(settings): add session lock overlay and server-side guard utility"
```

---

## Phase 9: Tasks Page Updates

### Task 16: Tasks page — master + punishment task sections

**Files:**
- Modify: `src/app/(dashboard)/tasks/page.tsx`

**Step 1: Read the current tasks page**

Read `src/app/(dashboard)/tasks/page.tsx` fully first.

**Step 2: Add task type filtering and section headers**

In the tasks page, after fetching tasks, add filtering:

```tsx
// After fetching tasks data, add:
const masterTasks    = tasks.filter(t => t.task_type === 'master')
const punishmentTasks = tasks.filter(t => t.task_type === 'punishment' && t.status === 'pending')
const dailyTasks     = tasks.filter(t => t.task_type === 'daily' || !t.task_type)
```

Add master tasks section above daily tasks in the render:

```tsx
{/* Master Tasks */}
{masterTasks.length > 0 && (
  <div className="space-y-3">
    <div className="flex items-center gap-2 px-1">
      <div className="w-2 h-2 rounded-full bg-red-primary animate-pulse" />
      <h3 className="text-sm font-bold text-red-primary uppercase tracking-wider">
        Master Commands
      </h3>
    </div>
    {masterTasks.map(task => (
      <div key={task.id} className="border border-red-primary/30 rounded-lg p-4 bg-red-primary/5">
        {/* Task card with deadline countdown */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h4 className="font-semibold">{task.title}</h4>
            <p className="text-sm text-text-secondary mt-1 line-clamp-2">{task.description}</p>
          </div>
          <Badge variant="locked">MASTER</Badge>
        </div>
        {task.deadline && (
          <p className={`text-xs font-mono mt-2 ${new Date(task.deadline) < new Date() ? 'text-red-primary' : 'text-text-tertiary'}`}>
            {new Date(task.deadline) < new Date() ? '⚠ OVERDUE' : `Due: ${formatTimeLeft(new Date(task.deadline))}`}
          </p>
        )}
      </div>
    ))}
  </div>
)}

{/* Punishment Tasks */}
{punishmentTasks.length > 0 && (
  <div className="space-y-3">
    <div className="flex items-center gap-2 px-1">
      <div className="w-2 h-2 rounded-full bg-tier-slave animate-pulse" />
      <h3 className="text-sm font-bold text-tier-slave uppercase tracking-wider">
        Active Punishments
      </h3>
    </div>
    {punishmentTasks.map(task => (
      <div key={task.id} className="border border-tier-slave/30 rounded-lg p-4 bg-tier-slave/5">
        <h4 className="font-semibold">{task.title}</h4>
        <p className="text-sm text-text-secondary mt-1">{task.description}</p>
        {task.deadline && (
          <p className="text-xs font-mono mt-2 text-tier-slave">
            Proof due: {formatTimeLeft(new Date(task.deadline))}
          </p>
        )}
      </div>
    ))}
  </div>
)}
```

**Step 3: Build check**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/app/(dashboard)/tasks/page.tsx
git commit -m "feat(tasks): add master command and punishment task sections"
```

---

## Phase 10: Session Completion Flow

### Task 17: Wire session archival into the home page on completing state

**Files:**
- Modify: `src/app/(dashboard)/home/page.tsx`

**Step 1: Add Realtime subscription to session status**

In `src/app/(dashboard)/home/page.tsx`, replace the one-time `loadDashboard` fetch with a Realtime subscription on the session:

```tsx
import { requestPersistentStorage } from '@/lib/local-storage/db'
import { archiveSession } from '@/lib/local-storage/session-archive'

// Add state:
const [summary, setSummary] = useState<Record<string, unknown> | null>(null)
const [archiving, setArchiving] = useState(false)

// Add Realtime subscription after loadDashboard useEffect:
useEffect(() => {
  if (!session?.id || !user) return

  const supabase = getSupabase()

  const channel = supabase
    .channel(`session_${session.id}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'sessions',
      filter: `id=eq.${session.id}`,
    }, (payload) => {
      const updated = payload.new as Session
      setSession(updated)

      // Handle completing → archive flow
      if (updated.status === 'completing' && !archiving) {
        handleSessionCompleting(updated)
      }
    })
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}, [session?.id, user])

// Add completing handler:
const handleSessionCompleting = async (completingSession: Session) => {
  if (!user) return
  setArchiving(true)

  try {
    // Generate summary first
    const compliance = completingSession.total_tasks_assigned > 0
      ? Math.round((completingSession.total_tasks_completed / completingSession.total_tasks_assigned) * 100)
      : 0

    const summaryRes = await fetch('/api/sessions/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: completingSession.id,
        userId: user.id,
        sessionData: {
          actual_minutes: Math.round((Date.now() - new Date(completingSession.start_time).getTime()) / 60000),
          planned_minutes: completingSession.total_duration_minutes,
          tasks_completed: completingSession.total_tasks_completed,
          tasks_assigned: completingSession.total_tasks_assigned,
          tasks_failed: completingSession.total_tasks_failed,
          master_completed: 0,
          master_failed: 0,
          punishment_count: completingSession.total_punishments,
          compliance_rate: compliance,
          willpower_start: 50,
          willpower_end: profile?.willpower_score ?? 50,
          streak_change: 0,
        },
      }),
    })

    const { summary: generatedSummary } = summaryRes.ok ? await summaryRes.json() : { summary: null }
    setSummary(generatedSummary)

    // Archive and purge
    await archiveSession(completingSession, user.id, generatedSummary)
  } catch (err) {
    console.error('[Home] Session archive failed:', err)
  } finally {
    setArchiving(false)
  }
}

// Request persistent storage at session start
useEffect(() => {
  if (session?.status === 'active') {
    requestPersistentStorage().then(granted => {
      if (!granted) console.warn('[Storage] Persistent storage not granted')
    })
  }
}, [session?.status])
```

**Step 2: Build check**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/app/(dashboard)/home/page.tsx
git commit -m "feat(home): wire session archival on completing state with Realtime subscription"
```

---

## Phase 11: Final Integration

### Task 18: Run full test suite and build

**Step 1: Run all tests**

```bash
npm run test
```
Expected: all 52 existing tests pass (new routes don't have conflicting mocks)

**Step 2: Full production build**

```bash
npm run build
```
Expected: compiled successfully, no TypeScript errors

**Step 3: Verify new routes appear in build output**

Check that these routes appear in the build output:
- `ƒ /api/sessions/start`
- `ƒ /api/sessions/extend`
- `ƒ /api/sessions/complete`
- `ƒ /api/sessions/purge`
- `ƒ /api/sessions/emergency`
- `ƒ /api/sessions/summary`

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete session lifecycle redesign — timer fix, master tasks, local storage, settings lock"
```

---

## Summary

| Phase | Tasks | What It Delivers |
|-------|-------|-----------------|
| 1 — Database | 1–2 | Schema migrations, TypeScript types |
| 2 — Session APIs | 3–6 | start, extend, complete, purge, emergency, summary |
| 3 — Timer Fix | 7 | Actual duration progress, completing/completed states |
| 4 — Mini Onboarding | 8 | 6-step SessionStartFlow component |
| 5 — Master Tasks | 9 | AI chat `[TASK:{...}]` parsing and task creation |
| 6 — Cron | 10 | Auto-expiry + overdue task detection Edge Function |
| 7 — Local Storage | 11–14 | Dexie.js, OPFS, rolling window, archival, ZIP export |
| 8 — Settings Lock | 15 | UI overlay + server-side API guard |
| 9 — Tasks UI | 16 | Master command and punishment task sections |
| 10 — Completion | 17 | Realtime archival on completing state |
| 11 — Integration | 18 | Full test + build verification |
