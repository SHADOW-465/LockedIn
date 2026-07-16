I think this is where we can save you **weeks of development time**.

One suggestion before diving in:

Do **not** tell Claude/Antigravity *"build the app."*

Instead, we'll create a document that is almost like **Apple's internal screen specifications**.

Meaning:

* Every screen has a purpose.
* Every button is defined.
* Every transition is defined.
* Every animation is defined.
* Every empty state is defined.
* Every success state is defined.
* Every error state is defined.
* Every gesture is defined.

When the AI finishes reading Volume 4, it should know exactly what to build without inventing UX.

---

# LOCKEDIN-X

# Product Requirements Document

# Volume 4

# Complete Screen Specification & User Flows

**Version 4.0**

---

# Overview

The application consists of approximately **65–80 core screens** plus reusable sheets, dialogs, onboarding steps, and overlays.

The experience should always prioritize:

* minimal cognitive load
* emotional continuity
* premium aesthetics
* fast interaction
* offline-first reliability

The screen hierarchy is organized into **11 experiences** rather than isolated pages.

---

# EXPERIENCE 1 — FIRST LAUNCH

---

## Screen 1. Splash Screen

**Purpose**

Introduce the product with confidence and calm.

### Layout

Centered logo.

Soft animated gradient.

Very slow breathing glow.

No loading spinner.

Logo fades into Home if returning user.

Otherwise proceeds to onboarding.

Animation

* 2.5-second fade
* subtle ambient background movement
* soft haptic when finished

---

## Screen 2. Welcome

Large heading

> Welcome.

Subheading

> This is a place for the promises you keep to yourself.

Buttons

* Begin
* Restore Backup

Minimal illustration.

---

## Screen 3. Personal Intention

Instead of asking

"What is your goal?"

Ask

> Why are you beginning this journey?

Large multiline input.

Examples

* Self-control
* Mental clarity
* Discipline
* Lifestyle
* Personal growth

AI stores this permanently.

This becomes one of the most important data fields.

---

## Screen 4. Commitment

User writes

A commitment statement.

Example

> I choose to remain locked because...

Signature box.

Optional.

Feels ceremonial.

Animation

Page slowly folds into the memoir.

---

## Screen 5. Reminder Preferences

Morning

Afternoon

Evening

Custom reminders.

Notification preview.

---

## Screen 6. Permissions

Camera

Photos

Notifications

Biometrics

Storage

Each permission explained in plain language.

---

## Screen 7. Finish

Hero animation.

Book opens.

First page appears.

Home loads.

---

# EXPERIENCE 2 — HOME

---

## Screen 8. Home Dashboard

Purpose

Create calm.

Never overwhelm.

---

Layout

Large Hero Card

Today's Ritual

Identity Card

AI Reflection

Memoir Preview

Support Button

Next Milestone

Bottom Navigation

---

Hero Card

```text
LOCKED

14 DAYS

Everything is secure.
```

Hero gently breathes.

Ambient gradient shifts with time.

Touch expands.

---

## Screen 9. Expanded Hero

Displays

Current Session

Time

Progress

Photos

Integrity

Promises Kept

Mini Timeline

Close gesture

Swipe down.

---

## Screen 10. Daily Ritual Card

Morning

Verify

Mood

Commitment

Photo

---

Evening

Reflection

Photo

Journal

Completion

Large CTA.

---

## Screen 11. AI Reflection

Displays

Today's insight.

Yesterday's memory.

Gentle encouragement.

Feels handwritten.

---

## Screen 12. Identity Card

Displays

Promises Kept

Pages Written

Photos Preserved

Recovery Rate

Current Chapter

Never uses "XP"

---

# EXPERIENCE 3 — DAILY RITUAL

---

## Screen 13. Morning Ritual

Sequence

Greeting

↓

Mood

↓

Photo

↓

Today's Intention

↓

Complete

Progress indicator at top.

---

## Screen 14. Evening Ritual

Reflection

Difficulty

Photo

Journal

Complete Day

Animation

Ink dries onto memoir page.

---

## Screen 15. Verification Camera

Minimal camera.

No unnecessary controls.

Large shutter.

Retake.

Done.

Immediately stores locally.

---

# EXPERIENCE 4 — SUPPORT MODE

This is one of the defining experiences of the product.

---

## Screen 16. Support Mode Entry

Triggered by

"I'm Having an Urge"

Transition

Entire UI softens.

Background darkens.

Hero enlarges.

Navigation fades.

No abrupt page change.

Feels like entering another room.

---

## Screen 17. Stay With Me

Large countdown.

Three breathing circles.

Soft animation.

Buttons

Read My Reason

Walk

Cold Shower

Talk to AI

Journal

Timer

No distractions.

---

## Screen 18. Read My Reason

Displays

Original commitment.

Favorite quotes.

Past successes.

Selected memoir excerpts.

Large typography.

---

## Screen 19. Recovery Timer

5

10

15-minute options.

Ambient animation.

End screen congratulates surviving the urge.

---

## Screen 20. Urge Reflection

Optional journal.

Mood.

Intensity slider.

