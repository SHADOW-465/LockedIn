# AI Master Guide System — Design Spec

## Goal

Allow the slave to ask the AI Master any question about how the app works and receive an in-character explanation with optional tappable navigation cards that take them directly to the relevant page.

## Architecture

Three concerns, fully isolated from the existing D/s chat system:

1. **`/api/guide` route** — stateless POST handler. Derives `userId` server-side from the auth cookie. Accepts message + currentPage + short conversation history from the client. Returns reply text + optional parsed nav card. Never writes to the database (except token usage tracking).
2. **`guide-knowledge.ts`** — a static module exporting the app knowledge string and a `buildGuidePrompt()` function. Single source of truth for what the AI knows about the app.
3. **`GuideSheet` + `GuideFab` components** — client-side UI only. Guide history lives in React state; cleared on close. No persistence.

## Data Flow

1. Slave taps the floating `?` FAB on any dashboard page.
2. `GuideSheet` opens. It calls `usePathname()` internally to capture the current route.
3. Slave types a message or taps a quick-topic pill.
4. Client sends `POST /api/guide` with:
   - `message` — the slave's question
   - `currentPage` — current route (e.g. `/tasks`)
   - `history` — last 6 messages `[{role, content}]` from local state
5. Server derives `userId` from the Supabase auth cookie (admin client). Returns 401 if unauthenticated.
6. Server constructs a Groq messages array: `[system, ...history, userMessage]` via a `generateWithHistory()` helper (see AI Service section).
7. AI responds. Server scans reply for a single `[NAV:/path|Label|Description]` marker, strips it from reply text, returns it as a structured `navCard` object.
8. Client renders reply bubble. If `navCard` is present, renders it inline below the bubble.
9. Slave taps "Go →" on nav card → sheet closes, `router.push(navCard.href)` fires.

## API

### `POST /api/guide`

**Authentication:** `userId` is derived server-side from the Supabase auth cookie using the SSR cookie client (`createServerClient` from `@supabase/ssr` + `await cookies()`), then `.auth.getUser()`. The admin client (`getServerSupabase()`) is used only for `trackUsage()` — it is not session-aware and cannot read the auth cookie. The client does not send `userId` in the body.

**Request:**
```ts
{
  message: string
  currentPage: string          // e.g. '/tasks'
  history: { role: 'user' | 'assistant'; content: string }[]  // max 6 items
}
```

**Response:**
```ts
{
  reply: string
  navCard?: {
    href: string        // e.g. '/tasks'
    label: string       // e.g. 'Tasks Page'
    description: string // e.g. 'Where you submit proof'
  }
}
```

**Error responses:**
- `401` — unauthenticated
- `400` — missing `message`
- `500` — AI failure (returns `{ error: 'Something went wrong' }`)

**Rate limiting:** Max 20 calls per user per minute, enforced via a lightweight in-memory map in the route module (`Map<userId, { count, windowStart }>`). Returns `429` when exceeded. This is a simple defence against runaway loops — not a persistent quota system.

**Nav card marker format (parsed server-side):**
```
[NAV:/tasks|Tasks Page|Where you submit proof]
```
Only the first marker is parsed. The marker is stripped from the reply text before returning.

## AI Service

### New helper: `generateWithHistory()`

`generateSimpleText()` accepts only a single user prompt string and does not support multi-turn history. A new helper is added to `src/lib/ai/ai-service.ts`:

```ts
export async function generateWithHistory(
  systemPrompt: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  userMessage: string,
): Promise<GenerateResult>
```

