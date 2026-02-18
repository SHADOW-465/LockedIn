# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

Tests live in `src/__tests__/` and use Vitest with Node environment. The config alias `@/` maps to `src/`. Current test files: `chat-api`, `onboarding`, `punishment`, `rewards`, `task-generation`, `verification`.

## Required Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
OPENROUTER_API_KEY=
```

## Architecture

### App Structure

Next.js 16 App Router with three route groups:
- `(auth)` — `/login`, `/signup` — no layout wrapper
- `(dashboard)` — `/home`, `/tasks`, `/chat`, `/journal`, `/regimens`, `/achievements`, `/calendar`, `/settings` — wrapped in `src/app/(dashboard)/layout.tsx` with TopBar + BottomNav
- `onboarding` — 11-step onboarding flow at `/onboarding`

Root route: `src/app/page.tsx` is a **server component** that checks auth via SSR and redirects authenticated users before any HTML is sent. The landing page UI lives in `src/app/landing-page.tsx` (client component, rendered only for unauthenticated visitors).

API routes under `src/app/api/`:
- `POST /api/chat` — AI chat with persona, safeword detection, care mode
- `POST /api/tasks/generate` — AI task generation (5/day limit via `daily_task_log`)
- `POST /api/tasks/complete` — Mark task complete, update willpower score
- `POST /api/verify` — Vision AI proof photo verification
- `POST /api/regimens/complete-day` — AI-gated regimen advancement
- `GET  /api/usage` — Token usage meter
- `POST /api/punish` — Apply punishment

### Auth & Routing

Two-layer auth guard:
1. **`src/middleware.ts`** (Edge Runtime) — primary security boundary. Validates JWT via `supabase.auth.getUser()`, then checks `profiles.onboarding_completed`. Caches onboarding status in a 24h httpOnly cookie (`x-onboarding-done`) to skip DB on repeat requests. Root path (`/`) is handled specially: unauthenticated users pass through to the landing page; authenticated users are redirected to `/home` or `/onboarding` at the Edge.
2. **`src/components/route-guard.tsx`** (client) — UI-layer fallback using `useAuth()`. Handles the brief window before middleware cookie propagates.

> **Note:** Next.js 16 warns that `src/middleware.ts` is deprecated in favour of `src/proxy.ts`. Rename the file if the warning escalates to an error.

Public paths (never hit auth check): `/login`, `/signup`, `/auth/*`, `/api/*`

### Supabase Clients — Critical Distinction

**Never mix these up:**

| Client | File | Key | Use |
|--------|------|-----|-----|
| Browser (anon) | `src/lib/supabase/client.ts` → `getSupabase()` | anon key | Client components, hooks |
| Server admin | `src/lib/supabase/server.ts` → `getServerSupabase()` | service_role | API routes — bypasses RLS |
| SSR middleware | `createServerClient` from `@supabase/ssr` | anon key | `src/middleware.ts` only |
| SSR page | `createServerClient` + `await cookies()` | anon key | Server components (e.g., `src/app/page.tsx`) |

The admin client (`getServerSupabase()`) bypasses RLS — never expose it to the browser. The SSR page pattern requires `await cookies()` (async in Next.js 15+).

### Supabase Helper Modules

`src/lib/supabase/` contains typed query helpers — prefer these over raw queries:

- `auth.ts` — `signIn()`, `signUp()`, `signOut()`, `getSession()`
- `tasks.ts` — task CRUD, status updates
- `sessions.ts` — session lifecycle management
- `regimens.ts` — regimen queries
- `storage.ts` — Supabase Storage for verification photo uploads

### AI Service (`src/lib/ai/ai-service.ts`)

All AI functions return `GenerateResult { text: string; usage: TokenUsage }` — callers must destructure:

```typescript
const { text, usage } = await generateText(prompt, aiContext, systemOverride?)
const { text, usage } = await generateSimpleText(systemPrompt, userPrompt)
```

After each call, track tokens:
```typescript
await trackUsage(supabase, userId, 'llama-3.3-70b-versatile', usage, 'chat')
```

**AI routing:** Groq (`llama-3.3-70b-versatile`) is primary. Falls back to OpenRouter (`google/gemini-2.0-flash-exp:free`) on error. Vision uses OpenRouter (`llama-3.2-11b-vision-instruct:free`).

**Token optimisation:** `src/lib/ai/context-builder.ts` `buildProfileSummary()` builds a compact ~80-token profile string. Pass it as `profileSummary` to the chat API instead of the full `AIContext` (~60% token reduction).

### State Management

- **`useAuth()`** (`src/lib/contexts/auth-context.tsx`) — global user + profile state. `profile` is the full `UserProfile` from `profiles` table. Call `refreshProfile()` after any profile mutation.
- **Onboarding** — Zustand store at `src/lib/stores/onboarding-store.ts` buffers all 11 steps; single DB upsert on completion.
- **Realtime data** — `useRealtimeQuery<T>()` from `src/lib/hooks/use-realtime.ts` subscribes to Postgres changes and auto-refetches. Use the `refetch()` return value for manual refreshes.

### Business Logic Engines

`src/lib/engines/` contains pure server-side logic — always called with the admin Supabase client:

- **`rewards.ts`** — `awardCompletion(supabase, userId, difficulty)` grants XP (5/10/20/40/80 for difficulty 1–5) and creates a `reward` notification. `checkAchievements(supabase, userId)` evaluates all achievement conditions. `awardStreak(supabase, userId, streak)` checks streak milestones.
- **`punishment.ts`** — punishment application logic called from `/api/punish`.

### Scoring System

- **Willpower** (`profiles.willpower_score`, 0–100): `+ceil(difficulty × 3)` on task complete (`/api/tasks/complete`), `−ceil(difficulty × 2)` on failed verification (`/api/verify`).
- **XP** (`profiles.xp_total`): via `awardCompletion()` in `rewards.ts`.
- **Compliance streak** (`profiles.compliance_streak`): via `awardStreak()`.
- **Achievements**: via `checkAchievements()` — checks against `ACHIEVEMENT_DEFS` array in `rewards.ts`.

### Database Schema

Types are in `src/lib/supabase/schema.ts`. Key tables: `profiles`, `sessions`, `tasks`, `chat_messages`, `regimens`, `achievements`, `notifications`, `daily_task_log`, `api_usage`.

The `api_usage` table requires the migration at `supabase/migrations/20260218_add_api_usage.sql` to exist before token tracking works.

### UI Components

Primitive components in `src/components/ui/` (`Button`, `Card`, `Badge`, `Input`) all use `class-variance-authority` for variants. Feature components in `src/components/features/`. Layout components (`TopBar`, `BottomNav`, `BentoGrid`) in `src/components/layout/`. Onboarding step components in `src/components/onboarding/`.

### Prompt Registry

All AI system prompts are documented in `PROMPTS.md` at the project root. When changing a prompt, update both the source file and `PROMPTS.md`.
