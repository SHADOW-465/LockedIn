# Design System & Theme Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the settings-page design language (pure black, zinc-900 cards, legible white text, accent-colored highlights) across every dashboard page, plus add a 6-theme color system stored in `profiles.theme` with a picker in Settings.

**Architecture:** CSS custom properties (`--accent`, `--accent-dark`, `--accent-dim`, `--accent-glow`) drive all accent colors. A lightweight `ThemeProvider` reads `profile.theme` from the existing auth context and sets the CSS vars on `document.documentElement`. All dashboard pages drop neumorphism-era gray tokens and adopt the new zinc-900 card style.

**Tech Stack:** Tailwind CSS v4, CSS custom properties, React context, Supabase, Next.js 15 App Router.

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Modify | `src/app/globals.css` | Replace old `--color-bg-*` tokens with pure-black system; add `--accent` CSS vars (default Crimson); add `cardIn`, `bubbleIn`, `dotFadeIn` keyframes; add `.accent-glow` utility |
| Modify | `src/components/ui/card.tsx` | Update `raised`/`hero` variants to `bg-zinc-900 border border-zinc-800` |
| Modify | `src/components/layout/bottom-nav.tsx` | Active state → `text-[var(--accent)]`; glass → `bg-zinc-950/90 border-t border-zinc-800` |
| Create | `src/lib/themes.ts` | 6 theme definitions (name, CSS vars object) |
| Create | `src/lib/contexts/theme-context.tsx` | ThemeProvider — reads `profile.theme`, sets CSS vars |
| Modify | `src/app/(dashboard)/layout.tsx` | Wrap children with ThemeProvider |
| Modify | `src/lib/supabase/schema.ts` | Add `theme?: string` to `UserProfile` |
| Create | `supabase/migrations/20260323_add_theme.sql` | `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme text DEFAULT 'crimson'` |
| Modify | `src/app/api/profile/update/route.ts` | Accept and persist `theme` field |
| Modify | `src/app/(dashboard)/settings/page.tsx` | Add "Appearance" card with 6 theme swatches |
| Modify | `src/app/(dashboard)/home/page.tsx` | Restyle with new design language |
| Modify | `src/app/(dashboard)/tasks/page.tsx` | Restyle |
| Modify | `src/app/(dashboard)/chat/page.tsx` | Restyle |
| Modify | `src/app/(dashboard)/achievements/page.tsx` | Restyle |
| Modify | `src/app/(dashboard)/regimens/page.tsx` | Restyle |
| Modify | `src/app/(dashboard)/journal/page.tsx` | Restyle |
| Modify | `src/app/(dashboard)/calendar/page.tsx` | Restyle |
| Modify | `src/app/(dashboard)/history/page.tsx` | Restyle |
| Modify | `src/app/(dashboard)/history/[sessionId]/page.tsx` | Restyle |
| Modify | `src/app/(dashboard)/feedback/page.tsx` | Restyle |
| Modify | `src/app/(dashboard)/checkin-history/page.tsx` | Restyle |
| Create | `src/__tests__/theme-system.test.ts` | Unit tests for theme logic |

---

## Task 1: CSS Foundations

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/ui/card.tsx`
- Modify: `src/components/layout/bottom-nav.tsx`

### Design tokens to apply

The old tokens (`--color-bg-primary: #0F1117`, `--color-bg-secondary: #1E2129`, etc.) must be replaced. The new system:

```
pure black page background:  #000000
card surface:                 #18181b  (zinc-900)
card border:                  #27272a  (zinc-800)
hover border:                 #3f3f46  (zinc-700)
text — title:                 #ffffff
text — body:                  rgba(255,255,255,0.85)
text — secondary:             rgba(255,255,255,0.50)
text — label:                 rgba(255,255,255,0.30)
accent (default Crimson):     #ef4444  (overridden per theme)
```

- [ ] **Step 1: Update globals.css design tokens and body background**

Replace the entire `@theme inline { ... }` block and `body { background-color: ... }` in `src/app/globals.css`:

```css
@theme inline {
  /* New base tokens */
  --color-bg-primary:   #000000;
  --color-bg-secondary: #18181b;
  --color-bg-tertiary:  #27272a;
  --color-bg-hover:     #3f3f46;

  /* Text hierarchy */
  --color-text-primary:   #ffffff;
  --color-text-secondary: rgba(255,255,255,0.85);
  --color-text-muted:     rgba(255,255,255,0.50);
  --color-text-subtle:    rgba(255,255,255,0.30);

  /* Care Mode teal (fixed, never themed) */
  --color-care: #14b8a6;

  /* Tier colors (unchanged) */
  --color-tier-newbie:      #4CAF50;
  --color-tier-slave:       #FF9800;
  --color-tier-hardcore:    #F44336;
  --color-tier-extreme:     #9C27B0;
  --color-tier-destruction: #000000;

  /* Typography */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Border Radius */
  --radius-pill: 9999px;
  --radius-lg:   16px;
  --radius-md:   12px;
  --radius-sm:   8px;
}
```

**Important:** The `--accent*` vars are intentionally placed in `@layer base :root` (NOT inside `@theme inline`) so they remain plain CSS custom properties usable via `var(--accent)` in arbitrary Tailwind values like `text-[var(--accent)]` and in `style={{ }}` props. Add these after the `@theme inline { }` block:

```css
@layer base {
  :root {
    /* Theme accent — default Crimson, overridden by ThemeProvider at runtime */
    --accent:      #ef4444;
    --accent-dark: #7f1d1d;
    --accent-dim:  rgba(239, 68, 68, 0.15);
    --accent-glow: rgba(239, 68, 68, 0.30);
  }
}
```

In the existing `@layer base` block, update `body`:
```css
body {
  background-color: #000000;
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
  overflow-x: hidden;
}
```

- [ ] **Step 2: Add new keyframes and utility classes to globals.css**

Add after existing `@keyframes` definitions:

```css
@keyframes cardIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes bubbleIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes dotFadeIn {
  from { opacity: 0; transform: scale(0.7); }
  to   { opacity: 1; transform: scale(1); }
}

@keyframes drawRing {
  from { stroke-dashoffset: 339; }
  to   { stroke-dashoffset: var(--ring-offset, 84); }
}
```

Add to the utilities `@layer`:

```css
.animate-card-in {
  animation: cardIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) both;
}

.animate-bubble-in {
  animation: bubbleIn 0.35s ease both;
}

.animate-dot-in {
  animation: dotFadeIn 0.4s ease both;
}

.animate-draw-ring {
  animation: drawRing 1.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.accent-glow {
  box-shadow: 0 0 20px var(--accent-glow), 0 0 40px var(--accent-dim);
}

.card-hover {
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.card-hover:hover {
  border-color: #3f3f46 !important;  /* zinc-700 — fixed hover border */
  transform: translateY(-1px);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.5);
}
```

Also update `.glass` and `.glass-strong` to use black base:

```css
.glass {
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.glass-strong {
  background: rgba(0, 0, 0, 0.90);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```

- [ ] **Step 3: Update Card component variants**

In `src/components/ui/card.tsx`, replace the `cardVariants` cva definition.

**Note on min-h removal:** The old variants included `min-h-[100px]`/`min-h-[140px]`/`min-h-[200px]`. The new sizes drop these so cards collapse to content height — intentional for the new design. After implementing, start the dev server and visually scan all pages; if any card collapses in a broken way, add `min-h-*` inline on that specific card only.

```typescript
const cardVariants = cva(
    'rounded-xl transition-all duration-200',
    {
        variants: {
            variant: {
                raised:
                    'bg-zinc-900 border border-zinc-800',
                inset:
                    'bg-black border border-zinc-800/50',
                flat:
                    'bg-zinc-900',
                hero:
                    'bg-zinc-900 border border-zinc-800',
            },
            size: {
                sm: 'p-4',
                md: 'p-5',
                lg: 'p-6',
            },
        },
        defaultVariants: {
            variant: 'raised',
            size: 'md',
        },
    }
)
```

- [ ] **Step 4: Update BottomNav active state and glass background**

In `src/components/layout/bottom-nav.tsx`:

Change the nav bar class from:
```
glass-strong lg:hidden safe-area-bottom
```
To:
```
bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 lg:hidden safe-area-bottom
```

Change active link classes from `text-purple-primary bg-bg-tertiary glow-purple` to:
```
text-[var(--accent)] bg-zinc-800
```

