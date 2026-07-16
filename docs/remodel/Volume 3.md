I actually want to make one significant architectural change before Volume 3.

After thinking about your product for quite a while, I don't think it should be built around **modules**.

It should be built around **experiences**.

Almost every PRD on the internet says

Dashboard

Analytics

Journal

Settings

...

I think that's wrong for LOCKEDIN-X.

Instead, the application should feel like entering a beautifully designed environment where every screen belongs to one continuous journey.

So Volume 3 becomes the **Experience Architecture**.

This is what your AI coding agent should follow.

---

# LOCKEDIN-X

# Product Requirements Document

# Volume 3

# Experience Architecture & Information Design

**Version 4.0**

---

# 1. Purpose

This document defines the complete user experience architecture of LOCKEDIN-X.

Rather than organizing the application by technical features, the product is organized around the user's emotional journey throughout a day, a week, a month, and ultimately a year.

Every screen should feel like another room inside the same carefully designed home.

Users should never feel like they are switching between unrelated pages.

Instead, the application should feel continuous.

---

# 2. Information Architecture

The application consists of six primary experiences.

```
Home

↓

Rituals

↓

Memoir

↓

Insights

↓

AI Companion

↓

Profile
```

Everything else belongs inside these six pillars.

No feature should exist outside this architecture unless absolutely necessary.

---

# 3. Primary Navigation

Bottom Navigation

Five tabs.

```
🏠

Home

📖

Memoir

✨

Center Action

🤍

Companion

👤

Profile
```

The center button is not navigation.

It always opens the Daily Ritual.

Regardless of where the user currently is.

---

# 4. Home

The Home screen is the emotional center of the application.

It should answer only one question.

> "How am I doing today?"

Nothing more.

---

Home consists of

Hero Lock Card

Today's Ritual

AI Reflection

Identity Card

Today's Progress

Mood

Next Milestone

Recent Memoir Preview

Daily Quote

Support Button

No charts.

No analytics.

No complicated statistics.

Home should feel peaceful.

---

# 5. Hero Lock Card

Largest element.

Always visible.

Displays

```
LOCKED

37 DAYS

Everything is secure.
```

The Hero Card slowly breathes using subtle ambient motion.

Background gradients change throughout the day.

Touching it expands into

Session Details.

---

# 6. Daily Ritual

The second most important experience.

Morning

Verify

Mood

Photo

Commitment

---

Evening

Verification

Reflection

Journal

Photo

Completion

The Ritual should never exceed two minutes.

---

# 7. Memoir

This becomes the signature feature.

Not Reports.

Not Timeline.

Not Journal.

The Memoir.

---

Internally,

the Memoir is generated every day.

The user simply watches it grow.

Each page contains

Date

Photos

Journal

Mood

Milestones

AI Reflection

Personal Notes

Favorite Quote

Background Theme

The layout changes based on the content of the day.

No two pages should feel identical.

---

# 8. Chapter System

Pages automatically group into Chapters.

Examples

```
Beginning

Learning Discipline

Finding Stability

Momentum

Recovery

Growth

Mastery

```

AI decides chapter names.

Users may rename them.

---

# 9. Today's Story

Every day has its own page.

Large hero photo.

Beautiful typography.

Mood.

AI Summary.

Journal.

Gallery.

Timeline.

Reading today's page should feel like reading a magazine article.

---

# 10. Timeline

Separate from the Memoir.

Chronological.

Shows

Photos

Milestones

Journals

Unlocks

Achievements

AI Conversations

Useful for searching history.

Not emotional.

Pure reference.

---

# 11. AI Companion

This is not ChatGPT.

This is not Claude.

This is not a chatbot.

Conversation should feel like writing letters.

---

Instead of bubbles

Messages appear inside elegant cards.

The AI references

past memories,

journal entries,

photos,

previous struggles,

past victories.

It always remembers.

---

# 12. Companion Memory

The AI should naturally say things like

> Three weeks ago you described evenings as your most difficult time.

or

> Your writing has become noticeably calmer over the past month.

Memory creates trust.

---

# 13. Support Mode

This is the most important feature besides the Memoir.

Support Mode activates manually.

The user presses

```
I'm Having an Urge
```

Everything changes.

Navigation fades.

Background darkens.

Hero grows.

The app enters Support Mode.

---

Support Mode contains

Countdown

Breathing

Read My Reason

Cold Shower

Walk Timer

Reflection

AI Conversation

Journal

Emergency Notes

Nothing else.