Internally it constructs the full messages array `[{ role: 'system', content: systemPrompt }, ...history, { role: 'user', content: userMessage }]` and calls the Groq client directly (same model: `llama-3.3-70b-versatile`, `max_tokens: 1024` — higher than `generateSimpleText`'s 512 to accommodate multi-step feature explanations). Falls back to OpenRouter on error, same pattern as existing helpers.

## System Prompt Design

### Persona instruction
The guide prompt instructs the AI to act as the Master in an instructive mode: authoritative and clear, but patient — explaining app mechanics like a dominant laying out the rules rather than a neutral assistant. Still uses first-person ("I review your proof", "I assign punishments"). No warmth, no encouragement, but no cruelty either.

### Nav card rule (enforced in prompt)
The prompt explicitly instructs: **emit zero or one `[NAV:...]` marker per reply, placed at the very end**. Never emit more than one. Only emit when the answer involves a specific page the slave must visit.

### App knowledge base (`guide-knowledge.ts`)
A static string covering every feature the slave might ask about:

| Section | Content |
|---|---|
| Navigation | Bottom nav (Home, Tasks, Chat, Settings, More), More menu (Journal, Calendar, History) |
| Sessions | How to start, duration, extending time, emergency release, session completion/archival |
| Tasks | Daily tasks, master tasks (assigned via chat), punishment tasks, task status, deadlines |
| Proof | How to submit (Tasks page → Submit Proof), photo upload, AI verification, pass/fail consequences |
| Punishments | Punishment wheel (Home → Punishment button), pool editor (Settings), severity levels, proof requirement |
| Mood check-in | Home → Check In button (active session only), sliders, tags, care mode trigger |
| Calendar | Overlays (sessions, mood, punishments), day detail panel, Past Sessions link |
| History | Session replay at /history, tabs (timeline, chat, proofs, export) |
| Chat | D/s training chat, safeword (MERCY), master task assignment, care mode |
| Regimens | Daily training regimens, completion, AI-gated advancement |
| Achievements | XP, willpower score, compliance streak, achievement badges |
| Settings | Profile, punishment pool editor, emergency release, sign out |

### Context injection
The current page path is injected: "The slave is currently on: /tasks". AI can say "You're already in the right place" or reference visible UI elements.

## Components

### `src/app/api/guide/route.ts`
- Derives `userId` from auth cookie via SSR cookie client (`createServerClient` + `await cookies()`).`.auth.getUser()` → 401 if missing. The admin client (`getServerSupabase()`) is used only for `trackUsage()`, not for auth.
- Validates `message` present → 400 if missing
- Truncates `history` to last 6 items server-side; validates each item has `role: 'user' | 'assistant'` and `content: string` — invalid items are dropped silently
- Enforces rate limit (20 calls/60s per user) via module-scope `Map<userId, { count, windowStart }>`. On each lookup: if `Date.now() > windowStart + 60000`, resets count. Returns 429 if count ≥ 20. **Note:** this map resets on serverless cold starts — it is a basic guard against runaway loops, not a persistent production quota. A Redis/KV-backed limiter would be required for stricter enforcement.
- Calls `buildGuidePrompt(currentPage)` from `guide-knowledge.ts`
- Calls `generateWithHistory(systemPrompt, history, message)`
- Parses first `[NAV:...]` marker from response via regex; strips from reply
- Tracks token usage via `trackUsage(supabase, userId, model, usage, 'guide')`
- Returns `{ reply, navCard? }` on success; `{ error }` on AI failure

### `src/lib/ai/guide-knowledge.ts`
- Exports `APP_KNOWLEDGE: string` — static feature reference
- Exports `buildGuidePrompt(currentPage: string): string` — assembles final system prompt with knowledge base + persona instruction + nav card rule + current page context

### `src/lib/ai/ai-service.ts` (modified)
- Adds `generateWithHistory(systemPrompt, history, userMessage)` — multi-turn Groq call, `max_tokens: 1024`, same fallback pattern

### `src/components/features/guide/guide-sheet.tsx`
- Props: `userId: string`, `onClose: () => void`
- Calls `usePathname()` internally — no `currentPage` prop (avoids staleness)
- State: `messages: GuideMessage[]`, `input: string`, `loading: boolean`
- Quick-topic pills: pre-set questions that send immediately on tap
- Renders message bubbles + inline nav cards
- Nav card "Go →" tap: calls `onClose()` then `router.push(href)`
- Passes last 6 messages as `history` on each API call

### `src/components/features/guide/guide-fab.tsx`
- `'use client'` component — calls `useAuth()` internally to get `userId`
- State: `open: boolean`
- Renders nothing (returns `null`) while `loading === true` or `user === null` — FAB only appears once auth is confirmed
- Renders floating `?` button (bottom-right, above nav bar, `z-index: 40`)
- Mounts `GuideSheet` as a fixed overlay when `open === true`
- Added to `src/app/(dashboard)/layout.tsx` with no props: `<GuideFab />`. The layout remains a server component; `GuideFab` handles all client-side concerns itself.

## Quick Topic Pills

Static array in `guide-sheet.tsx`:
```ts
const QUICK_TOPICS = [
  'How does proof work?',
  'What are punishments?',
  'How do sessions work?',
  'What is the mood check-in?',
  'How do I use the calendar?',
  'Where is my session history?',
]
```

## Error Handling

- AI failure → `{ error: 'Something went wrong' }` → client renders inline error bubble; no crash
- `401` → sheet shows "Sign in required" (should never happen in practice)
- `429` → sheet shows "Slow down — try again in a moment"
- Nav card parse failure → reply renders cleanly without card (non-fatal; regex returns null)
- Missing `message` → 400 → sheet shows inline error

## Testing (`src/__tests__/guide.test.ts`)

**Unit: nav card parser**
- Valid `[NAV:/tasks|Tasks Page|Where you submit proof]` → parsed correctly
- Marker with missing parts → returns null (non-fatal)
- No marker in reply → returns null
- Two markers present → only first parsed

**Unit: `buildGuidePrompt()`**
- Returns string containing current page
- Returns string containing knowledge base
- Returns string containing nav card rule

**Route: `POST /api/guide`**
- Missing `message` → 400
- Valid request with nav marker → `{ reply, navCard }` with marker stripped from reply
- Valid request without nav marker → `{ reply }` only, no `navCard` key
- AI failure → `{ error }` response (mock `generateWithHistory` to throw)
- Rate limit exceeded (20+ calls in window) → 429
- Rate limit window expiry → after `windowStart + 60001ms`, count resets and call succeeds (mock `Date.now()`). **Note:** this test is only meaningful in a single-process test environment; the in-memory map is not shared across serverless instances and resets on cold starts.
- `history` with 8 items → server truncates to last 6 before passing to AI

## Files Created / Modified

**New:**
- `src/app/api/guide/route.ts`
- `src/lib/ai/guide-knowledge.ts`
- `src/components/features/guide/guide-sheet.tsx`
- `src/components/features/guide/guide-fab.tsx`
- `src/__tests__/guide.test.ts`

**Modified:**
- `src/lib/ai/ai-service.ts` — add `generateWithHistory()`
- `src/app/(dashboard)/layout.tsx` — add `<GuideFab />`
