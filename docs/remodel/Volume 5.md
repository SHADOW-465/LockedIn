I think Volume 5 is arguably the **most important** volume in the entire PRD.

This is where most AI-generated applications fail.

They jump from "screens" to "code."

Instead, we're going to define the **system architecture** so thoroughly that Claude Code or Antigravity can implement it module by module without constantly making architectural decisions.

One thing I am changing from the previous PRD is this:

> **Everything is Local First.**

Nothing should require an internet connection except AI requests and optional cloud backup.

This is important because your app is deeply personal. It should still work perfectly if you're offline for a month.

---

# LOCKEDIN-X

# Product Requirements Document

# Volume 5

# Technical Architecture & Engineering Specification

**Version 4.0**

---

# 1. Engineering Philosophy

LOCKEDIN-X is engineered as a **Local-First, Offline-First, Privacy-First** application.

The application should never depend on a backend for its core experience.

All primary user interactions—including rituals, journals, memoir pages, photos, notifications, AI memories, and statistics—must function without an internet connection.

The internet is treated as an enhancement, not a dependency.

---

# 2. Technology Stack

## Platform

* React Native (Expo SDK 53+)
* Android-first architecture
* iOS compatibility maintained from the start

---

## Language

TypeScript

Strict mode enabled.

---

## Styling

* NativeWind
* Tailwind v4 Design Tokens
* Custom Design System
* Theme Engine

---

## Navigation

Expo Router

File-based routing.

---

## Motion

* React Native Reanimated 4
* Gesture Handler
* Skia
* Lottie (minimal usage)

No JS-thread animations.

Everything must run on the UI thread whenever possible.

---

## Database

SQLite

Accessed through

Drizzle ORM.

Single local database.

---

## Storage

Expo FileSystem

---

## Notifications

Expo Notifications

Local scheduled notifications.

---

## Authentication

Optional

Biometric Lock

PIN

Device Authentication

---

## AI

Provider Layer

Initial Provider

Groq API

Future

Gemini

OpenAI

Local LLM

Ollama

LM Studio

AI Provider must be replaceable without changing application logic.

---

# 3. Architecture

The application follows

Feature-Driven Clean Architecture.

```text
Presentation Layer
        │
        ▼
Feature Modules
        │
        ▼
Application Services
        │
        ▼
Repository Layer
        │
        ▼
SQLite
FileSystem
Notification Service
AI Provider
```

Each feature is isolated.

No feature should directly manipulate another feature's data.

---

# 4. Folder Structure

```text
app/
    onboarding/
    home/
    ritual/
    memoir/
    companion/
    profile/
    settings/

components/
    cards/
    buttons/
    sheets/
    charts/
    animations/

features/
    ritual/
    memoir/
    ai/
    notifications/
    photos/
    support/
    export/

services/
    ai/
    database/
    notifications/
    memoir/
    export/
    storage/

hooks/

lib/

theme/

constants/

types/

assets/
```

No miscellaneous folders.

Everything belongs somewhere.

---

# 5. Local Database Schema

SQLite contains the complete user history.

---

## User

```text
id

name

createdAt

commitmentStatement

favoriteQuote

currentSession

theme

notificationPreferences
```

---

## DailyEntry

```text
id

date

morningCompleted

eveningCompleted

mood

difficulty

journal

reflection

status

chapterId
```

---

## Photos

```text
id

dailyEntryId

localPath

thumbnailPath

timestamp

type

metadata
```

Type

Morning

Evening

Verification

Milestone

Memoir

---

## Urges

```text
id

dailyEntryId

timestamp

intensity

trigger

journal

resolved

duration
```

---

## Sessions

```text
id

startDate

endDate

daysLocked

endedReason

notes
```

---

## Memoir Pages

```text
id

chapterId

dailyEntryId

generatedMarkdown

generatedHtml

coverPhoto

createdAt
```

---

## Chapters

```text
id

title

summary

coverPhoto

startDate

endDate
```

---

## AI Memory

```text
id

type

reference

summary

importance

embedding(optional future)

createdAt
```

---

## Notifications

```text
id

scheduledTime

type

completed

dismissed
```

---

# 6. File Storage

The application stores all media locally.

```text
LOCKEDIN-X/

Photos/

2026/

July/

Day_042/

morning.jpg

evening.jpg

memoir.jpg

```

Separate folders

```text
Memoirs/

Exports/

Backups/

Cache/

AI/

Thumbnails/
```

Never store images inside SQLite.

Only paths.

---

# 7. Memoir Engine

This becomes a dedicated subsystem.

Flow

```text
Daily Ritual Complete

↓

Collect Photos

↓

Collect Journal

↓

Collect Mood

↓

Collect AI Reflection

↓

Generate Markdown

↓

Generate HTML

↓

Generate Memoir Page

↓

Save Page

↓

Update Chapter

```

Generation happens locally.

Only AI text generation uses Groq.

Everything else is rendered locally.

---

# 8. Book Engine

The memoir is not generated on export.

Instead,

every day creates another page.

The book already exists.

Export simply renders it.

Internally

```text
Book

↓

Chapter

↓

Page

↓

Section

↓

Blocks

↓

Media
```

