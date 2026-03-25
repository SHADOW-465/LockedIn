# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Product Overview

**LockedIn** is a mobile-first web application for **chastity and D/s (Dominant/submissive) lifestyle training**. The user is the submissive ("slave"). An AI plays the Dominant ("Master") role — assigning tasks, enforcing compliance, issuing punishments, and controlling a timed lock session. The entire experience is built around a single power dynamic: the slave submits to the AI Master's control.

The app is **explicitly adult content** (18+ confirmed during onboarding). It covers chastity play, orgasm control, humiliation, pain tolerance, femdom worship, bondage, pet play, body writing, and more. Understanding this context is essential for building features — tone, UI copy, task content, and punishment mechanics all reflect the Master/slave dynamic.

### Core User Flow

1. **Onboarding** — New users complete an 11-step setup: age/terms, tier selection, AI persona, hard limits, fetish interests, physical details, training regimens, psych profile, lock goal duration, notification preferences, and final review. This creates their `profile` row.
2. **Session Start** — User configures and starts a timed lock session (hours/days). The session is the primary container for all activity. During a session the user is "locked in" — settings are blocked, tasks must be completed, and the session can only end via normal completion or emergency release.
3. **Chat with the Master** — The core interaction loop. The user talks to their chosen AI persona. The Master assigns tasks, judges behavior, applies punishments, and guides training. A safeword ("MERCY") activates Care Mode — all punishment pauses.
4. **Task Completion** — Master-assigned tasks and auto-generated daily tasks must be completed within their deadline. Tasks may require photo/video/audio/text proof, verified by vision AI. Failure triggers punishment.
5. **Session End** — When the session timer expires the status transitions to `completing`, the client archives all chat + media locally (IndexedDB + OPFS), generates an AI recap, purges server data, then marks `completed`.

---

## Tier System

Five intensity tiers, selected during onboarding and configurable per-session:

| Tier | Intensity | Description |
|------|-----------|-------------|
| **Newbie** | Mild | Gentle intro. Shorter tasks, lighter punishment, encouragement. |
| **Slave** | Moderate | Regular obedience training. Moderate tasks, proper punishments. |
| **Hardcore** | High | Intense conditioning. Demanding tasks, severe punishments, strict rules. |
| **Extreme** | Extreme | Maximum intensity. Brutal tasks, relentless punishment, total submission. |
| **Total Destruction** | Absolute | No mercy. Designed to break and rebuild. Only the most dedicated. |

Tier affects task difficulty/duration, punishment severity, regimen quota requirements, and AI tone.

---

## AI Persona System

10 distinct Master personalities, chosen during onboarding:

| Persona | Character |
|---------|-----------|
| Cruel Mistress | Icy and bored. Everything on her terms. Silence is punishment. |
| Clinical Sadist | Detached, scientific. Your suffering is data. |
| Playful Tease | Flirty and cruel in small ways. Loves making you wait. |
| Strict Master | Military precision. Commands only. Failure is logged. No appeals. |
| Humiliation Expert | Picks the exact phrase that cuts. Compliments to make the fall harder. |
| Goddess | Receives worship as her natural state. |
| Dommy Mommy | Warm and controlling. Disappointment hurts more than cruelty. |
| Bratty Keyholder | Changes the rules mid-sentence. Makes you work for every second. |
| Psychological Manipulator | Never direct. Uses your words against you. |
| Extreme Sadist | Pure, unfiltered. No warmth, no mercy, no explanation. |

The persona is injected into every AI system prompt and controls the entire tone of chat, task assignment, and punishment narration.

---

## Training Regimens

25 structured training programs users can select (1 primary + unlimited secondary). Examples: Sissy Training, Obedience & Service, CEI Mastery, Edging Endurance, SPH Conditioning, Anal Training, Body Worship, Pet Play Training, Self-Bondage, Chastity Endurance, Body Writing, Exhibitionism Training, Orgasm Control, Mental Conditioning, Wardrobe Control, Domestic Service, etc.

Regimens are stored in `profiles.preferred_regimens` and influence AI task generation (which tasks are generated, what proof is required).

---

## Feature Reference

### Home Dashboard (`/home`)

The primary session hub. Layout when a session is active:

