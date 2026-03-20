# Phase 1 Feature Design — Mood Check-in, Session Replay, Calendar Upgrade, Punishment Wheel

**Date:** 2026-03-20
**Status:** Approved (v3 — all reviewer issues resolved)
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

**Unique constraint note:** `unique (user_id, date)` is intentionally session-agnostic. One check-in per calendar day, globally. Sessions cannot overlap (enforced by `/api/sessions/start` returning 409 `active_session_exists`), so the same-day session restart edge case cannot occur in practice. On upsert, `session_id` is updated to the current session, which is correct — a new session started mid-day should own that day's check-in.

Valid `headspace_tags` values (enforced in API route, not DB constraint): `needy`, `floaty`, `defiant`, `broken`, `eager`, `desperate`, `content`, `frustrated`.

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
  created_at     timestamptz not null default now(),
  -- Unique constraint enables ON CONFLICT DO NOTHING for idempotent seeding
  unique (user_id, title, is_custom)
);

alter table punishment_pool enable row level security;
create policy "users own their pool"
  on punishment_pool for all using (auth.uid() = user_id);
```

### Existing tables used (no schema changes)

- `sessions` — `care_mode_active` (bool, already exists), `total_tasks_failed` (int, already exists = violation count)
- `session_archives` (IndexedDB) — Session Replay reads this
- `tasks`, `calendar_adjustments`, `session_events` — Calendar Upgrade joins these client-side

---

## 3. Punishment Pool — Default Seed Data

Seeded into `punishment_pool` once per user (`is_custom = false`). Idempotency via `unique (user_id, title, is_custom)` constraint — `/api/sessions/start` runs a bulk insert with `onConflict: ['user_id', 'title', 'is_custom'], ignoreDuplicates: true`. Safe to call on every session start; duplicate rows are silently skipped. No count check required, no race condition.

| title | description | severity | requires_proof |
|-------|-------------|----------|----------------|
| Orgasm Denial Extension | No touching permitted for 24 hours | 3 | false |
| Writing Lines | Write "I am a locked, obedient slave" 50 times. Submit photo proof. | 2 | true |
| Cold Shower | Take a 3-minute cold shower immediately. Submit audio proof of discomfort. | 2 | true |
| Corner Time | Stand facing a corner for 20 minutes. No phone, no distractions. | 1 | false |
| Mirror Inspection | Stand naked before a mirror for 10 minutes. Recite your rules aloud. | 2 | true |
| Lock Time Extension | +2 hours added to session duration | 4 | false |
| Mantra Recording | Record yourself saying "I am owned and grateful" 10 times. Submit audio. | 3 | true |
| Edging Tease | Edge yourself exactly 3 times without release. Submit text proof describing each. | 4 | true |
| Humiliation Essay | Write a 100-word essay on why you deserve to be locked. Submit text proof. | 2 | true |
| Exposure Challenge | Take a mirror selfie (face not required). Saved locally, not uploaded. Self-report only. | 3 | false |
| Severe Extension | +4 hours added to session duration | 5 | false |
| Ruins Only | If you edge today, it must be a ruin. No clean orgasms for 48 hours. | 5 | false |

---

## 4. New API Routes

### `POST /api/mood/checkin`

Upserts today's mood check-in for the active session. Returns 403 if no active session.

**Request body:**
```json
{
  "userId": "uuid",
  "sessionId": "uuid",
  "submissionDepth": 7,
  "frustrationLevel": 4,
  "headspaceTags": ["needy", "floaty"],
  "notes": "optional string, max 280 chars"
}
```

**Validation (server-side):**
- All fields required except `notes`
- `submissionDepth` and `frustrationLevel`: integer 1–10
- `headspaceTags`: array of strings, each must be in the valid tags list above
- `notes`: string, max 280 chars

**Response:** `{ checkin: MoodCheckin }`

**Side effects:**
1. Upserts `mood_checkins` row on `(user_id, date)` conflict — updates `session_id`, both sliders, tags, notes
2. If `frustrationLevel >= 8` AND `headspaceTags` includes `'broken'` or `'desperate'`:
   - Update `sessions` set `care_mode_active = true` where `id = sessionId` (only if currently false)
   - Insert `{ event_type: 'care_mode_triggered', payload: { trigger: 'mood_checkin', frustration_level: N } }` into `session_events`
   - Downstream: `care_mode_active = true` causes the AI chat to switch to a softer, supportive persona (this behaviour is already implemented in `/api/chat`)

Uses `getServerSupabase()`. Tracks no tokens (no AI call).

---

### `GET /api/punishment-pool`

Returns the user's full punishment pool (system + custom, unsorted).

**Auth:** Uses `getServerSupabase()`. Validates that the requesting user owns the pool by querying `where user_id = userId`. Returns 403 if `userId` is missing or empty.

**Query params:** `userId` (string)

**Response:**
```json
{
  "pool": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "severity": 1,
      "requiresProof": true,
      "isCustom": false
    }
  ]
}
```

No pagination — pool is capped at system(12) + user custom (max 20, enforced on POST). Max 32 entries total.

---

### `POST /api/punishment-pool`

Creates a custom punishment entry.

**Request body:**
```json
{
  "userId": "uuid",
  "title": "string, max 100 chars",
  "description": "string, max 500 chars",
  "severity": 3,
  "requiresProof": true
}
```

**Validation:** All fields required. `severity` int 1–5. Returns 400 if user already has 20 custom entries.

**Response:** `{ item: PunishmentPoolItem }`

---

### `DELETE /api/punishment-pool/[id]`

**Route file:** `src/app/api/punishment-pool/[id]/route.ts` (dynamic segment, separate directory from `src/app/api/punishment-pool/route.ts`)

Deletes a custom punishment. Returns 403 if `is_custom = false`. Returns 404 if not found or not owned by user.

**Response:** `{ success: true }`

---

### `POST /api/punishment-wheel/spin`

Selects a punishment from the pool, weighted by `sessions.total_tasks_failed` (the violation count), creates a punishment task in the DB, returns AI-narrated delivery text.

**Request body:**
```json
{
  "userId": "uuid",
  "sessionId": "uuid"
}
```

**Response:**
```json
{
  "punishment": {
    "id": "uuid",
    "title": "string",
    "description": "string",
    "severity": 3,
    "requiresProof": true,
    "isCustom": false
  },
  "taskId": "uuid",
  "narration": "string (AI-generated, ≤100 tokens)"
}
```

**Violation count source:** `sessions.total_tasks_failed` for the given `sessionId`.

**Weighting algorithm:**

```typescript
function buildWeightedPool(pool: PunishmentPoolItem[], violations: number): PunishmentPoolItem[] {
  return pool.flatMap(item => {
    let weight: number
    if (violations <= 2) {
      weight = 1 // uniform
    } else if (violations <= 5) {
      weight = item.severity <= 2 ? 0.5 : item.severity >= 4 ? 2 : 1
    } else {
      weight = item.severity <= 2 ? 0 : item.severity === 5 ? 3 : 1
    }
    // Convert fractional weights to integer repetitions (x2 to avoid fractions)
    const reps = Math.round(weight * 2)
    return Array(reps).fill(item)
  }).filter(Boolean)
}
// Then: const selected = weightedPool[Math.floor(Math.random() * weightedPool.length)]
```

**Task creation:** Creates a `task_type: 'punishment'`, `source: 'system'` task row with `deadline = now() + 24h`. Writes `punishment_applied` event to `session_events`.

**AI narration:** Calls `generateSimpleText(systemPrompt, userPrompt)` where the system prompt is the active AI persona and the user prompt describes the selected punishment. Tracks tokens via `trackUsage(supabase, userId, 'llama-3.3-70b-versatile', usage, 'punishment_wheel')`.

---

## 5. Feature Designs

### 5.1 Mood Check-in

**"No check-in today" detection (client-side):**
The home page `loadDashboard()` function already runs on mount. Add a parallel fetch:
```typescript
const { data: todayCheckin } = await supabase
  .from('mood_checkins')
  .select('id')
  .eq('user_id', user.id)
  .eq('date', format(new Date(), 'yyyy-MM-dd'))
  .maybeSingle()
