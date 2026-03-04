# LockedIn — Session Lifecycle Redesign
**Date:** 2026-03-05
**Status:** Approved
**Approach:** Full Redesign (Approach B)

---

## Overview

Redesign and implement a fully AI-controlled session lifecycle architecture. The AI Master governs session state, task generation, punishments, timer logic, local archival, and post-session summary generation. All authority is server-side. The client only renders.

---

## Core Principles

- No client-side authoritative logic — timer, state transitions, and task creation are all server-driven
- No data loss — every state change writes to `session_events` before anything else changes
- Supabase stores metadata and working state only — heavy data (chat, media) lives on-device
- All state transitions are logged and replayable via the event log

---

## Section 1: Database Schema

### `sessions` table — modified
```sql
ALTER TABLE sessions
  ADD COLUMN total_duration_minutes  integer NOT NULL DEFAULT 10080,
  ADD COLUMN session_config          jsonb,
  ADD COLUMN extension_count         integer NOT NULL DEFAULT 0,
  ADD COLUMN last_extended_at        timestamptz;

-- Extend status enum
-- idle | active | extending | completing | completed | emergency | failed
```

`scheduled_end_time` is kept as a stored column, always equal to `start_time + total_duration_minutes`.
Extensions increment `total_duration_minutes` and recalculate `scheduled_end_time`.

`session_config` JSONB structure:
```json
{
  "tier": "Slave",
  "ai_personality": "Cruel Mistress",
  "hard_limits": ["..."],
  "soft_limits": ["..."],
  "regimens": ["..."],
  "desired_duration_minutes": 4320
}
```

### `tasks` table — modified
```sql
ALTER TABLE tasks
  ADD COLUMN task_type  text NOT NULL DEFAULT 'daily',
  ADD COLUMN source     text NOT NULL DEFAULT 'auto';

-- task_type: 'daily' | 'master' | 'punishment'
-- source:    'ai_chat' | 'auto' | 'system'
```

### `session_events` table — new
```sql
CREATE TABLE session_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id),
  event_type  text NOT NULL,
  payload     jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_session_events_session ON session_events(session_id, created_at);
```

Event types: `session_started`, `session_completed`, `session_emergency`, `task_assigned`, `task_completed`, `task_failed`, `task_overdue`, `punishment_applied`, `punishment_completed`, `timer_extended`, `settings_locked`, `settings_unlocked`, `archive_completed`, `summary_generated`

### `proof_documents` table — new
```sql
CREATE TABLE proof_documents (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id             uuid NOT NULL REFERENCES tasks(id),
  user_id             uuid NOT NULL REFERENCES profiles(id),
  session_id          uuid REFERENCES sessions(id),
  file_type           text NOT NULL, -- 'image' | 'video' | 'text' | 'audio'
  local_storage_key   text,          -- OPFS path or IndexedDB key (device-local reference)
  verification_status text NOT NULL DEFAULT 'pending', -- 'pending' | 'passed' | 'failed'
  verified_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);
```

No binary data in Supabase. Only the metadata reference. The actual file lives on-device in OPFS.

---

## Section 2: Session State Machine

```
idle
 │
 └─[user completes mini-onboarding → POST /api/sessions/start]
         │
       active ◄────────────────────────────────────────────────┐
         │                                                      │
         ├─[punishment / AI extends → POST /api/sessions/extend]│
         │         │                                            │
         │      extending ──[extension applied]─────────────────┘
         │
         ├─[scheduled_end_time < now() → cron]
         │         │
         │      completing
         │         │
         │      [archive written + Supabase purge]
         │         │
         │      completed
         │
         └─[user triggers emergency → POST /api/sessions/emergency]
                   │
                emergency
```

**Rules:**
- Only API routes write `status`. Client reads only.
- Every transition writes to `session_events` before updating `sessions`.
- `completing` is a transient state — the client drives the archival flow, then calls `/api/sessions/complete` to finalize.
- `emergency` bypasses all pending tasks and punishments.

---

## Section 3: Timer Architecture

**Server stores:**
```
start_time              timestamptz
total_duration_minutes  integer
scheduled_end_time      timestamptz  (= start_time + interval)
```

**Extension logic:**
```sql
UPDATE sessions SET
  total_duration_minutes = total_duration_minutes + $delta,
  scheduled_end_time     = start_time + (total_duration_minutes + $delta) * interval '1 minute',
  extension_count        = extension_count + 1,
  last_extended_at       = now()
WHERE id = $session_id;
```

**Client rendering:**
```ts
const remaining_ms = new Date(session.scheduled_end_time).getTime() - Date.now()
const progress     = elapsed_ms / (session.total_duration_minutes * 60000) * 100
```