Change inactive link classes from `text-text-secondary hover:text-text-primary hover:bg-bg-tertiary` to:
```
text-white/40 hover:text-white/70 hover:bg-zinc-800/50
```

Apply the same active/inactive changes to the More popup items and More button.

The More popup div class changes from:
```
glass-strong border border-white/10 rounded-2xl
```
To:
```
bg-zinc-900 border border-zinc-800 rounded-2xl
```

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/components/ui/card.tsx src/components/layout/bottom-nav.tsx
git commit -m "feat(design): overhaul CSS tokens to pure black system with accent vars"
```

---

## Task 2: Theme Definitions + ThemeProvider

**Files:**
- Create: `src/lib/themes.ts`
- Create: `src/lib/contexts/theme-context.tsx`
- Modify: `src/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/theme-system.test.ts`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { THEMES, applyTheme } from '@/lib/themes'

describe('THEMES', () => {
  it('exports exactly 6 themes', () => {
    expect(Object.keys(THEMES)).toHaveLength(6)
  })

  it('each theme has required CSS var keys', () => {
    for (const theme of Object.values(THEMES)) {
      expect(theme).toHaveProperty('accent')
      expect(theme).toHaveProperty('accentDark')
      expect(theme).toHaveProperty('accentDim')
      expect(theme).toHaveProperty('accentGlow')
      expect(theme).toHaveProperty('label')
    }
  })

  it('crimson is the default theme', () => {
    expect(THEMES['crimson'].accent).toBe('#ef4444')
  })
})

describe('applyTheme', () => {
  it('sets CSS custom properties on the provided element', () => {
    const el = document.createElement('div')
    applyTheme('amethyst', el)
    expect(el.style.getPropertyValue('--accent')).toBe(THEMES['amethyst'].accent)
    expect(el.style.getPropertyValue('--accent-dark')).toBe(THEMES['amethyst'].accentDark)
  })

  it('falls back to crimson for unknown theme names', () => {
    const el = document.createElement('div')
    applyTheme('nonexistent', el)
    expect(el.style.getPropertyValue('--accent')).toBe(THEMES['crimson'].accent)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/theme-system.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/themes'`

- [ ] **Step 3: Create `src/lib/themes.ts`**

```typescript
export interface ThemeVars {
  label: string
  accent: string
  accentDark: string
  accentDim: string
  accentGlow: string
}

export const THEMES: Record<string, ThemeVars> = {
  crimson: {
    label: 'Crimson',
    accent:      '#ef4444',
    accentDark:  '#7f1d1d',
    accentDim:   'rgba(239, 68, 68, 0.15)',
    accentGlow:  'rgba(239, 68, 68, 0.30)',
  },
  amethyst: {
    label: 'Amethyst',
    accent:      '#a855f7',
    accentDark:  '#581c87',
    accentDim:   'rgba(168, 85, 247, 0.15)',
    accentGlow:  'rgba(168, 85, 247, 0.30)',
  },
  ice: {
    label: 'Ice',
    accent:      '#38bdf8',
    accentDark:  '#0c4a6e',
    accentDim:   'rgba(56, 189, 248, 0.15)',
    accentGlow:  'rgba(56, 189, 248, 0.30)',
  },
  gold: {
    label: 'Gold',
    accent:      '#f59e0b',
    accentDark:  '#78350f',
    accentDim:   'rgba(245, 158, 11, 0.15)',
    accentGlow:  'rgba(245, 158, 11, 0.30)',
  },
  obsidian: {
    label: 'Obsidian',
    accent:      '#94a3b8',   // slate-400 — dark chrome, distinct from Care Mode teal
    accentDark:  '#1e293b',
    accentDim:   'rgba(148, 163, 184, 0.15)',
    accentGlow:  'rgba(148, 163, 184, 0.30)',
  },
  bone: {
    label: 'Bone',
    accent:      '#e2e8f0',
    accentDark:  '#475569',
    accentDim:   'rgba(226, 232, 240, 0.15)',
    accentGlow:  'rgba(226, 232, 240, 0.30)',
  },
}

export function applyTheme(name: string, el: HTMLElement = document.documentElement): void {
  const theme = THEMES[name] ?? THEMES['crimson']
  el.style.setProperty('--accent',      theme.accent)
  el.style.setProperty('--accent-dark', theme.accentDark)
  el.style.setProperty('--accent-dim',  theme.accentDim)
  el.style.setProperty('--accent-glow', theme.accentGlow)
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/__tests__/theme-system.test.ts
```