- **TimerCard** (hero) — countdown to session end, progress ring, tier badge, emergency release button
- **Willpower Ring** — circular gauge (0–100) showing current willpower score
- **Current Task** — the most recent active/pending task with quick complete/fail actions
- **Compliance Streak** — 7-dot weekly streak indicator
- **Next Release** — calculated end date/time
- **Session Stats** — tasks completed, violations, denial hours, edge count
- **Quick Access** — Check In button and Punishment button (only during active sessions)

When no session is active: shows session start flow, compliance history, recent achievements.

**Session completion flow** (triggered by Realtime when `status === 'completing'`):
1. Fetch all session data
2. `navigator.storage.persist()` — request persistent storage
3. `archiveSession()` — write full snapshot to IndexedDB
4. `POST /api/sessions/summary` — AI recap JSON
5. `POST /api/sessions/purge` — delete server-side heavy data
6. `POST /api/sessions/complete` — status → `completed`

### Chat (`/chat`)

The primary interaction with the AI Master. Features:

- **Care Mode** — triggered by typing the safeword "MERCY". UI shifts to teal/safe theme. All punishment pauses. User types "resume training" to exit.
- **Message types** — `normal`, `care_mode` (teal), `punishment` (red), `safeword_detected` (teal border on user bubble)
- **Master Task parsing** — the AI appends `[TASK:{...}]` JSON markers which `/api/chat` strips and creates as real task rows
- **Profile summary** — `buildProfileSummary()` builds a compact ~80-token profile string sent as context, reducing token usage by ~60%
- **Chat persistence** — messages written to `chat_messages` table by API (not client). Loaded on mount via direct Supabase query. Server is authoritative — no client-side DB writes.
- **Rolling window** — when `chat_messages` exceeds 500, older messages flush to IndexedDB

### Tasks (`/tasks`)

Task management page with four categories:

- **Daily Check-ins** — Morning (6am–10am) and Night (8pm–midnight) check-in tasks, always shown at top
- **Master Tasks** — AI-assigned via chat. Shown in red. Always require photo/video/audio/text proof. Have deadlines. Failure triggers punishment.
- **Punishment Tasks** — Assigned by punishment system. Shown in orange. Have deadlines.
- **Daily Tasks** — AI-generated on demand (5/day limit via `daily_task_log`). Mark Done or Submit Proof.

Each task card shows: title, genres (tags), cage status (locked/unlocked), difficulty stars, duration, deadline timer, proof requirement badge, punishment warning. Clicking opens detail modal.

**Task actions:** Start → Mark Done (no proof) or Submit Proof (opens `ProofCaptureModal`) → Mark Failed (confirmation + punishment). Proof rejected = `awaiting_proof` state with rejection reason shown.

**Self-created entries:** User can create their own journal entries or self-tasks via the "Create" button (title + notes + difficulty).

**Proof system:** Tasks with `proof_type` ('image', 'video', 'audio', 'text') open `ProofCaptureModal`. Photo/video saved to OPFS, submitted to `/api/verify` for vision AI verification. Text proof submitted directly. Verification result: `verified` (XP awarded) or `failed` (willpower deducted, punishment triggered).

### Regimens (`/regimens`)

Structured multi-day training programs. Each regimen has days with specific tasks. Users advance through days by completing the daily quota (AI-gated via `/api/regimens/complete-day`). Progress tracked in `regimens` table.

### Achievements (`/achievements`)

Unlocked badges displayed in a grid. Summary card shows: Total XP, Unlocked count, Compliance Streak.

Achievements awarded automatically by `checkAchievements()` in `src/lib/engines/rewards.ts` after task completions and streaks. Achievement conditions check: willpower score, XP total, tasks completed, streak length, etc.

### Calendar (`/calendar`)

Session and task history view. Shows scheduled events, completed sessions, mood check-in data.

### History (`/history`)

Past session archives. Data read from local IndexedDB (not server — purged post-session). Allows export via ZIP download (`exportSessionZip()`).

### Punishment Pool & Wheel

- **Pool (`/settings` or punishment section):** A merged list of system punishments + up to 20 user-custom punishments. Each entry: title, description, severity (1–5), `requires_proof` flag. Managed via `GET/POST /api/punishment-pool` and `DELETE /api/punishment-pool/[id]`.
- **Wheel:** Spin the punishment wheel (`POST /api/punishment-wheel/spin`) — selects from the merged pool, returns the selected punishment + AI-narrated result text. `src/lib/engines/punishment-wheel.ts` handles selection logic.