Progress uses actual session duration — not a hardcoded 7-day value.

**Auto-expiry Edge Function (cron, every 60s):**
```sql
UPDATE sessions
SET status = 'completing'
WHERE status IN ('active', 'extending')
AND scheduled_end_time < now()
RETURNING id, user_id;
```
For each expired session: write `session_completed` event, notify client via Realtime.

**Overdue master task detection (same cron):**
```sql
UPDATE tasks
SET status = 'overdue'
WHERE task_type = 'master'
AND status = 'pending'
AND deadline < now()
RETURNING id, user_id, session_id;
```
Each overdue task triggers the punishment pipeline.

**Timer bug fixes:**
1. Progress hardcoded to 7 days → replaced with `total_duration_minutes`
2. Timer freezes at 00:00:00 → `TimerCard` watches `session.status` via Realtime; when `completing` or `completed`, renders completion state instead of frozen zeros
3. No restart option → completion state shows session summary CTA, not a broken timer

---

## Section 4: Mini Session Onboarding

Replaces the instant `createSession()` call on the home page. A full-screen 6-step flow, all fields pre-filled from `profile` as defaults.

```
Step 1 — Tier             dropdown         default: profile.tier
Step 2 — Hard Limits      multi-select     default: profile.hard_limits
Step 3 — Soft Limits      multi-select     default: profile.soft_limits
Step 4 — Regimens         card select      default: profile.preferred_regimens
Step 5 — AI Personality   dropdown         default: profile.ai_personality
Step 6 — Lock Duration    time picker      no default — user must set explicitly
```

On confirm → `POST /api/sessions/start`:
- Creates session row with `session_config` JSONB
- Sets `total_duration_minutes` from user input
- Writes `session_started` event
- Returns session object

Profile is **not modified**. Session config is session-scoped only.

---

## Section 5: Master Task System

### AI response format

The chat API system prompt instructs the AI:

> "When assigning a task, append a machine-readable block on its own line at the very end of your response — nothing after it:
> `[TASK:{"title":"...","description":"...","deadline_minutes":120,"difficulty":3,"punishment_hours":4}]`
> Only include this when explicitly assigning a task. Never include it in normal conversation."

### Chat API parsing

```ts
const TASK_REGEX = /\[TASK:(\{.*?\})\]\s*$/s

// 1. Detect [TASK:{...}] in AI response
// 2. Strip it from reply before sending to client
// 3. Parse JSON
// 4. Create task row: task_type='master', source='ai_chat'
//    deadline = now() + deadline_minutes
// 5. Write 'task_assigned' event
// 6. Return clean reply + masterTask field in response
```

### Client handling

```ts
// Chat page receives:
{ reply: "...", masterTask: { id, title, deadline, difficulty } | null }

// If masterTask present:
// - Animate task card appearing in Tasks page
// - Show toast notification
// - Update task count badge
```

### Master tasks in Tasks page

Displayed in a distinct section above daily tasks:
- Red/gold border treatment
- Countdown deadline timer per card
- No daily limit
- Same proof/completion flow as daily tasks

---

## Section 6: Punishment Pipeline

All punishment triggers flow through the same pipeline regardless of source.

```
Trigger sources:
  ├── Overdue master task        (cron → auto)
  ├── Failed verification        (/api/verify)
  ├── Failed daily task          (/api/tasks/fail)
  └── AI rudeness detection      (/api/chat)

Pipeline (POST /api/punish):
  1. Look up punishment hours from PUNISHMENT_TABLE[violation_type][tier]
  2. Create task row: task_type='punishment', source='system'
     deadline = now() + punishment_hours (proof window)
  3. Extend session: total_duration_minutes += punishment_hours * 60
  4. Write 'punishment_applied' event
  5. Write notification (type='punishment', body=description)
  6. Return punishment task

Proof submission:
  - File stored to OPFS locally: /{user_id}/{session_id}/proofs/{filename}
  - Base64 sent to /api/verify (no Supabase Storage)
  - Verification prompt includes: "This proof must show recent completion.
    Check for indicators the image was not pre-taken."
  - Pass → task status 'completed', 'punishment_completed' event
  - Fail → new punishment generated at escalated tier (tier + 1 level)
```

---

## Section 7: Local Storage Architecture

### IndexedDB (Dexie.js) — structured data

```ts
// Tables
db.chat_messages      // All messages, permanent device record
db.session_archives   // Completed session JSON blobs
db.journal_entries    // Full journal content
db.proof_metadata     // OPFS file references
db.task_archives      // Completed task history
```

### OPFS — binary files