Expected: PASS (3 test suites, all green)

- [ ] **Step 5: Create `src/lib/contexts/theme-context.tsx`**

```typescript
'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'
import { applyTheme } from '@/lib/themes'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth()

  useEffect(() => {
    applyTheme(profile?.theme ?? 'crimson')
  }, [profile?.theme])

  return <>{children}</>
}
```

- [ ] **Step 6: Wrap dashboard layout with ThemeProvider**

Replace `src/app/(dashboard)/layout.tsx` content:

```typescript
import { GuideFab } from '@/components/features/guide/guide-fab'
import { ThemeProvider } from '@/lib/contexts/theme-context'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider>
      {children}
      <GuideFab />
    </ThemeProvider>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/themes.ts src/lib/contexts/theme-context.tsx src/app/(dashboard)/layout.tsx src/__tests__/theme-system.test.ts
git commit -m "feat(themes): add 6-theme system with ThemeProvider and CSS custom properties"
```

---

## Task 3: Schema + Migration + API

**Files:**
- Modify: `src/lib/supabase/schema.ts`
- Create: `supabase/migrations/20260323_add_theme.sql`
- Modify: `src/app/api/profile/update/route.ts`

- [ ] **Step 1: Add `theme` to UserProfile interface**

In `src/lib/supabase/schema.ts`, add after the `psych_profile` line in `UserProfile`:

```typescript
  theme?: string  // one of: 'crimson' | 'amethyst' | 'ice' | 'gold' | 'obsidian' | 'bone' — optional so pre-migration rows don't break TypeScript
```

- [ ] **Step 2: Create the migration file**

Create `supabase/migrations/20260323_add_theme.sql`:

```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'crimson';
```

- [ ] **Step 3: Apply migration**

Run in Supabase dashboard SQL editor or via CLI:
```bash
# If using Supabase CLI:
npx supabase db push
```

Or paste the SQL directly into the Supabase dashboard → SQL Editor.

- [ ] **Step 4: Extend the update API to accept `theme`**

In `src/app/api/profile/update/route.ts`, add `theme` to the destructuring and the updates builder:

In the destructured body (after `psych_profile`):
```typescript
theme?: string
```

In the updates section (after `if (psych_profile !== undefined)`):
```typescript
if (theme !== undefined) updates.theme = theme
```

`theme` is not session-exempt — updating appearance is blocked during active sessions (correct behavior, same as tier/persona).

- [ ] **Step 5: Run the existing test suite to verify no regressions**

```bash
npx vitest run
```

