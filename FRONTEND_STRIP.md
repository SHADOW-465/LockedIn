# Frontend strip (2026-07-16)

## Why
Repeated UI redesigns failed to match Stitch because the presentation layer mixed:
- Legacy neumorphic / cyber-noir tokens (`globals.css` dual mappings)
- Industrial ALL_CAPS mono chrome
- Zinc utility leftovers
- Partial Stitch tokens (`stitch-theme.css`)

Redesign-over-legacy produced hybrid UIs, not Stitch DNA.

## What was removed
- All feature components (`src/components/features/**`)
- Layout chrome (TopBar, BottomNav, DesktopSidebar, HomeRightRail, BentoGrid)
- Onboarding step components
- UI primitives (Button, Card, Badge, Input) — rebuild from Stitch
- All dashboard page implementations (replaced with stubs)
- `landing-page.tsx` marketing chrome
- Dual design token pollution in `globals.css`

## What was kept (backend / product core)
| Path | Role |
|------|------|
| `src/app/api/**` | All ~33 API routes |
| `src/lib/**` | AI, engines, Supabase, local-storage, stores, hooks |
| `src/proxy.ts` | Auth / onboarding gate |
| `src/app/auth/callback` | OAuth callback |
| `src/app/designs/**` | Stitch HTML source of visual truth |
| `src/app/stitch-theme.css` | Stitch token table |
| `DESIGN.md` | Design system contract |
| `supabase/**` | Migrations & edge functions |
| `src/__tests__/**` | Backend / unit tests |
| Auth plumbing | `AuthProvider`, minimal `RouteGuard`, login/signup/onboarding |

## Temporary shell → Stitch workbench (in progress)
- `src/components/layout/app-shell.tsx` — desktop rail + mobile pill + optional right rail
- `src/lib/nav.ts` — Stitch-mapped routes
- `src/components/rebuild-stub.tsx` — in-canvas placeholders only (no chrome)
- Bare login / signup / one-shot onboarding
- Home shows real streak / XP / willpower; full bento next

## Rebuild rules
1. **Only** use tokens from `stitch-theme.css` + `DESIGN.md`
2. Treat `src/app/designs/*.html` as layout DNA, not the deleted React trees
3. Wire pages to existing APIs — do not reimplement engines in components
4. Do not reintroduce zinc / industrial mono / neumorphic dual tokens
5. Order suggestion: shell (nav + workbench) → home → companion → tasks/proof → ritual → memoir → settings → onboarding

## Status
Presentation layer is intentionally incomplete. Product backend is intact for a greenfield Stitch UI.
