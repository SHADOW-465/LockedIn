# AI Master Guide System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a floating `?` FAB to every dashboard page that opens a slide-up sheet where the slave can ask the AI Master questions about app features and receive in-character explanations with tappable navigation cards.

**Architecture:** Three isolated concerns — `POST /api/guide` route (stateless, derives auth server-side), `guide-knowledge.ts` (static knowledge base + prompt builder), and `GuideFab`/`GuideSheet` client components (ephemeral React state, no DB persistence). A new `generateWithHistory()` AI helper supports multi-turn conversation history.

**Tech Stack:** Next.js 15 App Router, Groq (`llama-3.3-70b-versatile`), Supabase SSR cookie client (`@supabase/ssr`), Vitest, Tailwind CSS, Lucide React.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/lib/ai/ai-service.ts` | Modify | Add `generateWithHistory()` + `openRouterChatWithHistory()` helpers |
| `src/lib/ai/guide-knowledge.ts` | Create | APP_KNOWLEDGE string + `buildGuidePrompt(currentPage)` |
| `src/app/api/guide/parse-nav-card.ts` | Create | Exported `parseNavCard()` pure function (enables unit testing) |
| `src/app/api/guide/route.ts` | Create | `POST /api/guide` handler with auth, rate limiting, AI call |
| `src/components/features/guide/guide-sheet.tsx` | Create | Slide-up chat sheet UI |
| `src/components/features/guide/guide-fab.tsx` | Create | Floating `?` button, mounts GuideSheet |
| `src/app/(dashboard)/layout.tsx` | Modify | Add `<GuideFab />` |
| `src/__tests__/guide.test.ts` | Create | Unit tests for parser + prompt builder + route handler |

---

## Task 1: `generateWithHistory()` in ai-service.ts

**Files:**
- Modify: `src/lib/ai/ai-service.ts`

- [ ] **Step 1: Read the current file**

  Open `src/lib/ai/ai-service.ts` and note where `openRouterChat` is defined (around line 229) and where `generateSimpleText` ends (around line 143). You'll add `openRouterChatWithHistory` next to `openRouterChat`, and `generateWithHistory` as a new exported function after `generateSimpleText`.

- [ ] **Step 2: Add `openRouterChatWithHistory` private helper**

  Add this immediately after the existing `openRouterChat` function (after line ~248):

  ```ts
  async function openRouterChatWithHistory(
      messages: { role: string; content: string }[],
      model: string,
  ): Promise<string> {
      const response = await fetch(OPENROUTER_BASE, {
          method: 'POST',
          headers: {
              Authorization: `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ model, messages }),
      });
      if (!response.ok) throw new Error(`OpenRouter ${response.status}`);
      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
  }
  ```

- [ ] **Step 3: Add `generateWithHistory` exported function**

  Add this after `generateSimpleText` (after line ~143, before the Usage Tracking section):

  ```ts
  /**
   * Multi-turn text generation for guide conversations.
   * Accepts full history array; uses max_tokens 1024 for longer explanations.
   */
  export async function generateWithHistory(
      systemPrompt: string,
      history: { role: 'user' | 'assistant'; content: string }[],
      userMessage: string,
  ): Promise<GenerateResult> {
      const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: userMessage },
      ];

      try {
          const completion = await getGroq().chat.completions.create({
              messages,
              model: 'llama-3.3-70b-versatile',
              temperature: 0.85,
              max_tokens: 1024,
          });
          const text = completion.choices[0]?.message?.content;
          if (text) {
              return {
                  text,
                  usage: {
                      promptTokens: completion.usage?.prompt_tokens ?? 0,
                      completionTokens: completion.usage?.completion_tokens ?? 0,
                      totalTokens: completion.usage?.total_tokens ?? 0,
                  },
              };
          }
      } catch (err) {
          console.warn('[AI] Groq failed (generateWithHistory), falling back:', (err as Error).message);
      }

      try {
          const text = await openRouterChatWithHistory(messages, OPENROUTER_MODELS.textFallback);
          return { text, usage: ZERO_USAGE };
      } catch (err) {
          console.error('[AI] OpenRouter fallback also failed:', (err as Error).message);
      }

      return { text: 'The AI Master is momentarily silent. Try again.', usage: ZERO_USAGE };
  }
  ```

- [ ] **Step 4: Verify TypeScript compiles**

  ```bash
  npx tsc --noEmit
  ```
  Expected: no errors.

- [ ] **Step 5: Commit**

  ```bash
  git add src/lib/ai/ai-service.ts
  git commit -m "feat(guide): add generateWithHistory helper to ai-service"
  ```

---

## Task 2: `guide-knowledge.ts` — knowledge base and prompt builder

**Files:**
- Create: `src/lib/ai/guide-knowledge.ts`

- [ ] **Step 1: Write the failing tests first**

  Create `src/__tests__/guide.test.ts` with only the `buildGuidePrompt` unit tests (route and parser tests come in Task 4):

  ```ts
  import { describe, it, expect } from 'vitest'
  import { buildGuidePrompt, APP_KNOWLEDGE } from '@/lib/ai/guide-knowledge'

  describe('Guide: buildGuidePrompt()', () => {
    it('contains the current page path', () => {
      const prompt = buildGuidePrompt('/tasks')
      expect(prompt).toContain('/tasks')
    })

    it('contains the APP_KNOWLEDGE string', () => {
      const prompt = buildGuidePrompt('/home')
      expect(prompt).toContain(APP_KNOWLEDGE)
    })

    it('contains the NAV card rule instruction', () => {
      const prompt = buildGuidePrompt('/home')
      expect(prompt).toContain('[NAV:')
    })
  })
  ```

- [ ] **Step 2: Run tests to verify they fail**

  ```bash
  npx vitest run src/__tests__/guide.test.ts
  ```
  Expected: FAIL — `Cannot find module '@/lib/ai/guide-knowledge'`

- [ ] **Step 3: Create `src/lib/ai/guide-knowledge.ts`**

  ```ts
  export const APP_KNOWLEDGE = `LOCKEDIN APP — FEATURE REFERENCE

  NAVIGATION:
  - Bottom nav: Home, Tasks, Chat, Settings, More
  - More menu: Journal, Calendar, History (tap the More button in the nav bar to reveal)

  SESSIONS:
  - Start: Home page → tap Start Session. Configure tier, personality, limits, regimens, duration.
  - Duration: shown as a countdown on Home. Set at session start in minutes.
  - Extend: Home → Extend button (if the session config allows it). Adds minutes to the timer.
  - Emergency release: Settings → Emergency Release. Ends the session immediately with emergency status.
  - Completion: When the timer expires, status becomes "completing". The app archives everything locally, then marks the session completed.

  TASKS:
  - Daily tasks: generated automatically each day. Complete them to earn XP.
  - Master tasks: I assign these through the Chat page. They appear on the Tasks page with a deadline.
  - Punishment tasks: assigned when you fail or disobey. Appear on Tasks page.
  - Task status: pending → proof submitted → passed or failed.
  - Submit proof: Tasks page → tap "Submit Proof" on the task card.

  PROOF:
  - Required for master tasks and some daily tasks.
  - Go to the Tasks page, find the task, tap "Submit Proof".
  - Take a photo or upload one from your library.
  - I review it with AI verification — pass means task complete and XP awarded, fail means punishment assigned.

  PUNISHMENTS:
  - Punishment Wheel: Home page → Punishment button (only visible during an active session). Spins to pick a punishment at random.
  - Pool editor: Settings → Punishment Pool. Add custom punishments with title, severity (1–5), and optional proof requirement.
  - Severity 1–5: escalating difficulty. System punishments are always present; custom ones add variety.

  MOOD CHECK-IN:
  - Home page → Check In button (only visible during an active session).
  - Adjust sliders: energy, stress, arousal, submission. Optionally add mood tags.
  - If extreme values are detected, Care Mode may activate in Chat.

  CALENDAR:
  - More → Calendar. Shows sessions, mood check-ins, and punishments overlaid on a monthly view.
  - Tap any day to see details for that date.

  HISTORY:
  - More → History (route: /history).
  - View any completed session. Tabs: Timeline, Chat, Proofs, Export.
  - Export tab downloads a ZIP file of all session data.

  CHAT:
  - D/s training chat with your AI Master persona.
  - Safeword: type MERCY at any time to activate Care Mode (supportive, non-dominant).
  - I assign master tasks from here using the [TASK:...] system — they appear on your Tasks page.
  - Type "resume training" to exit Care Mode.

  REGIMENS:
  - Daily training programmes visible in regimens section.
  - Complete all tasks for a regimen day to advance to the next day.
  - Advancement requires my approval — AI-gated.

  ACHIEVEMENTS:
  - XP: earned by completing tasks. Higher difficulty = more XP.
  - Willpower score (0–100): increases on completion, decreases on failure.
  - Compliance streak: consecutive days without failures.
  - Achievement badges: awarded automatically at milestones.

  SETTINGS:
  - Profile: update your personal details.
  - Punishment Pool: manage your custom punishment list.
  - Emergency Release: immediately exit your active session.
  - Sign Out: sign out of the app.`.trim()

  export function buildGuidePrompt(currentPage: string): string {
    return `You are the Master in a chastity training app called LockedIn. A slave is asking you a question about how the app works. You are in GUIDE MODE: authoritative and clear, but patient — explaining app mechanics like a dominant laying out rules, not punishing. Use first-person ("I review your proof", "I assign punishments"). No warmth or encouragement, but no cruelty either. Keep answers practical and focused.

  APP KNOWLEDGE:
  ${APP_KNOWLEDGE}

  CURRENT PAGE: The slave is currently on: ${currentPage}

  NAV CARD RULE: If your answer involves a specific page the slave must visit, append EXACTLY ONE marker at the very end of your reply in this format:
  [NAV:/path|Page Label|Brief one-line description]
  Example: [NAV:/tasks|Tasks Page|Where you submit proof]
  Rules: Never emit more than one. Only emit when navigating somewhere specific will help. Do not emit if the slave is already on the relevant page.`
  }
  ```

- [ ] **Step 4: Run tests to verify they pass**

  ```bash
  npx vitest run src/__tests__/guide.test.ts
  ```
  Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

  ```bash
  git add src/lib/ai/guide-knowledge.ts src/__tests__/guide.test.ts
  git commit -m "feat(guide): add guide-knowledge.ts with APP_KNOWLEDGE and buildGuidePrompt"
  ```

---

## Task 3: Nav card parser utility + tests

**Files:**
- Create: `src/app/api/guide/parse-nav-card.ts`
- Modify: `src/__tests__/guide.test.ts`

- [ ] **Step 1: Add nav card parser tests to `src/__tests__/guide.test.ts`**

  Append to the existing test file:

  ```ts
  import { parseNavCard } from '@/app/api/guide/parse-nav-card'

  describe('Guide: parseNavCard()', () => {
    it('parses a valid NAV marker', () => {
      const text = 'Here is the info. [NAV:/tasks|Tasks Page|Where you submit proof]'
      const result = parseNavCard(text)
      expect(result.navCard).toEqual({
        href: '/tasks',
        label: 'Tasks Page',
        description: 'Where you submit proof',
      })
      expect(result.reply).not.toContain('[NAV:')
    })

    it('returns undefined navCard for marker with missing parts', () => {
      const text = 'Info. [NAV:/tasks|Tasks Page]'
      const result = parseNavCard(text)
      expect(result.navCard).toBeUndefined()
    })

    it('returns undefined navCard when no marker present', () => {
      const text = 'Just a regular reply with no marker.'
      const result = parseNavCard(text)
      expect(result.navCard).toBeUndefined()
      expect(result.reply).toBe(text)
    })

    it('only parses the first marker when two are present', () => {
      const text = 'Info [NAV:/tasks|Tasks Page|Do tasks] more [NAV:/home|Home|Go home]'
      const result = parseNavCard(text)
      expect(result.navCard?.href).toBe('/tasks')
      expect(result.reply).not.toContain('[NAV:/tasks|')
    })
  })
  ```

- [ ] **Step 2: Run tests to verify they fail**

  ```bash
  npx vitest run src/__tests__/guide.test.ts
  ```
  Expected: 4 new tests FAIL — `Cannot find module '@/app/api/guide/parse-nav-card'`

- [ ] **Step 3: Create `src/app/api/guide/parse-nav-card.ts`**

  First create the directory:
  ```bash
  mkdir -p src/app/api/guide
  ```

  Then create the file:

  ```ts
  export interface NavCard {
    href: string
    label: string
    description: string
  }

  const NAV_MARKER_RE = /\[NAV:([^\]|]+)\|([^\]|]+)\|([^\]|]+)\]/

  /**
   * Parses the first [NAV:/path|Label|Description] marker from an AI reply.
   * Strips the marker from the reply text.
   * Returns navCard: undefined if no valid marker found.
   */
  export function parseNavCard(text: string): { reply: string; navCard?: NavCard } {
    const match = NAV_MARKER_RE.exec(text)
    if (!match) return { reply: text }

    const [fullMatch, href, label, description] = match
    if (!href?.trim() || !label?.trim() || !description?.trim()) {
      return { reply: text.replace(fullMatch, '').trim() }
    }

    return {
      reply: text.replace(fullMatch, '').trim(),
      navCard: {
        href: href.trim(),
        label: label.trim(),
        description: description.trim(),
      },
    }
  }
  ```

- [ ] **Step 4: Run tests to verify they pass**

  ```bash
  npx vitest run src/__tests__/guide.test.ts
  ```
  Expected: All 7 tests PASS (3 from Task 2 + 4 new).

- [ ] **Step 5: Commit**

  ```bash
  git add src/app/api/guide/parse-nav-card.ts src/__tests__/guide.test.ts
  git commit -m "feat(guide): add parseNavCard utility with unit tests"
  ```

---

## Task 4: `POST /api/guide` route + route handler tests

**Files:**
- Create: `src/app/api/guide/route.ts`
- Modify: `src/__tests__/guide.test.ts`

- [ ] **Step 1: Add route handler tests to `src/__tests__/guide.test.ts`**

  Add at the top of the file (after existing imports), the vi.mock calls need to be at module level before any imports are resolved. **Replace the entire file** with this version that includes all prior tests plus the new route tests:

  ```ts
  import { describe, it, expect, vi, beforeEach } from 'vitest'

  // --- Mocks for route handler tests (must be at top level) ---
  vi.mock('next/headers', () => ({
    cookies: vi.fn().mockResolvedValue({ getAll: () => [] }),
  }))

  vi.mock('@supabase/ssr', () => ({
    createServerClient: vi.fn().mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
      },
    }),
  }))

  vi.mock('@/lib/ai/ai-service', () => ({
    generateWithHistory: vi.fn().mockResolvedValue({
      text: 'Plain reply.',
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
    }),
    trackUsage: vi.fn().mockResolvedValue(undefined),
  }))

  vi.mock('@/lib/supabase/server', () => ({
    getServerSupabase: vi.fn().mockReturnValue({}),
  }))

  import { buildGuidePrompt, APP_KNOWLEDGE } from '@/lib/ai/guide-knowledge'
  import { parseNavCard } from '@/app/api/guide/parse-nav-card'
  import { generateWithHistory } from '@/lib/ai/ai-service'

  // ── buildGuidePrompt tests ────────────────────────────────────────────────

  describe('Guide: buildGuidePrompt()', () => {
    it('contains the current page path', () => {
      const prompt = buildGuidePrompt('/tasks')
      expect(prompt).toContain('/tasks')
    })

    it('contains the APP_KNOWLEDGE string', () => {
      const prompt = buildGuidePrompt('/home')
      expect(prompt).toContain(APP_KNOWLEDGE)
    })

    it('contains the NAV card rule instruction', () => {
      const prompt = buildGuidePrompt('/home')
      expect(prompt).toContain('[NAV:')
    })
  })

  // ── parseNavCard tests ───────────────────────────────────────────────────

  describe('Guide: parseNavCard()', () => {
    it('parses a valid NAV marker', () => {
      const text = 'Here is the info. [NAV:/tasks|Tasks Page|Where you submit proof]'
      const result = parseNavCard(text)
      expect(result.navCard).toEqual({
        href: '/tasks',
        label: 'Tasks Page',
        description: 'Where you submit proof',
      })
      expect(result.reply).not.toContain('[NAV:')
    })

    it('returns undefined navCard for marker with missing parts', () => {
      const text = 'Info. [NAV:/tasks|Tasks Page]'
      const result = parseNavCard(text)
      expect(result.navCard).toBeUndefined()
    })

    it('returns undefined navCard when no marker present', () => {
      const text = 'Just a regular reply with no marker.'
      const result = parseNavCard(text)
      expect(result.navCard).toBeUndefined()
      expect(result.reply).toBe(text)
    })

    it('only parses the first marker when two are present', () => {
      const text = 'Info [NAV:/tasks|Tasks Page|Do tasks] more [NAV:/home|Home|Go home]'
      const result = parseNavCard(text)
      expect(result.navCard?.href).toBe('/tasks')
      expect(result.reply).not.toContain('[NAV:/tasks|')
    })
  })

  // ── Route handler tests ──────────────────────────────────────────────────

  describe('Guide: POST /api/guide', () => {
    let POST: (req: Request) => Promise<Response>

    beforeEach(async () => {
      vi.clearAllMocks()

      // Restore createServerClient mock — vi.clearAllMocks() wipes it
      const { createServerClient } = await import('@supabase/ssr')
      vi.mocked(createServerClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
        },
      } as ReturnType<typeof createServerClient>)

      // Restore generateWithHistory default
      vi.mocked(generateWithHistory).mockResolvedValue({
        text: 'Plain reply.',
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      })

      // Dynamically import to get the module each time (rate limit state persists across tests)
      const mod = await import('@/app/api/guide/route')
      POST = mod.POST
    })

    const makeReq = (body: unknown) =>
      new Request('http://localhost/api/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

    it('returns 400 when message is missing', async () => {
      const res = await POST(makeReq({ currentPage: '/tasks', history: [] }))
      expect(res.status).toBe(400)
    })

    it('returns reply and navCard when AI reply contains marker', async () => {
      vi.mocked(generateWithHistory).mockResolvedValueOnce({
        text: 'Submit from here. [NAV:/tasks|Tasks Page|Where you submit proof]',
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      })
      const res = await POST(makeReq({ message: 'How do I submit proof?', currentPage: '/home', history: [] }))
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.navCard).toBeDefined()
      expect(data.navCard.href).toBe('/tasks')
      expect(data.reply).not.toContain('[NAV:')
    })

    it('returns reply only (no navCard key) when no marker in reply', async () => {
      const res = await POST(makeReq({ message: 'Hello?', currentPage: '/home', history: [] }))
      const data = await res.json()
      expect(data.navCard).toBeUndefined()
      expect(data.reply).toBe('Plain reply.')
    })

    it('returns 500 when AI throws', async () => {
      vi.mocked(generateWithHistory).mockRejectedValueOnce(new Error('AI unavailable'))
      const res = await POST(makeReq({ message: 'Hello?', currentPage: '/home', history: [] }))
      expect(res.status).toBe(500)
    })

    it('truncates history to last 6 items server-side', async () => {
      const captured: unknown[] = []
      vi.mocked(generateWithHistory).mockImplementationOnce(async (_sys, hist, _msg) => {
        captured.push(hist)
        return { text: 'ok', usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 } }
      })
      const history = Array.from({ length: 8 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `msg ${i}`,
      }))
      await POST(makeReq({ message: 'Hello?', currentPage: '/home', history }))
      expect((captured[0] as unknown[]).length).toBe(6)
    })

    it('returns 429 after 20 calls in the same window for same user', async () => {
      // Use a unique userId to avoid cross-test state pollution
      const { createServerClient } = await import('@supabase/ssr')
      vi.mocked(createServerClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'rate-test-' + Date.now() } } }),
        },
      } as ReturnType<typeof createServerClient>)
      for (let i = 0; i < 20; i++) {
        await POST(makeReq({ message: 'Hello?', currentPage: '/home', history: [] }))
      }
      const res = await POST(makeReq({ message: 'Hello?', currentPage: '/home', history: [] }))
      expect(res.status).toBe(429)
    })
  })
  ```

- [ ] **Step 2: Run tests to verify route tests fail (route not created yet)**

  ```bash
  npx vitest run src/__tests__/guide.test.ts
  ```
  Expected: Route handler tests FAIL — `Cannot find module '@/app/api/guide/route'`. Other 7 tests still PASS.

- [ ] **Step 3: Create `src/app/api/guide/route.ts`**

  ```ts
  import { NextRequest, NextResponse } from 'next/server'
  import { cookies } from 'next/headers'
  import { createServerClient } from '@supabase/ssr'
  import { getServerSupabase } from '@/lib/supabase/server'
  import { generateWithHistory, trackUsage } from '@/lib/ai/ai-service'
  import { buildGuidePrompt } from '@/lib/ai/guide-knowledge'
  import { parseNavCard } from './parse-nav-card'

  // ── Rate limiter (in-memory, per-process guard only) ──────────────────────
  // Resets on cold start. Not a persistent quota — a basic loop guard.
  const rateLimitMap = new Map<string, { count: number; windowStart: number }>()
  const RATE_LIMIT_MAX = 20
  const RATE_LIMIT_WINDOW_MS = 60_000

  function checkRateLimit(userId: string): boolean {
    const now = Date.now()
    const entry = rateLimitMap.get(userId)
    if (!entry || now > entry.windowStart + RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.set(userId, { count: 1, windowStart: now })
      return true
    }
    if (entry.count >= RATE_LIMIT_MAX) return false
    entry.count++
    return true
  }

  export async function POST(request: NextRequest) {
    // ── Auth: SSR cookie client (NOT admin client — service_role can't read auth cookie) ──
    const cookieStore = await cookies()
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } },
    )
    const {
      data: { user },
    } = await supabaseSSR.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = user.id

    // ── Rate limit ────────────────────────────────────────────────────────────
    if (!checkRateLimit(userId)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // ── Validate body ─────────────────────────────────────────────────────────
    const body = await request.json()
    const {
      message,
      currentPage = '/',
      history = [],
    } = body as {
      message?: string
      currentPage?: string
      history?: unknown[]
    }

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // ── Sanitize history: drop invalid items, truncate to last 6 ─────────────
    const safeHistory = (history as Array<{ role?: unknown; content?: unknown }>)
      .filter(
        (h) =>
          (h.role === 'user' || h.role === 'assistant') &&
          typeof h.content === 'string',
      )
      .slice(-6) as { role: 'user' | 'assistant'; content: string }[]

    // ── Generate ──────────────────────────────────────────────────────────────
    const systemPrompt = buildGuidePrompt(currentPage)
    let result: { text: string; usage: { promptTokens: number; completionTokens: number; totalTokens: number } }
    try {
      result = await generateWithHistory(systemPrompt, safeHistory, message)
    } catch {
      return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
    }

    // ── Parse nav card ────────────────────────────────────────────────────────
    const { reply, navCard } = parseNavCard(result.text)

    // ── Track usage (fire-and-forget, admin client) ───────────────────────────
    const supabaseAdmin = getServerSupabase()
    await trackUsage(supabaseAdmin, userId, 'llama-3.3-70b-versatile', result.usage, 'guide')

    return NextResponse.json(navCard ? { reply, navCard } : { reply })
  }
  ```

- [ ] **Step 4: Run all tests**

  ```bash
  npx vitest run src/__tests__/guide.test.ts
  ```
  Expected: All 13 tests PASS (7 unit + 6 route).

- [ ] **Step 5: Run full test suite to confirm no regressions**

  ```bash
  npx vitest run
  ```
  Expected: All existing tests still PASS.

- [ ] **Step 6: Commit**

  ```bash
  git add src/app/api/guide/route.ts src/__tests__/guide.test.ts
  git commit -m "feat(guide): add POST /api/guide route with auth, rate limiting, nav card parsing"
  ```

---

## Task 5: `GuideSheet` component

**Files:**
- Create: `src/components/features/guide/guide-sheet.tsx`

- [ ] **Step 1: Create the directory**

  ```bash
  mkdir -p src/components/features/guide
  ```

- [ ] **Step 2: Create `src/components/features/guide/guide-sheet.tsx`**

  ```tsx
  'use client'

  import { useState, useRef, useEffect } from 'react'
  import { usePathname, useRouter } from 'next/navigation'
  import { X } from 'lucide-react'

  interface NavCard {
    href: string
    label: string
    description: string
  }

  interface GuideMessage {
    role: 'user' | 'assistant'
    content: string
    navCard?: NavCard
    error?: boolean
  }

  interface Props {
    onClose: () => void
  }

  const QUICK_TOPICS = [
    'How does proof work?',
    'What are punishments?',
    'How do sessions work?',
    'What is the mood check-in?',
    'How do I use the calendar?',
    'Where is my session history?',
  ]

  export function GuideSheet({ onClose }: Props) {
    const pathname = usePathname()
    const router = useRouter()
    const [messages, setMessages] = useState<GuideMessage[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = async (text: string) => {
      if (!text.trim() || loading) return

      const history = messages
        .filter((m) => !m.error)
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }))

      setMessages((prev) => [...prev, { role: 'user', content: text }])
      setInput('')
      setLoading(true)

      try {
        const res = await fetch('/api/guide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, currentPage: pathname, history }),
        })

        if (res.status === 429) {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: 'Slow down — try again in a moment.', error: true },
          ])
          return
        }

        if (!res.ok) {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: 'Something went wrong. Try again.', error: true },
          ])
          return
        }

        const data = await res.json()
        if (data.error) {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: data.error, error: true },
          ])
          return
        }

        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.reply, navCard: data.navCard },
        ])
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Something went wrong. Try again.', error: true },
        ])
      } finally {
        setLoading(false)
      }
    }

    const handleNavCard = (href: string) => {
      onClose()
      router.push(href)
    }

    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Sheet */}
        <div className="relative z-10 flex flex-col bg-[#13131c] border-t border-white/10 rounded-t-2xl max-h-[78vh]">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-8 h-1 rounded-full bg-white/20" />
          </div>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-2 border-b border-white/5 shrink-0">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-700 to-pink-600 flex items-center justify-center text-xs shrink-0">
              👤
            </div>
            <div>
              <p className="text-xs font-semibold text-white">The Master</p>
              <p className="text-[10px] text-white/40">App Guide · In character</p>
            </div>
            <button
              onClick={onClose}
              className="ml-auto text-white/30 hover:text-white/60 transition-colors"
              aria-label="Close guide"
            >
              <X size={16} />
            </button>
          </div>

          {/* Quick topic pills — only shown before any conversation */}
          {messages.length === 0 && (
            <div className="flex gap-2 flex-wrap px-4 py-3 shrink-0">
              {QUICK_TOPICS.map((topic) => (
                <button
                  key={topic}
                  onClick={() => sendMessage(topic)}
                  className="bg-white/5 border border-white/10 rounded-full px-3 py-1 text-[11px] text-white/50 hover:text-white/80 hover:bg-white/10 transition-all whitespace-nowrap"
                >
                  {topic}
                </button>
              ))}
            </div>
          )}

          {/* Message list */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-[85%]">
                  <div
                    className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-purple-900/30 text-white rounded-br-sm'
                        : msg.error
                        ? 'bg-red-900/20 text-red-300 rounded-bl-sm'
                        : 'bg-purple-950/60 text-purple-100 rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.navCard && (
                    <div className="mt-2 bg-black/40 border border-purple-800/50 rounded-xl p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-purple-300 truncate">
                          {msg.navCard.label}
                        </p>
                        <p className="text-[10px] text-white/40 truncate">
                          {msg.navCard.description}
                        </p>
                      </div>
                      <button
                        onClick={() => handleNavCard(msg.navCard!.href)}
                        className="shrink-0 bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Go →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-purple-950/60 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400/60 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400/60 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400/60 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input row */}
          <div className="flex gap-2 items-center px-4 py-3 border-t border-white/5 shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage(input)
                }
              }}
              placeholder="Ask anything about the app…"
              className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 transition-colors"
              disabled={loading}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-full bg-purple-700 disabled:bg-white/10 disabled:cursor-not-allowed flex items-center justify-center text-white text-sm transition-colors hover:bg-purple-600"
              aria-label="Send message"
            >
              ↑
            </button>
          </div>
        </div>
      </div>
    )
  }
  ```

- [ ] **Step 3: Verify TypeScript compiles**

  ```bash
  npx tsc --noEmit
  ```
  Expected: no errors.

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/features/guide/guide-sheet.tsx
  git commit -m "feat(guide): add GuideSheet slide-up chat component"
  ```

---

## Task 6: `GuideFab` component + layout wiring

**Files:**
- Create: `src/components/features/guide/guide-fab.tsx`
- Modify: `src/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Create `src/components/features/guide/guide-fab.tsx`**

  ```tsx
  'use client'

  import { useState } from 'react'
  import { useAuth } from '@/lib/contexts/auth-context'
  import { GuideSheet } from './guide-sheet'

  export function GuideFab() {
    const { user, loading } = useAuth()
    const [open, setOpen] = useState(false)

    // Render nothing until auth is confirmed
    if (loading || !user) return null

    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-4 z-40 w-10 h-10 rounded-full bg-gradient-to-br from-purple-700 to-purple-500 shadow-lg shadow-purple-900/50 flex items-center justify-center text-white font-bold text-lg border border-white/15 hover:scale-105 transition-transform"
          aria-label="Open app guide"
        >
          ?
        </button>
        {open && <GuideSheet onClose={() => setOpen(false)} />}
      </>
    )
  }
  ```

- [ ] **Step 2: Modify `src/app/(dashboard)/layout.tsx`**

  Replace the current file contents with:

  ```tsx
  import { GuideFab } from '@/components/features/guide/guide-fab'

  export default function DashboardLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <>
        {children}
        <GuideFab />
      </>
    )
  }
  ```

- [ ] **Step 3: Verify TypeScript compiles cleanly**

  ```bash
  npx tsc --noEmit
  ```
  Expected: no errors.

- [ ] **Step 4: Run full test suite**

  ```bash
  npx vitest run
  ```
  Expected: All tests PASS. No regressions.

- [ ] **Step 5: Commit**

  ```bash
  git add src/components/features/guide/guide-fab.tsx src/app/(dashboard)/layout.tsx
  git commit -m "feat(guide): add GuideFab floating button and wire into dashboard layout"
  ```

---

## Done

All 6 tasks complete. Run `superpowers:finishing-a-development-branch` to verify tests, then merge/push.
