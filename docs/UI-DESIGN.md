# LockedIn-X — UI Design System: "Oxblood Devotion"

> The MOAT. Design language engineered to make the user *feel submission through the interface* —
> seduced, not crushed. Premium, warm-dark, tactile, reverent. Rejects cold/industrial/brutalist.

## Concept
**Devotional Luxury.** A high-end temple × intimate boudoir × the hush of a £500 spa. Submission
comes from **beauty, reverence, anticipation** — surfaces you want to touch, a presence you want to
please. The accent is a **wine→violet bleed**: oxblood (hardcore/visceral) dissolving into violet
(hypnotic/surrender) — the user's own arc from intensity into giving in. Antique gold = "owned &
treasured", used rarely.

## Design tokens (CSS custom properties — usable directly)
```css
:root{
  /* ── Warm-dark surfaces (never cold/blue-black) ── */
  --bg:            #0E0A0D;   /* canvas, warm near-black */
  --surface-1:     #171115;   /* cards */
  --surface-2:     #1F1720;   /* raised / active cards */
  --surface-frost: rgba(31,23,32,.62); /* glass modals — use with backdrop-blur:24px */
  --hairline:      #2A2030;   /* subtle warm borders */

  /* ── Signature accent: oxblood → violet ── */
  --oxblood:       #7B1E3B;   /* primary — hardcore, visceral */
  --wine-bright:   #A8324F;   /* hover/active */
  --violet:        #5B3A8C;   /* secondary — hypnotic surrender */
  --violet-bright: #7A4FB0;
  --accent-grad:   linear-gradient(135deg,#7B1E3B 0%,#5B3A8C 100%);
  --accent-glow:   0 0 48px rgba(123,30,59,.38), 0 0 72px rgba(91,58,140,.22);

  /* ── Precious metal: antique gold (sparingly) ── */
  --gold:          #C9A86A;
  --gold-hi:       #E3CFA3;

  /* ── Ink (warm off-white, never pure white) ── */
  --ink-high:      #F3ECF0;
  --ink-mid:       #B6A8B4;
  --ink-low:       #7C6E7B;

  /* ── Semantic (kept in-family — no alarm-neon) ── */
  --ok:            #C9A86A;   /* compliance = gold glow, not green */
  --warn:          #A8324F;   /* drift = bright wine */
  --danger:        #5E1228;   /* violation = deep crimson pulse */

  /* ── Radii (generous pillbox) ── */
  --r-pill: 999px; --r-lg: 32px; --r-card: 24px; --r-md: 18px; --r-sm: 14px;

  /* ── Soft layered shadows (warm) ── */
  --shadow-soft: 0 10px 34px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.03);
  --shadow-lift: 0 18px 54px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.04);

  /* ── Spacing ── */
  --s1:4px; --s2:8px; --s3:12px; --s4:16px; --s5:24px; --s6:32px; --s7:48px; --s8:64px;

  /* ── Motion (slow, weighted, "breathing") ── */
  --ease-glide: cubic-bezier(.22,1,.36,1);
  --ease-weight: cubic-bezier(.34,1.56,.64,1); /* satisfying overshoot on confirm */
  --t-micro:180ms; --t-base:320ms; --t-reveal:760ms;
}
```

## Typography (the secret weapon)
- **Keyholder voice — display serif:** `Cormorant Garamond` (free) — high-contrast, intimate,
  refined; premium alts: *Canela*, *PP Editorial New*. **Only the keyholder's words use this.** It
  makes the master feel like a cultured human speaking to you — the opposite of robotic monospace.
- **UI / data — modern sans:** `General Sans` (or `Outfit` / `Inter`). Clean, quiet, premium.
- **Numbers / timer:** tabular figures (Outfit/Inter `font-variant-numeric: tabular-nums`).
- **Scale:** display 44/serif · h1 32 · h2 24 · body 16 · caption 13 · timer 64–80 tabular.
- **Keyholder text reveal:** type-on at ~22ms/char with a soft cursor — you are being *spoken to*.

## Shape & material
- Fully-rounded **pillbox** controls (`--r-pill`), cards `--r-card`–`--r-lg`.
- **Frosted-glass** overlays/modals (`--surface-frost` + `backdrop-blur`).
- Soft **dual shadows** for depth (outer + faint inner highlight). Tasteful, not heavy neumorphism.
- Faint **satin sheen / fine grain** on hero surfaces for "premium physical object" feel.
- Soft **vignette** + a low **radial accent glow** behind hero elements.