Expected: all existing tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/supabase/schema.ts supabase/migrations/20260323_add_theme.sql src/app/api/profile/update/route.ts
git commit -m "feat(theme): add theme column to profiles and extend update API"
```

---

## Task 4: Settings Theme Picker

**Files:**
- Modify: `src/app/(dashboard)/settings/page.tsx`

The settings page already uses the correct card style. This task adds an "Appearance" card above the existing profile cards with 6 circle swatches.

- [ ] **Step 1: Read the current settings page to understand where to insert**

The settings page renders profile cards in a `space-y-4` div. Add the Appearance card as the **first** card in the list.

- [ ] **Step 2: Add theme import and state**

At the top of `SettingsPage`, add:
```typescript
import { THEMES, applyTheme } from '@/lib/themes'
```

Add state:
```typescript
const [themeChanging, setThemeChanging] = useState(false)
```

- [ ] **Step 3: Add handleThemeChange function**

Inside the component, add:
```typescript
async function handleThemeChange(themeName: string) {
  if (themeChanging || hasActiveSession) return
  setThemeChanging(true)
  // Apply immediately for instant preview
  applyTheme(themeName)
  const res = await fetch('/api/profile/update', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: user?.id, theme: themeName }),
  })
  if (res.ok) {
    await refreshProfile()
  } else {
    // Revert on failure
    applyTheme(profile?.theme ?? 'crimson')
  }
  setThemeChanging(false)
}
```

- [ ] **Step 4: Insert Appearance card JSX**

Inside the scrollable cards section, as the very first card:

```tsx
{/* ── Appearance ── */}
<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
  <div>
    <p className="text-white font-semibold text-sm">Appearance</p>
    <p className="text-white/40 text-xs mt-0.5">Theme color — reflects your training dynamic</p>
  </div>
  <div className="flex items-center gap-3 flex-wrap">
    {Object.entries(THEMES).map(([key, t]) => {
      const isActive = (profile?.theme ?? 'crimson') === key
      return (
        <button
          key={key}
          title={t.label}
          disabled={themeChanging || hasActiveSession}
          onClick={() => handleThemeChange(key)}
          className="relative flex flex-col items-center gap-1.5 disabled:opacity-40"
        >
          <span
            className="w-9 h-9 rounded-full border-2 transition-all duration-200 flex items-center justify-center"
            style={{
              backgroundColor: t.accent,
              borderColor: isActive ? '#ffffff' : 'transparent',
              boxShadow: isActive ? `0 0 0 3px ${t.accentDim}` : undefined,
            }}
          >
            {isActive && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </span>
          <span className="text-white/40 text-[10px]">{t.label}</span>
        </button>
      )
    })}
  </div>
  {hasActiveSession && (
    <p className="text-white/30 text-xs">Theme cannot change during an active session.</p>
  )}
</div>
```

- [ ] **Step 5: Verify visually that the settings page renders correctly**

```bash
npm run dev
```

Open `/settings`, confirm 6 swatches appear, clicking one changes the accent color live across the nav and UI.

- [ ] **Step 6: Commit**

```bash
git add src/app/(dashboard)/settings/page.tsx
git commit -m "feat(settings): add theme color picker with 6 swatches"
```

---

## Task 5: Home Page Restyle

**Files:**
- Modify: `src/app/(dashboard)/home/page.tsx`

The home page uses `bg-gray-900 border border-gray-700`, `bg-gray-800`, `text-gray-400`, `bg-red-600`, etc. All must be replaced with the new design language.

### Color substitution map for this file

| Old | New |
|-----|-----|
| `bg-gray-900` | `bg-zinc-900` |
| `bg-gray-800` | `bg-zinc-800` |
| `border-gray-700` | `border-zinc-800` |
| `border-gray-800` | `border-zinc-800` |
| `text-gray-400` | `text-white/50` |
| `text-gray-300` | `text-white/85` |
| `text-gray-500` | `text-white/30` |
| `text-gray-200` | `text-white/85` |
| `text-red-400`, `text-red-500` | `text-[var(--accent)]` |
| `text-red-600` | `text-[var(--accent)]` |
| `bg-red-600`, `bg-red-700` | `bg-[var(--accent)]` |
| `hover:bg-red-700` | `hover:opacity-90` |
| `text-green-400` | `text-emerald-400` |
| `text-yellow-400` | `text-amber-400` |
| `rounded-xl` stays | keep |
| `rounded-lg` → | `rounded-xl` |

- [ ] **Step 1: Read the full home page**

```bash
# Read src/app/(dashboard)/home/page.tsx in full
```

- [ ] **Step 2: Apply all color substitutions**

Key elements to restyle:

**SessionSummaryOverlay:**
```tsx
// Old:
<div className="bg-gray-900 border border-gray-700 rounded-xl ...">
// New:
<div className="bg-zinc-900 border border-zinc-800 rounded-xl ...">

// Old:
<div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-200 italic ...">
// New:
<div className="bg-zinc-800/50 rounded-xl p-4 text-sm text-white/85 italic ...">
```

**Session active cards** — add `animate-card-in` with staggered `animationDelay`:
```tsx
<div
  className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 card-hover animate-card-in"
  style={{ animationDelay: '0.1s' }}
>
```

**Willpower section:**
```tsx
// Bar fill: use var(--accent)
<div
  className="h-1.5 rounded-full transition-all duration-1200"
  style={{ width: `${willpower}%`, backgroundColor: 'var(--accent)' }}
/>
```

**"Continue" button in summary:**
```tsx
className="w-full py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
style={{ backgroundColor: 'var(--accent)' }}
```

**No session state / start session UI:**
- Replace any `bg-gray-900`/`border-gray-700` cards with `bg-zinc-900 border border-zinc-800 rounded-xl`

- [ ] **Step 3: Add page-level background**

The outermost wrapper div should have `className="min-h-screen bg-black"`.

- [ ] **Step 4: Commit**

```bash
git add src/app/(dashboard)/home/page.tsx
git commit -m "feat(home): apply new design system — black bg, zinc-900 cards, accent vars"
```

---

## Task 6: Tasks Page Restyle

**Files:**
- Modify: `src/app/(dashboard)/tasks/page.tsx`

Apply the same color substitution map from Task 5.

- [ ] **Step 1: Read the full tasks page**

Read `src/app/(dashboard)/tasks/page.tsx` in full.

- [ ] **Step 2: Apply design system**

Key changes:
- Outermost div: add `bg-black` to ensure pure black background
- Task cards: `bg-zinc-900 border border-zinc-800 rounded-xl card-hover`
- Master task border accent: `border-l-4` with `border-[var(--accent)]`
- Punishment task border: `border-l-4 border-orange-500`
- Stagger `animate-card-in` on each task card with `animationDelay: \`${index * 0.05}s\``
- Deadline "OVERDUE" text: `text-[var(--accent)]`
- "Generate Tasks" button: `bg-[var(--accent)] hover:opacity-90`
- Badge styles for `proof_type`: replace `bg-gray-700 text-gray-300` → `bg-zinc-800 text-white/60`

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/tasks/page.tsx
git commit -m "feat(tasks): apply new design system"
```

---

## Task 7: Chat Page Restyle

**Files:**
- Modify: `src/app/(dashboard)/chat/page.tsx`

Chat has two visual states: normal (accent-colored highlights) and Care Mode (teal-colored highlights). Keep Care Mode teal (`#14b8a6` = `--color-care`) fixed — it must NOT follow the accent theme.

- [ ] **Step 1: Read the full chat page**

Read `src/app/(dashboard)/chat/page.tsx` in full.

- [ ] **Step 2: Apply design system**

Key changes:

**Container:** `bg-black` page background.

**Message bubbles:**

AI message (normal):
```tsx
className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3 animate-bubble-in"
```

User message:
```tsx
className="rounded-2xl rounded-tr-sm px-4 py-3 text-white animate-bubble-in"
style={{ backgroundColor: 'var(--accent)' }}
```

AI message (punishment type):
```tsx
className="bg-zinc-900 border border-orange-500/40 rounded-2xl rounded-tl-sm px-4 py-3"
```

Care Mode bubbles: keep `border-teal-500/40` and `text-teal-400` — these are intentionally fixed, not themed.

**Input bar:**
```tsx
className="bg-zinc-900 border-t border-zinc-800 px-4 py-3"
```

**Input field:**
```tsx
className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-zinc-600 flex-1"
```

**Send button:**
```tsx
className="p-3 rounded-xl text-white disabled:opacity-40 transition-opacity"
style={{ backgroundColor: 'var(--accent)' }}
```

**Master task card (assigned in chat):**
```tsx
className="bg-zinc-900 border border-[var(--accent)]/30 rounded-xl p-3 mt-2"
```

**Care Mode banner:**
Keep `bg-teal-900/30 border border-teal-500/40 text-teal-300` — intentionally fixed, not themed.

- [ ] **Step 3: Add `animate-bubble-in` stagger**

Each message bubble gets:
```tsx
style={{ animationDelay: `${Math.min(index * 0.04, 0.4)}s` }}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/(dashboard)/chat/page.tsx
git commit -m "feat(chat): apply new design system with themed bubbles and fixed care mode teal"
```

---

## Task 8: Remaining Pages Restyle

**Files:**
- Modify: `src/app/(dashboard)/achievements/page.tsx`
- Modify: `src/app/(dashboard)/regimens/page.tsx`
- Modify: `src/app/(dashboard)/journal/page.tsx`
- Modify: `src/app/(dashboard)/calendar/page.tsx`
- Modify: `src/app/(dashboard)/history/page.tsx`
- Modify: `src/app/(dashboard)/history/[sessionId]/page.tsx`
- Modify: `src/app/(dashboard)/feedback/page.tsx`
- Modify: `src/app/(dashboard)/checkin-history/page.tsx`

Apply the same color substitution map from Task 5 to each page. These pages are simpler and can be batched.

- [ ] **Step 1: Read all 8 pages in full**

Read each page before editing. Use `Read` tool on each path.

- [ ] **Step 2: Restyle achievements page**

- Page bg: `bg-black`
- Summary hero card: `bg-zinc-900 border border-zinc-800 rounded-xl`
- XP icon: `text-[var(--accent)]`
- Achievement badge cards: `bg-zinc-900 border border-zinc-800 rounded-xl`
- Unlocked achievement icon: `text-[var(--accent)]`
- Locked achievement: `opacity-40`
- Stagger cards with `animate-card-in`

- [ ] **Step 3: Restyle regimens page**

- Page bg: `bg-black`
- Regimen cards: `bg-zinc-900 border border-zinc-800 rounded-xl card-hover`
- Progress bar fill: `style={{ width: ..., backgroundColor: 'var(--accent)' }}`
- "Start New Regimen" button: `bg-[var(--accent)] text-white hover:opacity-90`
- Template cards (create modal): `bg-zinc-800 border border-zinc-700 rounded-xl hover:border-[var(--accent)]/50`

- [ ] **Step 4: Restyle journal page**

- Page bg: `bg-black`
- Entry cards: `bg-zinc-900 border border-zinc-800 rounded-xl`
- Create entry button: `bg-[var(--accent)]`
- Entry date/label text: `text-white/30`
- Entry body text: `text-white/85`

- [ ] **Step 5: Restyle calendar page**

- Page bg: `bg-black`
- Calendar grid cells: `bg-zinc-900 border border-zinc-800 rounded-xl`
- Active session day highlight: `bg-[var(--accent-dim)] border-[var(--accent)]/50`
- Today indicator dot: `style={{ backgroundColor: 'var(--accent)' }}`
- Event badges: `bg-zinc-800 text-white/85`

- [ ] **Step 6: Restyle history page**

- Page bg: `bg-black`
- Archive cards: `bg-zinc-900 border border-zinc-800 rounded-xl card-hover`
- Session grade badge: accent-colored
- "Export ZIP" button: `border border-zinc-700 text-white/70 hover:border-zinc-600 hover:text-white`
- Empty state: `text-white/30`

- [ ] **Step 7: Restyle history/[sessionId], feedback, checkin-history**

Apply same substitution map:
- `history/[sessionId]/page.tsx` — session detail view; black bg, zinc-900 cards, accent highlights
- `feedback/page.tsx` — feedback form; black bg, zinc-900 card wrapper, white text
- `checkin-history/page.tsx` — mood log list; black bg, zinc-900 cards, accent-colored slider values

- [ ] **Step 8: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 9: Commit all remaining page changes**

```bash
git add src/app/(dashboard)/achievements/page.tsx src/app/(dashboard)/regimens/page.tsx src/app/(dashboard)/journal/page.tsx src/app/(dashboard)/calendar/page.tsx src/app/(dashboard)/history/page.tsx src/app/(dashboard)/history/[sessionId]/page.tsx src/app/(dashboard)/feedback/page.tsx src/app/(dashboard)/checkin-history/page.tsx
git commit -m "feat(pages): apply design system to achievements, regimens, journal, calendar, history, feedback, checkin-history"
```

---

## Quick Reference: Design Token Cheatsheet

Use these Tailwind classes throughout the app:

```
Page bg:          bg-black
Card surface:     bg-zinc-900 border border-zinc-800 rounded-xl
Card hover:       card-hover  (adds the CSS hover lift)
Card animate in:  animate-card-in  (+ animationDelay inline for stagger)

Title text:       text-white
Body text:        text-white/85
Secondary text:   text-white/50
Label text:       text-white/30

Accent text:      text-[var(--accent)]
Accent bg:        bg-[var(--accent)]
Accent border:    border-[var(--accent)]
Accent glow:      accent-glow  (CSS utility class)
Accent dim bg:    bg-[var(--accent-dim)]

Care Mode teal:   text-teal-400 / border-teal-500 / bg-teal-900/30  (NEVER replace with accent)
Punishment:       text-orange-400 / border-orange-500/40
```