AI summarizes.

Returns to Home.

---

# EXPERIENCE 5 — MEMOIR

The emotional heart of LOCKEDIN-X.

---

## Screen 21. Memoir Library

Looks like a bookshelf.

Each chapter represented by a premium cover.

Scrolling feels like browsing books.

---

## Screen 22. Chapter View

Displays

Chapter title

Summary

Cover photo

Pages

Milestones

---

## Screen 23. Daily Page

Magazine layout.

Large hero photo.

Journal.

Mood.

AI narration.

Tiny handwritten annotations.

Photos arranged dynamically.

---

## Screen 24. Fullscreen Reading Mode

Page-turn gesture.

No navigation.

Only content.

---

## Screen 25. Search Memoir

Search

Quotes

Photos

Dates

AI reflections

Everything.

---

# EXPERIENCE 6 — INSIGHTS

---

## Screen 26. Identity Overview

Promises Kept

Pages Written

Recovery Events

Sessions

Current Chapter

Beautiful radial charts.

---

## Screen 27. Mood Trends

Monthly.

Weekly.

AI insights.

---

## Screen 28. Photo Timeline

Photo wall.

Grouped by month.

Tap opens memoir.

---

## Screen 29. Milestones

Animated milestone cards.

Minimal.

Elegant.

---

# EXPERIENCE 7 — AI COMPANION

---

## Screen 30. Conversation

Letter style.

No chat bubbles.

Cards resemble journal notes.

---

## Screen 31. Memory Browser

AI remembers

Photos

Quotes

Past journals

Important days

---

## Screen 32. Ask About My Journey

Example

"What changed this month?"

AI answers using memoir.

---

# EXPERIENCE 8 — PROFILE

---

## Screen 33. Profile

Portrait

Current Chapter

Favorite Quote

Lifetime Pages

Days Locked

---

## Screen 34. Timeline

Lifetime overview.

---

## Screen 35. Export

Called

Publish Memoir

Preview

Formats

PDF

HTML

Markdown

---

# EXPERIENCE 9 — SETTINGS

---

## Screen 36. General

Appearance

Notifications

Privacy

Storage

---

## Screen 37. AI

Provider

Groq

Future providers

Prompt settings

---

## Screen 38. Security

PIN

Biometrics

Encryption

---

## Screen 39. Backup

Export

Import

Local backups

---

# EXPERIENCE 10 — RECOVERY

---

## Screen 40. Report Unlock

User manually reports an unlock.

No interrogation.

Simple questions:

* What happened?
* How are you feeling?
* Anything you want to remember?

Optional only.

---

## Screen 41. New Beginning

Hero message:

> Every book has difficult chapters.

> Turn the page.

Options:

* Begin New Session
* Read My Reason
* Open Memoir

The UI uses the same calm language throughout. No guilt, no punitive elements.

---

# EXPERIENCE 11 — MICRO EXPERIENCES

These aren't full screens but are critical to the feeling of the product.

---

## Bottom Sheets

* Quick mood check
* Quick journal
* Reminder actions
* Notification preview
* AI suggestions

Each opens with a spring animation and blurred backdrop.

---

## Floating Notifications

In-app notifications should slide gently from the top, linger briefly, then fade. They never interrupt an ongoing ritual.

---

## Empty States

Examples:

> Your memoir is waiting for its first page.

> Every chapter starts somewhere.

> Your story grows one day at a time.

---

## Success States

Verification complete:

* soft glow
* medium haptic
* hero card brightens
* today's page visibly added to the memoir stack

Milestone reached:

* page-turn animation
* chapter bookmark appears
* AI writes a short congratulatory note

---

## Error States

Always calm.

Examples:

> We couldn't save this photo yet. It's still safe in memory—let's try again.

> Your memoir will continue as soon as storage is available.

Never use alarming language or destructive colors.

---

# Universal Interaction Rules

These apply to every screen:

* Swipe down dismisses full-screen overlays.
* Swipe left/right flips memoir pages where appropriate.
* Long-press on photos reveals metadata and lets users add captions.
* Pull-to-refresh uses a custom ink-drop animation rather than a spinner.
* All primary actions are reachable with one thumb.
* Interactive elements have a minimum 48 × 48 dp touch target.
* Motion respects the system "Reduce Motion" setting.

---

# Navigation Map

```text
Splash
   │
   ▼
Onboarding
   │
   ▼
Home
 ├── Daily Ritual
 ├── Support Mode
 ├── Memoir
 ├── AI Companion
 ├── Insights
 ├── Profile
 └── Settings
```

Every path ultimately returns to **Home**, reinforcing it as the user's place of stability.

---

# End of Volume 4

## One recommendation before Volume 5

At this point, I would **freeze the product scope**. You've defined the vision, the design language, and the user experience. Resist the temptation to keep adding features.

Volume 5 should focus entirely on **engineering architecture**—folder structure, local database schema, AI provider abstraction, photo storage, memoir generation pipeline, synchronization, notifications, security, export engine, and offline-first implementation.

That separation will let you build quickly without sacrificing the experience you've carefully designed.
