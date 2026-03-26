# Profile & Settings Overhaul — Design Spec

**Date:** 2026-03-22
**Status:** Approved for implementation

---

## 1. Problem Statement

The current `/settings` page exposes a minimal subset of the user's profile. Data entered during the 11-step onboarding (physical details, psychological profile, regimen selections, preferences) is effectively invisible after setup — users cannot review or update it. This creates several problems:

1. Users cannot refine their profile to improve AI personalization over time.
2. There is no mechanism to communicate a standing, permanent "Master Preference" (e.g., complete denial, no unlocking ever) that must constrain *every* AI interaction across the entire app.
3. The user has no way to update their preferences through natural conversation with the Master during a session.

---

## 2. Goals

- Make all onboarding data visible and editable in `/settings`.
- Introduce a **Master Preference** card — a permanent, profile-level hard constraint injected into every AI system prompt.
- Introduce a **Session Goals / Intent** card — a per-profile preference statement that guides task generation and session tone.
- Add an **AI Master Review** button that sends the current profile to the AI for personalization suggestions.
- Display a **Profile Strength Ring** showing completeness.
- Premium, scrollable card layout with bottom sheet editors for each section.
- Provide inline hints for fields that directly impact AI behavior.
- Allow users to update preferences through chat **in Care Mode** — the Master can propose preference updates and apply them with user confirmation.
- Block all mutations during active sessions for the settings page (existing behavior), but allow preference updates via Care Mode chat at any time.
- Update the in-app Guide knowledge base and the floating `?` help assistant to document all new preference features.

---

## 3. TypeScript Interfaces

All new interfaces live in `src/lib/supabase/schema.ts` alongside existing types.

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
  active_hours: { start: string; end: string }[]  // array of time window pairs, e.g. [{ start: "09:00", end: "22:00" }]
  timezone: string                                 // IANA timezone string e.g. "Asia/Karachi"
}
```

`UserProfile` in `schema.ts` must be extended with these fields:

```typescript
export interface UserProfile {
  // ... existing fields ...
  master_preference?: string        // permanent hard constraint text
  privacy_constraints?: PrivacyConstraints
  session_intent?: string           // session goals free text
  communication_style?: CommunicationStyle
  availability?: Availability
  safeword?: string                 // user's safeword (default "MERCY")
  psych_profile?: string            // psychological profile text (pre-existing gap — add if missing)
}
```

---

## 4. Database Changes

Single migration: `supabase/migrations/20260322_profile_preferences.sql`

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

---

## 5. API Changes

### 5.1 `PATCH /api/profile/update`

Extend the **existing `PATCH` handler** (not POST) to accept all new fields. The `ProfileUpdateBody` type gains:

```typescript
interface ProfileUpdateBody {
  // Existing fields (unchanged)
  tier?: string
  ai_personality?: string
  hard_limits?: string[]
  soft_limits?: string[]
  interests?: string[]
  preferred_regimens?: string[]
  physical_details?: Record<string, string>
  safeword?: string
  // New fields
  master_preference?: string
  privacy_constraints?: PrivacyConstraints
  session_intent?: string
  communication_style?: CommunicationStyle
  availability?: Availability
  psych_profile?: string
}
```

Auth: SSR cookie client (already the pattern in `profile/update`). Active session check: `getActiveSessionId()` — return 403 if active session detected, **except** when the request body contains only `master_preference`, `session_intent`, or `privacy_constraints` — these three fields are allowed to update during active sessions because they can be set via Care Mode chat.

### 5.2 `POST /api/profile/suggestions` — new endpoint

**Auth:** SSR cookie client (`createServerClient` from `@supabase/ssr`).

**Rate limiting:** 1 call per 10 minutes per user (same in-memory `Map<userId, lastCallTime>` pattern as `/api/guide`).

**Request body:**
```typescript
{
  type: 'full_review' | 'session_intent',  // which kind of suggestions to generate
  profile: Partial<UserProfile>            // current profile snapshot sent from client
}
```

**Response:**
```typescript
{ suggestions: string[] }   // 3–5 actionable suggestion strings
```

**AI call:** Use `generateWithHistory(systemPrompt, [], userPrompt)` — this function already uses `max_tokens: 1024` and accepts an empty history array, making it suitable here without modifying `generateSimpleText`. Include `trackUsage()` call after generation with model `'llama-3.3-70b-versatile'` and endpoint `'profile_suggestions'`.

**Error handling:** On AI failure, return `{ suggestions: [] }` with HTTP 200 (graceful fallback, not 500) — the UI shows an empty state with a retry option.

### 5.3 Chat-Based Preference Updates (Care Mode)

No new API endpoint needed. The existing `POST /api/chat` route is extended:

**Care Mode detection in `/api/chat`:** The server detects the safeword in the current message (`isSafeword = message.toUpperCase().includes(userSafeword)`) and sets `sessions.care_mode_active = true`. For subsequent messages in the same Care Mode session, the server queries `sessions.care_mode_active` from the DB using `sessionId`. The client already sends `safeword` in the request body (sourced from `profile.safeword` once that field exists). The server-side `DEFAULT_SAFEWORD = 'MERCY'` fallback is preserved — no changes to safeword detection logic.

The PREF_UPDATE system prompt instruction is injected when `isSafeword === true` OR when `sessions.care_mode_active === true` (looked up by `sessionId`).

When Care Mode is active, the AI is given an additional system prompt instruction:

```
CARE MODE — SAFE SPACE:
The user may share preferences, limits, or desires in this conversation.
If the user clearly states a preference that should be saved (e.g., "I want complete denial",
"add no public humiliation to my limits", "my goal is permanent chastity"), respond with your
normal reply AND append a preference update marker:

[PREF_UPDATE:{"field":"<field_name>","action":"set|append","value":"<value>"}]

Valid fields: master_preference, session_intent, soft_limits, hard_limits, interests.
For list fields (soft_limits, hard_limits, interests), use action "append" with a single string value.
For text fields (master_preference, session_intent), use action "set" with the full new value.
Only emit this marker when the user clearly and explicitly states a preference. Do not guess.
```

`/api/chat` parses `PREF_UPDATE` markers (same regex pattern as `TASK` markers: `/\[PREF_UPDATE:([\s\S]*?)\]/g`), strips them from the reply, and returns them to the client as `{ prefUpdates: PrefUpdate[] }` alongside the normal reply.

**Malformed JSON handling:** The `value` field for text fields may contain quotes or special characters that break JSON parsing. The parser must wrap each match in a `try/catch` — on parse failure, discard that marker and log a warning. Never throw to the caller. `value` for list-append actions must be a single string (not an array); if an array is detected, take the first element.

**Client handling** (`src/app/(dashboard)/chat/page.tsx`):
- When `prefUpdates` is non-empty, show a confirmation bottom sheet: "Your Master wants to save these preferences. Confirm?"
- On confirm: call `PATCH /api/profile/update` with the preference update data (active session exception applies — see 5.1).
- On dismiss: no action.
- Show a success toast: "Preferences updated by Master."

This is only available when Care Mode is active. Outside Care Mode, the `PREF_UPDATE` instruction is not injected, so the AI never emits the marker.

---

## 6. AI Context Changes

**Phase 2 depends on Phase 1 being merged and types verified before implementation.**

### 6.1 `buildProfileSummary()` — `src/lib/ai/context-builder.ts`

Add `master_preference`, `privacy_constraints`, and `session_intent` to the output string. `communication_style` and `availability` are stored in DB but NOT injected into the profile summary in this iteration (future work). Master Preference is injected first, as a hard constraint block:

```typescript
// Master Preference — injected as hard constraint
if (profile.master_preference?.trim()) {
  lines.push(`HARD CONSTRAINTS — NEVER VIOLATE: ${profile.master_preference}`)
}
// Privacy constraints
const pc = profile.privacy_constraints
if (pc?.no_public_humiliation) lines.push('- No public humiliation tasks')
if (pc?.no_face_revealing)     lines.push('- No face revealing in proofs')
if (pc?.no_outdoor_tasks)      lines.push('- No outdoor tasks')
if (pc?.no_involving_others)   lines.push('- No tasks involving other people')
// Session intent
if (profile.session_intent?.trim()) {
  lines.push(`Session Intent: ${profile.session_intent}`)
}
// Availability is stored but NOT injected in this iteration (future use)
```

### 6.2 `buildSystemPrompt()` — `src/lib/ai/ai-service.ts`

The `AIContext` interface is **not changed**. Instead, the compiled profile summary string (already passed as `systemOverride` in some callers, or embedded in the system prompt) carries the Master Preference via `buildProfileSummary()`. No `AIContext` field additions are needed — the summary string already flows through to every prompt.

### 6.3 Task Generation Conflict Validation — `/api/tasks/generate`

After generating tasks, run a conflict check against `master_preference` and `privacy_constraints`:

```typescript
function conflictsWithPreferences(
  taskText: string,
  masterPreference: string,
  privacyConstraints: PrivacyConstraints
): boolean {
  const lower = taskText.toLowerCase()
  // Privacy constraint keyword check
  if (privacyConstraints.no_public_humiliation &&
      (lower.includes('public') || lower.includes('outside') || lower.includes('stranger'))) return true
  if (privacyConstraints.no_face_revealing && lower.includes('face')) return true
  if (privacyConstraints.no_outdoor_tasks &&
      (lower.includes('outside') || lower.includes('outdoor') || lower.includes('public'))) return true
  if (privacyConstraints.no_involving_others &&
      (lower.includes('partner') || lower.includes('someone') || lower.includes('person'))) return true
  // Master preference keyword check — split on word boundaries, filter short words
  if (masterPreference.trim()) {
    const prefWords = masterPreference.toLowerCase()
      .split(/[\s,;.!?]+/)
      .filter(w => w.length > 4)
    // Simple denial detection
    if (masterPreference.toLowerCase().includes('no unlock') ||
        masterPreference.toLowerCase().includes('no orgasm') ||
        masterPreference.toLowerCase().includes('complete denial')) {
      if (lower.includes('unlock') || lower.includes('orgasm') || lower.includes('ejaculat')) return true
    }
    // General word overlap check (conservative — only flag obvious conflicts)
    const denialPhrases = ['no touch', 'no release', 'no penetrat', 'complete chastity']
    for (const phrase of denialPhrases) {
      if (masterPreference.toLowerCase().includes(phrase) &&
          (lower.includes('touch') || lower.includes('release') || lower.includes('penetrat'))) return true
    }
  }
  return false
}
```

Maximum 1 regeneration attempt per conflicting task. Regeneration appends to the prompt: `"CONSTRAINT: ${masterPreference}. Do NOT generate tasks that conflict with this."`. If still conflicts, log a warning and include the task anyway (avoid infinite loops).

---

## 7. UI Design

### 7.1 Page Structure

`/settings` page:

```
[Profile Strength Ring + name + completion %]
[AI Master Review button]
─────────────────────────────
[Scrollable card list — 13 cards]
─────────────────────────────
[Danger Zone — logout / delete account]
```

Each card is a tappable surface. Tapping opens a **bottom sheet editor** specific to that section.

### 7.2 Profile Strength Ring

A circular progress SVG ring (80px diameter) in the page header. Score (0–100):

| Field | Weight |
|-------|--------|
| Tier selected | 5 |
| Persona selected | 5 |
| Hard limits set (≥1) | 10 |
| Interests selected (≥3) | 10 |
| Physical details filled (≥3 fields) | 10 |
| Psych profile written (≥20 chars) | 10 |
| Preferred regimens set (≥1) | 10 |
| Master Preference written (≥20 chars) | 20 |
| Session Intent written (≥20 chars) | 10 |
| Soft limits set (≥1) | 5 |
| Communication style customized | 5 |
| **Total** | **100** |

Ring color: red (0–39), amber (40–69), teal (70–100).

### 7.3 The 13 Profile Section Cards

| # | Card Title | Fields | AI Impact Badge |
|---|-----------|--------|-----------------|
| 1 | Training Tier | tier | High |
| 2 | AI Master Persona | ai_personality | High |
| 3 | Hard Limits | hard_limits[] | Critical |
| 4 | **Master Preference** | master_preference (text), privacy_constraints (toggles) | **PERMANENT** |
| 5 | **Session Goals & Intent** | session_intent (text) | High |
| 6 | Soft Limits | soft_limits[] | Medium |
| 7 | Fetish Interests | interests[] | High |
| 8 | Training Regimens | preferred_regimens[] | High |
| 9 | Psych Profile | psych_profile (text) | High |
| 10 | Physical Details | body_type, age, measurements, orientation, gender_identity | Medium |
| 11 | **Communication Style** | feedback_frequency, tone_preference, punishment_sensitivity | Low (stored, not yet injected) |
| 12 | Lock Parameters | safeword, initial_lock_goal_hours | Low |
| 13 | **Availability & Schedule** | active_hours, timezone | Low (future) |

Cards 4, 5, 11, and 13 are new. Cards 1–3, 6–10, 12 already exist in the profile but gain improved editors.

### 7.4 Master Preference Card (Card 4)

Visually distinct — red/crimson accent, "PERMANENT CONSTRAINT" badge.

**Editor contents:**
- Free-text area: placeholder — "e.g., Complete chastity — I must not touch or unlock under any circumstances except hygiene. No tasks involving orgasm or ejaculation of any kind."
- Toggle section — "Privacy & Safety Boundaries":
  - No public humiliation tasks
  - No face-revealing in proof photos
  - No outdoor tasks
  - No tasks involving other people

**Inline hint:** "The AI Master treats this as law. It overrides all other preferences and is checked before every task, every chat response, and every punishment assignment."

**Note:** Card 4 and Card 5 bottom sheets have a "Save" button that calls `PATCH /api/profile/update` and are allowed even during active sessions (see section 5.1 exception).

### 7.5 Session Goals & Intent Card (Card 5)

Free-text area. Within the bottom sheet editor, a "Get Suggestions" button calls `POST /api/profile/suggestions` with `{ type: 'session_intent', profile: currentProfile }`.

**Inline hint:** "Use this to tell the AI what you want to achieve in your sessions. The more specific you are, the better your tasks will be tailored."

**Suggestions flow:**
1. User taps "Get Suggestions".
2. API returns 3–5 suggestion strings.
3. Each suggestion displays as a tappable pill below the text area.
4. Tapping a pill appends it to the text area with a space separator.
5. If API fails, show: "Suggestions unavailable. Try again in a moment."

### 7.6 AI Master Review Button

In the page header, below the profile ring.

- Label: "Get AI Feedback on Your Profile"
- Calls `POST /api/profile/suggestions` with `{ type: 'full_review', profile: currentProfile }`.
- Opens a bottom sheet showing the AI Master's feedback in-character.
- Rate-limited: once per 10 minutes.
- On rate limit: button shows "Check back in X minutes" (disabled).

### 7.7 Bottom Sheet Editor Pattern

All 13 cards open a bottom sheet (slide-up, max-h 85vh, scrollable):

```
[Handle bar]
[Card title + description]
[Editor content]
[Save]  [Cancel]
```

- Save calls `PATCH /api/profile/update`, then `refreshProfile()`.
- Cancel with unsaved edits shows a simple "Discard changes?" confirmation dialog.
- During active sessions: Save is blocked with toast "Settings locked during active session" — **except** for Cards 4 and 5 (Master Preference + Session Intent) which remain editable always.

---

## 8. Chat-Based Preference Updates (Care Mode)

### 8.1 How It Works

When the user types their safeword in chat (entering Care Mode), the system prompt gains the `PREF_UPDATE` instruction block (section 5.3). If the user says something like:

- "I want to add complete denial as my main rule"
- "Make sure I never have to do public tasks"
- "My goal is to reach 30 days of continuous lock"

The AI responds naturally in-character AND appends a `[PREF_UPDATE:{...}]` marker.

The client receives `prefUpdates: PrefUpdate[]` and shows a confirmation sheet:

```
Your Master wants to update your preferences:
• master_preference → "Complete denial — no release under any circumstances"
[Confirm]  [Dismiss]
```

On Confirm, the client calls `PATCH /api/profile/update` with only the preference fields.

### 8.2 Scope

Only available in Care Mode (when the safeword "MERCY" has been typed and Care Mode is active). The reasoning: preference changes are sensitive, and Care Mode's safe, reflective tone is the appropriate context for them. Outside Care Mode, the Master stays strictly in-character and does not offer to save preferences.

---

## 9. Guide & Help System Updates

### 9.1 `src/lib/ai/guide-knowledge.ts` — `APP_KNOWLEDGE` update

Add a new section to the static knowledge string:

```
## Profile & Preferences