```
Store as `hasTodayCheckin` state. The modal renders if `session !== null && !hasTodayCheckin && !loading`. No flicker risk because the modal renders after the loading state resolves (same condition as the rest of the dashboard).

**Component:** `src/components/features/mood/mood-checkin-modal.tsx`

UI elements:
- Header: "How are you feeling?" + "Daily check-in · Shapes your AI's tone today"
- Slider (range input): Submission Depth 1–10, purple fill
- Slider (range input): Frustration Level 1–10, red fill
- Tag chips (toggle buttons, multi-select): needy, floaty, defiant, broken, eager, desperate, content, frustrated
- Textarea: Notes (optional, max 280 chars, character counter)
- Submit button → `POST /api/mood/checkin` → on success: close modal, set `hasTodayCheckin = true`
- Dismiss link ("Skip for now") — writes `skip-mood-checkin-{sessionId}` to `sessionStorage`. On home page load, the modal is suppressed if this key exists in `sessionStorage` (cleared automatically when browser tab closes). This prevents re-appearing on tab switch or soft refresh within the same browser session, while still prompting on a fresh page load the next day.

**AI integration:** Add to `buildProfileSummary()` in `src/lib/ai/context-builder.ts`:
```typescript
// After existing profile fields:
if (latestMood) {
  parts.push(`mood: depth=${latestMood.submission_depth}, frust=${latestMood.frustration_level}, tags=[${latestMood.headspace_tags.join(',')}]`)
}
```

`latestMood` is an optional second parameter added to `buildProfileSummary(profile, latestMood?)`. Since it is optional and TypeScript-typed, all existing callers continue to work unchanged — no updates needed to `chat-api.test.ts` or `task-generation.test.ts` mocks (they pass only `profile`, which remains valid).

**Fetching `latestMood` in `/api/chat`:** Add this query alongside the existing profile fetch:
```typescript
const { data: latestMood } = await supabase
  .from('mood_checkins')
  .select('submission_depth, frustration_level, headspace_tags')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle()