Support Mode should reduce choices.

---

# 14. Recovery Experience

If the user reports an unlock,

the app never shames.

Instead

```
Welcome Back.

Every story has difficult chapters.

Let's begin today's page.
```

The memoir records the event honestly.

The AI discusses it constructively.

The dashboard resets calmly.

---

# 15. Insights

Insights are intentionally hidden behind Home.

Statistics should not dominate the experience.

Sections

Identity

Consistency

Photos

Mood

Journals

Milestones

Verification

Activity

Progress

Everything visual.

No spreadsheets.

---

# 16. Identity Screen

Instead of Statistics

The app presents

```
Promises Kept

Recovery Speed

Urges Overcome

Sessions Completed

Reflections Written

Pages Created

Photos Preserved

```

Everything reinforces identity.

---

# 17. Photo Library

Every photo

is preserved.

Grouped by

Year

↓

Month

↓

Chapter

↓

Day

Photos feel like memories,

not verification evidence.

---

# 18. Search

Global Search

Should instantly find

Journal text

AI conversations

Dates

Photos

Mood

Milestones

Quotes

Lessons

Everything.

---

# 19. Notifications

Notifications should feel personal.

Examples

Morning

> Good morning.
>
> Another page is waiting to be written.

Evening

> Today's chapter isn't complete yet.

Milestone

> Another promise kept.

Support Reminder

> Stay with today's commitment.

Never use

"Don't forget."

---

# 20. Settings

Minimal.

Only

Appearance

Notifications

Security

AI Provider

Backups

Exports

Privacy

Developer

Nothing else.

---

# 21. Profile

Profile should feel like looking at the cover of your autobiography.

Large portrait (optional).

Name.

Current Chapter.

Days Locked.

Identity Summary.

Lifetime Memoir.

Favorite Quote.

Current Goal.

No profile editing clutter.

---

# 22. Empty States

The application should always encourage.

Instead of

"No entries"

Display

```
Every great story begins
with a single page.
```

---

# 23. Error States

Errors should feel calm.

Never alarming.

Instead of

```
Upload Failed
```

Use

```
We couldn't save this page yet.

Let's try again.
```

---

# 24. Export Experience

Export is presented as

```
Publish Memoir
```

Formats

Interactive HTML

Premium PDF

Markdown

JSON Archive

Future EPUB

The export preview resembles a professionally typeset book.

---

# 25. User Journey

The complete experience is designed around four nested cycles:

## Daily Cycle

Morning ritual → Living with intention → Evening reflection → Memoir page created.

## Weekly Cycle

Review → Highlights → AI insights → Chapter progression.

## Monthly Cycle

A new chapter opens. The AI writes a reflective introduction based on the month's themes, progress, and notable moments.

## Lifetime Cycle

Every completed day adds another page to an ever-growing memoir. Over months and years, the user is not just collecting streaks—they are building a personal archive of growth that can be revisited, searched, and exported as a beautifully crafted autobiography.

---

# 26. The Core User Flow

Every feature ultimately supports this loop:

```text
Open App
      │
      ▼
Feel Protected
      │
      ▼
Complete Today's Ritual
      │
      ▼
Live Your Day
      │
      ├──────────────┐
      ▼              │
 Urge? → Support Mode│
      │              │
      └──────┬───────┘
             ▼
Evening Reflection
      │
      ▼
Today's Memoir Page is Written
      │
      ▼
Close App with Peace
```

Notice that **"Statistics" never appears in the core loop**. The emotional journey—not the metrics—is the product.

---

# 27. Final Experience Principle

When users think about LOCKEDIN-X months later, they should remember **how it felt**, not just what it tracked.

It should feel like returning each day to a beautifully designed place that quietly helped them become the person they wanted to be. Every interaction—from opening the app, to completing a ritual, to reading yesterday's memoir page—should reinforce the same idea:

> **"You're not maintaining a streak. You're writing the next page of your life."**

---

# End of Volume 3

## My recommendation before Volume 4

I think we now have enough vision and UX to start implementation. Rather than writing the functional requirements next, I'd actually create **Volume 4 as a complete screen specification**—every screen, bottom sheet, modal, onboarding step, gesture, edge case, and navigation flow (roughly 80–120 screens). That will allow Claude Code or Antigravity to build the application almost screen-for-screen instead of interpreting abstract requirements. After that, Volume 5 can focus on the technical architecture and data models. I think that ordering will get you to a working app significantly faster while preserving the experience you've defined.