```
/{user_id}/{session_id}/proofs/{filename}
/{user_id}/{session_id}/videos/{filename}
```

### Persistent Storage

At session start, call `navigator.storage.persist()`. If denied, show a warning:
> "Storage permission not granted. Your session data may be cleared by the OS under low storage conditions. Tap here to grant permission."

### Rolling 500-message window

```
On every chat insert:
  1. Write to Supabase chat_messages
  2. Write to IndexedDB chat_messages

  Check: SELECT COUNT(*) WHERE session_id = $1 AND source = 'supabase'
  If count > 500:
    - Fetch oldest 100 from Supabase
    - Verify in IndexedDB (write if missing)
    - DELETE from Supabase
```

### Session end archival + Supabase purge

Triggered when client detects `session.status = 'completing'` via Realtime:

```
1. Fetch from Supabase: chat_messages, tasks, session_events, proof_documents
2. Write to IndexedDB session_archives: full snapshot
3. POST /api/sessions/purge:
   DELETE chat_messages WHERE session_id
   DELETE proof_documents WHERE session_id
   DELETE calendar_adjustments WHERE session_id
   DELETE session_events WHERE session_id
   (keeps: tasks metadata, session row, achievements, notifications)
4. POST /api/sessions/complete → status = 'completed'
5. Settings unlocked
6. Summary screen shown
```

### Export flow

```
User taps "Export Session Data":
  1. Read IndexedDB session_archives for selected session
  2. Read OPFS files for that session
  3. Generate ZIP in-browser (fflate):
     LockedIn_Export_{session_id}/
       chat_history.json
       tasks.json
       punishments.json
       journal_entries.json
       session_summary.json
       proofs/
       videos/
  4. Trigger browser download
  5. User manually uploads to Google Drive
```

---

## Section 8: Settings Lock

### UI layer

```tsx
// Settings page
const { data: activeSession } = useRealtimeSingle('sessions', { user_id: user.id, status: 'active' })
const isLocked = !!activeSession

// Render locked overlay if isLocked:
"Settings are locked during an active session.
 Your Master controls this space."

// All inputs disabled, lock icon on tier/limits/personality fields
```

### API layer

Every profile mutation route checks for an active session:

```ts
const activeSession = await supabase
  .from('sessions')
  .select('id')
  .eq('user_id', userId)
  .in('status', ['active', 'extending', 'completing'])
  .maybeSingle()

if (activeSession) {
  return NextResponse.json(
    { error: 'settings_locked', reason: 'Active session in progress' },
    { status: 403 }
  )
}
```

Unlocks instantly when session status transitions to `completed` or `emergency` via Realtime.

---

## Section 9: Session Completion Summary

Triggered after archival is complete, before `status` transitions to `completed`.

### API: `POST /api/sessions/summary`

```ts
// Input (assembled from session archive):
{
  duration: { planned_minutes, actual_minutes },
  tasks: { assigned, completed, failed, overdue, master_completed },
  punishments: { count, types[] },
  compliance_rate: number,
  willpower: { start, end, delta },
  streak_change: number,
  events_timeline: SessionEvent[]
}

// AI generates:
{
  narrative: string,           // 2-3 paragraph immersive recap in Master's voice
  compliance_rate: number,
  performance_grade: string,   // S / A / B / C / D
  highlights: string[],
  improvement_areas: string[],
  behavioral_insight: string,
  next_session_recommendation: string
}
```

### Storage + display

- Stored in `IndexedDB session_archives` alongside the raw session data
- Displayed as a full-screen immersive summary card on session completion
- Accessible from sessions history indefinitely (reads from IndexedDB)
- Included in ZIP export as `session_summary.json`

---

## Section 10: New API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/sessions/start` | Create session with config, write `session_started` event |
| POST | `/api/sessions/extend` | Add hours to session, write `timer_extended` event |
| POST | `/api/sessions/complete` | Finalize session after archive, status → `completed` |
| POST | `/api/sessions/emergency` | Emergency release, status → `emergency` |
| POST | `/api/sessions/purge` | Delete heavy data from Supabase post-session |
| POST | `/api/sessions/summary` | Generate AI session summary |
| GET  | `/api/sessions/active` | Get current active session for user |

---

## Constraints

- No client-side state authority
- No data loss — event log written before every state change
- PWA persistent storage requested at session start
- Supabase never stores binary files — OPFS only
- Rolling 500-message Supabase window — quota never exceeded
- Settings locked at API level, not just UI level

---

## Out of Scope (this iteration)

- Google Drive OAuth integration (manual export covers this)
- Push notifications beyond browser Notifications API
- Visual session summary PDF/collage generation (JSON summary only)
- Multi-device session sync for heavy data