// Pass to: buildProfileSummary(profile, latestMood ?? undefined)
```
Uses most recent ever check-in (not today-only), so AI context persists even if no check-in today.

**Home dashboard addition:** Add a "Check In" quick-action card to the BentoGrid, visible only when `session !== null`. Clicking it opens the mood modal regardless of `hasTodayCheckin` (allows updating the check-in).

---

### 5.2 Session Replay

**Navigation:** `/history` is NOT added to the bottom nav (which already has 8 items and is at mobile capacity). Instead, it is accessed from:
1. The Calendar page — a "Past Sessions" button in the header
2. The Calendar day detail panel — "↗ Replay" link on days within an archived session
3. Settings page — "Session History" link in a new "Data" section

**Route:** `src/app/(dashboard)/history/page.tsx` (protected by existing middleware, no special config needed)
**Detail route:** `src/app/(dashboard)/history/[sessionId]/page.tsx`

**Component structure:**
- `src/components/features/history/session-list.tsx` — list of archived sessions
- `src/components/features/history/session-detail.tsx` — timeline + tabs

**Data source:** All client-side from IndexedDB (`listUserArchives(userId)`) and OPFS (`listSessionFiles`). The middleware auth check on page load is a network call to Supabase — expected and correct. "No server calls" in the spec means no data-fetching API routes are needed, not that auth middleware is bypassed.

**Session list view:**
- Card per archived session: personality, date range, duration, grade badge, compliance % badge
- Sorted newest-first
- Empty state: "No archived sessions yet. Complete your first session to see it here."

**Session detail view:**
- Header: session meta (dates, duration, tier, personality, grade)
- AI summary narrative block (italic)
- Tabs: Timeline · Chat · Proofs · Export
- **Timeline tab:** chronological merge of `session_events` and `tasks`, colour-coded dots (teal = complete, red = fail, gold = mood check-in, purple = system event)
- **Chat tab:** paginated transcript, 50 messages per page, prev/next buttons
- **Proofs tab:** grid of thumbnails from OPFS, tap to fullscreen
- **Export tab:** single "Download ZIP" button → calls `exportSessionZip(sessionId, userId)`

---

### 5.3 Calendar Upgrade

**File:** `src/app/(dashboard)/calendar/page.tsx` — extend existing.

**New "Past Sessions" button** in the calendar header → navigates to `/history`.

**Overlay toggles** (chip row above grid):
```typescript
const [overlays, setOverlays] = useState<Set<string>>(new Set(['tasks']))
// Options: 'tasks', 'mood', 'sessions', 'punish'
```

Per-day rendering with overlays:
- `tasks` (existing): good/bad/mixed background colour
- `mood`: small coloured dot bottom-right of cell — `teal` for floaty/content/eager, `gold` for needy/desperate, `red` for broken/frustrated/defiant
- `sessions`: purple outline ring on days that fall within any session's `start_time`–`scheduled_end_time`
- `punish`: ⚠ icon bottom-left on days with `punishment_applied` events

**Data loading additions** to `loadCalendar()`:
```typescript
// Mood check-ins for month
const { data: moods } = await supabase
  .from('mood_checkins')
  .select('date, submission_depth, frustration_level, headspace_tags')
  .eq('user_id', user.id)
  .gte('date', format(monthStart, 'yyyy-MM-dd'))
  .lte('date', format(monthEnd, 'yyyy-MM-dd'))

