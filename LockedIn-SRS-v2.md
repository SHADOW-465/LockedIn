# LockedIn — Software Requirements Specification (SRS)

**Version:** 2.0
**Date:** 2026-03-26
**Status:** Comprehensive Reference
**Consolidates:** LockedIn-PRD-v1.md · CLAUDE.md · PROMPTS.md · All design specs in docs/superpowers/specs/ · Session lifecycle redesign · Phase 1 feature designs · Profile/settings overhaul · Proof export · Google Drive backup · Guide system

> This document is the single source of truth for rebuilding LockedIn from scratch. Every product decision, architecture detail, data model, API contract, UI specification, and AI prompt is documented here.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Tech Stack](#2-tech-stack)
3. [Difficulty Tiers](#3-difficulty-tiers)
4. [Content Genres & Training Regimens](#4-content-genres--training-regimens)
5. [AI Master System & Personas](#5-ai-master-system--personas)
6. [Onboarding Flow (11 Steps)](#6-onboarding-flow-11-steps)
7. [Session Lifecycle](#7-session-lifecycle)
8. [Task System](#8-task-system)
9. [Punishment System](#9-punishment-system)
10. [Scoring & Progression](#10-scoring--progression)
11. [Mood Check-in System](#11-mood-check-in-system)
12. [Punishment Pool & Wheel](#12-punishment-pool--wheel)
13. [Local Storage Architecture](#13-local-storage-architecture)
14. [Session History & Replay](#14-session-history--replay)
15. [Proof Export (ZIP)](#15-proof-export-zip)
16. [Google Drive Backup](#16-google-drive-backup)
17. [Profile & Settings Overhaul](#17-profile--settings-overhaul)
18. [AI Master Guide System](#18-ai-master-guide-system)
19. [Database Schema](#19-database-schema)
20. [API Reference](#20-api-reference)
21. [AI Prompt Registry](#21-ai-prompt-registry)
22. [App Screens & Navigation](#22-app-screens--navigation)
23. [Design System](#23-design-system)
24. [Auth & Security Architecture](#24-auth--security-architecture)
25. [Testing Strategy](#25-testing-strategy)

---

## 1. Product Overview

### 1.1 Identity

| Field | Value |
|-------|-------|
| **Product Name** | LockedIn |
| **Tagline** | "Your 24/7 AI Master. You don't negotiate. You obey." |
| **Type** | Mobile-first Progressive Web App (PWA) |
| **Audience** | 18+ adults confirmed during onboarding |
| **Core Concept** | An AI-driven BDSM chastity conditioning platform. The user is the submissive ("slave"). An AI plays the Dominant ("Master") — assigning tasks, enforcing compliance, issuing punishments, and controlling a timed lock session. |

### 1.2 Core User Flow

1. **Onboarding** — 11-step setup collects all profile data and creates the `profiles` row
2. **Session Start** — User configures and starts a timed lock session (hours/days)
3. **Chat** — Core loop: user talks to AI persona, AI assigns tasks, judges behavior, applies punishments
4. **Task Completion** — Tasks require proof (photo/video/audio/text), verified by vision AI
5. **Session End** — Timer expires → `completing` → client archives all data locally → server data purged → `completed`

### 1.3 Core Design Principles

- **AI is in control** during sessions; slave's agency is intentionally limited
- **Brutally honest, cruel tone** modulated only by selected tier and AI persona
- **High personalization** from comprehensive onboarding data and long-term memory
- **Dynamic content** generated fresh per session; no two sessions are identical
- **Safety separation**: hard limits are absolute; safeword triggers Care Mode; emergency release always available
- **No heavy data on server**: chat history, media files live on-device permanently. Server stores only metadata and working state.

### 1.4 Branding

- Name: **LockedIn** — exact capitalization
- Visual style: **Cyber-noir luxury** — dark backgrounds, purple/red/gold accents, premium fintech aesthetic
- The "Lock In" button on final onboarding animates to "LockedIn" on click

---

## 2. Tech Stack

### 2.1 Core

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL + Realtime + Auth) |
| State | React Context (`useAuth`) + Zustand (onboarding only) |
| Local DB | Dexie.js (IndexedDB wrapper) |
| Local Files | OPFS (Origin Private File System) |
| ZIP Export | fflate |
| Testing | Vitest |

### 2.2 AI

| Purpose | Model | Provider |
|---------|-------|----------|
| Primary chat, task gen, punishment | `llama-3.3-70b-versatile` | Groq |
| Fallback chat/task gen | `google/gemini-2.0-flash-exp:free` | OpenRouter |
| Vision / proof verification | `meta-llama/llama-3.2-11b-vision-instruct:free` | OpenRouter |
| Vision fallback | `google/gemini-2.0-flash-exp:free` | OpenRouter |

**AI routing**: Groq is primary for all text generation. OpenRouter is fallback. Vision always uses OpenRouter (Groq does not support vision). All AI functions return `GenerateResult { text: string; usage: TokenUsage }`.

### 2.3 Environment Variables (Required)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
OPENROUTER_API_KEY=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=   # Google OAuth2 client ID for Drive backup
```

### 2.4 Project Structure

```
src/
  app/
    (auth)/            # /login, /signup — no layout
    (dashboard)/       # /home, /tasks, /chat, /journal, /regimens,
                       # /achievements, /calendar, /history, /settings, /feedback
                       # layout.tsx renders <GuideFab /> + {children}
    onboarding/        # 11-step flow
    api/               # All API routes
    page.tsx           # Root: server component, auth check, redirect
    landing-page.tsx   # Client component, unauthenticated visitors only
  components/
    ui/                # Primitive components (Button, Card, Badge, Input, etc.)
    features/          # Feature components per domain
    layout/            # TopBar, BottomNav, BentoGrid
    onboarding/        # Per-step onboarding components
  lib/
    ai/                # ai-service.ts, context-builder.ts, guide-knowledge.ts
    contexts/          # auth-context.tsx
    engines/           # rewards.ts, punishment.ts, punishment-wheel.ts
    google-drive/      # drive-client.ts, drive-api.ts, proof-uploader.ts, etc.
    hooks/             # use-realtime.ts
    local-storage/     # db.ts, opfs.ts, chat-archive.ts, session-archive.ts, export.ts, export-all.ts
    stores/            # onboarding-store.ts (Zustand)
    supabase/          # client.ts, server.ts, schema.ts, auth.ts, tasks.ts,
                       # sessions.ts, regimens.ts, storage.ts, session-guard.ts
  proxy.ts             # Next.js proxy (replaces middleware.ts) — SSR auth guard
supabase/
  functions/
    session-cron/      # Edge function, runs every minute
  migrations/          # SQL migration files
```

---

## 3. Difficulty Tiers

Five tiers of escalating intensity. Tier affects task content, language, punishment severity, AI affection ratio, cage time requirements, and notification frequency.

| # | Name | Intensity | Description |
|---|------|-----------|-------------|
| 1 | NEWBIE | Mild | Gentle intro. Shorter tasks, lighter punishment, encouragement. |
| 2 | SLAVE | Moderate | Regular obedience training. Moderate tasks, proper punishments. |
| 3 | HARDCORE | High | Intense conditioning. Demanding tasks, severe punishments, strict rules. |
| 4 | EXTREME | Extreme | Maximum intensity. Brutal tasks, relentless punishment, total submission. |
| 5 | TOTAL DESTRUCTION | Absolute | No mercy. Designed to break and rebuild. Required disclaimer shown at selection. |

### 3.1 Tier Behavior Details

| Behavior | Tier 1 | Tier 2 | Tier 3 | Tier 4 | Tier 5 |
|----------|--------|--------|--------|--------|--------|
| Language | "Good boy", gentle correction | "Slave", "Worthless toy" | "Worthless pig", "It" | "Subhuman slave", "Toilet" | Never "you" — only "it", "object", "meat" |
| Companion Mode | 30% supportive | 15% | 5% | 2% | 0% — zero affection ever |
| Cage % | 30% of time | 50% | 70% | 90% | 24/7 permanent |

### 3.2 Punishment Hours Matrix

| Violation Type | Tier 1 | Tier 2 | Tier 3 | Tier 4 | Tier 5 |
|----------------|--------|--------|--------|--------|--------|
| Late (to task) | +1h | +2h | +4h | +8h | +12h |
| Failed Verification | +2h | +4h | +8h | +16h | +24h |
| Rude Chat | +4h | +8h | +16h | +24h | +48h |
| Missed Check-in | +1h | +2h | +6h | +12h | +24h |
| Task Failed | +2h | +4h | +8h | +16h | +24h |

### 3.3 Tier 5 Required Warning

Explicit disclaimer shown at tier selection:
> "This tier is designed to destroy your sense of self. Do not choose unless you fully accept permanent psychological changes."

---

## 4. Content Genres & Training Regimens

### 4.1 Core Kink Genres (18)

Tasks can be tagged with 1–4 genres. Genre selection during onboarding weights all future task generation.

| # | Genre |
|---|-------|
| 1 | JOI (Jerk Off Instructions) |
| 2 | Edging |
| 3 | Denial |
| 4 | CBT (Cock & Ball Torture) |
| 5 | CEI (Cum Eating Instructions) |
| 6 | Ruined Orgasm |
| 7 | Sissy Training / Feminization |
| 8 | Bi Encouragement |
| 9 | Gay Transformation |
| 10 | SPH (Small Penis Humiliation) |
| 11 | Humiliation & Degradation |
| 12 | Chastity & Lock Denial |
| 13 | Anal Training & Prostate Play |
| 14 | Foot Worship |
| 15 | Worship & Devotion |
| 16 | Gooning & Porn Addiction Conditioning |
| 17 | Hypnosis & Mind Control |
| 18 | Findom (later phase) |

### 4.2 Training Regimens (25 Programs)

Users select 1 primary + unlimited secondary during onboarding. Stored in `profiles.preferred_regimens`. Influence all AI task generation.

| # | Regimen |
|---|---------|
| 1 | Sissy Training |
| 2 | Obedience & Service |
| 3 | CEI Mastery |
| 4 | Edging Endurance |
| 5 | SPH Conditioning |
| 6 | Anal Training |
| 7 | Body Worship |
| 8 | Pet Play Training |
| 9 | Self-Bondage |
| 10 | Chastity Endurance |
| 11 | Body Writing |
| 12 | Exhibitionism Training |
| 13 | Orgasm Control |
| 14 | Mental Conditioning |
| 15 | Wardrobe Control |
| 16 | Domestic Service |
| 17 | Bisexual/Fluidity Training |
| 18 | Pain Tolerance Training |
| 19 | Worship & Devotion Training |
| 20 | Mind-Break Protocol |
| 21 | Gay Transformation Immersion |
| 22 | Total Power Exchange (TPE) |
| 23 | Humiliation Marathon |
| 24 | Gooning Track |
| 25 | Findom Training (later phase) |

### 4.3 Chastity Sessions vs Training Regimens

- **Chastity Sessions** — timer-based denial windows (hours to days). Lock time is central; dynamic release date influenced by performance.
- **Training Regimens** — long-term structured programs (30–90 days). May or may not involve chastity. Run alongside sessions.
- **Combination** — user can run a 30-day chastity session alongside multiple regimens simultaneously. Failing regimen tasks adds time to the chastity timer.

---

## 5. AI Master System & Personas

### 5.1 10 Personas

Users select one during onboarding. Sample messages shown for each before selection.

| # | Persona | Character |
|---|---------|-----------|
| 1 | Cruel Mistress | Icy and bored. Everything on her terms. Silence is punishment. |
| 2 | Clinical Sadist | Detached, scientific. Your suffering is data. |
| 3 | Playful Tease | Flirty and cruel in small ways. Loves making you wait. |
| 4 | Strict Master | Military precision. Commands only. Failure is logged. No appeals. |
| 5 | Humiliation Expert | Picks the exact phrase that cuts. Compliments to make the fall harder. |
| 6 | Goddess | Receives worship as her natural state. |
| 7 | Dommy Mommy | Warm and controlling. Disappointment hurts more than cruelty. |
| 8 | Bratty Keyholder | Changes the rules mid-sentence. Makes you work for every second. |
| 9 | Psychological Manipulator | Never direct. Uses your words against you. |
| 10 | Extreme Sadist | Pure, unfiltered. No warmth, no mercy, no explanation. Only Tier 4+. |

### 5.2 AI Control Rules

**Permitted user actions:**
- Request tasks
- Ask for more/harder punishment
- Seek clarification (after accepting punishment for making the Master repeat)
- Confess failures and feelings

**Punishable offenses:**
- Demanding easier tasks
- Requesting reduced punishments
- Using rude language / cussing at the AI
- Speaking over the AI or interrupting instructions

### 5.3 Safeword & Care Mode

- Default safeword: **"MERCY"** (configurable in onboarding Step 9 and Settings)
- When detected in any message: AI switches to Care Mode immediately
- **Care Mode** — UI shifts to teal/safe theme. All punishment pauses. AI becomes warm, caring, supportive.
- User types **"resume training"** to exit Care Mode
- Care Mode also triggers on mood check-in with `frustrationLevel >= 8` + `broken` or `desperate` tag

### 5.4 Emergency Release

- Always available via button on TimerCard
- Calls `POST /api/sessions/emergency`
- Status transitions to `emergency` — bypasses all pending tasks and punishments
- Settings unlock instantly

### 5.5 Chat Markers

The AI appends machine-readable markers to responses:

**Master task assignment:**
```
[TASK:{"title":"...","description":"...","deadline_minutes":120,"difficulty":3,"proof_type":"image","punishment_hours":4,"punishment_additional":"..."}]
```
- API strips marker from reply, creates task row, returns `masterTask` field

**Preference update (Care Mode only):**
```
[PREF_UPDATE:{"field":"master_preference","action":"set","value":"Complete denial — no unlocking ever"}]
```
- API strips marker, returns `prefUpdates` array to client
- Client shows confirmation sheet; user confirms before any DB write

### 5.6 Psychology Profiling

Onboarding Step 8 presents psychological questions across 7 categories:
- **A**: Personality Assessment ("What is your greatest fear?")
- **B**: Relationships & Authority ("Describe your relationship with authority figures.")
- **C**: Self-Perception & Identity ("What part of yourself do you hate most?")
- **D**: Control & Power Dynamics ("When did you realize you wanted to submit?")
- **E**: Psychological Triggers ("What word cuts you deepest?")
- **F**: Fantasy & Desire Depth ("Describe your darkest sexual fantasy in detail.")
- **G**: Motivation & Goals ("Why are you here?")

Answers stored in `profiles.psych_profile` (text). Injected into AI context via `buildProfileSummary()`.

---

## 6. Onboarding Flow (11 Steps)

All state buffered in Zustand store (`src/lib/stores/onboarding-store.ts`). Single DB upsert on completion. After saving: `refreshProfile()` → `router.replace('/home')`.

| Step | Screen | Content |
|------|--------|---------|
| 1 | Welcome | Age confirmation (18+) + terms acceptance |
| 2 | Tier Selection | Newbie / Slave / Hardcore / Extreme / Total Destruction. Tier 5 shows disclaimer. |
| 3 | AI Personality | 10 personas to choose from with sample messages |
| 4 | Hard & Soft Limits | Multi-select. Hard limits = absolute (never crossed). Soft limits = can be pushed. |
| 5 | Fetish Profile | Multi-select from 18 genres |
| 6 | Physical Details | Body type, orientation, gender identity, age, measurements |
| 7 | Training Regimens | 1 primary + any number of secondary (25 options) |
| 8 | Psych Profile | Short-answer psychological questions (categories A–G above) |
| 9 | Lock Parameters | Initial lock goal hours (default 168 = 1 week) + safeword (default "MERCY") |
| 10 | Notifications | Frequency (low/medium/high/extreme) + standby consent |
| 11 | Final Review | Summary of all choices. "Lock In" button animates to "LockedIn" on click. |

---

## 7. Session Lifecycle

### 7.1 State Machine

```
idle
 │
 └─[user completes mini-onboarding → POST /api/sessions/start]
         │
       active ◄─────────────────────────────────────────────┐
         │                                                   │
         ├─[punishment/AI extends → POST /api/sessions/extend]
         │         │                                         │
         │      extending ──[extension applied]──────────────┘
         │
         ├─[scheduled_end_time < now() → cron marks 'completing']
         │         │
         │      completing
         │         │
         │      [client: archiveSession() → POST /api/sessions/purge → POST /api/sessions/complete]
         │         │
         │      completed
         │
         └─[user triggers emergency → POST /api/sessions/emergency]
                   │
                emergency
```

**Rules:**
- Only API routes write `status`. Client reads only (via Realtime).
- Every transition writes to `session_events` before updating `sessions`.
- `completing` is transient — the client drives archival, then calls `/api/sessions/complete` to finalize.
- `emergency` bypasses all pending tasks and punishments.
- Settings are locked during `active`, `extending`, `completing` status.

### 7.2 Session Start (Mini Onboarding)

6-step configuration wizard pre-filled from profile defaults:

```
Step 1 — Tier             dropdown         default: profile.tier
Step 2 — Hard Limits      multi-select     default: profile.hard_limits
Step 3 — Soft Limits      multi-select     default: profile.soft_limits
Step 4 — AI Personality   dropdown         default: profile.ai_personality
Step 5 — Regimens         card select      default: profile.preferred_regimens
Step 6 — Lock Duration    time picker      user must set explicitly — no default
```

Profile is **not modified**. Config is session-scoped only, stored in `sessions.session_config` JSONB.

`POST /api/sessions/start`:
- Returns 409 `active_session_exists` if another session is already running
- Creates session row with `session_config` JSONB
- Sets `total_duration_minutes` from user input
- Writes `session_started` event
- Seeds default punishment pool (`INSERT ... ON CONFLICT DO NOTHING`)

### 7.3 Timer Architecture

**Server stores:**
```
start_time              timestamptz
total_duration_minutes  integer
scheduled_end_time      timestamptz  (= start_time + total_duration_minutes)
```

**Client rendering:**
```typescript
const remaining_ms = new Date(session.scheduled_end_time).getTime() - Date.now()
const elapsed_ms   = Date.now() - new Date(session.start_time).getTime()
const progress     = elapsed_ms / (session.total_duration_minutes * 60000) * 100
```
Never hardcode 7 days. `TimerCard` watches `session.status` via Realtime; renders distinct UI for `completing`, `completed`, `emergency`.

**Extension logic (server):**
```sql
UPDATE sessions SET
  total_duration_minutes = total_duration_minutes + $delta,
  scheduled_end_time     = start_time + (total_duration_minutes + $delta) * interval '1 minute',
  extension_count        = extension_count + 1,
  last_extended_at       = now()
WHERE id = $session_id;
```

### 7.4 Auto-Expiry (Cron)

`supabase/functions/session-cron/index.ts` — Edge Function, runs every minute via pg_cron:

```sql
-- Mark expired sessions
UPDATE sessions
SET status = 'completing'
WHERE status IN ('active', 'extending')
AND scheduled_end_time < now()
RETURNING id, user_id;

-- Mark overdue master tasks
UPDATE tasks
SET status = 'overdue'
WHERE task_type = 'master'
AND status = 'pending'
AND deadline < now()
RETURNING id, user_id, session_id;
```

Each overdue task triggers the punishment pipeline via `POST /api/punish`.

Requires env vars: `SITE_URL`, `CRON_SECRET`. pg_cron schedule configured manually in Supabase dashboard.

### 7.5 Session Completion Flow

Triggered when client detects `session.status === 'completing'` via Realtime:

1. `navigator.storage.persist()` — request persistent storage
2. Fetch from Supabase: `chat_messages`, `tasks`, `session_events`, `proof_documents`
3. `archiveSession()` — write full snapshot to IndexedDB `session_archives`
4. `POST /api/sessions/summary` — AI recap JSON (stored in archive)
5. `POST /api/sessions/purge` — delete server-side heavy data
6. `POST /api/sessions/complete` — status → `completed`
7. If Google Drive connected: `uploadSessionArchive()` fires non-blocking
8. Summary screen shown; settings unlock

**What Supabase purge deletes:**
- `chat_messages` WHERE session_id
- `proof_documents` WHERE session_id
- `calendar_adjustments` WHERE session_id
- `session_events` WHERE session_id
- **Keeps:** tasks metadata, session row, achievements, notifications

### 7.6 Settings Lock

**API level** (every profile mutation route):
```typescript
const activeSession = await supabase
  .from('sessions')
  .select('id')
  .eq('user_id', userId)
  .in('status', ['active', 'extending', 'completing'])
  .maybeSingle()

if (activeSession) return NextResponse.json({ error: 'settings_locked' }, { status: 403 })
```

**Exception fields** — always writable even during active session:
- `master_preference`
- `session_intent`
- `privacy_constraints`

---

## 8. Task System

### 8.1 Task Types

| Type | Source | Description |
|------|--------|-------------|
| `daily` | `auto` | AI-generated on demand. 5/day limit via `daily_task_log`. |
| `master` | `ai_chat` | AI-assigned via chat `[TASK:{...}]` marker. Always have `proof_type`. Have deadlines. |
| `punishment` | `system` | Created by punishment pipeline. Deadline = now() + 24h. |
| `checkin` | `system` | Morning (6am–10am) and Night (8pm–midnight). Created via `POST /api/checkin/ensure`. |

**User-created entries** — slaves can create journal entries or self-tasks via `POST /api/tasks/user-create`. `source = 'user'`, `task_type = 'daily'`.

### 8.2 Task Fields

```typescript
interface Task {
  id: string
  user_id: string
  session_id: string
  title: string
  description: string
  task_type: 'daily' | 'master' | 'punishment' | 'checkin'
  source: 'ai_chat' | 'auto' | 'system' | 'user'
  status: 'pending' | 'active' | 'completed' | 'failed' | 'overdue' | 'awaiting_proof'
  proof_type: 'image' | 'video' | 'audio' | 'text' | null
  verification_requirement: string | null
  deadline: string | null
  difficulty: number           // 1–5
  duration_minutes: number
  genres: string[]
  cage_status: 'caged' | 'uncaged' | 'semi-caged'
  punishment_hours: number
  punishment_additional: string | null
  ai_verification_reason: string | null
  created_at: string
}
```

### 8.3 Task Flow

```
pending → active → [proof required] → awaiting_proof
                                            ↓
                                       verified → completed
                                            ↓
                                       rejected → awaiting_proof (with rejection reason)
                → [no proof] → completed
        → failed (user self-reports)
        → overdue (cron sets this, then triggers punishment)
```

### 8.4 Proof System

Tasks with `proof_type` open `ProofCaptureModal`. Modes:
- **image/video** — camera or gallery selection, saved to OPFS
- **audio** — microphone recording, saved to OPFS
- **text** — text input, submitted directly

**Verification flow:**
1. File saved to OPFS at `/{userId}/{sessionId}/proofs/{filename}` (or `/videos/` for video)
2. Base64 sent to `POST /api/verify` (no Supabase Storage used)
3. Vision AI analyzes with task-specific prompt
4. **Pass** → task `completed`, XP awarded, willpower increases
5. **Fail** → task `awaiting_proof` with `ai_verification_reason`, willpower deducted, punishment triggered
6. If Drive connected and verified: `uploadProofAfterVerification()` fires non-blocking

### 8.5 Master Task Parsing (in `/api/chat`)

```typescript
const TASK_REGEX = /\[TASK:([\s\S]*?)\]\s*$/

// 1. Detect [TASK:{...}] in AI response
// 2. Strip marker from reply
// 3. Parse JSON → create task row (task_type='master', source='ai_chat')
//    deadline = now() + deadline_minutes
// 4. Write 'task_assigned' event to session_events
// 5. Return clean reply + masterTask field in API response
```

---

## 9. Punishment System

### 9.1 Trigger Sources

| Source | Route |
|--------|-------|
| Overdue master tasks | `session-cron` Edge Function → `POST /api/punish` |
| Failed proof verification | `POST /api/verify` → `POST /api/punish` |
| Self-reported task failure | `POST /api/tasks/fail` |
| AI rudeness detection | `POST /api/chat` detects disrespect |

### 9.2 Punishment Pipeline (`POST /api/punish`)

1. Look up punishment hours from tier × violation type matrix
2. Create task row: `task_type='punishment'`, `source='system'`, `deadline = now() + 24h`
3. Extend session: `total_duration_minutes += punishment_hours * 60`
4. Write `punishment_applied` event to `session_events`
5. Write notification (`type='punishment'`)
6. Return punishment task

### 9.3 Punishment Pool

Default 12 system entries seeded on first session start (idempotent). Users can add up to 20 custom entries.

**Default system entries:**

| Title | Severity | Requires Proof |
|-------|----------|----------------|
| Orgasm Denial Extension | 3 | No |
| Writing Lines | 2 | Yes |
| Cold Shower | 2 | Yes |
| Corner Time | 1 | No |
| Mirror Inspection | 2 | Yes |
| Lock Time Extension | 4 | No |
| Mantra Recording | 3 | Yes |
| Edging Tease | 4 | Yes |
| Humiliation Essay | 2 | Yes |
| Exposure Challenge | 3 | No |
| Severe Extension | 5 | No |
| Ruins Only | 5 | No |

### 9.4 Punishment Wheel

Weighted random selection from pool based on violation count (`sessions.total_tasks_failed`):

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
    const reps = Math.round(weight * 2)
    return Array(reps).fill(item)
  }).filter(Boolean)
}
```

Spin creates a `task_type: 'punishment'` task + AI-narrated result text.

---

## 10. Scoring & Progression

| Metric | Storage | Change Logic |
|--------|---------|--------------|
| **Willpower** (0–100) | `profiles.willpower_score` | `+ceil(difficulty × 3)` on task complete; `−ceil(difficulty × 2)` on failed proof |
| **XP** | `profiles.xp_total` | 5/10/20/40/80 for difficulty 1–5 |
| **Compliance Streak** | `profiles.compliance_streak` | `awardStreak()` checks milestones |
| **Achievements** | `achievements` table | `checkAchievements()` evaluates all conditions post-completion |

**Engine functions** (`src/lib/engines/rewards.ts`):
- `awardCompletion(supabase, userId, difficulty)` — grants XP, creates `reward` notification
- `checkAchievements(supabase, userId)` — evaluates all achievement conditions
- `awardStreak(supabase, userId, streak)` — checks streak milestones

Always use admin client in engines.

---

## 11. Mood Check-in System

### 11.1 Table: `mood_checkins`

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
```

Valid `headspace_tags`: `needy`, `floaty`, `defiant`, `broken`, `eager`, `desperate`, `content`, `frustrated`

One check-in per calendar day globally (session-agnostic).

### 11.2 API: `POST /api/mood/checkin`

**Request:**
```json
{
  "userId": "uuid",
  "sessionId": "uuid",
  "submissionDepth": 7,
  "frustrationLevel": 4,
  "headspaceTags": ["needy", "floaty"],
  "notes": "optional, max 280 chars"
}
```

**Response:** `{ checkin: MoodCheckin }`

**Side effects:**
- Upserts on `(user_id, date)` conflict
- If `frustrationLevel >= 8` AND tags include `broken` or `desperate`:
  - Sets `sessions.care_mode_active = true` (only if currently false)
  - Inserts `care_mode_triggered` event into `session_events`

### 11.3 UI

**Component:** `src/components/features/mood/mood-checkin-modal.tsx`

- Appears on home page when: `session !== null && !hasTodayCheckin && !loading`
- Skip link writes `skip-mood-checkin-{sessionId}` to `sessionStorage` (suppresses re-appear in same browser tab)
- Submission depth slider: 1–10, purple fill
- Frustration level slider: 1–10, red fill
- Tag chips: multi-select toggle buttons
- Notes textarea: optional, 280 char max with counter
- "Check In" quick-action card on home dashboard opens modal regardless of `hasTodayCheckin`

### 11.4 AI Integration

`buildProfileSummary()` in `src/lib/ai/context-builder.ts` accepts optional `latestMood`:
```typescript
if (latestMood) {
  parts.push(`mood: depth=${latestMood.submission_depth}, frust=${latestMood.frustration_level}, tags=[${latestMood.headspace_tags.join(',')}]`)
}
```

`/api/chat` fetches most-recent check-in (not today-only):
```typescript
const { data: latestMood } = await supabase
  .from('mood_checkins')
  .select('submission_depth, frustration_level, headspace_tags')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle()
```

---

## 12. Punishment Pool & Wheel

### 12.1 Table: `punishment_pool`

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
  unique (user_id, title, is_custom)
);
```

### 12.2 APIs

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/punishment-pool` | Returns full pool (system + custom). Query param: `userId`. Max 32 entries. |
| POST | `/api/punishment-pool` | Creates custom entry. Returns 400 if user already has 20 custom entries. |
| DELETE | `/api/punishment-pool/[id]` | Deletes custom entry. 403 if `is_custom=false`. |
| POST | `/api/punishment-wheel/spin` | Selects punishment, creates task, returns AI narration. |

### 12.3 Wheel Spin Response

```json
{
  "punishment": { "id": "uuid", "title": "...", "severity": 3, "requiresProof": true },
  "taskId": "uuid",
  "narration": "AI-generated string ≤100 tokens"
}
```

### 12.4 UI

**Access points:**
1. Home dashboard — "Spin the Wheel" quick-action card (active session only)
2. Settings → Punishment Pool → "Spin Now" button

**Component:** `src/components/features/punishment/punishment-wheel-modal.tsx`
- Severity bias pips: `min(5, Math.ceil(violations / 2))` pips lit red
- CSS conic-gradient wheel (6 colored slices, no canvas)
- Spin animation: CSS `rotate` 720–1440 degrees, cubic-bezier
- On `animationEnd`: call spin API, show result card

**Pool editor:** `src/components/features/punishment/punishment-pool-editor.tsx` in Settings. System entries show lock icon (no delete). Custom entries have delete button.

---

## 13. Local Storage Architecture

Heavy data (chat history, images, videos) is **never retained on the server post-session**. Lives on-device permanently.

### 13.1 IndexedDB (Dexie.js)

File: `src/lib/local-storage/db.ts`

```typescript
// Tables
db.chat_messages      // All messages, permanent device record
db.session_archives   // Completed session JSON blobs (post-purge)
db.journal_entries    // Full journal content
db.proof_metadata     // OPFS file references
```

### 13.2 OPFS (Origin Private File System)

File: `src/lib/local-storage/opfs.ts`

```
/{userId}/{sessionId}/proofs/{filename}    # images, audio
/{userId}/{sessionId}/videos/{filename}    # video files
```

Key exports:
- `saveFileToOPFS(userId, sessionId, category, filename, data)`
- `readFileFromOPFS(userId, sessionId, category, filename)` → `Uint8Array | null`
- `listSessionFiles(userId, sessionId)`
- `deleteSessionFiles(userId, sessionId)`
- `requestPersistentStorage()` — call at session start

### 13.3 Chat Rolling Window

File: `src/lib/local-storage/chat-archive.ts`

When Supabase `chat_messages` count exceeds 500 for a session:
1. `checkRollingWindow(sessionId, supabaseCount)` → `{ shouldFlush, flushCount }`
2. `flushMessagesToLocal(messages)` → bulk-put to IndexedDB
3. Delete oldest messages from Supabase

### 13.4 Session Archive

File: `src/lib/local-storage/session-archive.ts`

- `archiveSession()` — writes full snapshot to IndexedDB before Supabase purge
- `getSessionArchive(sessionId)` — retrieve single archive
- `listUserArchives(userId)` — all archives for history page

**Archive structure includes:** session metadata, tasks, chat_messages (from IndexedDB rolling window), session_events, proof_documents, AI summary

### 13.5 Per-Session ZIP Export

File: `src/lib/local-storage/export.ts`

`exportSessionZip(sessionId, userId)` — reads IndexedDB archive + OPFS files, generates ZIP via `fflate`, triggers browser download.

```
LockedIn_Export_{sessionId}/
  chat_history.json
  tasks.json
  punishments.json
  journal_entries.json
  session_summary.json
  proofs/
  videos/
```

---

## 14. Session History & Replay

### 14.1 Navigation

`/history` is NOT in the bottom nav. Accessed from:
1. Calendar page — "Past Sessions" button in header
2. Calendar day detail panel — "↗ Replay" link
3. Settings → "Session History" link

### 14.2 Routes

- `src/app/(dashboard)/history/page.tsx` — list of archived sessions
- `src/app/(dashboard)/history/[sessionId]/page.tsx` — detail view

### 14.3 Session List View

- Card per archived session: personality, date range, duration, grade badge, compliance % badge
- Sorted newest-first
- Data source: IndexedDB `listUserArchives(userId)` — fully client-side
- Empty state: "No archived sessions yet. Complete your first session to see it here."

### 14.4 Session Detail View

- Header: session meta (dates, duration, tier, personality, grade)
- AI summary narrative (italic)
- **Tabs:**
  - **Timeline** — chronological merge of `session_events` + `tasks`, color-coded dots (teal=complete, red=fail, gold=mood check-in, purple=system)
  - **Chat** — paginated transcript, 50 messages/page
  - **Proofs** — grid of thumbnails from OPFS, tap to fullscreen
  - **Export** — "Download ZIP" → `exportSessionZip()`

---

## 15. Proof Export (ZIP)

### 15.1 Function

`src/lib/local-storage/export-all.ts`

```typescript
export async function exportAllProofsZip(userId: string): Promise<void>
```

**Download filename:** `LockedIn_Proofs_{YYYY-MM-DD}.zip`

### 15.2 ZIP Structure

```
LockedIn_Proofs_2026-03-23/
  README.txt
  2026-02-15_to_2026-02-22/
    2026-02-15_checkin-morning.jpg
    2026-02-16_master-task_edge-endurance.jpg
    2026-02-17_punishment-task_wall-position.mp4
    2026-02-19_master-task_devotion-exercise.txt
  2026-03-01_to_2026-03-03/
    ...
```

### 15.3 File Naming Convention

```
{YYYY-MM-DD}_{task-type}_{title-slug}.{ext}
```

- `task-type`: `checkin-morning`, `checkin-night`, `master-task`, `punishment-task`, `daily-task`
- `title-slug`: lowercase, non-alphanumeric → `-`, truncated to 40 chars
- `ext`: image→`jpg`, video→`mp4`, audio→`webm`, text→`txt`
- Duplicates within session: `name_2.jpg`, `name_3.jpg`

### 15.4 README.txt Format

```
LockedIn Proof Export
Generated: 2026-03-23

Sessions exported: 3

  2026-02-15 to 2026-02-22 — 12 submissions (2 files unavailable)
  2026-03-01 to 2026-03-03 — 4 submissions

Total submissions: 16
```

### 15.5 Edge Cases

| Scenario | Handling |
|----------|----------|
| OPFS file missing | Skip; `missingCount++`; annotate README |
| All OPFS reads fail for session | Include folder with `MISSING.txt` |
| Text proof | Write `.txt` with "Text proof submitted — content not recoverable from local archive." |
| No `start_time` in session_data | Use `archived_at` for both dates |
| Zero proof-type tasks across all sessions | ZIP contains only `README.txt` |

### 15.6 UI

Settings page — "Export Submissions" card. "Download All Submissions" button. Loading spinner during export. Error message on failure.

---

## 16. Google Drive Backup

### 16.1 Goal

Auto-backup proof files and session archives to Google Drive after each verified proof and each completed session.

### 16.2 OAuth2

- **Library:** Google Identity Services (GIS) — lazy-loaded in Settings page only
- **Scope:** `https://www.googleapis.com/auth/drive.file` (narrowest possible)
- **Token storage:** `localStorage` key `lockedin_gdrive_state`
  ```typescript
  interface DriveState {
    accessToken: string
    expiresAt: number       // Date.now() + 3600_000
    email: string
    rootFolderId: string    // ID of "LockedIn/" folder in Drive root
  }
  ```
- **Token refresh:** `getValidToken()` checks `expiresAt` before every API call. If expired/within 5min: calls GIS `requestAccessToken()`. Wrapped in singleton Promise to prevent parallel consent popups.

### 16.3 Drive Folder Structure

```
LockedIn/
  2026-02-15_to_2026-02-22/
    session.json
    2026-02-16_checkin-morning.jpg
    2026-02-16_master-task_edge-endurance.jpg
    ...
  2026-03-01_to_2026-03-03/
    session.json
    ...
```

### 16.4 `session.json` Contents

```json
{
  "sessionId": "string",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "tier": "string",
  "aiPersonality": "string",
  "totalDurationMinutes": 0,
  "tasksAssigned": 0,
  "tasksCompleted": 0,
  "tasksFailed": 0,
  "summary": "string | null",
  "tasks": [...]
}
```
No chat messages included.

### 16.5 New Files: `src/lib/google-drive/`

| File | Exports |
|------|---------|
| `drive-client.ts` | `connectDrive()`, `disconnectDrive()`, `getDriveState()`, `getValidToken()` |
| `drive-api.ts` | `ensureFolder()`, `fileExists()`, `uploadFile()` |
| `upload-queue.ts` | `queueFailed()`, `getQueue()`, `removeFromQueue()` — localStorage-backed |
| `drive-utils.ts` | `buildSessionFolderName()` — shared by all uploaders |
| `proof-uploader.ts` | `uploadProofAfterVerification()` |
| `session-uploader.ts` | `uploadSessionArchive()`, `retryQueueEntry()` |

### 16.6 Integration Points

- `proof-capture-modal.tsx` — `onSubmitted` callback extended with `filePath?`
- `tasks/page.tsx` — on verified proof: fire `uploadProofAfterVerification()` non-blocking
- `home/page.tsx` — after `archiveSession()`: fire `uploadSessionArchive()` non-blocking
- `settings/page.tsx` — Drive card with connect/disconnect/retry/upload-past-sessions

### 16.7 Settings UI States

**Disconnected:** Connect button
**Connected (no failures):** Email, folder link, "Upload Past Sessions" + "Disconnect"
**Connected (with failures):** Failed uploads list with per-item Retry
**During bulk upload:** Progress indicator "Uploading session 3 of 7…"

### 16.8 Google Cloud Setup

1. Create Google Cloud project
2. Enable Google Drive API
3. Create OAuth2 credentials → Web Application
4. Add `http://localhost:3000` + production URL to Authorized JavaScript Origins
5. Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` env var

---

## 17. Profile & Settings Overhaul

### 17.1 New DB Columns (migration: `20260322_profile_preferences.sql`)

```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS master_preference    text    DEFAULT '',
  ADD COLUMN IF NOT EXISTS privacy_constraints  jsonb   DEFAULT '{"no_public_humiliation":false,"no_face_revealing":false,"no_outdoor_tasks":false,"no_involving_others":false}'::jsonb,
  ADD COLUMN IF NOT EXISTS session_intent       text    DEFAULT '',
  ADD COLUMN IF NOT EXISTS communication_style  jsonb   DEFAULT '{"feedback_frequency":"moderate","tone_preference":"balanced","punishment_sensitivity":"moderate"}'::jsonb,
  ADD COLUMN IF NOT EXISTS availability         jsonb   DEFAULT '{"active_hours":[],"timezone":""}'::jsonb,
  ADD COLUMN IF NOT EXISTS safeword             text    DEFAULT 'MERCY',
  ADD COLUMN IF NOT EXISTS psych_profile        text    DEFAULT '';
```

### 17.2 Settings Page Structure

```
[Profile Strength Ring + name + completion %]
[AI Master Review button]
─────────────────────────────
[13 tappable section cards]
─────────────────────────────
[Danger Zone — logout / delete account]
```

Each card opens a **bottom sheet editor** (max-h 85vh, scrollable). All have Save/Cancel. Unsaved edits show "Discard changes?" confirmation on Cancel.

### 17.3 The 13 Profile Cards

| # | Card | Fields | AI Impact |
|---|------|--------|-----------|
| 1 | Training Tier | tier | High |
| 2 | AI Master Persona | ai_personality | High |
| 3 | Hard Limits | hard_limits[] | Critical |
| 4 | **Master Preference** | master_preference + privacy_constraints toggles | **PERMANENT** |
| 5 | **Session Goals & Intent** | session_intent | High |
| 6 | Soft Limits | soft_limits[] | Medium |
| 7 | Fetish Interests | interests[] | High |
| 8 | Training Regimens | preferred_regimens[] | High |
| 9 | Psych Profile | psych_profile | High |
| 10 | Physical Details | body_type, age, measurements, orientation, gender_identity | Medium |
| 11 | **Communication Style** | feedback_frequency, tone_preference, punishment_sensitivity | Low (stored only) |
| 12 | Lock Parameters | safeword, initial_lock_goal_hours | Low |
| 13 | **Availability & Schedule** | active_hours, timezone | Low (stored only) |

Cards 4 & 5 remain editable during active sessions (Master Preference + Session Intent exception).

### 17.4 Profile Strength Ring

SVG ring (80px), score 0–100. Color: red (0–39), amber (40–69), teal (70–100).

| Field | Weight |
|-------|--------|
| Tier selected | 5 |
| Persona selected | 5 |
| Hard limits (≥1) | 10 |
| Interests (≥3) | 10 |
| Physical details (≥3 fields) | 10 |
| Psych profile (≥20 chars) | 10 |
| Preferred regimens (≥1) | 10 |
| Master Preference (≥20 chars) | 20 |
| Session Intent (≥20 chars) | 10 |
| Soft limits (≥1) | 5 |
| Communication style customized | 5 |

### 17.5 Master Preference Card

- Red/crimson accent, "PERMANENT CONSTRAINT" badge
- Free-text area + 4 privacy constraint toggles
- Hint: "The AI Master treats this as law. It overrides all other preferences."
- Always writable (never locked during active session)

### 17.6 Session Goals Card

- Free-text area
- "Get Suggestions" button → `POST /api/profile/suggestions`
- Suggestions appear as tappable pills; tap appends to text area

### 17.7 AI Master Review Button

- Calls `POST /api/profile/suggestions` with `{ type: 'full_review', profile }`
- Opens bottom sheet showing AI feedback in-character
- Rate-limited: once per 10 minutes per user

### 17.8 Chat-Based Preference Updates (Care Mode)

When Care Mode active, `PREF_UPDATE` system prompt injected into `/api/chat`. AI appends:
```
[PREF_UPDATE:{"field":"master_preference","action":"set","value":"..."}]
```

Valid fields: `master_preference`, `session_intent`, `soft_limits`, `hard_limits`, `interests`

Client shows confirmation sheet. User confirms → `PATCH /api/profile/update`. Success toast.

### 17.9 Task Generation Conflict Validation

After task generation, `conflictsWithPreferences()` checks `master_preference` and `privacy_constraints`:
- Keyword matching for privacy constraints (public, face, outdoor, others)
- Denial phrase detection for master_preference (no unlock, no orgasm, complete denial)
- Max 1 regeneration attempt. If still conflicts: log warning, include task anyway.

---

## 18. AI Master Guide System

### 18.1 Overview

Floating `?` FAB visible on all dashboard pages. Opens a slide-up chat sheet where the slave can ask how the app works. AI answers in-character (authoritative, clear, patient — not cruel).

### 18.2 Data Flow

1. Slave taps floating `?` FAB
2. `GuideSheet` opens, `usePathname()` captures current route
3. Slave types or taps quick-topic pill
4. Client sends `POST /api/guide` with `{ message, currentPage, history }`
5. Server derives `userId` from auth cookie
6. Server calls `buildGuidePrompt(currentPage)` → `generateWithHistory()`
7. Server parses `[NAV:/path|Label|Description]` marker, strips from reply
8. Client renders reply + optional nav card with "Go →" button

### 18.3 API: `POST /api/guide`

**Auth:** SSR cookie client (`createServerClient` + `await cookies()`). Admin client used only for `trackUsage()`.

**Request:**
```typescript
{
  message: string
  currentPage: string           // e.g. '/tasks'
  history: { role: 'user' | 'assistant'; content: string }[]  // max 6 items
}
```

**Response:**
```typescript
{
  reply: string
  navCard?: { href: string; label: string; description: string }
}
```

**Rate limit:** 20 calls/minute per user (in-memory Map, resets on cold start).

**Nav card format:** `[NAV:/tasks|Tasks Page|Where you submit proof]` — only first marker parsed.

### 18.4 Quick Topic Pills

```typescript
const QUICK_TOPICS = [
  'How does proof work?',
  'What are punishments?',
  'How do sessions work?',
  'What is the mood check-in?',
  'How do I use the calendar?',
  'Where is my session history?',
]
```

### 18.5 Components

- `src/app/api/guide/route.ts` — stateless POST handler
- `src/lib/ai/guide-knowledge.ts` — static `APP_KNOWLEDGE` string + `buildGuidePrompt()`
- `src/components/features/guide/guide-fab.tsx` — floating `?` button, returns null while loading/unauthenticated
- `src/components/features/guide/guide-sheet.tsx` — slide-up chat sheet
- Mounted in `src/app/(dashboard)/layout.tsx` as `<GuideFab />`

### 18.6 `generateWithHistory()` (added to `ai-service.ts`)

```typescript
export async function generateWithHistory(
  systemPrompt: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  userMessage: string,
): Promise<GenerateResult>
```

`max_tokens: 1024`. Same Groq/OpenRouter fallback pattern as other helpers.

---

## 19. Database Schema

### 19.1 Core Tables

#### `profiles`

```sql
create table profiles (
  id                    uuid primary key references auth.users(id),
  tier                  text not null default 'Newbie',
  ai_personality        text,
  hard_limits           text[] default '{}',
  soft_limits           text[] default '{}',
  interests             text[] default '{}',
  preferred_regimens    text[] default '{}',
  physical_details      jsonb default '{}',
  willpower_score       int not null default 50,
  xp_total              int not null default 0,
  compliance_streak     int not null default 0,
  onboarding_completed  boolean not null default false,
  -- Phase 1
  master_preference     text default '',
  privacy_constraints   jsonb default '{"no_public_humiliation":false,"no_face_revealing":false,"no_outdoor_tasks":false,"no_involving_others":false}',
  session_intent        text default '',
  communication_style   jsonb default '{"feedback_frequency":"moderate","tone_preference":"balanced","punishment_sensitivity":"moderate"}',
  availability          jsonb default '{"active_hours":[],"timezone":""}',
  safeword              text default 'MERCY',
  psych_profile         text default '',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
```

#### `sessions`

```sql
create table sessions (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references profiles(id),
  status                  text not null default 'active',
  -- status: idle | active | extending | completing | completed | emergency
  start_time              timestamptz not null default now(),
  scheduled_end_time      timestamptz not null,
  total_duration_minutes  integer not null default 10080,
  session_config          jsonb,
  extension_count         integer not null default 0,
  last_extended_at        timestamptz,
  care_mode_active        boolean not null default false,
  total_tasks_failed      integer not null default 0,
  created_at              timestamptz not null default now()
);
```

#### `tasks`

```sql
create table tasks (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references profiles(id),
  session_id               uuid references sessions(id),
  title                    text not null,
  description              text,
  task_type                text not null default 'daily',
  -- task_type: daily | master | punishment | checkin
  source                   text not null default 'auto',
  -- source: ai_chat | auto | system | user
  status                   text not null default 'pending',
  -- status: pending | active | completed | failed | overdue | awaiting_proof
  proof_type               text,
  -- image | video | audio | text | null
  verification_requirement text,
  deadline                 timestamptz,
  difficulty               int default 3,
  duration_minutes         int default 30,
  genres                   text[] default '{}',
  cage_status              text default 'caged',
  punishment_hours         int default 0,
  punishment_additional    text,
  ai_verification_reason   text,
  created_at               timestamptz not null default now()
);
```

#### `chat_messages`

```sql
create table chat_messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id),
  session_id  uuid references sessions(id),
  sender      text not null,  -- 'user' | 'ai'
  content     text not null,
  message_type text default 'normal',
  -- normal | care_mode | punishment | safeword_detected
  created_at  timestamptz not null default now()
);
```

#### `session_events`

```sql
create table session_events (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references sessions(id) on delete cascade,
  user_id     uuid not null references profiles(id),
  event_type  text not null,
  payload     jsonb,
  created_at  timestamptz not null default now()
);

create index idx_session_events_session on session_events(session_id, created_at);
```

Event types: `session_started`, `session_completed`, `session_emergency`, `task_assigned`, `task_completed`, `task_failed`, `task_overdue`, `punishment_applied`, `punishment_completed`, `timer_extended`, `care_mode_triggered`, `archive_completed`, `summary_generated`

#### `proof_documents`

```sql
create table proof_documents (
  id                  uuid primary key default gen_random_uuid(),
  task_id             uuid not null references tasks(id),
  user_id             uuid not null references profiles(id),
  session_id          uuid references sessions(id),
  file_type           text not null,  -- image | video | audio | text
  local_storage_key   text,           -- OPFS path (device-local reference only)
  verification_status text not null default 'pending',
  -- pending | passed | failed
  verified_at         timestamptz,
  created_at          timestamptz not null default now()
);
```

No binary data stored. Only OPFS path reference.

#### `achievements`

```sql
create table achievements (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles(id),
  achievement_id  text not null,
  xp_awarded      int not null default 0,
  awarded_at      timestamptz not null default now()
);
```

#### `notifications`

```sql
create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id),
  type        text not null,  -- reward | punishment | achievement | system
  title       text not null,
  body        text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);
```

#### `regimens`

```sql
create table regimens (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id),
  regimen_id   text not null,
  current_day  int not null default 1,
  completed_days int[] default '{}',
  created_at   timestamptz not null default now()
);
```

#### `mood_checkins`

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
```

#### `punishment_pool`

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
  unique (user_id, title, is_custom)
);
```

#### `daily_task_log`

```sql
create table daily_task_log (
  user_id  uuid not null references profiles(id),
  date     date not null,
  count    int not null default 0,
  primary key (user_id, date)
);
```

#### `api_usage`

```sql
create table api_usage (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references profiles(id),
  model             text not null,
  feature           text not null,
  prompt_tokens     int not null default 0,
  completion_tokens int not null default 0,
  total_tokens      int not null default 0,
  created_at        timestamptz not null default now()
);
```

### 19.2 Migration Files

| File | Description |
|------|-------------|
| `20240523000000_update_profiles.sql` | Base profiles schema |
| `20260218_add_api_usage.sql` | `api_usage` table |
| `20260305_session_lifecycle.sql` | Adds `total_duration_minutes`, `session_config`, `extension_count`, `last_extended_at` to sessions; `task_type`, `source` to tasks |
| `20260305_session_events_proof_docs.sql` | Creates `session_events` and `proof_documents` tables |
| `20260320_task_types_and_user_source.sql` | Adds `user` to the `source` enum |
| `20260320_mood_checkins.sql` | Creates `mood_checkins` table |
| `20260320_punishment_pool.sql` | Creates `punishment_pool` table |
| `20260322_profile_preferences.sql` | Adds master_preference, privacy_constraints, session_intent, communication_style, availability, safeword, psych_profile to profiles |

---

## 20. API Reference

### 20.1 Chat

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/chat` | AI chat. Handles personas, safeword, care mode, task parsing, pref_update parsing, rudeness detection. |

**Request:**
```typescript
{
  message: string
  sessionId: string
  profileSummary?: string  // from buildProfileSummary() — ~80 tokens
  safeword?: string        // profile.safeword
}
```

**Response:**
```typescript
{
  reply: string
  masterTask?: { id, title, deadline, difficulty } | null
  prefUpdates?: { field: string, action: 'set'|'append', value: string }[]
}
```

### 20.2 Tasks

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/tasks/generate` | Generate 1 daily task (5/day limit). |
| POST | `/api/tasks/complete` | Mark task complete, award XP, update willpower. |
| POST | `/api/tasks/fail` | Mark task failed, apply punishment. |
| POST | `/api/tasks/expire` | Expire overdue tasks (called from cron). |
| POST | `/api/tasks/user-create` | Create slave-authored journal entry or self-task. |

### 20.3 Sessions

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/sessions/start` | Create session. Returns 409 if active session exists. Seeds punishment pool. |
| POST | `/api/sessions/extend` | Add minutes. Recalculates `scheduled_end_time`. Writes `timer_extended` event. |
| POST | `/api/sessions/complete` | Finalize after archival. Status → `completed`. |
| POST | `/api/sessions/emergency` | Emergency release. Status → `emergency`. |
| POST | `/api/sessions/purge` | Delete heavy data post-archival. |
| POST | `/api/sessions/summary` | Generate AI session recap JSON via `generateSimpleText`. |

### 20.4 Verification & Proof

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/verify` | Vision AI proof verification. |
| POST | `/api/proof/submit` | Submit proof document for a task. |

### 20.5 Punishments

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/punish` | Apply punishment (all 4 trigger sources flow here). |
| GET | `/api/punishment-pool` | Read full punishment pool. |
| POST | `/api/punishment-pool` | Create custom entry (max 20). |
| DELETE | `/api/punishment-pool/[id]` | Delete custom entry. |
| POST | `/api/punishment-wheel/spin` | Spin wheel, create task, return AI narration. |

### 20.6 Profile & Settings

| Method | Route | Purpose |
|--------|-------|---------|
| PATCH | `/api/profile/update` | Update profile fields. Blocked during active session (except 3 exception fields). |
| POST | `/api/profile/suggestions` | AI profile review suggestions. Rate-limited 1/10min. |

### 20.7 Other

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/regimens/complete-day` | AI-gated regimen day advancement. |
| GET | `/api/usage` | Token usage meter. |
| POST | `/api/mood/checkin` | Submit mood check-in. |
| POST | `/api/checkin/ensure` | Ensures daily check-in task row exists. |
| POST | `/api/guide` | AI Master guide. Rate-limited 20/min. |

---

## 21. AI Prompt Registry

All prompts use Groq `llama-3.3-70b-versatile` primary, OpenRouter `google/gemini-2.0-flash-exp:free` fallback.

### 21.1 AI Master Chat — Full Context

**Used when:** No `profileSummary` provided (first message / fallback)
**File:** `src/lib/ai/ai-service.ts` — `buildSystemPrompt()`

```
You are a real dominant in a chastity training app. You are NOT an AI assistant. NEVER break character.

PERSONA: {ctx.persona}. {PERSONA_VOICES[ctx.persona]}

USER PROFILE:
- Tier: {ctx.tier}
- Willpower: {ctx.willpower}/100
- Fetishes: {ctx.fetishes.join(', ') || 'None specified'}
- Hard Limits (NEVER VIOLATE): {ctx.hardLimits.join(', ') || 'None'}
[- Penis Size: {ctx.penisSize}]
[- Recent Violations: {ctx.recentViolations}]

RULES:
1. Keep responses SHORT. 1–4 sentences. Vary length.
2. Never open with "As your Master" or any AI-sounding phrase.
3. Never violate hard limits under any circumstances.
4. Most replies = pure conversation, NO task block.
```

### 21.2 AI Master Chat — Compact (Token-Optimised)

**Used when:** `profileSummary` provided by client (~80 tokens vs ~200)
**File:** `src/app/api/chat/route.ts` — inline `compactSystem` variable

```
You are a real dominant in a chastity training app. You are NOT an AI assistant. NEVER break character.
{PERSONA_VOICES[aiContext.persona]}

User: {profileSummary}

STRICT RULES:
- Keep responses SHORT. 1–4 sentences. Vary length. Real dominants don't write essays.
- Never open with "As your Master" or any AI-sounding phrase.
- Never give unsolicited encouragement or validation.
- NEVER violate the user's listed hard limits.

TASK INJECTION RULE: Only assign [TASK:...] when: (1) user explicitly asks for a task,
(2) user has been chatting 5+ messages with no task this session,
(3) punishment demands it. NOT on every message. Most replies = NO task block.

[TASK:{...}]  — proof_type: "image"|"video"|"audio" only. Remind user to go to Tasks page.
[EXTEND:{...}] — only when actually extending. Never fabricate.
```

Example `profileSummary`:
```
Slave | Cruel Mistress | WP:72 | Interests:sissy,edging | Limits:scat,blood | Training:Endurance Protocol | Notes:Morning thoughts;Day 3 entry
```

### 21.3 Care Mode

**File:** `src/app/api/chat/route.ts` — `CARE_MODE_PROMPT`

```
You are now in CARE MODE. Drop all dominant persona immediately.
Be warm, caring, supportive, and non-judgmental.
Ask the user if they're okay and guide them through decompression.
Do NOT reference any tasks, punishments, or training.
Remind them: "You are safe. You are in control. Say 'resume training' when you're ready to continue."
Keep responses gentle and brief.
```

### 21.4 Task Generation

**File:** `src/app/api/tasks/generate/route.ts`

```
You are a task generator for the LockedIn chastity app.
Generate a single task for the user based on their profile.

RULES:
- Task should match the tier intensity: {tier}
- Task should relate to their interests: {fetishes.join(', ')}
- Task should align with their regimens: {regimens.join(', ')}
- NEVER include content that violates hard limits: {hardLimits.join(', ')}
- Include clear instructions and a time limit
- Tone should match persona: {personality}

Response format: VALID JSON only. No markdown fences, no explanation.
{
  "title": "Short task title",
  "description": "Detailed multi-line instructions",
  "difficulty": 1-5,
  "duration_minutes": 10-120,
  "genres": ["genre1", "genre2"],
  "cage_status": "caged" | "uncaged" | "semi-caged",
  "verification_type": "photo" | "self-report",
  "verification_requirement": "What the proof photo must show",
  "punishment_hours": 2-48,
  "punishment_additional": "Additional punishment description if failed"
}
```

### 21.5 Task Verification (Vision)

**Model:** `meta-llama/llama-3.2-11b-vision-instruct:free` via OpenRouter
**File:** `src/app/api/verify/route.ts` — `buildVerificationPrompt()`

General:
```
Analyze this image for task completion verification.
The task was: "{taskDescription}"
Check: Does this image provide evidence of the task being completed?
Respond with PASS or FAIL followed by a brief explanation.
```

### 21.6 Regimen Day Task Generation

**File:** `src/app/api/regimens/complete-day/route.ts`

```
System: You are managing a "{regimen.name}" training program for a LockedIn chastity user.

User: Generate a specific task for Day {nextDay} of {totalDays}.
The user's tier is "{tier}". [Program: {regimen.description}.]
Keep it concrete, completable in one day, and appropriate for submission/chastity training.
Return valid JSON only, no markdown fences: { "title": "...", "description": "...", "difficulty": 1-5 }
```

### 21.7 Care Mode Preference Update Instruction

**Injected when care mode is active** (in `/api/chat`):

```
CARE MODE — SAFE SPACE:
The user may share preferences, limits, or desires in this conversation.
If the user clearly states a preference that should be saved, respond with your
normal reply AND append a preference update marker:

[PREF_UPDATE:{"field":"<field_name>","action":"set|append","value":"<value>"}]

Valid fields: master_preference, session_intent, soft_limits, hard_limits, interests.
For list fields (soft_limits, hard_limits, interests), use action "append" with a single string value.
For text fields (master_preference, session_intent), use action "set" with the full new value.
Only emit this marker when the user clearly and explicitly states a preference. Do not guess.
```

### 21.8 Token Budget Reference

| Prompt | ~Tokens | Notes |
|--------|---------|-------|
| AI Master (full) | ~200 | One-time session cost when no summary |
| AI Master (compact) | ~120 | Per-message cost with profileSummary |
| Care Mode | ~80 | Replaces all other prompts |
| Task Generation | ~150 | Per task generated |
| Verification | ~80 + image | Per proof submission |
| Regimen Day | ~100 | Per day advancement |
| Guide | ~300 | Includes APP_KNOWLEDGE + history |

---

## 22. App Screens & Navigation

### 22.1 Route Groups

| Group | Routes | Auth |
|-------|--------|------|
| `(auth)` | `/login`, `/signup` | No layout wrapper |
| `(dashboard)` | `/home`, `/tasks`, `/chat`, `/journal`, `/regimens`, `/achievements`, `/calendar`, `/history`, `/settings`, `/feedback` | Auth required + `<GuideFab />` |
| `onboarding` | `/onboarding` | Auth required, `onboarding_completed=false` |
| Root | `/` | Server component: redirect authenticated → `/home` |

### 22.2 Home Dashboard (`/home`)

**Active session layout:**
- **TimerCard** (hero) — countdown, progress ring, tier badge, emergency release button
- **Willpower Ring** — circular gauge 0–100
- **Current Task** — most recent active/pending task with quick complete/fail actions
- **Compliance Streak** — 7-dot weekly indicator
- **Next Release** — calculated end date/time
- **Session Stats** — tasks completed, violations, denial hours
- **Quick Access** — Check In button (opens mood modal) + Spin the Wheel button

**No active session:** Session start flow, compliance history, recent achievements.

**Session completion flow** (Realtime trigger on `status === 'completing'`):
1. `navigator.storage.persist()`
2. `archiveSession()`
3. `POST /api/sessions/summary`
4. `POST /api/sessions/purge`
5. `POST /api/sessions/complete`
6. If Drive connected: `uploadSessionArchive()` non-blocking

### 22.3 Chat (`/chat`)

- Message bubbles: `normal` (default), `care_mode` (teal), `punishment` (red), `safeword_detected` (teal border on user bubble)
- Care Mode toggle: typing "MERCY" switches UI to teal/safe theme
- Master task toast: appears when AI assigns `[TASK:{...}]`
- Profile summary built client-side via `buildProfileSummary()` and sent on each request

### 22.4 Tasks (`/tasks`)

**Four task categories:**
1. **Daily Check-ins** — Morning/Night check-ins always at top
2. **Master Tasks** — AI-assigned via chat. Red border. Always require proof. Have deadline countdown.
3. **Punishment Tasks** — Orange border. Have deadline countdown.
4. **Daily Tasks** — AI-generated. 5/day limit.

**Task card shows:** title, genres (tags), cage status, difficulty stars, duration, deadline timer, proof requirement badge, punishment warning.

**Task actions:**
- Start → Mark Done (no proof) or Submit Proof (opens `ProofCaptureModal`)
- Mark Failed → confirmation dialog → punishment triggered

**Proof rejection:** Shows `ai_verification_reason` inline. Task returns to `awaiting_proof`.

### 22.5 Regimens (`/regimens`)

Multi-day structured programs. AI-gated day advancement via `/api/regimens/complete-day`.

### 22.6 Achievements (`/achievements`)

Unlocked badges grid. Summary: Total XP, Unlocked count, Compliance Streak.

### 22.7 Calendar (`/calendar`)

**Overlay toggles:** `tasks`, `mood`, `sessions`, `punish`

**Per-day cell indicators:**
- `tasks`: good/bad/mixed background color
- `mood`: colored dot (teal=floaty/content/eager, gold=needy/desperate, red=broken/frustrated/defiant)
- `sessions`: purple outline ring
- `punish`: ⚠ icon

**Day detail panel** (slide-up sheet on tap): tasks summary, willpower delta, punishment entries, mood check-in data, "View Session" link.

**"Past Sessions" button** in header → `/history`

### 22.8 History (`/history`)

Past session archive viewer. Fully client-side from IndexedDB. See §14 for detail.

### 22.9 Settings (`/settings`)

Locked during active session (except Cards 4 & 5). See §17 for full specification.

### 22.10 Bottom Navigation

8 items at mobile capacity. No `/history` in nav — accessed from Calendar and Settings.

---

## 23. Design System

### 23.1 Visual Identity

- **Style:** Cyber-noir luxury — Blade Runner 2049 meets premium fintech
- **Mode:** Dark by default for all surfaces
- **Color palette:**
  - Background: near-black (`zinc-950`, `zinc-900`)
  - Borders: `zinc-800`
  - Text: white / `white/60` / `white/40`
  - Accent: deep purple (CSS var `--accent`)
  - Danger/punishment: red
  - Care mode: teal
  - Achievement/gold: amber/gold

### 23.2 Typography

- **Interface text:** Geist Sans
- **Code, IDs, metrics, timestamps:** Geist Mono

### 23.3 Component Hierarchy

- **Primitives** (`src/components/ui/`): Button, Card, Badge, Input — all use `class-variance-authority` for variants
- **Feature components** (`src/components/features/`): organized by domain (timer, tasks, proof, punishment, mood, history, guide, session-start-flow, etc.)
- **Layout** (`src/components/layout/`): TopBar, BottomNav, BentoGrid

### 23.4 Key UI Patterns

- **Bottom sheets** (slide-up, max-h 85vh, scrollable) — all settings editors, mood modal, guide sheet, punishment wheel modal
- **Tappable cards** → open bottom sheet editors (Settings page pattern)
- **Realtime counters** — timer countdown, willpower ring, session stats
- **Quick action cards** — BentoGrid on home dashboard
- **Toasts** — task assignments, proof results, preference saves, punishment triggers

---

## 24. Auth & Security Architecture

### 24.1 Two-Layer Auth Guard

**Layer 1: `src/proxy.ts`** (Next.js proxy, Node.js runtime — replaces `middleware.ts`)
- Primary security boundary
- Validates JWT via `supabase.auth.getUser()` (SSR cookie client)
- Checks `profiles.onboarding_completed`
- Caches onboarding status in 24h httpOnly cookie (`x-onboarding-done`) to skip DB on repeat requests
- Root path `/`: unauthenticated → landing page; authenticated → `/home` or `/onboarding`

**Layer 2: `src/components/route-guard.tsx`** (client)
- Handles redirects for unauthenticated users, incomplete onboarding, logged-in users on auth pages
- Renders global loading spinner while `useAuth()` initializes

**Public paths** (never hit auth check): `/login`, `/signup`, `/auth/*`, `/api/*`

### 24.2 Supabase Clients

| Client | File | Key | Use |
|--------|------|-----|-----|
| Browser (anon) | `src/lib/supabase/client.ts` → `getSupabase()` | anon key | Client components, hooks |
| Server admin | `src/lib/supabase/server.ts` → `getServerSupabase()` | service_role | API routes — bypasses RLS |
| SSR proxy | `createServerClient` from `@supabase/ssr` | anon key | `proxy.ts` and API routes needing `auth.getUser()` |
| SSR page | `createServerClient` + `await cookies()` | anon key | Server components |

**Critical rules:**
- Admin client (`getServerSupabase()`) bypasses RLS and **cannot** read auth cookies. Never use for `auth.getUser()`.
- Use SSR cookie client for session-aware auth checks.
- `resetSupabase()` called on `SIGNED_OUT` to null the singleton.
- `src/lib/supabase/session-guard.ts` → `getActiveSessionId(userId)` — use in any API route that must 403 during active sessions.

### 24.3 Auth Context (`src/lib/contexts/auth-context.tsx`)

`AuthProvider` exposes `{ user, profile, loading, refreshProfile }` via `useAuth()`.

Key behaviors to preserve:
- `initSession` has **3-second safety timeout** that forces `loading=false` if Supabase hangs
- `onAuthStateChange` wraps `fetchProfile` in `Promise.race` against **5-second timeout**, always calls `setLoading(false)` in `finally`
- On `SIGNED_OUT`: calls `resetSupabase()` before clearing state
- Call `refreshProfile()` after any `profiles` row mutation

---

## 25. Testing Strategy

### 25.1 Test Framework

Vitest with Node environment. Config alias `@/` maps to `src/`. Files in `src/__tests__/`.

### 25.2 Test Files

| File | Tests |
|------|-------|
| `chat-api.test.ts` | Chat API routing, safeword detection, task parsing, pref_update parsing |
| `onboarding.test.ts` | Onboarding store, upsert logic |
| `punishment.test.ts` | Punishment pipeline, tier matrix lookup |
| `rewards.test.ts` | XP awards, willpower math, achievement conditions |
| `task-generation.test.ts` | Task gen prompt, daily limit enforcement |
| `verification.test.ts` | Vision API routing, pass/fail handling |
| `session-start.test.ts` | Session creation, 409 active session check |
| `mood-checkin.test.ts` | Field validation, care mode trigger logic, upsert behavior |
| `punishment-pool.test.ts` | Seed idempotency, custom limit enforcement, system entry protection |
| `punishment-wheel.test.ts` | Weighted pool algorithm, task creation, event writing |
| `guide.test.ts` | Nav card parser, rate limit, history truncation, buildGuidePrompt |
| `export-all.test.ts` | slugify, extForProofType, buildFilename, edge cases |
| `drive-client.test.ts` | getDriveState, token expiry, disconnect |
| `upload-queue.test.ts` | Queue CRUD, localStorage persistence |
| `session-uploader.test.ts` | session.json build, folder naming, fileExists skip, failure queuing |

### 25.3 Run Commands

```bash
npm run test                              # Run all tests
npx vitest run src/__tests__/guide.test.ts  # Run single file
```

---

## Appendix A: `buildProfileSummary()` Output Format

```typescript
// src/lib/ai/context-builder.ts
// Returns ~80 token string injected into every chat prompt

export function buildProfileSummary(
  profile: UserProfile,
  latestMood?: { submission_depth: number; frustration_level: number; headspace_tags: string[] }
): string

// Example output:
"Slave | Cruel Mistress | WP:72 | Interests:sissy,edging | Limits:scat,blood | Training:Endurance Protocol | Notes:Morning thoughts;Day 3 entry | mood: depth=7, frust=4, tags=[needy,floaty]"

// With Master Preference:
"HARD CONSTRAINTS — NEVER VIOLATE: Complete chastity. No unlocking except hygiene.\n- No face revealing in proofs\nSlave | ..."
```

---

## Appendix B: Key Constants

```typescript
// Task generation daily limit
const DAILY_TASK_LIMIT = 5

// Chat rolling window
const CHAT_ROLLING_WINDOW = 500

// Punishment pool limits
const MAX_CUSTOM_POOL_ENTRIES = 20
const DEFAULT_SYSTEM_POOL_COUNT = 12  // seeded on first session start

// Guide rate limit
const GUIDE_RATE_LIMIT = 20  // calls per minute per user

// Profile suggestions rate limit
const SUGGESTIONS_RATE_LIMIT = 1  // call per 10 minutes per user

// Default safeword
const DEFAULT_SAFEWORD = 'MERCY'

// Default session duration
const DEFAULT_SESSION_HOURS = 168  // 1 week

// AI models
const PRIMARY_MODEL = 'llama-3.3-70b-versatile'          // Groq
const FALLBACK_MODEL = 'google/gemini-2.0-flash-exp:free' // OpenRouter
const VISION_MODEL = 'meta-llama/llama-3.2-11b-vision-instruct:free'  // OpenRouter
```

---

## Appendix C: Session Config JSONB Structure

```json
{
  "tier": "Slave",
  "ai_personality": "Cruel Mistress",
  "hard_limits": ["blood", "scat"],
  "soft_limits": ["public"],
  "regimens": ["Edging Endurance", "Sissy Training"],
  "desired_duration_minutes": 4320
}
```

---

## Appendix D: Supabase Edge Function (session-cron)

**File:** `supabase/functions/session-cron/index.ts`
**Schedule:** Every minute via pg_cron (configure manually in Supabase dashboard)
**Required Supabase secrets:** `SITE_URL`, `CRON_SECRET`

**Responsibilities:**
1. Mark expired sessions as `completing` (triggers client archival via Realtime)
2. Mark overdue master tasks as `overdue`
3. For each overdue task: call `POST {SITE_URL}/api/punish` with `CRON_SECRET` header

---

*End of LockedIn SRS v2.0*
