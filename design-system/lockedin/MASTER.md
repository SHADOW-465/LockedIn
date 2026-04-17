# Design System Master File: CLINICAL BRUTALISM

> **MANDATE:** This system is sterile, cold, and authoritarian. 
> There are NO rounded corners. NO soft shadows. NO friendly animations.
> Consistency is achieved through rigid grids and tonal stacking.

---

**Project:** LockedIn
**Architectural Paradigm:** Clinical Brutalism
**Color Palette:** Sterile High-Contrast

---

## 1. Global Strategy: "The Architectural Autopsy"

The UI must feel like a high-security medical terminal or an industrial control system. Agency is removed; authority is enforced through clarity and harshness.

### 1.1 Core Constants (Tokens)

| Role | Hex | Token Name |
|------|-----|------------|
| Background | `#000000` | `--color-bg-primary` |
| Surface (Low) | `#0A0A0A` | `--color-bg-secondary` |
| Surface (Mid) | `#141414` | `--color-bg-tertiary` |
| Crimson Accent | `#FF1F1F` | `--color-accent` |
| Deep Red | `#990000` | `--color-accent-dark` |
| Text (Primary) | `#FFFFFF` | `--color-text-primary` |
| Text (Secondary)| `#A1A1AA` | `--color-text-secondary` |
| Text (Muted) | `#525252` | `--color-text-muted` |

### 1.2 Geometry & Radius
- **Border Radius:** `0px` (Strict violation to use any other value).
- **Borders:** `1px solid #141414` for subtle separation. `1px solid #FF1F1F` for active/punishment states.
- **Shadows:** None. Depths are managed by tonal value shifts (Black -> Dark Grey).

### 1.3 Typography
- **Heading Font:** Space Grotesk (Bold, All Caps recommended).
- **Body Font:** Inter (Clinical, legible).
- **Data Font:** JetBrains Mono (Terminal feel).

---

## 2. Component Specifications

### 2.1 Buttons
- **Rectangular only.** 
- **States:** 
  - `Default`: Black background, Crimson border.
  - `Active/Primary`: Crimson background (#FF1F1F), Black text.
  - `Hover`: Instant fill/color shift. No organic ease.

### 2.2 Cards & Containers
- **Void Stacking:** Use `#0A0A0A` for cards sitting on a `#000000` background.
- **Header Lines:** Use a thin `#FF1F1F` top-border (2px) to denote importance/severity.

### 2.3 Inputs
- **Terminal Style:** Solid `#141414` backgrounds with high-contrast white text.
- **Focus:** Sharp Crimson underline or 1px border.

---

## 3. Interaction & Motion
- **No Fades:** Elements should appear/disappear instantly (50ms max).
- **Rigid Motion:** If motion is used, it should be linear and fast.
- **Status Indicators:** Use stark badges with `0px` radius.

---

## 4. Forbidden Items (Anti-Patterns)
- ❌ **Rounded Corners:** (Any value > 0px).
- ❌ **Shadows/Glows:** (Unless simulating a CRT scanline).
- ❌ **Pastel Colors:** (Use only Pure White, Greys, and Harsh Red).
- ❌ **Friendly Language:** (Use clinical, authoritative terminology).
- ❌ **Icons with curves:** (Favor geometric/sharp SVG icons).