### Mood Check-in

Daily mood logging via sliders: **energy** (0–100), **stress** (0–100), **arousal** (0–100), **submission** (0–100), plus optional tags. Submitted via `POST /api/mood/checkin`. If extreme values detected (e.g., stress > 90), triggers care mode recommendation. Data stored in `mood_checkins` table.

### AI Master Guide (`/` floating `?` button)

A slide-up chat sheet powered by `/api/guide`. The AI Master answers questions about how to use the app "in character". Features:
- Quick topic pills (pre-set questions shown before first message)
- Nav card markers — AI can append `[NAV:/path|Label|Description]` to responses, which renders as a "Go →" navigation card
- Rate-limited: 20 requests/minute per user (in-memory, per-process)
- Auth via SSR cookie client (not admin client)
- Visible on all dashboard pages via `<GuideFab />` in `(dashboard)/layout.tsx`

### Settings (`/settings`)

Profile configuration. Blocked during active sessions (`getActiveSessionId()` returns non-null → 403). Allows updating: tier, AI personality, hard/soft limits, fetish interests, training regimens, physical details, notification preferences.

---

## Scoring & Progression

| Metric | Location | How it changes |
|--------|----------|---------------|
| **Willpower** (0–100) | `profiles.willpower_score` | `+ceil(difficulty × 3)` on task complete; `−ceil(difficulty × 2)` on failed proof |
| **XP** | `profiles.xp_total` | `awardCompletion(difficulty)` → 5/10/20/40/80 XP for difficulty 1–5 |
| **Compliance Streak** | `profiles.compliance_streak` | `awardStreak()` checks milestones |
| **Achievements** | `achievements` table | `checkAchievements()` evaluates all conditions post-completion |

---

## Punishment System

Punishments are triggered from four sources:
1. **Overdue master tasks** — cron job (`session-cron`) detects expired tasks, calls `/api/punish`
2. **Failed proof verification** — `/api/verify` on AI rejection
3. **Self-reported task failure** — `/api/tasks/fail`
4. **AI rudeness detection** — `/api/chat` detects disrespect, applies punishment

Punishments can add: willpower deduction, lock time extension (`punishment_hours`), and a punishment task (`punishment_additional` text). The punishment pool (`punishment_pool` table) stores the available punishments (system defaults + custom).

---

## Onboarding (11 Steps)

All state in Zustand store (`src/lib/stores/onboarding-store.ts`), single DB upsert on completion:

1. Welcome + age confirmation + terms acceptance
2. **Tier selection** — Newbie / Slave / Hardcore / Extreme / Total Destruction
3. **AI Personality** — 10 personas to choose from
4. **Hard & Soft Limits** — user's absolute limits (never crossed) and soft limits (can be pushed)
5. **Fetish Profile** — multi-select from 18 genres: Chastity & Denial, Edging & Orgasm Control, CBT, SPH, CEI, Sissy Training, Femdom Worship, Humiliation, Body Writing, Anal Training, Bondage, Impact Play, Foot Worship, Pet Play, Degradation, Financial Domination, Exhibitionism, JOI
6. **Physical Details** — body type, orientation, gender identity, age, measurements
7. **Training Regimens** — 1 primary + any number of secondary (25 options)
8. **Psych Profile** — short-answer psychological questions for AI calibration
9. **Lock Parameters** — initial lock goal hours (default 168 = 1 week) + safeword (default "MERCY")
10. **Notifications** — frequency (low/medium/high/extreme) + standby consent
11. **Final Review** — summary of all choices before submission

---

## Commands

```bash
npm run dev        # Start dev server (Next.js, port 3000)
npm run build      # Production build
npm run lint       # ESLint
npm run test       # Run all tests (vitest)
```

**Run a single test file:**
```bash
npx vitest run src/__tests__/your-file.test.ts
```

Tests live in `src/__tests__/` and use Vitest with Node environment. The config alias `@/` maps to `src/`. Current test files: `chat-api`, `onboarding`, `punishment`, `rewards`, `task-generation`, `verification`, `session-start`, `mood-checkin`, `punishment-pool`, `punishment-wheel`, `guide`.