// All sessions (for outline rings)
const { data: allSessions } = await supabase
  .from('sessions')
  .select('id, start_time, scheduled_end_time, status')
  .eq('user_id', user.id)
  .order('start_time', { ascending: false })
  .limit(50)
```

Build lookup maps: `moodByDate`, `sessionDaySet` (Set of date strings), `punishDaySet`.

**Day click → detail panel** (slide-up sheet, `useState<Date | null>(selectedDay)`):
- Date heading
- Tasks summary: completed, failed, overdue counts (filtered from already-loaded `tasks` data by date)
- Willpower delta: scan `session_events` for willpower-related events on that date
- Punishment entries: `calendar_adjustments` filtered by date
- Mood check-in block: if `moodByDate[dateKey]` exists, show submission depth, frustration, tags
- "View Session" button: if day is in `sessionDaySet`, find matching session and link to `/history/[sessionId]`

---

### 5.4 Punishment Wheel

**Access points:**
1. Home dashboard — "Spin the Wheel" quick-action card, visible only when session is active
2. Settings → "Punishment Pool" → "Spin Now" button
3. ~~Automatic trigger via `[WHEEL]` chat marker~~ — **deferred from Phase 1.** The `[TASK:{...}]` chat marker required significant plumbing (regex, server-side task creation, client-side result rendering). An equivalent `[WHEEL]` marker adds the same complexity without enough new value — the home quick-action card covers the use case adequately. The AI can verbally suggest spinning the wheel; the user does so manually. The marker pattern can be added in a future phase.

**Component:** `src/components/features/punishment/punishment-wheel-modal.tsx`

UI:
- Severity bias pips: `min(5, Math.ceil(violations / 2))` pips lit red
- "Weighted by your violation count" caption
- Wheel: conic-gradient `<div>` with 6 coloured slices (CSS only, no canvas)
- `SPIN` button: on click, apply CSS `animation: spin 3s cubic-bezier(0.17, 0.67, 0.12, 0.99) forwards` with random `rotate(Ndeg)` end state (N = random 720–1440)
- On animation end (`onAnimationEnd`): call `POST /api/punishment-wheel/spin`
- Loading state during API call: wheel stops, spinner overlay
- Result card: punishment title, AI narration text, severity badge, proof requirement note
- "Accept Punishment →" button: dismisses modal. The new punishment task appears in the task list via existing Realtime subscription.

**Pool editor:** `src/components/features/punishment/punishment-pool-editor.tsx` — rendered in Settings → new "Punishment Pool" section. Lists all entries, system entries show lock icon (no delete), custom entries have delete button. Add new custom form at bottom.

---

## 6. TypeScript Types (additions to `schema.ts`)

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

Add to `TableName`: `'mood_checkins' | 'punishment_pool'`

---

## 7. Component File Map

```
src/
  app/
    (dashboard)/
      calendar/page.tsx              ← extend existing
      history/page.tsx               ← new
      history/[sessionId]/page.tsx   ← new
    api/
      mood/checkin/route.ts          ← new
      punishment-pool/route.ts       ← new (GET + POST)
      punishment-pool/[id]/route.ts  ← new (DELETE, separate directory)
      punishment-wheel/spin/route.ts ← new
  components/
    features/
      mood/
        mood-checkin-modal.tsx       ← new
      history/
        session-list.tsx             ← new
        session-detail.tsx           ← new
      punishment/
        punishment-wheel-modal.tsx   ← new
        punishment-pool-editor.tsx   ← new
  lib/
    supabase/
      schema.ts                      ← add MoodCheckin, PunishmentPoolItem
    ai/
      context-builder.ts             ← add mood field to buildProfileSummary()
