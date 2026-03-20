# Phase 1 Feature Design — Mood Check-in, Session Replay, Calendar Upgrade, Punishment Wheel

**Date:** 2026-03-20
**Status:** Approved
**Build order:** Mood Check-in → Session Replay → Calendar Upgrade → Punishment Wheel

---

## 1. Overview

Four new features that deepen the chastity training experience. Each feeds the next:
- **Mood Check-in** produces per-day emotional data during sessions
- **Session Replay** surfaces archived sessions as a browsable timeline
- **Calendar Upgrade** visualises mood, sessions, and punishment history on the monthly grid
- **Punishment Wheel** adds randomised, weighted consequence theatre

The remaining 9 features selected (Denial Tracker, Rituals, Body Stats, Contract, Permission System, Analytics, Milestones, Humiliation Tasks, Smart Notifications) are deferred to future phases.

---

## 2. Data Model

### New table: `mood_checkins`

```sql
create table mood_checkins (
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

Valid `headspace_tags` values: `needy`, `floaty`, `defiant`, `broken`, `eager`, `desperate`, `content`, `frustrated`.

### New table: `punishment_pool`

```sql
create table punishment_pool (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  title          text not null,
  description    text not null,
  severity       int not null check (severity between 1 and 5),
  requires_proof boolean not null default true,
  is_custom      boolean not null default false,
  created_at     timestamptz not null default now()
);

alter table punishment_pool enable row level security;
create policy "users own their pool"
  on punishment_pool for all using (auth.uid() = user_id);
