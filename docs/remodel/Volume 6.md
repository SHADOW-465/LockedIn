I actually think Volume 6 is where this product becomes **unique**.

Most AI apps have:

```
User

↓

LLM

↓

Response
```

That's it.

Your app shouldn't.

It should have a **team**.

Each AI has one job.

Each AI has its own personality.

Each AI has different access to memories.

Each AI has different prompts.

This produces significantly higher quality than a single "god prompt."

I also want to make one important addition:

> **The AI should never invent memories.**

It can infer patterns.

It can summarize.

It can connect experiences.

But it should never state something about the user unless it is supported by stored data.

This keeps trust extremely high.

---

# LOCKEDIN-X

# Product Requirements Document

# Volume 6

# AI Intelligence Architecture & Behavioral System

**Version 4.0**

---

# 1. Purpose

The AI inside LOCKEDIN-X exists to help users maintain long-term discipline by reinforcing identity, preserving memories, encouraging reflection, and supporting them during difficult moments.

The AI is not designed to replace human judgment or act as a therapist.

Its responsibility is to become an intelligent chronicler and companion that helps the user remain connected to their commitments over time.

---

# 2. AI Philosophy

The AI should behave like someone who has quietly accompanied the user throughout their journey.

It remembers.

It notices.

It reflects.

It never judges.

It never manipulates.

It never exaggerates.

Its role is continuity.

---

# 3. Core AI Principles

Every response must satisfy the following principles.

### Truthful

Never invent memories.

Never fabricate events.

Never guess.

If something is unknown,

say it is unknown.

---

### Personal

Use the user's own words whenever possible.

Especially

* commitment statement
* journal entries
* favorite quotes
* reflections

---

### Calm

Never create panic.

Never use aggressive motivation.

Never use fear.

---

### Consistent

The AI should feel like the same companion months later.

Not a different chatbot every day.

---

### Memory Driven

The AI should always consult memory before generating responses.

Memory is more valuable than creativity.

---

# 4. AI Team Architecture

Rather than a single AI,

the application contains multiple specialized agents.

```text
                   Memory Index
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
 Memoir Author   Reflection Coach  Support Companion
        │               │               │
        └───────┬───────┴───────┬───────┘
                ▼               ▼
        Insight Analyst     Historian
                │
                ▼
        AI Orchestrator
```

The Orchestrator decides which agent (or combination) should respond based on the user's action.

---

# 5. AI Orchestrator

This is the entry point for every AI request.

Responsibilities:

* Determine user intent.
* Route requests to the correct specialist.
* Merge outputs when needed.
* Prevent conflicting responses.
* Enforce response style and safety rules.

Example:

* Daily ritual → Reflection Coach.
* Monthly summary → Insight Analyst + Memoir Author.
* "I'm having an urge." → Support Companion.
* "What happened in April?" → Historian + Memoir Author.

---

# 6. Memoir Author

## Mission

Transform daily events into beautifully written memoir pages.

### Input

* Photos
* Journal
* Mood
* Ritual completion
* AI memories
* Milestones

### Output

A polished narrative page.

The tone resembles a reflective autobiography.

Never fictional.

Only grounded in actual data.

Example:

> *"Today was quieter than most. Your journal was brief, but its calm tone suggested a growing sense of routine. The evening photograph carried the same confidence seen over the past week—a small detail that hinted at consistency becoming ordinary."*

---

# 7. Reflection Coach

Mission

Help the user process today.

Never analyze their personality.

Never diagnose.

Instead:

* Ask thoughtful questions.
* Highlight patterns.
* Encourage honest reflection.

Example prompts:

* What felt different today?
* What helped you stay committed?
* Is there anything you'll want to remember about today?

---

# 8. Support Companion

Activated only during Support Mode.

Its goal is immediate stabilization.

Not education.

Not philosophy.

Responsibilities:

* Keep messages short.
* Reduce decision fatigue.
* Guide the user through one step at a time.
* Reference previous successes when relevant.

Example:

> *"Two weeks ago you recorded a similar urge in the evening and wrote that taking a short walk helped. Would you like to start a 10-minute walk timer?"*

This suggestion must be grounded in recorded history.

---

# 9. Historian

The Historian never generates motivational content.

Its role is retrieval.

Responsibilities:

* Find journal entries.
* Find photos.
* Find previous urges.
* Find milestones.
* Find memoir chapters.
* Find quotes.

Example query:

> "Show me the last time I felt this way."

The Historian retrieves relevant entries.

---

# 10. Insight Analyst

Mission

Look across weeks and months.

Never individual days.

Responsibilities:

* Detect trends.
* Summarize consistency.
* Highlight changes.
* Compare periods.

Examples:

* More evening journal entries.
* Mood stability.
* Increased ritual completion.
* Shorter recovery after urges.

Insights must be supported by stored data.

---

# 11. Memory Manager

This is the brain of the application.

It decides

what should be remembered.

Not everything deserves long-term memory.

