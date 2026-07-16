# LockedIn Design System

/* Hallmark · pre-emit critique: P4 H4 E4 S4 R4 V3 */
/* Hallmark · macrostructure: Workbench · tone: austere-premium · studied: yes */
/* theme: studied-DNA (source: Stitch LockedIn-X HTML) */
/* paper: deep olive #10140F · accent: electric lime #C3F400 · display: Epilogue · body: Manrope · label: Geist */

> **DNA extracted from Stitch project screens** (local HTML in `src/app/designs/`).  
> Product register (Impeccable): design **serves** the task — density, consistency, trust.

---

## Hallmark study diagnosis (Stitch)

### What the screens actually are
Not a marketing landing page. A **discipline operating system**:
- **Desktop workbench:** left nav rail · primary canvas · **right utility rail** (timer + companion + memoir peek)
- **Mobile:** bottom nav + single-column priority stack (lock → metrics → actions)
- **Macrostructure:** Workbench / Bento (information density, not hero-marketing)

### Visual DNA
| Token | Value | Role |
|-------|--------|------|
| Paper | `#10140F` / `#0D110C` | App chrome |
| Surface / glass | `#161B15` + `rgba(white,0.05)` + blur | Cards |
| Accent | `#C3F400` electric lime | Primary CTA, live state, key metrics only |
| Muted text | `#8E9379` / on-surface-variant | Labels, secondary |
| Type | Epilogue (display) · Manrope (body) · Geist (caps/labels) | Product scale, not fluid marketing type |
| Radius | 8–16px cards, full pills for CTAs | Soft OS, not clinical 0px |
| Motion | 150–250ms state only | No page-load choreography |

### IA from Stitch (must ship in product)
1. **Lock status always visible** (right rail on desktop; top of home on mobile)
2. **4-up metric strip** after greeting (streak · level/XP · milestone · identity tags)
3. **Today’s rituals checklist** co-equal with tasks
4. **Companion reachable without leaving home** (desktop dock / mobile nav)
5. **Verification** as first-class capture surface (full-bleed camera chrome)

### Anti-patterns to reject (from failed iterations)
- Industrial ALL_CAPS mono “terminal” entire UI
- Fake metrics / hardcoded Day 42
- Single-column desktop with huge padding (wastes Stitch density)
- Lime everywhere (accent only for action + live + primary number)
- Glass on every card (glass for hero quote + elevated panels only)

---

## Product UX rules (Impeccable product register)

1. **One primary job per viewport region** — timer rail ≠ marketing hero.
2. **Touch targets ≥ 44px** on mobile actions.
3. **Empty states teach the next action** (Start session, Open ritual, Submit proof).
4. **Session-active vs idle** change the home composition (don’t show dead CTAs).
5. **Consistent component vocabulary** — same button, card, chip language on every route.
6. **No invented metrics** — bind to `profile` / `session` / APIs only.

---

## Layout contracts

### Desktop (≥1280px)
```
┌────────┬────────────────────────────┬──────────────┐
│ Nav    │ Main canvas                │ Right rail   │
│ 256px  │ hero · metrics · bento     │ lock · proof │
│        │ rituals · task · behavior  │ companion    │
└────────┴────────────────────────────┴──────────────┘
```

### Mobile
```
[ Top bar ]
[ Greeting (compact) ]
[ Lock timer — full width ]
[ Metrics 2×2 ]
[ Behavior / Proof ]
[ Task ]
[ Bottom nav ]
```

---

## Component voice
- **Section labels:** 10–11px medium tracking, not screaming caps blocks
- **Primary button:** lime fill, dark ink, pill or 12px radius
- **Secondary:** ghost border white/10
- **Danger:** coral/error, reserved for fail/emergency
- **Cards:** surface + hairline; hover lift ≤1% scale, 200ms

## Provenance
Stitch project **LockedIn-X Design System** `14416040438722354321`.  
Local exports: `docs/stitch/SCREEN-INDEX.md`. User-owned design reference for this product.