## Required Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
OPENROUTER_API_KEY=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=      # Google OAuth2 client ID for Drive backup
```

---

## Technical Architecture

### App Structure

Next.js 15 App Router with three route groups:
- `(auth)` — `/login`, `/signup` — no layout wrapper
- `(dashboard)` — `/home`, `/tasks`, `/chat`, `/journal`, `/regimens`, `/achievements`, `/calendar`, `/history`, `/settings`, `/feedback` — wrapped in `src/app/(dashboard)/layout.tsx`, which also mounts `<GuideFab />` (the floating `?` app guide button)
- `onboarding` — 11-step onboarding flow at `/onboarding`

Root route: `src/app/page.tsx` is a **server component** that checks auth via SSR and redirects authenticated users before any HTML is sent. The landing page UI lives in `src/app/landing-page.tsx` (client component, rendered only for unauthenticated visitors).

API routes under `src/app/api/`:
- `POST /api/chat` — AI chat with persona, safeword detection, care mode, master task `[TASK:{...}]` parsing
- `POST /api/tasks/generate` — AI task generation (5/day limit via `daily_task_log`)
- `POST /api/tasks/complete` — Mark task complete, update willpower score
- `POST /api/tasks/fail` — Mark task failed, apply punishment
- `POST /api/tasks/expire` — Expire overdue tasks (called from cron)
- `POST /api/tasks/user-create` — Slave-created tasks and journal entries
- `POST /api/verify` — Vision AI proof photo verification
- `POST /api/proof/submit` — Submit proof document for a task
- `POST /api/regimens/complete-day` — AI-gated regimen advancement
- `GET  /api/usage` — Token usage meter
- `POST /api/punish` — Apply punishment
- `GET/POST /api/punishment-pool` — Read/create custom punishment pool entries (max 20 custom)
- `DELETE /api/punishment-pool/[id]` — Remove a custom entry
- `POST /api/punishment-wheel/spin` — Spin punishment wheel, returns AI-narrated result
- `POST /api/mood/checkin` — Submit mood check-in (energy/stress/arousal/submission sliders + tags)
- `POST /api/checkin/ensure` — Ensures a daily check-in row exists
- `POST /api/profile/update` — Update profile fields (blocked during active session)
- `POST /api/guide` — AI Master app guide: accepts `{ message, currentPage, history[] }`, returns `{ reply, navCard? }`. Auth via SSR cookie client. Rate-limited (20 req/min in-memory).
- `POST /api/sessions/start` — Create session with config, writes `session_started` event; returns 409 `active_session_exists` if already running
- `POST /api/sessions/extend` — Add minutes to session, recalculate `scheduled_end_time`, write `timer_extended` event
- `POST /api/sessions/complete` — Finalize session after client archival (status → `completed`)
- `POST /api/sessions/purge` — Delete `chat_messages`, `proof_documents`, `calendar_adjustments`, `session_events` for a session post-archival
- `POST /api/sessions/emergency` — Emergency release (status → `emergency`)
- `POST /api/sessions/summary` — Generate AI session recap JSON via `generateSimpleText`

### Auth & Routing

Two-layer auth guard:
1. **`src/proxy.ts`** (Next.js 15 proxy, Node.js runtime) — primary security boundary. Validates JWT via `supabase.auth.getUser()`, then checks `profiles.onboarding_completed`. Caches onboarding status in a 24h httpOnly cookie (`x-onboarding-done`) to skip DB on repeat requests. Root path (`/`) is handled specially: unauthenticated users pass through to the landing page; authenticated users are redirected to `/home` or `/onboarding`.
2. **`src/components/route-guard.tsx`** (client) — **sole client-side guard**, lives in the root layout and wraps all pages. Handles redirects for unauthenticated users, incomplete onboarding, and logged-in users on auth pages. Also renders the global loading spinner while `useAuth()` initializes.

**The `(dashboard)/layout.tsx` has no auth logic** — do not add guards there. It only renders `{children}` and `<GuideFab />`.

Public paths (never hit auth check): `/login`, `/signup`, `/auth/*`, `/api/*`

### Supabase Clients — Critical Distinction

**Never mix these up:**

| Client | File | Key | Use |
|--------|------|-----|-----|
| Browser (anon) | `src/lib/supabase/client.ts` → `getSupabase()` | anon key | Client components, hooks |
| Server admin | `src/lib/supabase/server.ts` → `getServerSupabase()` | service_role | API routes — bypasses RLS |
| SSR proxy | `createServerClient` from `@supabase/ssr` | anon key | `src/proxy.ts` and API routes that need `auth.getUser()` |
| SSR page | `createServerClient` + `await cookies()` | anon key | Server components (e.g., `src/app/page.tsx`) |

The admin client (`getServerSupabase()`) bypasses RLS and is **not session-aware** — it cannot read auth cookies and must not be used for `auth.getUser()`. Use the SSR cookie client for that. The SSR page pattern requires `await cookies()` (async in Next.js 15+).

`src/lib/supabase/client.ts` also exports `resetSupabase()` — call on `SIGNED_OUT` to null the singleton so the next `getSupabase()` creates a fresh client. This is already wired in `auth-context.tsx`.

`src/lib/supabase/session-guard.ts` exports `getActiveSessionId(userId)` — returns the active session ID or null. Use this in any API route that must 403 during an active session (e.g., profile mutations).

### Supabase Helper Modules

`src/lib/supabase/` contains typed query helpers — prefer these over raw queries:

- `auth.ts` — `signIn()`, `signUp()`, `signOut()`, `getSession()`
- `tasks.ts` — task CRUD, status updates
- `sessions.ts` — session lifecycle management
- `regimens.ts` — regimen queries (each function calls `getSupabase()` internally; do not call it at module scope)
- `storage.ts` — Supabase Storage for verification photo uploads
- `session-guard.ts` — `getActiveSessionId(userId)` for settings lock enforcement

### Auth Context (`src/lib/contexts/auth-context.tsx`)

`AuthProvider` exposes `{ user, profile, loading, refreshProfile }` via `useAuth()`.

Key implementation details to preserve:
- `initSession` has a **3-second safety timeout** that forces `loading=false` if Supabase hangs on startup.
- `onAuthStateChange` wraps `fetchProfile` in `Promise.race` against a **5-second timeout** and always resolves `setLoading(false)` in a `finally` block — it cannot hang indefinitely.
- On `SIGNED_OUT`, calls `resetSupabase()` before clearing state.
- Call `refreshProfile()` after any mutation to the `profiles` row to keep in-memory state in sync.

### AI Service (`src/lib/ai/ai-service.ts`)

All AI functions return `GenerateResult { text: string; usage: TokenUsage }` — callers must destructure:

```typescript
const { text, usage } = await generateText(prompt, aiContext, systemOverride?)
const { text, usage } = await generateSimpleText(systemPrompt, userPrompt)
const { text, usage } = await generateWithHistory(systemPrompt, history, userMessage)
```

`generateWithHistory` — multi-turn conversations. Accepts `history: { role: 'user' | 'assistant'; content: string }[]`, uses `max_tokens: 1024`. Used by `/api/guide`.

After each call, track tokens:
```typescript
await trackUsage(supabase, userId, 'llama-3.3-70b-versatile', usage, 'chat')
```

**AI routing:** Groq (`llama-3.3-70b-versatile`) is primary. Falls back to OpenRouter (`google/gemini-2.0-flash-exp:free`) on error. Vision uses OpenRouter (`llama-3.2-11b-vision-instruct:free`).

**Guide system:** `src/lib/ai/guide-knowledge.ts` exports `APP_KNOWLEDGE` (static feature reference string) and `buildGuidePrompt(currentPage)`. Nav card parsing (`[NAV:/path|Label|Description]` markers) lives in `src/app/api/guide/parse-nav-card.ts` as a pure function. UI: `src/components/features/guide/guide-fab.tsx` (floating `?` button, renders `null` while `loading || !user`) + `src/components/features/guide/guide-sheet.tsx` (slide-up chat sheet with quick topic pills, message history, nav card display).

**Token optimisation:** `src/lib/ai/context-builder.ts` — `buildProfileSummary()` builds a compact ~80-token profile string. Pass it as `profileSummary` to the chat API instead of the full `AIContext` (~60% token reduction).

### State Management

- **`useAuth()`** (`src/lib/contexts/auth-context.tsx`) — global user + profile state. `profile` is the full `UserProfile` from `profiles` table. Call `refreshProfile()` after any profile mutation.
- **Onboarding** — Zustand store at `src/lib/stores/onboarding-store.ts` buffers all 11 steps; single DB upsert on completion. After saving, calls `refreshProfile()` then `router.replace('/home')`.
- **Realtime data** — `useRealtimeQuery<T>()` from `src/lib/hooks/use-realtime.ts` subscribes to Postgres changes and auto-refetches. Use the `refetch()` return value for manual refreshes.

### Business Logic Engines

`src/lib/engines/` contains pure server-side logic — always called with the admin Supabase client:

- **`rewards.ts`** — `awardCompletion(supabase, userId, difficulty)` grants XP (5/10/20/40/80 for difficulty 1–5) and creates a `reward` notification. `checkAchievements(supabase, userId)` evaluates all achievement conditions. `awardStreak(supabase, userId, streak)` checks streak milestones.
- **`punishment.ts`** — punishment application logic called from `/api/punish`.
- **`punishment-wheel.ts`** — wheel spin logic: selects from the merged pool (system + custom entries), returns the result. Called from `/api/punishment-wheel/spin`.

### Session Lifecycle

Sessions follow a server-authoritative state machine: `idle → active → extending → completing → completed | emergency`

**Only API routes write `status`.** The client reads status via Realtime and reacts.

Key fields on `sessions`:
- `total_duration_minutes` — authoritative session length (not the old `lock_goal_hours`)
- `scheduled_end_time` — always equal to `start_time + total_duration_minutes`; recalculated on every extension
- `session_config` — JSONB snapshot of the config selected at session start (tier, personality, limits, regimens, duration)
- `extension_count`, `last_extended_at` — extension tracking

Every state transition writes to `session_events` before updating `sessions`. Event types: `session_started`, `session_completed`, `session_emergency`, `task_assigned`, `task_completed`, `task_failed`, `task_overdue`, `punishment_applied`, `timer_extended`.

**Timer rendering (client):**
```typescript
const remaining_ms = new Date(session.scheduled_end_time).getTime() - Date.now()
const progress     = elapsed_ms / (session.total_duration_minutes * 60000) * 100
```
Never hardcode 7 days. `TimerCard` (`src/components/features/timer/timer-card.tsx`) accepts `totalDurationMinutes` and `status` props and renders distinct UI for `completing`, `completed`, `emergency` states.

**Auto-expiry:** The `session-cron` Edge Function (deployed to Supabase, `supabase/functions/session-cron/index.ts`) runs every minute, marks expired sessions `completing`, and triggers punishments for overdue master tasks. It requires `SITE_URL` and `CRON_SECRET` env vars in Supabase secrets. The pg_cron schedule must be set up manually via the Supabase dashboard.

### Task Types

Tasks have `task_type: 'daily' | 'master' | 'punishment' | 'checkin'` and `source: 'ai_chat' | 'auto' | 'system' | 'user'`.

**Master tasks** are assigned through chat: the AI appends `[TASK:{...}]` JSON markers to chat responses. `/api/chat` parses these with `TASK_REGEX = /\[TASK:([\s\S]*?)\]\s*$/`, strips the marker from the reply, creates the task row, and returns `masterTask` alongside `reply` in the response body. Master tasks always have a `proof_type`.

**Punishment tasks** are created by `/api/punish` from four sources: overdue master tasks (cron), failed verification (`/api/verify`), failed daily task (`/api/tasks/fail`), and AI rudeness detection (`/api/chat`).

**Checkin tasks** — Morning (6am–10am) and Night (8pm–midnight). Created automatically per session day via `POST /api/checkin/ensure`.

### Local Storage Architecture

Heavy data (chat history, images, videos) is **never retained on the server post-session**. It lives on-device permanently.

`src/lib/local-storage/` (all browser-only, import only from client components):
- `db.ts` — Dexie.js IndexedDB schema. Tables: `chat_messages`, `session_archives`, `journal_entries`, `proof_metadata`. Exports singleton `db`.
- `opfs.ts` — OPFS utilities. Files stored at `/{userId}/{sessionId}/proofs/{filename}` and `/videos/{filename}`. Key exports: `saveFileToOPFS`, `readFileFromOPFS`, `listSessionFiles`, `deleteSessionFiles`, `requestPersistentStorage`.
- `chat-archive.ts` — Rolling 500-message window helpers. `checkRollingWindow(sessionId, supabaseCount)` returns `{ shouldFlush, flushCount }` when Supabase exceeds 500 messages; `flushMessagesToLocal(messages)` bulk-puts them to IndexedDB.
- `session-archive.ts` — `archiveSession()` writes full session snapshot to IndexedDB before Supabase purge. `getSessionArchive(sessionId)`, `listUserArchives(userId)` for retrieval.
- `export.ts` — `exportSessionZip(sessionId, userId)` — reads IndexedDB archive + OPFS files, generates a ZIP via `fflate`, triggers browser download.

### Database Schema

Types are in `src/lib/supabase/schema.ts`. Key tables:

| Table | Purpose |
|-------|---------|
| `profiles` | User config: tier, willpower_score, xp_total, compliance_streak, ai_personality, hard_limits, soft_limits, interests, preferred_regimens, physical_details, onboarding_completed |
| `sessions` | Session state machine: status, start_time, scheduled_end_time, total_duration_minutes, session_config, extension_count |
| `tasks` | All task types: title, description, task_type, source, status, proof_type, verification_requirement, deadline, difficulty, duration_minutes, genres, cage_status, punishment_hours, punishment_additional, ai_verification_reason |
| `chat_messages` | All chat history: sender ('user'/'ai'), content, message_type, session_id |
| `session_events` | Immutable audit log of all session state transitions |
| `proof_documents` | Proof submissions: task_id, file_path, proof_type, verified, ai_result |
| `achievements` | Unlocked achievements: achievement_id, xp_awarded, awarded_at |
| `notifications` | In-app notifications: type, title, body, read |
| `regimens` | User regimen progress: regimen_id, current_day, completed_days |
| `mood_checkins` | Daily mood data: energy, stress, arousal, submission (0–100), tags[], date |
| `punishment_pool` | Available punishments: title, description, severity (1–5), requires_proof, is_system |
| `daily_task_log` | Task generation quota tracker: user_id, date, count (max 5/day) |
| `api_usage` | Token tracking: user_id, model, feature, prompt_tokens, completion_tokens, total_tokens |

Migrations in `supabase/migrations/` (applied in order):
- `20240523000000_update_profiles.sql` — base profiles schema
- `20260218_add_api_usage.sql` — `api_usage` table
- `20260305_session_lifecycle.sql` — adds `total_duration_minutes`, `session_config`, `extension_count`, `last_extended_at` to `sessions`; `task_type`, `source` to `tasks`
- `20260305_session_events_proof_docs.sql` — creates `session_events` and `proof_documents` tables
- `20260320_task_types_and_user_source.sql` — adds `user` to the `source` enum
- `20260320_mood_checkins.sql` — creates `mood_checkins` table
- `20260320_punishment_pool.sql` — creates `punishment_pool` table

### UI Components

Primitive components in `src/components/ui/` (`Button`, `Card`, `Badge`, `Input`) all use `class-variance-authority` for variants. Feature components in `src/components/features/`. Layout components (`TopBar`, `BottomNav`, `BentoGrid`) in `src/components/layout/`. Onboarding step components in `src/components/onboarding/`.

`src/components/features/session-start-flow.tsx` — 6-step session configuration wizard (tier, personality, hard limits, soft limits, regimens, duration). Exports `SessionConfig` interface.

`src/components/features/timer/timer-card.tsx` — session countdown. Props: `endTime`, `startTime`, `totalDurationMinutes`, `tier`, `status`, `punishmentActive`. Progress calculated from `totalDurationMinutes`, never hardcoded.

`src/components/features/proof/proof-capture-modal.tsx` — multi-mode proof capture: camera/gallery for image/video, mic for audio, text input for text proof. Saves to OPFS, submits to `/api/verify`.

### Prompt Registry

All AI system prompts are documented in `PROMPTS.md` at the project root. When changing a prompt, update both the source file and `PROMPTS.md`.