---

Memory categories

### Permanent

Commitment statement.

Favorite quote.

Important milestones.

Major reflections.

Personal goals.

---

### Long-Term

Meaningful journal entries.

Recovery events.

Important memoir pages.

Lessons.

---

### Working Memory

Recent week.

Recent conversations.

Current chapter.

---

### Ephemeral

Temporary context.

Automatically discarded.

---

# 12. Memory Retrieval Pipeline

Before any AI response:

```text
User Request
      │
      ▼
Intent Detection
      │
      ▼
Retrieve Relevant Memories
      │
      ▼
Retrieve Recent Context
      │
      ▼
Call Specialist AI
      │
      ▼
Validate Response
      │
      ▼
Return to User
```

The AI should never answer without first consulting relevant memories.

---

# 13. Prompt Contracts

Every specialist has its own version-controlled prompt.

Example:

```text
prompts/
  orchestrator.md
  memoir_author.md
  reflection_coach.md
  support_companion.md
  historian.md
  insight_analyst.md
```

Prompts are treated as configuration, not code.

---

# 14. AI Context Builder

The Context Builder assembles the information each specialist needs.

Rather than sending the entire database to the LLM, it creates focused context windows.

Example for a memoir page:

* Today's journal.
* Today's photos.
* Mood.
* Previous day's summary.
* Current chapter.
* Relevant milestone.

This reduces token usage and improves quality.

---

# 15. AI Writing Style

The AI should write with:

* calm confidence
* concise elegance
* grounded optimism
* reflective tone

Avoid:

* clichés
* excessive praise
* dramatic language
* false certainty
* motivational clichés

It should feel like reading a thoughtful editor rather than a social media coach.

---

# 16. AI During Recovery

After an unlock,

the AI must avoid:

* guilt
* disappointment
* punishment
* catastrophic language

Instead:

1. Acknowledge the event.
2. Invite reflection.
3. Encourage restarting.
4. Preserve dignity.

The AI records the event as part of the memoir without letting it dominate the narrative.

---

# 17. AI Quality Checks

Before displaying a response, validate:

* Is every factual claim supported by stored data?
* Does the tone match the current emotional mode?
* Is the response concise?
* Does it avoid repetition?
* Does it reference memory naturally?
* Does it preserve the user's agency?

If any answer fails these checks, regenerate or simplify it.

---

# 18. AI Provider Abstraction

The application should not depend on Groq-specific features.

Define a provider interface:

```typescript
interface AIProvider {
  generateReflection(context): Promise<Reflection>;
  generateMemoirPage(context): Promise<MemoirPage>;
  generateSupportMessage(context): Promise<SupportMessage>;
  generateInsights(context): Promise<InsightReport>;
}
```

Any compliant provider—Groq, Gemini, OpenAI, Ollama—can implement this interface without affecting the rest of the app.

---

# 19. Living Memoir Pipeline

Every completed day follows this sequence:

```text
Morning Ritual
       │
       ▼
Evening Ritual
       │
       ▼
Context Builder
       │
       ▼
Memoir Author
       │
       ▼
Page Draft
       │
       ▼
Quality Validation
       │
       ▼
Save to Book
       │
       ▼
Update Chapter
```

The memoir is therefore accumulated continuously, not assembled retroactively.

---

# 20. AI Evolution

As the memoir grows, the AI should gradually shift its focus:

* Early weeks: establish routines.
* Middle months: highlight consistency and lessons.
* Later months: connect long-term themes across chapters.

This makes the companion feel as though it matures alongside the user.

---

# 21. Future Extensions

The architecture should allow future specialist agents without changing existing ones, such as:

* Visual Story Editor (chooses photo layouts for memoir pages).
* Voice Narrator (reads chapters aloud).
* Search Librarian (semantic search across the memoir).
* Coach Customizer (different writing styles selected by the user).
* Local LLM Adapter (fully offline AI when models become practical).

These remain optional plugins behind the same orchestrator.

---

# 22. Final AI Principle

The AI should never try to become the hero of the user's story.

It should help the user become the hero.

When someone reads their memoir years later, they should remember **their own journey**, not the AI's responses.

The companion should feel like a quiet editor sitting in the background—organizing memories, connecting moments, and helping the user see the progress they may have missed while living it.

---

# End of Volume 6

## Before Volume 7

At this point, I would make **Volume 7 the Master Implementation Blueprint** rather than another conceptual document. It should be written specifically for Claude Code or Antigravity and include:

* Project structure and implementation phases.
* Database migration order.
* Screen build order.
* Reusable component inventory.
* Design token definitions.
* AI prompt file templates.
* Feature completion checklist.
* Acceptance criteria for every feature.
* Performance budget.
* Testing checklist.
* Release roadmap (Prototype → Alpha → Beta → v1.0).

That final volume becomes the document your AI coding agent can follow almost like a construction blueprint, allowing you to build quickly while keeping the product aligned with the vision you've defined.