supabase/
  migrations/
    20260320_mood_checkins.sql       ← new
    20260320_punishment_pool.sql     ← new
```

---

## 8. Error Handling & Edge Cases

- **Mood check-in outside session:** 403 `no_active_session`
- **Invalid headspace tag:** 400 `invalid_tag`
- **Notes too long:** 400 `notes_too_long`
- **Empty pool on spin:** 400 `empty_pool` (prevented by seeding on first session start; also re-seeded if pool somehow becomes empty)
- **Spin with no active session:** 403 `no_active_session`
- **Custom pool limit reached (POST):** 400 `custom_pool_limit_reached`
- **Delete system entry:** 403 `cannot_delete_system_entry`
- **Duplicate mood check-in:** upsert on `(user_id, date)` — silent overwrite, returns updated row
- **Care mode already active:** check `care_mode_active` before updating — skip update if already true
- **Calendar day click on future date:** Detail panel shows "No data yet for future dates"
- **Session Replay with no archives:** `/history` shows empty state
- **Punishment wheel API call fails:** Result card shows error state "Something went wrong — try again"

---

## 9. Testing

New test files in `src/__tests__/`:

- **`mood-checkin.test.ts`**
  - POST: validates session check (403 if no active session)
  - POST: validates field ranges and tag whitelist (400 on invalid)
  - POST: upsert correctly overwrites existing same-day row
  - POST: care mode trigger fires when `frustrationLevel >= 8` + broken/desperate tag
  - POST: care mode trigger skips if `care_mode_active` already true

- **`punishment-wheel.test.ts`**
  - `buildWeightedPool()`: violations 0–2 → all items have equal weight
  - `buildWeightedPool()`: violations 3–5 → severity 4–5 doubled, 1–2 halved
  - `buildWeightedPool()`: violations 6+ → severity 1–2 excluded, severity 5 tripled
  - Spin endpoint: creates `task_type: 'punishment'` task row
  - Spin endpoint: writes `punishment_applied` event to `session_events`
  - Spin endpoint: calls `trackUsage()` after AI narration

- **`punishment-pool.test.ts`**
  - Seed idempotency: calling seed insert twice with `ignoreDuplicates: true` does not create duplicate system entries
  - GET: 403 when `userId` is missing
  - POST: creates custom entry
  - POST: 400 when at 20 custom entries
  - DELETE: 403 when `is_custom = false`
  - DELETE: 404 when entry belongs to different user

---

## 10. Migration & Deployment Plan

1. Run `20260320_mood_checkins.sql`
2. Run `20260320_punishment_pool.sql`
3. Deploy API routes
4. Modify `/api/sessions/start` to seed default punishment pool (idempotent check)
5. Deploy UI components
6. Add "Past Sessions" button to calendar page header and `/history` links in settings
7. No bottom nav changes required