```

System-default punishments (12 entries, `is_custom = false`) are seeded into the user's pool on first session start via `/api/sessions/start`. Users can add/delete custom entries. System entries cannot be deleted.

### Existing tables (no schema changes)

- `session_archives` (IndexedDB) — Session Replay reads this exclusively
- `sessions`, `tasks`, `calendar_adjustments`, `session_events` — Calendar Upgrade joins these client-side

---

## 3. New API Routes

### `POST /api/mood/checkin`
Upserts today's mood check-in for the active session. Accessible only during an active session (403 otherwise).

**Request body:**
```json
{
  "userId": "uuid",
  "sessionId": "uuid",
  "submissionDepth": 7,
  "frustrationLevel": 4,
  "headspaceTags": ["needy", "floaty"],
  "notes": "optional string"
}
```

**Response:** `{ checkin: MoodCheckin }`

Uses admin Supabase client (`getServerSupabase()`). Validates session is active before upserting. On success, the AI chat context builder (`src/lib/ai/context-builder.ts`) should include the latest mood check-in in the profile summary — add `mood` field to `buildProfileSummary()`.

### `GET /api/punishment-pool`
Returns the user's full punishment pool (system + custom).

**Query params:** `userId`
**Response:** `{ pool: PunishmentPoolItem[] }`

### `POST /api/punishment-pool`
Creates a custom punishment entry.

**Request body:** `{ userId, title, description, severity, requiresProof }`
**Response:** `{ item: PunishmentPoolItem }`

### `DELETE /api/punishment-pool/[id]`
Deletes a custom punishment. Returns 403 if trying to delete a system entry (`is_custom = false`).

### `POST /api/punishment-wheel/spin`
Selects a punishment from the pool weighted by violation count, creates a punishment task in the DB, and returns AI-narrated delivery text.

**Request body:** `{ userId, sessionId }`

**Weighting logic:**
- Fetch `total_tasks_failed` from the active session
- Violations 0–2: uniform weight across all severities
- Violations 3–5: severity 1–2 weight halved, severity 4–5 weight doubled
- Violations 6+: severity 1–2 weight zeroed, severity 5 weight tripled

**Response:**
```json
{
  "punishment": PunishmentPoolItem,
  "taskId": "uuid",
  "narration": "AI-generated delivery string"
}
```

Creates a `task_type: 'punishment'`, `source: 'system'` task row. Writes a `punishment_applied` event to `session_events`. Uses `generateSimpleText` for narration (≤100 tokens). Tracks usage via `trackUsage`.

---

## 4. Feature Designs

### 4.1 Mood Check-in

**Trigger:** On home page load, if an active session exists and no `mood_checkins` row exists for today → auto-display the check-in modal. Also accessible via a "Check In" quick-action card on the home dashboard (visible when session is active).

**Component:** `src/components/features/mood/mood-checkin-modal.tsx`

UI elements:
- Header: "How are you feeling?" + "Daily check-in · Shapes your AI's tone today"
- Slider: Submission Depth (1–10), purple fill
- Slider: Frustration Level (1–10), red fill
- Tag chips (multi-select): needy, floaty, defiant, broken, eager, desperate, content, frustrated
- Textarea: Notes (optional, max 280 chars)
- Submit button → `POST /api/mood/checkin` → close modal

**AI integration:** `buildProfileSummary()` in `src/lib/ai/context-builder.ts` gains a `mood` field:
```
mood: depth=7, frust=4, tags=[needy,floaty]
```
This compact string is appended to the profile summary injected into every chat prompt, letting the AI persona react to the user's emotional state without prompt bloat.

**Care mode auto-trigger:** If `frustration_level >= 8` and `headspace_tags` includes `broken` or `desperate`, set `care_mode_active = true` on the active session and insert a `care_mode_triggered` event into `session_events`.

---

### 4.2 Session Replay

**Route:** `/history` — new dashboard page, added to bottom nav (replaces or sits alongside existing nav).

**Component structure:**
- `src/app/(dashboard)/history/page.tsx` — client component
- `src/components/features/history/session-list.tsx` — list of archived sessions
- `src/components/features/history/session-detail.tsx` — timeline + tabs

**Data source:** All client-side from IndexedDB (`listUserArchives(userId)`) and OPFS (`listSessionFiles`). Zero server calls.

**Session list view:**
- Card per archived session: title (personality), date range, duration, grade (from `summary.performance_grade`), compliance rate badge
- Sorted newest-first
- Empty state: "No archived sessions yet"

**Session detail view (slide-in or new URL `/history/[sessionId]`):**
- Header: session meta (dates, duration, tier, personality, grade)
- AI summary narrative block (italic, from `summary.narrative`)
- Timeline tab: chronological event list (`session_events` + `tasks`), colour-coded dots (complete = teal, fail = red, mood = gold, event = purple)
- Chat tab: paginated chat transcript from IndexedDB `chat_messages`, 50 messages per page
- Proofs tab: grid of proof thumbnails from OPFS, tap to view full
- Export button: calls existing `exportSessionZip(sessionId, userId)` from `src/lib/local-storage/export.ts`

---

### 4.3 Calendar Upgrade

**File:** `src/app/(dashboard)/calendar/page.tsx` — extend existing component.

**Overlay toggles** (chips row above the grid):
- `Tasks` (on by default) — existing good/bad/mixed colouring
- `Mood` — small coloured dot overlay per day (teal=floaty/content, gold=needy/eager, red=broken/frustrated/defiant/desperate)
- `Sessions` — purple outline ring on days that fall within a session's `start_time`→`scheduled_end_time` range
- `Punish` — small ⚠ icon on days with punishment tasks or `punishment_applied` events

State: `const [overlays, setOverlays] = useState<Set<string>>(new Set(['tasks']))`

**Day click → detail panel** (slide-up sheet, not a separate page):
- Date heading + "→ Replay" link (only shown if a session archive exists for a session covering that day)
- Tasks summary: completed count, failed count, overdue count
- Willpower delta (start of day vs end of day, derived from `session_events`)
- Punishment log entries for that day (from `calendar_adjustments` filtered by date)
- Mood check-in block (submission depth, frustration, tags) — shown if `mood_checkins` row exists for that date
- "View Session" button if the day falls within an archived session

**Data loading:** Single `loadCalendar()` call on mount. Add mood checkins fetch:
```typescript
const { data: moods } = await supabase
  .from('mood_checkins')
  .select('date, submission_depth, frustration_level, headspace_tags')
  .eq('user_id', user.id)