## Motion philosophy — the rhythm IS the domination
Everything unfolds at the **keyholder's pace, not the user's**. Deliberate easing; reveals you must
wait for; confirmations with weight + haptic. This conditions patience and surrender through
interaction rhythm, before a single word is read. Anticipation = arousal; restraint = control.
- **Timer ring "breathes":** 4s scale 1.0↔1.015 + slow glow pulse.
- **Confirm/Lock:** `--ease-weight`, heavy haptic.
- **Card enter:** stagger 60ms, `--ease-glide`, fade+rise 12px.
- **Consequence:** deep crimson pulse from screen edges (slow, not a flash).

## Haptics & sound
- Lock-in: heavy thud (impactHeavy) + mechanical click.
- Verify accepted: soft double-tap + low warm chime.
- Keyholder message: subtle tick.
- Consequence: deep, resonant low rumble.
Audio: low warm tones; nothing shrill.

## Layout — Bento dashboard
Hero = **breathing timer ring** (center). Surrounding pillbox cards: Today's Ritual · Streak /
Devotion score · Keyholder's latest message (serif, glowing) · Next check-in · Willpower ring.
**Focus Mode** collapses everything except Ritual + Keyholder.

## Signature screens (where it gets addictive)
1. **Lock-In** — "Lock In" → "LockedIn" letter-slide; lock open→closed; heavy thud; accent-grad wash.
2. **Morning verification ritual** — full-screen, candle-lit hush, reverent (a *rite*, not a form).
3. **Keyholder speaks** — serif, slow type-on, soft accent glow; feels human.
4. **Milestone ceremony** — cinematic, gold-leaf, earned; the devotion-reward dopamine hit.
5. **Consequence** — slow crimson edge-pulse; the timer visibly extends.

## Do / Don't
- DO: warm-dark, soft rounded, frosted, serif keyholder voice, slow deliberate motion, gold for
  earned/owned, oxblood→violet for state/accent.
- DON'T: cold blue-black, neon-red alarms, monospace, brutalist/industrial, sharp flat boxes, fast
  snappy "productivity" motion, pure white text.

---

# UI GENERATION PROMPT (paste into v0 / Antigravity / uiforge)

```
Design a premium dark-luxury mobile app UI for "LockedIn" — an immersive AI "Keyholder"
accountability & discipline companion (adult D/s-themed, consensual). The UI itself must make the
user feel drawn in and willingly submissive — seduced, not crushed. This is the product's moat;
make it exceptional, modern, and tactile. Do NOT use cold/industrial/brutalist styling, neon-red
alarm colors, or monospace fonts.

DESIGN LANGUAGE — "Oxblood Devotion" (devotional luxury):
- Mood: high-end temple × intimate boudoir × luxury spa. Warm, enveloping, expensive, a little
  dangerous.
- Palette (warm-dark, never cold/blue-black):
  canvas #0E0A0D, cards #171115, raised #1F1720, hairline #2A2030.
  Signature accent = a gradient from oxblood #7B1E3B → deep violet #5B3A8C (use for the timer ring,
  active states, glows). Antique gold #C9A86A used sparingly for "earned/owned" moments.
  Text warm off-white #F3ECF0 / muted #B6A8B4. No pure white, no bright red.
- Typography: the AI Keyholder's spoken messages use an elegant high-contrast SERIF
  (Cormorant Garamond) and reveal with a slow type-on animation. All UI/labels/numbers use a clean
  modern sans (General Sans or Outfit), numbers tabular.
- Shape: fully-rounded pillbox buttons; cards radius 24–32px; frosted-glass modals (backdrop blur);
  soft layered shadows with depth; faint grain/satin sheen and a soft radial accent glow behind
  hero elements; gentle vignette.
- Motion: slow, weighted, deliberate (ease cubic-bezier(.22,1,.36,1)); the central timer ring
  "breathes" (subtle scale + glow pulse); cards stagger-fade-in; confirmations have a satisfying
  weighted overshoot. Restrained, hypnotic — never snappy/productivity-fast.

SCREENS TO PRODUCE:
1. Onboarding "Lock-In" final screen: a large pillbox "Lock In" button that animates into
   "LockedIn" with a lock open→closed; accent-gradient wash; reverent.
2. Bento dashboard: hero = large breathing circular timer ring (oxblood→violet gradient stroke,
   tabular countdown). Surrounding rounded cards: Today's Ritual, Streak/Devotion score (gold
   accent), Keyholder's latest message (serif, glowing card), Next check-in, Willpower ring.
3. Keyholder chat: intimate, the master's messages in serif with slow type-on and a soft glow;
   user input in a frosted pill field.
4. Morning verification ritual: full-screen, candle-lit, hushed, reverent — an upload-photo "rite".
5. Milestone ceremony: cinematic, gold-leaf, earned-reward celebration.

Deliver clean, production-grade React + Tailwind components with Framer Motion for the
microinteractions. Prioritize feel: every tap should feel weighted and satisfying; the whole thing
should feel like a high-end object the user is privileged to use.
```