The Settings page shows all your profile data in 13 cards. You can update any section by tapping it.
A Profile Strength Ring shows how complete your profile is — the fuller it is, the more personalized
your Master's behavior will be.

**Master Preference** (the most important card) — write your permanent training philosophy here.
This is injected into every AI prompt as a hard constraint. Example: "Complete chastity. No unlocking
except for hygiene. No orgasm-related tasks ever." The Master will never violate this, even in chat.

**Session Goals & Intent** — describe what you want from your training. Tap "Get Suggestions" to
have the AI Master suggest how to improve your goals.

**AI Master Review** — tap the button at the top of Settings to get in-character feedback on your
entire profile. Available once every 10 minutes.

**Updating preferences through chat** — while in Care Mode (after typing your safeword), you can
tell the Master your preferences in natural language. The Master will offer to save them to your
profile. You confirm or dismiss before anything is saved.
```

### 9.2 `buildGuidePrompt()` update

The guide prompt already includes `APP_KNOWLEDGE`. No structural changes needed — the new section above is picked up automatically.

### 9.3 Settings Page Help Section

Within the `/settings` page, add a small "How does this affect the AI?" info section above the card list:

> "Your profile is read before every AI interaction. The more complete it is, the more personalized your sessions become. Master Preference and Session Intent have the strongest effect — they are injected as hard constraints into every task, chat, and punishment decision."

---

## 10. Implementation Phases

### Phase 1 — Data layer (prerequisite for all other phases)
1. Write migration `20260322_profile_preferences.sql` with all 5 new columns + `safeword` + `psych_profile` (if missing).
2. Extend `UserProfile` interface in `schema.ts` with `PrivacyConstraints`, `CommunicationStyle`, `Availability` interfaces.
3. Extend `PATCH /api/profile/update` to accept all new fields. Add active-session exception for `master_preference`, `session_intent`, `privacy_constraints`.
4. Create `POST /api/profile/suggestions` endpoint (auth, rate limit, token tracking, graceful error handling).

### Phase 2 — AI integration (requires Phase 1 types)
1. Update `buildProfileSummary()` with new fields.
2. Add task generation conflict validation in `/api/tasks/generate`.
3. Add `PREF_UPDATE` marker instruction and parser to `/api/chat` for Care Mode.
4. Update `APP_KNOWLEDGE` in `guide-knowledge.ts`.

### Phase 3 — Settings page UI
1. Profile Strength Ring component (SVG).
2. AI Master Review button + bottom sheet display.
3. 13 card list with tappable cards.
4. Bottom sheet editors per card (reuse patterns for existing cards, new for 4, 5, 11, 13).
5. Active session lock with toast (except Cards 4 & 5).
6. Settings page info text block.

### Phase 4 — Chat preference update UX
1. Client-side `prefUpdates` parsing in chat page.
2. Confirmation bottom sheet component.
3. Success toast on save.

---

## 11. Testing

- Unit: `conflictsWithPreferences()` with various constraint/task combinations including edge cases (partial matches, nulls).
- Unit: Profile strength score calculation with all fields populated, none populated, partial.
- Unit: `buildProfileSummary()` with all new fields set, with all nulls/defaults.
- Unit: `PREF_UPDATE` marker parsing — valid JSON, malformed JSON, missing fields.
- Integration: `PATCH /api/profile/update` — new fields save correctly, active session blocks except exception fields.
- Integration: `POST /api/profile/suggestions` — mocked AI, verifies rate limit, token tracking called.
- Integration: `/api/chat` in Care Mode — `PREF_UPDATE` marker stripped from reply, returned in response.

---

## 12. Constraints & Non-Goals

- No per-session override of Master Preference — it is always profile-level and permanent.
- Availability schedule (Card 13) is stored but not used to auto-schedule tasks in this iteration.
- Communication Style (Card 11) is stored in DB but NOT injected into `buildProfileSummary()` this iteration. It does not alter punishment severity calculations. Both are future work.
- No profile photo/avatar upload — out of scope.
- Care Mode preference updates only support the five listed fields; other profile fields (tier, persona) cannot be changed via chat.