```
Build a `moodByDate: Record<string, MoodCheckin>` map for O(1) lookup per day.

---

### 4.4 Punishment Wheel

**Trigger:** Available during active sessions only. Access points:
1. Home dashboard — new "Spin the Wheel" quick-action card (shown only when session active)
2. Automatically offered when a punishment task is created by the AI (chat response includes `[WHEEL]` marker — AI prompted to append this when assigning punishments)

**Component:** `src/components/features/punishment/punishment-wheel-modal.tsx`

UI:
- Severity bias indicator (5 pips, lit count = `min(5, Math.ceil(violations/2))`)
- "Weighted by violation count — more sins, worse odds" label
- Wheel graphic: conic-gradient SVG, 6 coloured slices labelled by severity
- `SPIN` button → triggers CSS rotation animation (2–4s, random final angle)
- On animation end → call `POST /api/punishment-wheel/spin`
- Result card: punishment title, description, AI narration text
- "Accept Punishment →" button: dismisses modal, shows new punishment task in task list via Realtime

**Pool editor:** Accessible from Settings → "Punishment Pool". Lists all entries, allows add/delete of custom entries. System entries show lock icon, cannot be deleted.

---

## 5. Component File Map

```
src/
  app/
    (dashboard)/
      calendar/page.tsx          ← extend existing
      history/page.tsx           ← new
      history/[sessionId]/page.tsx ← new (optional, or modal)
    api/
      mood/checkin/route.ts      ← new
      punishment-pool/route.ts   ← new
      punishment-pool/[id]/route.ts ← new
      punishment-wheel/spin/route.ts ← new
  components/
    features/
      mood/
        mood-checkin-modal.tsx   ← new
      history/
        session-list.tsx         ← new
        session-detail.tsx       ← new
      punishment/
        punishment-wheel-modal.tsx ← new
        punishment-pool-editor.tsx ← new (used in Settings)
  lib/
    supabase/
      schema.ts                  ← add MoodCheckin, PunishmentPoolItem types
    ai/
      context-builder.ts         ← add mood field to buildProfileSummary()
supabase/
  migrations/
    20260320_mood_checkins.sql   ← new
    20260320_punishment_pool.sql ← new
```

---

## 6. Error Handling & Edge Cases

- **Mood check-in outside session:** `POST /api/mood/checkin` returns 403 with `no_active_session`. Client suppresses the modal entirely when no active session.
- **Spin with empty pool:** `POST /api/punishment-wheel/spin` returns 400 with `empty_pool`. Seed defaults on session start to prevent this.
- **Session Replay with no archives:** `/history` shows an empty state with a call-to-action to complete a session.
- **Calendar day click on future date:** Detail panel shows "No data yet" — no attempt to render task/mood data.
- **Duplicate mood check-in:** `POST /api/mood/checkin` uses upsert (`onConflict: ['user_id', 'date']`) — re-submitting today's check-in overwrites it.
- **Care mode already active:** Care mode auto-trigger skips the session update if `care_mode_active` is already `true`.

---

## 7. Testing

New test files in `src/__tests__/`:

- `mood-checkin.test.ts` — POST route: validates session check, upsert logic, care mode trigger conditions
- `punishment-wheel.test.ts` — weighting algorithm unit tests (violation buckets 0–2, 3–5, 6+), spin endpoint creates correct task type
- `punishment-pool.test.ts` — CRUD operations, 403 on system entry delete
- `session-replay.test.ts` — `listUserArchives` returns correctly shaped data, empty state handling

Calendar and mood modal UI are manually verified — no unit tests for pure client rendering.

---

## 8. Migration Plan

1. Run `20260320_mood_checkins.sql`
2. Run `20260320_punishment_pool.sql`
3. Deploy API routes
4. Seed default punishment pool entries on first session start (modify `/api/sessions/start`)
5. Deploy UI components
6. Update bottom nav to include `/history`

No breaking changes to existing tables or routes.
