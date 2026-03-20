# AI Master Guide System — Design Spec

## Goal

Allow the slave to ask the AI Master any question about how the app works and receive an in-character explanation with optional tappable navigation cards that take them directly to the relevant page.

## Architecture

Three concerns, fully isolated from the existing D/s chat system:

1. **`/api/guide` route** — stateless POST handler. Accepts message + userId + currentPage + short conversation history from the client. Returns reply text + optional parsed nav card. Never writes to the database.
2. **`guide-knowledge.ts`** — a static module exporting the app knowledge string and a `buildGuidePrompt()` function. Single source of truth for what the AI knows about the app.
3. **`GuideSheet` + `GuideFab` components** — client-side UI only. Guide history lives in React state; cleared on close. No persistence.

## Data Flow

1. Slave taps the floating `?` FAB on any dashboard page.
2. `GuideSheet` opens. `usePathname()` captures the current route.
3. Slave types a message or taps a quick-topic pill.
4. Client sends `POST /api/guide` with:
   - `message` — the slave's question
   - `userId` — authenticated user ID
   - `currentPage` — current route (e.g. `/tasks`)
   - `history` — last 6 messages `[{role, content}]` from local state
5. Server constructs prompt: guide system prompt (knowledge base + persona) + conversation history + current message.
6. AI responds. Server scans reply for `[NAV:/path|Label|Description]` markers, strips them from reply text, returns them as a structured `navCard` object.
7. Client renders reply bubble. If `navCard` is present, renders it inline below the bubble.
8. Slave taps "Go →" on nav card → sheet closes, `router.push(navCard.href)` fires.

## API

### `POST /api/guide`

**Request:**
```ts
{
  message: string
  userId: string
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

**Nav card marker format (parsed server-side):**
```
[NAV:/tasks|Tasks Page|Where you submit proof]
```
The marker is stripped from the reply text before returning.

## System Prompt Design

### Persona instruction
The guide prompt instructs the AI to act as the Master in an instructive mode: authoritative and clear, but patient — explaining app mechanics like a dominant laying out the rules rather than a neutral assistant. Still uses first-person ("I review your proof", "I assign punishments"). No warmth, no encouragement, but no cruelty either.

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
The current page path is injected into the prompt so the AI can say "You're already on the right page" or reference what the slave is currently looking at.

### Nav card emission rules
The AI is instructed to emit `[NAV:/path|Label|Description]` only when the answer involves a specific page the slave should visit. Most answers — especially those explaining a concept already visible on the current page — will not include a nav card.

## Components

### `src/app/api/guide/route.ts`
- Validates `message`, `userId` required
- Calls `buildGuidePrompt(currentPage)` from `guide-knowledge.ts`
- Calls `generateSimpleText(systemPrompt, userMessage)` with history prepended
- Parses `[NAV:...]` marker from response with regex
- Tracks token usage via `trackUsage()`
- Returns `{ reply, navCard? }`

### `src/lib/ai/guide-knowledge.ts`
- Exports `APP_KNOWLEDGE: string` — static feature reference
- Exports `buildGuidePrompt(currentPage: string): string` — assembles final system prompt

### `src/components/features/guide/guide-sheet.tsx`
- Props: `userId: string`, `currentPage: string`, `onClose: () => void`
- State: `messages: GuideMessage[]`, `input: string`, `loading: boolean`
- Quick-topic pills: pre-set questions that send immediately on tap
- Renders message bubbles + inline nav cards
- Nav card "Go →" tap: calls `onClose()` then `router.push(href)`
- Passes last 6 messages as `history` on each API call

### `src/components/features/guide/guide-fab.tsx`
- State: `open: boolean`
- Renders floating `?` button (bottom-right, above nav bar)
- Mounts `GuideSheet` as a fixed overlay when `open === true`
- Gets `userId` from `useAuth()`, `currentPage` from `usePathname()`
- Added to `src/app/(dashboard)/layout.tsx` — appears on all dashboard pages automatically

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

- API failure → inline error bubble: "Something went wrong. Try again."
- Missing `userId` or `message` → 400, sheet shows error
- Nav card parse failure → reply renders cleanly without card (non-fatal)
- AI times out → same inline error, no crash

## Testing

- Unit test: nav card regex parser — valid marker, missing parts, no marker, multiple markers (only first used)
- Unit test: `buildGuidePrompt()` — includes current page, includes knowledge base, returns string
- No DB mocks needed (no persistence)

## Files Created / Modified

**New:**
- `src/app/api/guide/route.ts`
- `src/lib/ai/guide-knowledge.ts`
- `src/components/features/guide/guide-sheet.tsx`
- `src/components/features/guide/guide-fab.tsx`
- `src/__tests__/guide.test.ts`

**Modified:**
- `src/app/(dashboard)/layout.tsx` — add `<GuideFab />`