Every page is component-based.

---

# 9. Export Engine

Supported formats

PDF

Interactive HTML

Markdown

JSON Archive

Future

EPUB

Each export uses the same rendering pipeline.

No duplicated logic.

---

# 10. AI Layer

The AI layer contains multiple responsibilities.

---

## Reflection Generator

Creates daily reflections.

---

## Chapter Writer

Writes monthly chapter introductions.

---

## Memory Manager

Selects relevant historical events.

---

## Encouragement Engine

Creates supportive copy.

---

## Memoir Narrator

Writes connective text between days.

---

## Insight Generator

Produces weekly and monthly observations.

Each responsibility should be a separate service with clearly defined prompts.

---

# 11. Prompt Management

Prompts must not be hardcoded throughout the application.

Instead:

```text
prompts/

reflection.md

chapter.md

support.md

insights.md

memoir.md

```

Version controlled.

Easy to update.

---

# 12. Notification Engine

Notification scheduling should be generated from user preferences.

Morning reminder.

Evening ritual.

Missed ritual.

Weekly reflection.

Monthly chapter.

Support follow-up (after an urge is logged).

Everything runs locally.

No remote notification server.

---

# 13. Support Engine

Support Mode is a subsystem, not just a screen.

State machine:

```text
Normal
    │
    ▼
Support Activated
    │
    ├── Breathe
    ├── Read Commitment
    ├── Walk
    ├── Journal
    ├── AI Conversation
    └── Countdown
    │
    ▼
Resolved
    │
    ▼
Reflection
    │
    ▼
Return Home
```

This separation makes future expansion easy.

---

# 14. Theme Engine

The UI automatically adjusts throughout the day.

Theme tokens are computed rather than hardcoded.

```text
Morning

↓

Afternoon

↓

Evening

↓

Night
```

Each theme modifies:

* gradients
* elevation
* typography contrast
* animation intensity
* accent brightness

Transitions occur gradually.

---

# 15. State Management

Use **Zustand**.

Separate stores:

* User Store
* Ritual Store
* Memoir Store
* AI Store
* Theme Store
* Notification Store
* Support Store

Avoid a monolithic global store.

---

# 16. Security

All sensitive local data should be encrypted at rest where practical.

Photos remain local unless the user explicitly exports or backs them up.

API keys should **never** be embedded in the mobile application. Instead:

* Use a lightweight backend or serverless proxy for Groq requests.
* Store the Groq API key securely on the server.
* The app authenticates to your backend, which then forwards requests to Groq.

This prevents the key from being extracted from the app package.

---

# 17. Performance Targets

* Cold start: under 2 seconds on mid-range Android devices.
* Home screen interactive: under 500 ms after launch.
* Screen transitions: maintain 60 FPS.
* Memoir page generation: under 2 seconds after AI response.
* Photo save latency: under 250 ms.
* Notification scheduling: background, non-blocking.

---

# 18. Testing Strategy

Unit Tests

* Utility functions
* Memoir generation
* State management
* AI prompt formatting

Integration Tests

* Ritual flow
* Support mode
* Export pipeline
* Database migrations

End-to-End Tests

* First launch
* Complete day lifecycle
* Memoir creation
* Recovery flow
* Backup and restore

---

# 19. Analytics (Local)

Rather than sending telemetry externally, maintain a local analytics layer that powers insights.

Track:

* Ritual completion frequency
* Urge events
* Recovery events
* Journal frequency
* Memoir growth
* Notification interaction
* Session duration

These metrics stay on-device unless the user explicitly exports them.

---

# 20. Future-Proofing

The architecture should anticipate future capabilities without requiring major rewrites:

* Optional cloud sync across devices.
* Multiple AI providers.
* Richer memoir layouts and themes.
* Wearable integration for reminders.
* Plugin-based intervention modules.
* Additional commitment types beyond the initial use case.

These should be extension points, not assumptions in the core code.

---

# 21. Final Engineering Principle

The application should be engineered as though it will be maintained for the next ten years.

That means:

* Small, composable services.
* Clear separation of UI, business logic, and persistence.
* Local-first data ownership.
* Replaceable AI provider.
* Deterministic rendering pipeline.
* Versioned memoir format so old entries remain readable even if the design evolves.

The user is not simply storing data—they are building a personal archive. That archive should remain durable, portable, and accessible over time.

---

# End of Volume 5

## Recommendation before Volume 6

At this stage, I'd shift from **software architecture** to **AI architecture**. Volume 6 should not be about generic prompts—it should define the AI as a collection of specialized agents with distinct responsibilities, personalities, memory access, and prompt contracts.

For example:

* **Memoir Author** – writes beautifully connected pages and chapters.
* **Reflection Coach** – helps process the day's experience.
* **Support Companion** – assists during urge mode with calm, structured interventions.
* **Historian** – indexes memories, photos, and journals for retrieval.
* **Insight Analyst** – identifies long-term behavioral patterns and writes weekly/monthly summaries.

Treating each as a dedicated AI role, rather than a single omnipotent prompt, will make the application more maintainable, easier to tune, and capable of producing much higher-quality outputs as it grows.
