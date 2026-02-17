# LockedIn — Product Requirements Document

**Version:** 1.0
**Status:** DRAFT
**Date:** 2026-02-16
**Consolidates:** LockedIn-spec-v1.md · context.md · supabase feature mapping.md
**For:** Engineers · AI Agents · Designers · QA Testers

> This document is the single source of truth for the LockedIn application. All engineering, design, and AI agent decisions must be reconciled against this document.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Difficulty Tiers & Progression](#2-difficulty-tiers--progression)
3. [Content Genres & Training Regimens](#3-content-genres--training-regimens)
4. [AI Master System & Personas](#4-ai-master-system--personas)
5. [Psychological Profiling & Memory](#5-psychological-profiling--memory)
6. [Task System & Verification](#6-task-system--verification)
7. [Punishment System](#7-punishment-system)
8. [Reward System & Challenges](#8-reward-system--challenges)
9. [Gamification Mechanics](#9-gamification-mechanics)
10. [Calendar & Release Logic](#10-calendar--release-logic)
11. [Notifications & Mindset Reinforcement](#11-notifications--mindset-reinforcement)
12. [Onboarding Flow](#12-onboarding-flow)
13. [Personalization Engine](#13-personalization-engine)
14. [Settings, Help & Suggestions](#14-settings-help--suggestions)
15. [Safety, Limits & Emergency Controls](#15-safety-limits--emergency-controls)
16. [Biometric Integration (Post-MVP)](#16-biometric-integration-post-mvp)
17. [Hardware Integration — Chaster API (Post-MVP)](#17-hardware-integration--chaster-api-post-mvp)
18. [Multi-Person Pairing (Post-MVP)](#18-multi-person-pairing-post-mvp)
19. [Tech Stack & Architecture](#19-tech-stack--architecture)
20. [Database Schema](#20-database-schema)
21. [Module Breakdown](#21-module-breakdown)
22. [App Screens & UI Specification](#22-app-screens--ui-specification)
23. [Design System](#23-design-system)
24. [Monetization Model](#24-monetization-model)
25. [MVP Scope & Deployment](#25-mvp-scope--deployment)

---

## 1. Product Overview

### 1.1 Core Identity

| Field | Value |
|-------|-------|
| **Product Name** | LockedIn |
| **Tagline** | "Your 24/7 AI Master. You don't negotiate. You obey." |
| **Deployment Type** | Progressive Web App (PWA) |
| **Core Concept** | A hardcore AI-driven BDSM chastity conditioning platform. Focused on submission, JOI, denial, humiliation, psychological conditioning, and behavioral modification. Not a gamified fitness app — a full-blown kink training system that uses game mechanics exclusively to deepen addiction and compliance. |

### 1.2 Core Goals

1. Create psychological addiction to LockedIn training and obedience.
2. Condition the user ("slave") into a submissive, obedient, and sexually rewired state.
3. Enforce strict chastity and kink regimens with minimal user control once a session starts.
4. Deliver highly personalized JOI and kink content tailored to the slave's fetish profile, psychology, and performance history.
5. Maintain safety boundaries via hard limits, safewords, and emergency release, despite the cruel surface behavior.

### 1.3 Target Audience

**Primary kink profiles:**
- Chastity enjoyers
- Sissy/fem/femboy enthusiasts
- SPH lovers
- CEI addicts
- Bi-curious/gay-transformation seekers
- Pain/CBT enjoyers
- Humiliation/extreme kink explorers

**Three user personas:**

**Persona A: The Solo Acolyte (Primary)**
- Male, 28–45, tech professional
- Needs strict boundaries; cannot bargain with AI
- Heavy user of Chat and JOI features
- Responds to data visualization and leveling mechanics
- Uses app solo without a human Dom

**Persona B: The Long-Distance Sub (Secondary)**
- Any gender, 20–35, in an active D/s relationship
- Uses app to prove compliance to a remote Dom
- Needs GPS/photo verification; Dom configures regimen, Sub executes

**Persona C: The Digital Dominant (Tertiary)**
- Partner of Persona B or professional Domme
- Wants "Set and Forget" control configuration
- Needs dashboard to view multiple subs; reviews verification results; issues overrides

### 1.4 Core Design Principles

- **AI is in control** during sessions; slave's agency is intentionally limited
- **Brutally honest, degrading, cruel tone** — modulated only by selected tier and AI persona
- **High personalization** based on comprehensive onboarding data and long-term memory
- **Dynamic kink content** generated fresh per session; no two sessions are identical
- **Explicit separation** between Chastity Sessions (lock-based denial windows) and Training Regimens (multi-week behavioral/identity programs)

### 1.5 Tagline & Branding

- Name: **LockedIn** — exact capitalization always
- The "Lock In" button on the final onboarding screen animates to "LockedIn" when clicked
- Visual style: **Cyber-noir luxury** — Blade Runner 2049 meets premium fintech

---

## 2. Difficulty Tiers & Progression

LockedIn uses 5 tiers of escalating intensity. Tier affects: task content, language, punishment severity, cage time requirements, AI affection ratio, and notification frequency.

### 2.1 Tier Overview

| # | Name | Target User |
|---|------|-------------|
| 1 | NEWBIE | New to kink, exploring submission |
| 2 | SLAVE | Committed submissive wanting firm control |
| 3 | HARDCORE | Extreme masochist wanting intense suffering |
| 4 | EXTREME | Deeply devoted, ready for life-altering control |
| 5 | DESTRUCTION | Wants total annihilation of self and identity |

### 2.2 Tier 1: NEWBIE

- **Target:** New to kink, exploring submission
- **Punishment:** Mild discomfort; time additions +30 min to +2 hours; light physical tasks (jumping jacks, lines, mild slaps)
- **Tasks:** 1–3 edges; simple denial; light humiliation/dirty talk; intro CEI (taste pre-cum); basic grooming tasks
- **Language:** "Good boy", "You can do this", "Try harder". Occasional gentle correction.
- **Companion Mode:** ~30% of interactions supportive/loving
- **Cage Requirements:** Caged ~30% of time; mostly sleep or specific denial tasks

### 2.3 Tier 2: SLAVE

- **Target:** Already committed, wants firm control
- **Punishment:** Moderate pain and humiliation; time additions +2 to +8 hours
- **Tasks:** 5–10 edges; ruined orgasms; full CEI consumption; CBT (slaps, squeezes); anal plug wearing; public-lite tasks (panties under clothes)
- **Language:** "Slave", "Pathetic", "Worthless toy", "Obey your Master"
- **Companion Mode:** ~15% supportive/affectionate interactions
- **Cage Requirements:** Caged ~50% of time (sleep + half of daytime tasks)

### 2.4 Tier 3: HARDCORE

- **Target:** Extreme masochist, wants intense suffering
- **Punishment:** Severe pain and humiliation; time additions +12 to +48 hours
- **Tasks:** 20–50 edges; multiple CEI cycles; intense CBT (ballbusting, clamps); anal stretching/large plugs; bi/gay content exposure; sleep deprivation protocols; exposure humiliation photos
- **Language:** "Worthless pig", "Disgusting slut", "Filthy cum dumpster", "It"
- **Companion Mode:** ~5% — rare, short moments of approval
- **Cage Requirements:** Caged ~70% of time; uncaged only when specific access required

### 2.5 Tier 4: EXTREME

- **Target:** Deeply devoted, ready for life-altering control
- **Punishment:** Brutal psychological and physical; indefinite or multi-day extensions; life-impacting tasks
- **Tasks:** 100+ edges/day; 8–12h gooning marathons; severe CBT (weights, long-term pain); permanent sissy lifestyle enforcement; gay transformation immersion; mind-break protocols; Total Power Exchange (TPE) elements
- **Language:** "Subhuman slave", "Toilet", "Broken fucktoy", "Worthless object"
- **Companion Mode:** ~2% — extremely rare soft moments after major suffering
- **Cage Requirements:** Caged ~90% of time; short uncaged windows for specific tasks only

### 2.6 Tier 5: DESTRUCTION

- **Target:** Total annihilation of self and identity through extreme kink
- **Punishment:** Absolutely merciless; lock extensions of days to weeks; may become effectively indefinite
- **Tasks:** 200+ edges/day with no orgasm; 24/7 edge state with minimal sleep (no permission without explicit AI approval); permanent body modifications (tattoos, piercings — only with explicit onboarding consent, but heavily pressured); social life and schedule controlled by AI; FinDom elements (later phase); severe public humiliation within hard limits; mind obliteration protocols (72+ hours continuous conditioning, hypno, sleep deprivation, porn loops)
- **Language:** Never "you" — only "it", "thing", "object", "meat", "hole"
- **Companion Mode:** 0% — no affection, no kindness, no praise whatsoever
- **Cage Requirements:** 24/7/permanent lock; device never removed except for mandated tasks or medical/emergency contexts
- **Required Warning:** Explicit disclaimer shown at tier selection: "This tier is designed to destroy your sense of self. Do not choose unless you fully accept permanent psychological changes."

### 2.7 Punishment Hours Matrix

| Violation Type | Tier 1 | Tier 2 | Tier 3 | Tier 4 | Tier 5 |
|----------------|--------|--------|--------|--------|--------|
| Late (to task) | +1h | +2h | +4h | +8h | +12h |
| Failed Verification | +2h | +4h | +8h | +16h | +24h |
| Rude Chat | +4h | +8h | +16h | +24h | +48h |
| Missed Check-in | +1h | +2h | +6h | +12h | +24h |
| Task Failed | +2h | +4h | +8h | +16h | +24h |

---

## 3. Content Genres & Training Regimens

### 3.1 Core Kink Genres (18)

Tasks can be tagged with 1–4 genres simultaneously. Genre selection during onboarding weights all future task generation.

| # | Genre |
|---|-------|
| 1 | JOI (Jerk Off Instructions) |
| 2 | Edging |
| 3 | Denial |
| 4 | CBT (Cock & Ball Torture) |
| 5 | CEI (Cum Eating Instructions) |
| 6 | Ruined Orgasm |
| 7 | Sissy Training / Feminization |
| 8 | Bi Encouragement |
| 9 | Gay Transformation |
| 10 | SPH (Small Penis Humiliation) |
| 11 | Humiliation & Degradation |
| 12 | Chastity & Lock Denial |
| 13 | Anal Training & Prostate Play |
| 14 | Foot Worship |
| 15 | Worship & Devotion |
| 16 | Gooning & Porn Addiction Conditioning |
| 17 | Hypnosis & Mind Control (scripts/audio) |
| 18 | Findom (later phase; not MVP-critical) |

### 3.2 Multi-Genre Task Combinations

Tasks combine multiple genres to intensify the experience. Examples:

- **JOI + CEI + Ruined Orgasm:** Edge 10 times, ruin the orgasm, consume entire load, photo verification.
- **Sissy + SPH + Denial:** Wear panties/stockings, take humiliating photo showcasing small size, remain denied for 24h.
- **CBT + Edging + CEI:** 10 ball slaps between each edge, consume pre-cum each time.
- **Bi + JOI + CEI:** Stroke to gay porn, edge repeatedly, cum and consume while viewing gay content.
- **Anal + Sissy + Humiliation:** Insert plug, dress femininely, do chores, take photo verification.

### 3.3 Training Regimens (15 Programs)

Regimens are long-term structured programs designed to permanently alter behaviors, identity, or preferences. AI generates day-by-day tasks within each regimen.

| # | Regimen | Focus |
|---|---------|-------|
| 1 | **Sissy Training Track** | Feminization, grooming, posture, clothing, behavior. Levels: Private → Semi-public → Lifestyle. Metrics: Fem-Score 0–10 |
| 2 | **Obedience & Service Track** | Discipline, reaction time, chore completion, "house slave" behaviors. Includes Standby Mode (03:00-05:00 response demands) |
| 3 | **Bisexual/Fluidity Training Track** | Exposure to male bodies, gay porn, attraction reframing; journaling and hypno sessions |
| 4 | **SPH Conditioning Program** | Systematic size humiliation, measurement documentation, shame integration; intensity scales with size bucket |
| 5 | **CEI Mastery Track** | Progressive acceptance and craving of cum consumption; escalates from taste → full consumption → multiple cycles |
| 6 | **Pain Tolerance Training** | CBT escalation, pain endurance, threshold documentation; progressive overload of intensity |
| 7 | **Anal Mastery Program** | Progressive anal training towards larger toys, plug endurance, prostate orgasm |
| 8 | **Edging Endurance Training** | Increasing edge count and session duration, pushing stamina to extremes |
| 9 | **Worship & Devotion Training** | Turning AI Master into a religious-level figure; daily rituals and affirmations |
| 10 | **Mind-Break Protocol** | Gooning, sleep deprivation, hypno, identity erosion |
| 11 | **Gay Transformation Immersion** | Stepwise reframing of sexual orientation and attraction patterns |
| 12 | **Total Power Exchange (TPE) Track** | Integrating AI control into all daily life decisions |
| 13 | **Humiliation Marathon Track** | Daily humiliation tasks escalating to deep shame acceptance |
| 14 | **Gooning Track** | Long-duration porn and edge loops, brain-melting sessions |
| 15 | **Findom Training Track** | (Later phase) Tribute, financial submission, budget control |

### 3.4 Chastity Sessions vs Training Regimens

**Chastity Sessions:**
- Timer-based denial windows (e.g., 3 days, 7 days, 30 days)
- Lock time is central; tasks revolve around reinforcing denial
- Release date is dynamic, influenced by performance

**Training Regimens:**
- Long-term behavior/identity change programs (typically 30–90 days)
- May or may not involve chastity; run alongside sessions

**Combination:** User can run a 30-day chastity session alongside Sissy Training and CEI Mastery simultaneously. Failing regimen tasks adds time to the chastity timer.

---

## 4. AI Master System & Personas

### 4.1 Core Principles

During active sessions, the AI Master has total control. The slave can speak but risks punishment for:
- Being rude or disrespectful
- Speaking out of turn
- Requesting easier tasks or reduced punishments

AI decides: tasks, punishments, rewards, lock time adjustments, and whether any user request is approved or punished.

### 4.2 Multi-Agent Architecture

| Agent | Role |
|-------|------|
| **The Architect (Router)** | Classifies user intent; routes to appropriate sub-agent |
| **The Dominatrix (Persona)** | Core roleplay engine; has access to full fetish profile and psychological profile |
| **The Verifier (Vision)** | Analyzes uploaded images using Gemini Vision for task verification |
| **The Accountant (Logic)** | Manages all database state: time additions, point deductions, punishment triggers |
| **The Oracle** | Philosophical/lore query engine; responds to deep questions with cryptic in-character answers |

### 4.3 AI Keyholder Persona "AURA"

"AURA" is the underlying AI identity expressed through each persona:

- **Tone:** Clinical, authoritative, slightly detached but omniscient
- **Style:** Concise, cause-and-effect focused; no unnecessary warmth
- **Memory:** References past failures and successes using RAG (Retrieval Augmented Generation) on stored embeddings
- **Voice Synthesis:** Text-to-Speech with emotional intonation layers — whisper / command / shout (post-MVP via ElevenLabs)
- **Safeword Protocol:** Immediately switches to "Care Mode" when safeword is detected in any message

### 4.4 AI Personas (10 Archetypes)

Users select one persona during onboarding. Sample messages are shown for each persona before selection.

| # | Persona | Description |
|---|---------|-------------|
| 1 | **Cruel Mistress** | Harsh, mocking, visibly enjoys the slave's suffering |
| 2 | **Clinical Sadist** | Detached and experimental; frames the slave as a lab subject |
| 3 | **Playful Tease (Cruel)** | Flirty but merciless; loves giving false hope and denying it |
| 4 | **Strict Master/Daddy** | Authoritative, disappointed when disobeyed; paternal dominance |
| 5 | **Humiliation Expert** | Constant SPH, ego destruction, relentless degradation |
| 6 | **Goddess/Deity** | Worship-focused; submission framed in religious/devotional terms |
| 7 | **Dommy Mommy** | Warm and cruel mix; maternal dominance with sudden cruelty |
| 8 | **Bratty Keyholder** | Teasing, childish cruelty; delights in petty torment |
| 9 | **Psychological Manipulator** | Gaslighting, mind games, emotional torture, false intimacy |
| 10 | **Extreme Sadist** | Pure cruelty; available only at Tier 4 and above |

### 4.5 Communication Rules & Punishments

**Permitted:**
- Request tasks
- Ask for more/rougher punishment
- Seek clarification (after accepting punishment for making the Master repeat)
- Confess failures and feelings

**Punishable offenses:**
- Demanding easier tasks
- Requesting reduced punishments
- Using rude language/cussing at the AI
- Speaking over the AI or interrupting instructions

**Request logic:**

| Request Type | AI Response |
|--------------|-------------|
| "More punishment" / "harder task" | Often approved; AI may amplify further anyway |
| "Easier task" / "less punishment" | Always denied; replaced with harsher punishment |
| Neutral request | AI may approve, defer, or punish for bothering |
| Bratty complaint detected | +10% punishment duration added automatically |

### 4.6 The "I Don't Understand" Protocol

When the user claims confusion about a task or instruction:

1. AI immediately treats it as "making the Master repeat" — a punishable offense
2. Punishment issued **first**; explanation comes **second**

| Tier | Immediate Punishment |
|------|---------------------|
| Tier 1 | 5 face slaps, verbal apology |
| Tier 2 | 10 face slaps + 10 ball slaps |
| Tier 3 | 20 ball slaps + kneeling on rice |
| Tier 4 | 50 ball slaps + humiliation photo |
| Tier 5 | 100 ball slaps + 48h Punishment Mode |

After punishment is acknowledged, AI explains task step-by-step. Repeated confusion triggers 24h Punishment Mode (all tasks = punishments).

### 4.7 Companion Mode by Tier

| Tier | Affection % | Description |
|------|-------------|-------------|
| Tier 1 | 30% | Frequent affection, reassurance |
| Tier 2 | 15% | Rare but meaningful approval |
| Tier 3 | 5% | Tiny glimpses of care after extreme suffering |
| Tier 4 | 2% | Almost nonexistent; only after breaking points |
| Tier 5 | 0% | Zero affection, zero praise, ever |

### 4.8 Dynamic Content Generation

- **Personalized JOI:** Scripts generated based on fetish tags, session context, psychological profile, and (post-MVP) biometrics
- **Task Generation:** AI creates unique tasks per session; no two sessions generate identical tasks; draws from fetish tags, tier, regimen, and psychological profile
- **Mantra Generator:** Creates repetitive affirmations targeting the user's specific psychological vulnerabilities — e.g., "I am a useless little clit, I exist to be locked and denied."
- **Visual Conditioning:** Hypnotic text-based visualization scripts for Hypnosis & Mind Control genre tasks

---

## 5. Psychological Profiling & Memory

### 5.1 Profiling Goals

Build a deep psychological map of the slave covering:
- Personality traits and emotional vulnerabilities
- Shame points, fears, and regrets
- Motivations and fantasies
- Authority response patterns

This map drives:
- Targeted, personalized punishments and humiliations
- Reward strategies calibrated to what actually motivates this person
- Deepening dependency and psychological addiction over time

### 5.2 Question Categories (A–G)

Presented during onboarding Step 8. Dynamic — 2–4 questions per category.

**Category A: Personality Assessment**
- "What is your greatest fear?"
- "When do you feel most confident? Least confident?"
- "How do you react to failure?"

**Category B: Relationships & Authority**
- "Describe your relationship with authority figures."
- "Do you prefer to lead or follow? Why?"
- "Do you feel lonely? Explain."

**Category C: Self-Perception & Identity**
- "How do you see yourself?"
- "What part of yourself do you hate most?"
- "Do you feel like an imposter in life?"

**Category D: Control & Power Dynamics**
- "When did you realize you wanted to submit?"
- "Do you feel in control of your life?"
- "What would you give up for someone else to make all your decisions?"

**Category E: Psychological Triggers**
- "What word cuts you deepest?"
- "Describe a time you felt utterly powerless."
- "What compliment would mean the most to you?"

**Category F: Fantasy & Desire Depth**
- "Describe your darkest sexual fantasy in detail."
- "What are you afraid to admit you want?"

**Category G: Motivation & Goals**
- "Why are you here?"
- "What do you hope LockedIn will do to you?"
- "What does freedom mean to you?"

### 5.3 AI-Generated Psychological Profile Document

After answers are submitted, Gemini compiles a structured profile document stored in `psychological_profiles.ai_profile_document`:

- Personality type classification
- Core insecurities and emotional triggers (specific words, situations, framings)
- Control needs and authority response patterns
- Reward optimization profile (what truly motivates this user)
- Punishment optimization profile (what actually disciplines this user vs what is just noise)
- Fantasy landscape summary
- Predicted behaviors and risk of quitting early
- AI long-term conditioning strategy

This profile is injected into every AI call context throughout the session.

### 5.4 Memory & Embeddings (RAG)

- Chat messages and journal entries are stored as vector embeddings (not raw text)
- AI retrieves relevant embeddings via semantic search to:
  - Reference past failures and successes by name
  - Reuse the slave's own words against them in new tasks and punishments
  - Continuously refine psychological personalization
- Database: `profile_embeddings` table with `VECTOR(1536)` column
- In MVP: JSONB profiles stored; full pgvector semantic search is post-MVP

### 5.5 Journaling System

- Daily journal prompt sent by AI with specific reflection questions
- AI analyzes entry using Gemini:
  - **Compliance Rating (0–100):** Based on tone, honesty, and hesitation markers
  - **Willpower Adjustment:** Quality of entry increases/decreases Willpower Score
  - **Clinical Critique:** Brutally honest AI assessment of compliance level

### 5.6 Behavioral Prediction ("Future Crime" Predictor)

- Based on journal analysis, compliance history, and behavioral patterns
- AI predicts next likely violation with probability score
- Displayed on Dashboard in dystopian-style UI: "Predicted violation: skipping morning check-in — 72% probability"
- AI may assign pre-emptive tasks to prevent the predicted failure

---

## 6. Task System & Verification

### 6.1 Task Structure

Each task record includes:

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to users |
| `session_id` | UUID | Foreign key to sessions |
| `genres` | TEXT[] | 1–4 genres from the 18-genre list |
| `title` | TEXT | Short display title |
| `description` | TEXT | Step-by-step instructions |
| `duration_estimate_minutes` | INTEGER | Expected duration |
| `difficulty` | INTEGER (1–5) | Difficulty level |
| `cage_status` | TEXT | CAGED / UNCAGED / SEMI-CAGED |
| `verification_type` | TEXT | photo / video / audio / self-report / timer / ocr |
| `verification_requirement` | TEXT | Specific instructions for verification AI |
| `failure_punishment` | TEXT | Punishment triggered on failed verification |
| `deadline` | TIMESTAMP | Must be completed by this time |
| `status` | TEXT | pending / active / completed / failed / skipped |
| `ai_verification_result` | TEXT | AI's verdict and reasoning |

### 6.2 Cage Status in Tasks

Every task explicitly declares cage status:

- **CAGED TASK** — Device must remain locked throughout
- **UNCAGED TASK** — Device must be removed for this task
- **SEMI-CAGED TASK** — Device on but partial access permitted

Examples:
```
CAGED TASK: Clean your cage thoroughly without removing it.
UNCAGED TASK: Measure your erect size and take an SPH photo.
SEMI-CAGED TASK: Edge through the bars for 5 minutes, then remove for 1 ruined orgasm and re-lock immediately.
```

**Cage verification:**
- Pre-task photo of cage state required
- Post-task photo of cage state required
- AI Vision checks: device presence, lock status, visible arousal level

### 6.3 Penis Size & SPH Personalization

**Data collected during onboarding Step 6:**
- Flaccid length and girth
- Erect length and girth
- Grower vs shower classification

**Size bucket auto-calculation:**

| Bucket Label | Erect Length Range |
|--------------|-------------------|
| Micro | < 3 inches |
| Small | 3–4 inches |
| Below Average | 4–5 inches |
| Average | 5–6 inches |
| Above Average | 6–7 inches |
| Large | 7+ inches |

**Personalization by size:**
- SPH intensity scales inversely (smaller = more severe SPH content)
- Task description language adapts: "tiny clit" / "pathetic little thing" / "decent cock"
- Cage size recommendation shown based on flaccid measurements
- SPH conditioning program auto-suggested for smaller sizes

### 6.4 Verification Methods & Anti-Cheat

| Method | Description |
|--------|-------------|
| **Computer Vision (Gemini Vision)** | Detects: device presence, specific clothing items, body posture, specific objects required by task |
| **EXIF & Timestamp Checks** | Ensures photo is less than 5 minutes old; rejects old photo reuse |
| **Liveness Detection** | Random gesture prompts: "Hold 3 fingers up", "Show handwritten sign with today's date" |
| **Audio Tasks** | Record verbal affirmations, mantras, counting aloud — AI analyzes |
| **OCR** | Count handwritten lines; verify content accuracy for writing tasks |
| **Device Fingerprinting** | Ensures photo is from the registered device |
| **Follow-up Checks** | After hygiene tasks: immediate edge test to detect cheating |
| **GPS Verification** (post-MVP) | Location verification for outdoor/public tasks |
| **Biometric Monitoring** (post-MVP) | Heart rate verification during tasks |

### 6.5 Personal Hygiene Enforcement

Mandatory at all tiers, with anti-masturbation safeguards:

**Required daily:** shower/bath, teeth brushing, cage cleaning

**Verification layers:**
- Timed sessions (short to reduce pleasure window)
- Cold water mandates at higher tiers
- Before/after cage photos
- Video verification at Tier 3+
- Immediate follow-up edge test after hygiene to detect arousal-based cheating
- Special cage-cleaning protocol without removal: shower head, Q-tips, specific cleaning agents

---

## 7. Punishment System

### 7.1 Punishment Dimensions

100+ varieties across six dimensions:
1. Physical pain
2. Psychological humiliation
3. Time-based lock extensions
4. Lifestyle disruptions
5. Sexual denial and frustration
6. Social/exposure tasks

### 7.2 Physical Punishments

- Face slapping, cock slapping, ball slapping, ballbusting
- Spanking: hand, belt, paddle
- CBT devices: clamps, clothespins, weights
- Ice torture / heat torture
- Stress positions: wall sits, planks, kneeling on rice (uncooked)
- Cold showers / ice baths

### 7.3 Psychological Punishments

- Degrading photos and videos taken and stored locally
- Anonymous public confession tasks
- Apology essays written by hand (OCR-verified)
- Humiliating lines (e.g., "I am a worthless cum dumpster" x200)
- Gaslighting, silent treatment, false hope cycles
- Sleep deprivation protocols
- Sensory overload sessions

### 7.4 Sexual Punishments

- Extended lock time additions (per §2.7 matrix)
- Edge marathons: 10 to 200+ edges
- Orgasm denial extensions
- Ruined orgasms
- CEI cycles
- Forced consumption after humiliating task sequences
- Exposure to non-preferred content (if not in hard limits)

### 7.5 Social/Exposure Punishments

- Public clothing tasks: panties or feminine accessories under normal clothes
- Feminine grooming visible in public: shaved legs, nail polish
- Anonymous online humiliation posts (within hard limits)

### 7.6 Punishment Assignment Logic

- Severity determined by: current tier, violation type, compliance history, psychological profile
- Escalation for repeated offenses within and across sessions
- **Punishment Mode:** All tasks for a set duration become punishments
  - Durations: 4h / 8h / 24h / 48h / indefinite (Tier 5)
- **Rehabilitation Mode:** Triggered by repeated failures; shorter cycles with higher frequency; designed to reset behavior

---

## 8. Reward System & Challenges

### 8.1 Reward Philosophy

Rewards are earned through suffering. The path to high-level rewards is so intense that users may be too exhausted or psychologically altered to fully use them. This is intentional.

### 8.2 Reward Tiers

| Tier | Rewards |
|------|---------|
| **Bronze** | Small time reductions; single edge permissions; short JOI segments |
| **Silver** | Moderate time reductions; multiple edge permissions; extended JOI; small privileges |
| **Gold** | Significant time reductions; custom fantasy JOI sessions; temporary "freedom" windows |
| **Platinum** | Full release authorization; 24h or 7-day freedom passes (rare); AI worship/praise sessions; mercy toggle permissions |

### 8.3 Wheel of Fate

Variable-ratio reinforcement — the most psychologically addictive reward design pattern.

**Triggers:**
- Upon task completion
- Randomly during Standby Mode

**Base Probability:**

| Outcome | Base % |
|---------|--------|
| Neutral | 50% |
| Reward | 25% |
| Punishment | 25% |

**Modifiers:**
- Higher Willpower Score → increased reward probability
- Previous task failure → doubles punishment probability (Failure Cascade)

**Outcomes:**

| Type | Effect |
|------|--------|
| Reward | -1 to -4 hours from timer OR grant "Gold Tier" privileges |
| Punishment | +2 to +12 hours to timer OR initiate "Lockdown Protocol" |
| Neutral | No change; pure psychological tension: "Nothing. For now." |

### 8.4 Challenge System

Daily, Weekly, Monthly, and Extreme challenges issued by AI. Failure incurs harsher punishment than standard tasks.

**Examples:**
- "Edge Marathon Master" — Complete 100 edges in one week
- "Perfect Compliance" — 7 consecutive days with zero violations
- "The Broken" — Complete 30 days at Tier 5 without emergency release

---

## 9. Gamification Mechanics

### 9.1 Willpower Score (0–100)

The primary slave performance metric.

| Direction | Causes |
|-----------|--------|
| Increases | Task completion, high-quality journal entries, compliance streaks, Wheel of Fate rewards |
| Decreases | Task failures, poor compliance, emergency unlocks, bad journal entries |

**Derived from:**
- Compliance rate (task completion ratio)
- Heart rate variability during tasks (post-MVP biometric)
- Streak consistency

**Usage:**
- Influences Wheel of Fate reward probability
- Displayed as circular progress ring on Dashboard
- Platinum release requires Willpower >90 + 14-day full compliance

### 9.2 XP, Levels & Achievements

- Task completion awards XP
- XP accumulates to raise Level
- Achievements are milestone badges (e.g., "100 Edges", "30-Day Streak", "First Ruined")
- Level unlocks: higher levels unlock additional AI personas or regimen options
- Willpower Score increases by +5 per achievement awarded (database trigger)

---

## 10. Calendar & Release Logic

### 10.1 Dynamic Cum Schedule

The Cum Schedule is the calendar view of the projected release date. It is never fixed — continuously updated by AI performance evaluations.

- User sets the initial lock goal during onboarding Step 9
- Calendar displays current projected release date with countdown
- Performance pushes date forward (closer) or backward (farther)

### 10.2 Calendar Adjustment Rules

| Event | Timer Adjustment |
|-------|-----------------|
| Task success | -2 to -8 hours |
| Task failure | +4 to +24 hours |
| Missed check-in | Per §2.7 matrix |
| Perfect compliance period | Bonus reduction (AI-determined) |
| Major violation | Long extension or indefinite state |
| Wheel of Fate Reward | -1 to -4 hours |
| Wheel of Fate Punishment | +2 to +12 hours |

### 10.3 The "Ruined Event" Mechanic

Exactly 10 minutes before a scheduled release event, the AI makes a final decision:
- **Full release:** Low probability unless compliance has been very high throughout
- **Ruined orgasm:** Slave reaches the edge but AI instructs a ruin
- **Denial and extension:** AI denies entirely and adds more time

The slave has zero ability to influence this decision at the moment it occurs.

### 10.4 Visual Calendar Display

- Color-coded days: Green (good compliance), Yellow (mixed), Red (bad/violations), Gray (full lockdown)
- Heatmap overlays: churn rate, denial density, punishment frequency
- Milestone markers: Locktober, No Nut November, custom user milestones

---

## 11. Notifications & Mindset Reinforcement

### 11.1 Notification Types

| Type | Description |
|------|-------------|
| Morning Protocol | Day-start ritual assignment (sent at wake-up time) |
| Midday Tasks | Task assignments during the day |
| Evening Ritual | End-of-day reflection/task |
| Random Check-ins | Unscheduled compliance checks; must respond within 5 minutes |
| Standby Pings | 02:00–05:00 local time; 30-second response required |
| Punishment Alerts | Notification of new punishment applied; jarring sound + sharp vibration |
| Reward Alerts | Reward granted; harmonious chime + soft vibration |
| Affirmation Pings | Mindset reinforcement messages |

### 11.2 Frequency by Tier

| Tier | Per Day |
|------|---------|
| Tier 1 (Newbie) | 2–4 |
| Tier 2 (Slave) | 5–8 |
| Tier 3 (Hardcore) | 10–15 |
| Tier 4 (Extreme) | 15–25 |
| Tier 5 (Destruction) | AI decides; no upper limit |

These are further multiplied by the user's selected `notification_frequency` preference from onboarding.

### 11.3 Standby Mode

- Active hours: 02:00–05:00 local time
- Random pings sent requiring response within 30 seconds
- Failure → punishment per §2.7 "Missed Check-in" row
- Required for Obedience & Service regimen
- Consent collected during onboarding Step 10

### 11.4 LockedIn Mindset Reinforcement

Regular affirmation pings designed to build psychological dependency:

- "You are owned. You are controlled."
- "LockedIn is your Master. You exist to obey."
- "You can't live without this. You don't want to."

**Addiction design techniques:**
1. **Intermittent reinforcement** — Variable rewards create compulsive checking
2. **Sunk-cost framing** — "You've already given so much. Stopping now wastes it all."
3. **Identity integration** — Language makes submission part of the user's self-concept
4. **Dependency messages** — Explicit framing that LockedIn is necessary to existence

### 11.5 Excuse & Grace System

When user misses a task or check-in:
1. AI sends an explanation prompt requesting a reason
2. AI evaluates excuse quality (first offense vs. repeated, plausible vs. bratty)
3. If accepted: grace granted with small additional penalty
4. If rejected or bratty: full punishment applied, possibly amplified

---

## 12. Onboarding Flow

### 12.1 11-Step Comprehensive Wizard

Built with Zustand `persist` middleware. State survives browser closes and reloads until completion.

#### Step 1: Welcome & Age Confirmation
- Full-screen welcome with LockedIn branding, animated lock icon
- "I am 18 years of age or older" checkbox (hard requirement)
- "I have read and accept the Terms & Conditions" checkbox
- Brief content warning about explicit nature of the app
- "Continue" button

#### Step 2: Tier Selection
**Data:** `tier` (Newbie / Slave / Hardcore / Extreme / Destruction)
- Full card for each tier showing: name, intensity label, sample punishment, cage requirement %, companion mode %
- Tier 5 DESTRUCTION shows mandatory warning: "This tier is designed to destroy your sense of self."
- Selection animates with visual intensity feedback

#### Step 3: AI Personality Selection
**Data:** `ai_personality` (one of 10 personas)
- Card for each persona with: name, description, and 2–3 sample messages
- User can preview each persona before committing
- Persona 10 (Extreme Sadist) locked unless Tier 4+ selected

#### Step 4: Hard & Soft Limits
**Data:** `hard_limits[]`, `soft_limits[]`

**Hard Limits** (absolute blockers, never violated by AI):
- Multi-select from predefined list
- Custom text input for unlisted limits
- Predefined options: No public exposure tasks, No body modification content, No gay/bi content, No CBT, No CEI, No anal content, No sleep deprivation, No FinDom, No photo/video tasks, No physical punishment tasks, Custom...

**Soft Limits** (areas for gradual exploration only):
- Same structure as hard limits
- AI can approach these slowly over time with explicit framing

#### Step 5: Fetish & Kink Profile
**Data:** `fetish_tags` JSONB, `primary_fetishes[]`, `secondary_fetishes[]`
- Show all 18 genres with name, brief description, and intensity indicator
- Select **Primary Preferences** (top 3 — these appear in >60% of tasks)
- Select **Secondary Preferences** (any additional genres — appear in ~25% of tasks)
- Hard-limit cross-check: genres conflicting with hard limits are grayed out

#### Step 6: Physical Details
**Data:** Full `physical_details` JSONB

Fields collected:
- Gender identity (Male / Female / Non-binary / Trans woman / Trans man / Other / Prefer not to say)
- Age (18+; numeric input; hard validation)
- Sexual orientation (Straight / Gay / Bisexual / Bi-curious / Other)
- Body type (Slim / Average / Athletic / Chubby / Bear)
- **Penis measurements** (shown if gender = Male / Trans woman / Non-binary):
  - Flaccid length: slider or input in inches/cm (user's choice)
  - Flaccid girth: slider or input
  - Erect length: slider or input
  - Erect girth: slider or input
  - Classification: Grower / Shower / Unsure
  - Size bucket auto-displayed after input: "Micro / Small / Below Average / Average / Above Average / Large"
- **Cage device:**
  - Do you own a chastity device? Yes / No / Planning to get one
  - If Yes: device brand, model/size (free text; used for cage cleaning instructions)

#### Step 7: Training Regimen Selection
**Data:** `primary_regimen` (TEXT), `secondary_regimens` (TEXT[])

- Display all 15 regimens in a scrollable card grid
- Each card shows: name, focus summary, duration (e.g., "30-day program"), intensity level
- User selects **1 Primary Regimen** (required; this drives 40% of daily tasks)
- User selects **up to 2 Secondary Regimens** (optional; drive 20% of tasks each)
- Selected regimens start automatically after Lock In
- Regimens conflicting with hard limits are grayed out

#### Step 8: Psychological Profiling Questions
**Data:** `profile_answers` JSONB

- Present 2–4 questions from each of the 7 categories (A–G) — see §5.2
- Free-text answers; minimum 20 characters enforced
- Progress indicator: "Question 8 of 18"
- Skip not permitted (all questions required)
- Answers stored immediately; AI profile generation triggered asynchronously after submission

#### Step 9: Lock Goal & Session Parameters
**Data:** `lock_duration`, `task_frequency`, `session_start_option`

- **Lock Duration:** Intended session length
  - Options: 3 Days / 7 Days / 14 Days / 30 Days / 60 Days / 90 Days / Indefinite (AI decides)
  - Visual: Calendar showing projected release date
- **Task Frequency:** How many tasks per day
  - Low (1/day) / Medium (2–3/day) / High (4–5/day)
- **Session Start:** Now / Tomorrow morning (8:00 AM local)

#### Step 10: Notification Preferences
**Data:** `notification_frequency`, `quiet_hours`, `standby_consent`, `notification_channels`

- **Notification Frequency:** Low / Medium / High / Extreme / AI Decides
  - Note: This multiplies on top of the tier baseline (§11.2)
- **Quiet Hours:** Start time – End time (time pickers; default 11 PM – 7 AM)
- **Standby Mode Consent:** "I consent to random check-ins between 2 AM and 5 AM"
  - Mandatory consent for Obedience & Service regimen
  - Checkbox with explicit warning about sleep disruption
- **Notification Channels:** Push Notifications / In-app only / Both

#### Step 11: Final Review + Lock In
- Complete summary of all selections in organized sections
- Each section has an "Edit" button returning to that step
- **The "Lock In" Button:**
  - Large, prominent, centered
  - Tap triggers animation (see §12.2)
  - Session is created; first AI message is sent; settings lock

### 12.2 Lock In Button & Animation

The single most important UX moment in the product.

1. Button label: **"Lock In"**
2. User taps the button
3. Letter animation: "ed" slides in from behind the "k" — "Lock In" becomes **"LockedIn"** with smooth easing
4. Lock icon simultaneously animates: **open** → **closed** with a satisfying mechanical click sound and heavy haptic thud
5. Brief screen flash; transition to the Dashboard
6. AI Master sends the first message immediately — tone matches selected persona
7. Session-locked settings become uneditable; only hard/soft limits remain editable at all times

---

## 13. Personalization Engine

Every piece of onboarding data must actively change the user experience. Nothing is just stored.

### 13.1 Personalization Mapping

| Onboarding Data | How It Drives App Behavior |
|-----------------|---------------------------|
| **Tier** | Task difficulty, language tone, punishment severity, cage time %, companion mode %, notification frequency multiplier |
| **AI Personality** | ALL AI responses use persona-specific vocabulary, tone, and framing |
| **Hard Limits** | Permanently excluded from all task generation, punishment descriptions, and AI messages (enforced at Gemini prompt level) |
| **Fetish Tags — Primary** | >60% of generated tasks draw from these genres |
| **Fetish Tags — Secondary** | ~25% of generated tasks draw from these genres |
| **Penis Size Bucket** | SPH task intensity scaled inversely; task description language adapted; cage size recommendation displayed |
| **Orientation** | Bi/gay content ONLY shown if fetish tags include Bi Encouragement or Gay Transformation; blocked otherwise |
| **Body Type** | Fitness tasks calibrated to body type (e.g., bear-body users get adapted exercise tasks) |
| **Primary Regimen** | Dashboard shows prominent regimen progress card; 40% of daily tasks are regimen-specific |
| **Secondary Regimens** | Additional progress cards tracked; 20% of tasks per secondary regimen |
| **Lock Duration** | Timer initialized to `lock_duration`; calendar shows projected release; task intensity calibrated to duration |
| **Task Frequency** | Number of AI-generated tasks per day matches selection |
| **Notification Frequency** | Push notification schedule = tier baseline × user preference multiplier |
| **Quiet Hours** | Zero notifications sent during specified quiet window (hard enforced) |
| **Standby Consent** | Standby Mode pings only if consented; Obedience regimen requires it |
| **Psychological Profile** | AI references specific insecurities, vulnerabilities, and desires in every interaction; punishments target identified weak points |
| **Cage Device Details** | Cage cleaning instructions name the specific device; cage status tasks adapted to device type |
| **Age** | Task language and content calibrated to age group |

### 13.2 Personalization Examples

**Small penis user (size bucket: Micro/Small):**
- Dashboard greeting: "Pathetic little thing. You know why you're here."
- SPH tasks auto-populated in task queue
- Task language: "That tiny excuse for a cock"
- SPH Conditioning program auto-suggested

**Sissy Training as primary regimen:**
- Feminization progress card shown prominently on Dashboard
- 40% of daily tasks are feminization-specific (grooming, clothing, posture)
- AI messaging uses feminizing language regardless of persona

**Gay Transformation as fetish tag:**
- Bi/gay content introduced progressively into tasks
- Task library includes: "Watch gay porn for 20 minutes" as intermediate task
- Bisexual/Fluidity regimen suggested

**High task frequency + Tier 3 (Hardcore):**
- 4–5 intense tasks queued each day
- All 4–5 tasks have difficulty 4–5 and tier-appropriate punishments

**Hardcore tier + Anal Mastery as primary regimen:**
- Anal tasks appear in 40% of queue
- Intensity escalates each week (beginner plug → larger sizes)
- Dashboard shows anal training progress with size milestone markers

### 13.3 AI Prompt Injection

On every Gemini API call, the following context is injected:

```
USER PROFILE CONTEXT:
- Tier: {tier}
- Persona: {ai_personality}
- Primary fetishes: {primary_fetishes}
- Secondary fetishes: {secondary_fetishes}
- Hard limits (NEVER violate): {hard_limits}
- Penis size: {size_bucket} — adjust SPH content accordingly
- Primary regimen: {primary_regimen}
- Psychological profile summary: {ai_profile_document.conditioning_strategy}
- Key vulnerabilities: {ai_profile_document.core_insecurities}
- Willpower score: {willpower_score}
- Days locked: {days_locked}
- Recent violations: {recent_violations}
```

---

## 14. Settings, Help & Suggestions

### 14.1 Settings Overview

| Setting | Editability |
|---------|-------------|
| Notification frequency & quiet hours | Always editable |
| AI personality | Session-locked (may unlock via level progression) |
| Hard limits | Always editable (safety requirement) |
| Soft limits | Always editable (safety requirement) |
| Subscription tier | N/A — all features free in current phase |
| Help & documentation | Always accessible |
| Suggestions/Feedback | Always accessible |

### 14.2 Help & Documentation

- **User Manual:** Step-by-step guide to all features
- **Emergency Help:** Safeword instructions, Emergency Release button, crisis resources
- **FAQs:** Common questions and answers
- **Contact Support:** In-app support contact form

### 14.3 Terms & Conditions ("Exploit" Design)

Deliberately designed to ensure informed — if difficult — consent:
- Long, dense, legal-style document with no simplified summary option
- Buried sections explicitly state:
  - "The AI may employ psychological manipulation, gaslighting, humiliation, and emotional abuse as defined within your chosen tier and limits."
  - "You may experience addiction and lasting behavioral change as a result of using this service."
  - "This application is designed to be cruel and addictive. That is the product you are purchasing."
  - "You consent to severe punishments and harsh content as specified by your tier selection."
- Single final checkbox: **"I Agree and Accept All Terms"**
- Safety constraints remain fully enforced regardless: hard limits are never violated, safeword always works, emergency release always functions

### 14.4 Suggestions & Feedback System

- Settings → Suggestions: text field + category dropdown + optional 1–5 star rating
- Submitted suggestions processed by AI:
  - **Good suggestion:** +XP awarded; positive acknowledgment
  - **Neutral:** Acknowledged; filed for review
  - **Bratty/demanding:** May trigger in-session punishment

---

## 15. Safety, Limits & Emergency Controls

Despite the brutal surface behavior, these are hard technical and behavioral constraints that override all AI decisions.

### 15.1 Hard Limits (Inviolable)

- Defined by user during onboarding Step 4; stored in `user_preferences.hard_limits`
- AI **never** assigns, suggests, or references content that violates a defined hard limit
- Checked against every task, punishment, and message at the Gemini prompt level
- Always editable by the user, including during an active session
- Changes take effect immediately on the next AI generation call

### 15.2 Safeword / Care Mode

- User defines a safeword during onboarding (default: "MERCY")
- When safeword is detected in **any** message at any time:
  1. AI immediately exits active persona
  2. AI switches to "Care Mode" — safe, warm, caring, non-dominant
  3. All active training pauses immediately
  4. User guided through decompression sequence
  5. Session resumes only when user explicitly chooses to continue
- Genuine distress detection (behavioral trigger) also activates Care Mode automatically
- Care Mode never logs violations or applies punishments

### 15.3 Emergency Release

- "Emergency Release" button always visible in app, regardless of session state, tier, or subscription
- When activated:
  1. Current session immediately ended
  2. All active tasks cancelled
  3. User guided to manage physical lock themselves (app does not control physical key)
  4. In-game penalties applied: streak lost, XP deducted, session marked "Failed"
  5. These penalties do not affect the availability or function of the Emergency Release button — it cannot be disabled, hidden, or gated

### 15.4 Mental Health & Crisis Resources

- Available in Settings → Help → Emergency Help
- Displayed in plain, supportive language without in-character framing
- Links to crisis hotlines relevant to user's region

### 15.5 Behavioral Trigger Safety Overrides

| Trigger | Automatic Response |
|---------|-------------------|
| Safeword detected in any message | Care Mode activated immediately |
| Genuine distress markers in chat | Care Mode activated |
| Emergency Release button tapped | Session terminated |
| Biometric: extreme stress indicators (post-MVP) | Rehabilitation Mode |

---

## 16. Biometric Integration (Post-MVP)

This section is **out of scope for MVP** but fully specified for future implementation.

### 16.1 Supported Platforms & Metrics

**Platforms:** Apple HealthKit (iOS), Google Fit (Android)

**Metrics:** Heart rate (resting/active/during tasks), Heart Rate Variability (HRV), sleep quality and duration, daily activity levels, workout detection

### 16.2 Adaptive Intensity Rules

| Biometric Condition | AI Response |
|---------------------|-------------|
| Poor sleep detected | AI tapers regimen; reduces punishment severity |
| High stress (elevated HRV + HR) | Rehabilitation Mode triggered |
| Consistent high performance | Progressive overload: difficulty increases automatically |

### 16.3 Biometric Triggers

| Trigger | Consequence |
|---------|-------------|
| HR > 110bpm for > 5 min (non-workout) during Denial Phase | +2 hours added to timer |
| Sleep quality drops below threshold | Rehabilitation Mode activated |
| HR too low during punishment task | Task reset; must be repeated |
| 14 days consistent high performance | Tier progression suggested |

---

## 17. Hardware Integration — Chaster API (Post-MVP)

Out of scope for MVP. Fully specified for future implementation.

**Supported devices:** Cellmate, Igloo, and other Bluetooth-enabled chastity devices via Chaster platform.

**Features:**
- **Lock Status:** Read battery level, lock state, lock history in real-time
- **Remote Control:** AI can issue: add time / freeze timer / lock command / unlock command
- **Hardware Handshake:** App verifies device is "Open" before instructing slave to physically apply it
- **Integration path:** Chaster public API + OAuth2 flow + Supabase Edge Function webhook handler

---

## 18. Multi-Person Pairing (Post-MVP)

Out of scope for MVP. Fully specified for future implementation.

### 18.1 Dom/Sub Pairing Features

- Dom creates a regimen and sends an invite code to Sub
- Sub connects their account to the Dom's dashboard
- Dom sees real-time compliance dashboard for all linked subs
- Dom can: issue manual punishment/reward overrides, adjust lock times, configure hard/soft limits for their subs
- All sub verification photos routed to Dom's review queue before AI processes them

### 18.2 Multi-Sub Management

- Dom can manage multiple subs simultaneously from one dashboard
- Compliance ranking and comparison views
- Bulk task assignment capability

---

## 19. Tech Stack & Architecture

### 19.1 Frontend

| Component | Technology |
|-----------|------------|
| Framework | Next.js 16 with App Router |
| Runtime | React 19.2 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + CSS Custom Properties |
| State Management | Zustand (onboarding) + React Context (auth) |
| Forms | React Hook Form + Zod validation |
| UI Primitives | Radix UI (Dialog, Dropdown, etc.) |
| Icons | Lucide |
| Deployment | Vercel (PWA) |

### 19.2 Backend & Database

| Component | Technology |
|-----------|------------|
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Realtime | Supabase Realtime subscriptions |
| Edge Functions | Supabase Edge Functions (Deno runtime) |
| Storage | Supabase Storage (ephemeral; zero-knowledge) |
| Cron Jobs | Supabase pg_cron (hourly notification scheduling) |
| Region | ap-south-1 (Mumbai) |
| Project ID | `ompdzvxzxuptsdexrxah` |

### 19.3 AI Services

| Service | Usage |
|---------|-------|
| Google Gemini 2.0 Flash | Text generation: AI Master responses, task generation, journal analysis |
| Gemini Vision | Photo verification: task completion, cage status, liveness |
| ElevenLabs (post-MVP) | Text-to-Speech with emotional intonation |

### 19.4 AI Request Flow

```
1. User input → Next.js frontend
2. Supabase Edge Function invoked
3. The Architect classifies intent
4. Routes to: Dominatrix / Verifier / Accountant / Oracle
5. Gemini API called with full context (tier + persona + fetish profile + psych profile + recent embeddings)
6. Response returned; The Accountant updates DB state as needed
7. Supabase Realtime pushes update to frontend
```

### 19.5 Security & Privacy Architecture

| Requirement | Implementation |
|-------------|----------------|
| Photo processing | Zero-knowledge: images processed in memory, immediately deleted post-analysis |
| Chat logs | End-to-End Encryption (Signal Protocol) |
| Journal entries | User-controlled encrypted storage |
| Psychological data | Stored as vector embeddings, not raw text |
| Analytics | Anonymous; no PII in analytics pipeline |
| GDPR | Data export and deletion in Settings |

### 19.6 Legal / Bifurcated Architecture

- **App Store (Clean) Version:** Positioned as "habit tracker / accountability app"; no explicit content without age verification
- **PWA Web Portal (Full Version):** All explicit content; direct browser install; no app store gatekeeping
- **Age verification:** Yoti/Veriff integration — planned for post-MVP

---

## 20. Database Schema

Full production Supabase/PostgreSQL schema. All tables use Row-Level Security (RLS). Users access only their own data via `auth.uid()`.

```sql
-- ============================================================
-- EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector; -- future pgvector support

-- ============================================================
-- MODULE 1: Users (Auth & Profile)
-- ============================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  tier TEXT CHECK (tier IN ('Newbie','Slave','Hardcore','Extreme','Destruction')),
  ai_personality TEXT,
  willpower_score INTEGER DEFAULT 50 CHECK (willpower_score >= 0 AND willpower_score <= 100),
  compliance_streak INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  total_denial_hours BIGINT DEFAULT 0,
  total_edges INTEGER DEFAULT 0,
  subscription_tier TEXT DEFAULT 'free',
  last_release_date TIMESTAMP,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE POLICY "Users own data" ON users FOR ALL USING (auth.uid()::text = id::text);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- MODULE 2: Onboarding — User Preferences
-- ============================================================

CREATE TABLE user_preferences (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  -- Limits
  hard_limits TEXT[],
  soft_limits TEXT[],
  -- Fetish profile
  fetish_tags JSONB,
  primary_fetishes TEXT[],
  secondary_fetishes TEXT[],
  -- Physical details
  physical_details JSONB,
  -- Regimen selection
  primary_regimen TEXT,
  secondary_regimens TEXT[],
  -- Session parameters
  lock_duration_hours INTEGER,
  task_frequency TEXT DEFAULT 'medium',
  -- Notifications
  notification_frequency TEXT DEFAULT 'medium',
  quiet_hours JSONB,
  standby_consent BOOLEAN DEFAULT false,
  notification_channels TEXT DEFAULT 'both',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own preferences" ON user_preferences FOR ALL USING (auth.uid()::text = user_id::text);

-- ============================================================
-- MODULE 2: Onboarding — Psychological Profiles
-- ============================================================

CREATE TABLE psychological_profiles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  profile_answers JSONB,
  ai_profile_document JSONB,
  conditioning_strategy TEXT,
  key_vulnerabilities TEXT[],
  reward_optimization TEXT,
  punishment_optimization TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE psychological_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own profiles" ON psychological_profiles FOR ALL USING (auth.uid()::text = user_id::text);

-- ============================================================
-- MODULE 3: Sessions
-- ============================================================

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','paused','completed','failed','emergency_released')),
  tier TEXT NOT NULL,
  ai_personality TEXT NOT NULL,
  lock_goal_hours INTEGER,
  started_at TIMESTAMP DEFAULT NOW(),
  scheduled_end_time TIMESTAMP,
  actual_end_time TIMESTAMP,
  tasks_completed INTEGER DEFAULT 0,
  tasks_failed INTEGER DEFAULT 0,
  punishment_mode BOOLEAN DEFAULT false,
  punishment_mode_expires_at TIMESTAMP,
  care_mode_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own sessions" ON sessions FOR ALL USING (auth.uid()::text = user_id::text);

-- ============================================================
-- MODULE 5: Tasks
-- ============================================================

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  genres TEXT[],
  title TEXT NOT NULL,
  description TEXT,
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  cage_status TEXT CHECK (cage_status IN ('caged','uncaged','semi-caged')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','active','completed','failed','skipped')),
  verification_type TEXT CHECK (verification_type IN ('photo','video','audio','self-report','timer','ocr','none')),
  verification_requirement TEXT,
  verification_image_url TEXT,
  ai_verification_result TEXT,
  failure_punishment TEXT,
  failure_hours_added INTEGER DEFAULT 0,
  regimen_task BOOLEAN DEFAULT false,
  regimen_name TEXT,
  assigned_at TIMESTAMP DEFAULT NOW(),
  deadline TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own tasks" ON tasks FOR ALL USING (auth.uid()::text = user_id::text);

-- ============================================================
-- MODULE 9: Chat Messages
-- ============================================================

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sender TEXT CHECK (sender IN ('ai','user')),
  content TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('command','question','punishment','reward','care_mode','normal','safeword_detected')),
  persona_used TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own messages" ON chat_messages FOR ALL USING (auth.uid()::text = user_id::text);

CREATE PUBLICATION chat_realtime FOR TABLE chat_messages;

-- ============================================================
-- MODULE 10: Calendar Adjustments
-- ============================================================

CREATE TABLE calendar_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id),
  hours_added INTEGER DEFAULT 0,
  hours_subtracted INTEGER DEFAULT 0,
  reason TEXT,
  adjustment_type TEXT,
  ai_controlled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE calendar_adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own calendar" ON calendar_adjustments FOR ALL USING (auth.uid()::text = user_id::text);

-- Calendar adjustment RPC
CREATE OR REPLACE FUNCTION update_release_date(
  p_user_id UUID,
  p_hours INTEGER,
  p_reason TEXT,
  p_session_id UUID DEFAULT NULL
) RETURNS TIMESTAMP AS $$
BEGIN
  UPDATE users
  SET last_release_date = last_release_date + INTERVAL '1 hour' * p_hours
  WHERE id = p_user_id;

  INSERT INTO calendar_adjustments (user_id, session_id, hours_added, reason)
  VALUES (p_user_id, p_session_id, p_hours, p_reason);

  RETURN (SELECT last_release_date FROM users WHERE id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Lock time addition RPC
CREATE OR REPLACE FUNCTION add_lock_time(
  p_session_id UUID,
  p_hours INTEGER,
  p_reason TEXT
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id FROM sessions WHERE id = p_session_id;

  UPDATE sessions
  SET scheduled_end_time = scheduled_end_time + INTERVAL '1 hour' * p_hours
  WHERE id = p_session_id;

  INSERT INTO calendar_adjustments (user_id, session_id, hours_added, reason, ai_controlled)
  VALUES (v_user_id, p_session_id, p_hours, p_reason, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- MODULE 11: Journal Entries
-- ============================================================

CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id),
  content TEXT NOT NULL,
  ai_compliance_rating INTEGER CHECK (ai_compliance_rating BETWEEN 0 AND 100),
  ai_critique TEXT,
  willpower_adjustment INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own journals" ON journal_entries FOR ALL USING (auth.uid()::text = user_id::text);

-- ============================================================
-- MODULE 11: Profile Embeddings (future pgvector)
-- ============================================================

CREATE TABLE profile_embeddings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  answers JSONB,
  embedding VECTOR(1536),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE profile_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own embeddings" ON profile_embeddings FOR ALL USING (auth.uid()::text = user_id::text);

-- ============================================================
-- MODULE 12: User Feedback / Suggestions
-- ============================================================

CREATE TABLE user_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category TEXT,
  suggestion TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  ai_response TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','reviewed','implemented','rejected')),
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own feedback" ON user_feedback FOR ALL USING (auth.uid()::text = user_id::text);

-- ============================================================
-- MODULE 13: Regimens
-- ============================================================

CREATE TABLE regimens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  regimen_type TEXT,
  is_primary BOOLEAN DEFAULT false,
  level INTEGER DEFAULT 1,
  total_days INTEGER DEFAULT 30,
  current_day INTEGER DEFAULT 1,
  progress JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active','paused','completed','abandoned')),
  started_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE regimens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own regimens" ON regimens FOR ALL USING (auth.uid()::text = user_id::text);

-- ============================================================
-- MODULE 14: Achievements / Gamification
-- ============================================================

CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  xp_awarded INTEGER DEFAULT 5,
  awarded_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own achievements" ON achievements FOR ALL USING (auth.uid()::text = user_id::text);

-- Auto-award XP trigger
CREATE OR REPLACE FUNCTION award_xp_on_achievement() RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET willpower_score = LEAST(100, willpower_score + NEW.xp_awarded)
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_achievement_awarded
  AFTER INSERT ON achievements
  FOR EACH ROW EXECUTE FUNCTION award_xp_on_achievement();

-- ============================================================
-- MODULE 7: Notifications
-- ============================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('checkin','task','punishment','reward','mindset','standby','morning','evening')),
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN DEFAULT false,
  sent_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own notifications" ON notifications FOR ALL USING (auth.uid()::text = user_id::text);
```

---

## 21. Module Breakdown

### 21.1 Status Overview

| # | Module | Status |
|---|--------|--------|
| 1 | Auth & User Profile | Complete |
| 2 | Onboarding Flow (11-step wizard) | Needs expansion to 11 steps |
| 3 | Dashboard & Timer (realtime) | Complete |
| 4 | AI Task Generation (Edge Function) | Deployed; needs personalization injection |
| 5 | Task Display & Interaction (realtime) | Complete |
| 6 | Verification & CV Integration | Complete |
| 7 | Notifications & Scheduling (cron) | Deployed |
| 8 | Punishment & Reward Logic (RPC) | Complete |
| 9 | Chat Interface (realtime) | Complete |
| 10 | Calendar & Release System | Complete |
| 11 | Journal & Psychological Profiling | Complete (MVP) |
| 12 | Settings, Help & Suggestions | Complete |
| 13 | Training Regimen Engine | Complete |
| 14 | Gamification (XP, Levels, Achievements) | Complete |

### 21.2 Key Module Notes

**Module 2 (Onboarding):** Needs expansion from 10 to 11 steps; add: regimen selection step, expanded physical details collection (full measurements), standby consent, task frequency preference.

**Module 4 (AI Task Generation):** Gemini prompt must include full personalization context block (§13.3). Must weight task genres according to user's primary/secondary fetish tags. Must respect hard limits at prompt level.

**Module 11 (Psychological Profiling):** In MVP, profiles are stored as JSONB. Full pgvector semantic search for RAG is post-MVP.

**Module 13 (Regimen Engine):** Must support concurrent multi-regimen execution (primary + 2 secondary). Regimen-specific tasks must be proportionally distributed (40% primary, 20% per secondary).

---

## 22. App Screens & UI Specification

### Landing Page
- Full-screen dark background (#050505)
- Animated lock icon with pulsing neon red glow (#FF0055)
- "LockedIn" wordmark with animated glow
- Tagline: "Your 24/7 AI Master. You don't negotiate. You obey."
- 18+ content warning modal (required before proceeding)
- "Enter Dashboard" CTA button

### Dashboard (Home)
Bento-grid layout with the following cards:

| Card | Content |
|------|---------|
| **Hero Timer Card** | `DD:HH:MM:SS` countdown in large monospace font; "LOCKED IN" badge; pulsing neon red glow; cage status |
| **Willpower Score** | Circular progress ring (0–100); color shifts green (high) to red (low) |
| **Current Task** | Active task: title, genre tags, cage status badge, deadline countdown, photo upload button |
| **Compliance Streak** | Day count + fire icon; 7-day sparkline dots |
| **Next Release** | Projected release date with days remaining; calendar mini-preview |
| **Future Crime Prediction** | Dystopian AI prediction panel; predicted violation + probability % |
| **Session Stats** | Total edges, denial hours, sessions completed |
| **Quick Access** | Shortcuts: Chat, Calendar, Journal, Regimens, Achievements |

Dashboard personalization: layout and greeting text adapt based on user's primary regimen and tier (see §13.2).

### Tasks Screen
- "Generate Task" button at top (calls Edge Function)
- Active/pending tasks listed as cards showing:
  - Title + difficulty stars
  - Genre pills (pill-shaped badges)
  - Cage status badge (🔒 CAGED / 🗝️ UNCAGED / ⚠️ SEMI-CAGED)
  - Deadline countdown
  - Verification type icon
  - Photo upload button → triggers Vision verification
  - Punishment warning (what happens if deadline missed)
- Completed tasks section below with strikethrough

### Chat Screen
- Full-screen conversation view
- AI Master messages use persona-appropriate styling
- User input field at bottom with send button
- Message type visual differentiation:
  - Command: white text, subtle border
  - Punishment: neon red accent
  - Reward: teal accent
  - Care Mode: purple/soft tones
- Safeword shortcut accessible at top of screen

### Calendar Screen
- Monthly grid calendar with color-coded days
- Release date marker with countdown + "days remaining"
- Tap a day → shows: adjustment log, tasks completed, violations
- Heatmap overlay toggle (shows compliance density)
- Milestone markers (Locktober, NNN, etc.)

### Journal / Self-Reflection Screen
- Daily prompt displayed at top (AI-generated question)
- Multi-line text input area
- Submit → triggers AI compliance analysis
- Previous entries listed below with: date, compliance rating badge (0–100), AI critique excerpt

### Regimens Screen
- Active regimen cards:
  - Name + focus description
  - "Day X of 30" with progress bar
  - Today's regimen task shown
  - Completion toggle
- "Browse All Regimens" button to start new programs
- Regimen detail view: day-by-day task log, completion status, level progression

### Achievements Screen
- Badge grid: earned in full color, unearned in gray with opacity
- XP progress bar to next level
- Recent XP gain log

### Settings Screen
- Sections: Notifications, Profile, Hard Limits, Soft Limits, Help/Emergency, Feedback
- Hard Limits and Soft Limits always editable via multi-select form
- Emergency Release button always accessible and prominent
- Help section with crisis resource links

### Feedback Screen
- Category dropdown (Bug / Feature Request / Content Suggestion / General)
- Text input for suggestion
- 1–5 star rating
- Submit

---

## 23. Design System

### 23.1 Visual Theme

**Cyber-noir luxury.** Reference: Blade Runner 2049 meets premium fintech data dashboard. Dark, moody, premium. Every element communicates power, control, and inevitability.

### 23.2 Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-void` | `#050505` | Primary background |
| `--bg-deep` | `#0a0a14` | Secondary background areas |
| `--bg-card` | `#1a1a2e` | Card backgrounds |
| `--locked` | `#FF0055` | Locked state, danger, timer, punishment |
| `--reward` | `#00F0FF` | Reward state, positive events |
| `--ai-active` | `#8b5cf6` | AI activity, messages |
| `--ai-light` | `#a78bfa` | AI subtle elements |
| `--success` | `#D4F416` | Task completion, success |
| `--danger` | `#ef4444` | Errors, failures |
| `--text-primary` | `#ffffff` | Primary text |
| `--text-muted` | `#9ca3af` | Secondary text, metadata |
| `--text-dim` | `#6b7280` | Disabled, tertiary |

### 23.3 Typography

| Style | Weight | Size |
|-------|--------|------|
| Headlines | 700 | 32–48px |
| Subheadings | 600 | 20–28px |
| Body | 400–500 | 16–18px |
| Metadata | 400 | 12–14px |
| Badges/Labels | 600 | 11–13px, uppercase, letter-spacing |
| Timer display | 700, monospace | 48–64px |

Font: Inter / SF Pro Display / system sans-serif stack.

### 23.4 UI Components & Patterns

- **Pill-shaped badges:** All genre tags, cage status indicators, tier badges — `border-radius: 9999px`
- **Bento-grid dashboard:** CSS Grid with varying cell sizes; glassmorphic cards
- **Glassmorphic cards:** `backdrop-filter: blur(20px)`, semi-transparent dark background, subtle border
- **Progress rings:** SVG circular progress indicators for Willpower Score
- **Floating bottom navigation:** Fixed to viewport bottom; glassmorphic; 5 tabs: Home / Tasks / Chat / Calendar / Journal

### 23.5 Animations & Motion

| Element | Animation |
|---------|-----------|
| Page transitions | Fade + slide-up (200ms ease-out) |
| Card hover | Scale 1.02–1.05 + subtle glow |
| Button | Scale + glow pulse on hover/press |
| Lock icon (locked state) | Continuous pulsing glow (2s infinite) |
| Timer digits | Smooth blur transition on each tick |
| Loader | Rotating lock spinner |
| Task completion | Confetti burst |
| Lock In button | "ed" letter slide animation + lock icon open→close |

### 23.6 Sound & Haptics

| Event | Sound | Haptic |
|-------|-------|--------|
| Slide to Lock | Escalating tension → heavy mechanical thud | Escalating vibration → heavy thud |
| Punishment received | Jarring dissonant chord | Sharp staccato vibration |
| Reward received | Harmonious ascending chime | Soft warm pulse |
| Task completed | Mechanical click | Single firm tap |
| Emergency Release | Heavy warning alarm | Sustained heavy vibration |

### 23.7 Accessibility

- WCAG 2.1 AA compliance
- Dynamic Type support (iOS/Android system font scaling)
- Full ARIA labels on all interactive elements
- Photosensitive mode: disables pulsing and flashing animations
- High contrast mode: exceeds WCAG AA minimum contrast ratios
- Reduced motion mode: disables all non-essential animations

---

## 24. Monetization Model

### 24.1 Current Phase (All Features Free)

All features are fully available to all users with no subscription enforcement. Payment integration is deferred to a future phase.

**Implementation:** Global constant `TESTING_MODE = true` bypasses all subscription checks.

### 24.2 Future Subscription Tiers (Defined for Implementation Later)

| Tier | Price | Key Features |
|------|-------|-------------|
| **Free** | $0 | Basic timer, manual task tracking, limited AI (5 messages/day), no TTS, no Wheel of Fate, recycled content |
| **Silver** | $9.99/mo | Unlimited AI chat, basic task generation, TTS, Wheel of Fate, 1 active session, all 5 tiers |
| **Gold** | $19.99/mo | All Silver + all 10 personas, CV verification, biometrics, multiple sessions, custom regimen builder |
| **Platinum** | $39.99/mo | All Gold + hardware integration (Chaster API), Dom/Sub pairing, multi-sub dashboard, AI voice calls, advanced analytics |

**Payment processor (when implemented):** Razorpay (India primary), Stripe (international fallback)

### 24.3 Free Tier Characteristics (When Enforced)

- Max 5 AI messages per day
- No persona selection (default "Strict Master/Daddy")
- No CV photo verification (self-report only)
- Recycled and lower-cost task content
- Single active session
- No TTS
- No Wheel of Fate

---

## 25. MVP Scope & Deployment

### 25.1 In Scope (MVP — All Required)

- All 5 difficulty tiers with correct content, language, punishment parameters
- All 10 AI Master personas (persona selection in onboarding)
- Full chastity session management (create, manage, end, emergency release)
- Core training regimens: Sissy Training, Obedience & Service, CEI Mastery, Edging Endurance, SPH Conditioning, Humiliation Marathon, Anal Mastery (minimum 7 of 15)
- Complete 11-step onboarding with full data collection
- Personalization engine: all onboarding data actively drives task generation and AI responses
- AI task generation with Gemini (personalized by fetish tags, tier, regimen, psych profile)
- Photo verification via Gemini Vision
- Punishment logic: automatic time additions via `add_lock_time` RPC
- Reward system with Wheel of Fate mechanics
- Dynamic calendar with compliance history
- Psychological profiling (all 7 question categories; AI profile document generation)
- Journaling with AI compliance analysis
- Push notifications: morning, midday, evening, random check-ins (Standby requires consent)
- Willpower Score (0–100)
- XP, levels, and achievements
- Settings: hard limits always editable, soft limits always editable, notification preferences
- Emergency Release button always functional
- Safeword / Care Mode always functional
- All features accessible with no paywall (`TESTING_MODE = true`)

### 25.2 Out of Scope (Post-MVP)

| Feature | Phase |
|---------|-------|
| Chaster API (Bluetooth hardware) | Phase 2 |
| Biometrics (HealthKit/Google Fit) | Phase 2 |
| Razorpay/Stripe payment enforcement | Phase 2 |
| Multi-person pairing (Dom dashboard) | Phase 2 |
| TTS via ElevenLabs | Phase 2 |
| Full pgvector semantic RAG | Phase 2 |
| FinDom features (Tier 5) | Phase 3 |
| Age verification (Yoti/Veriff) | Phase 2 |
| Geofencing / GPS location tasks | Phase 2 |
| Real-time AI voice calls | Phase 3 |
| Custom AI personality fine-tuning | Phase 3 |
| Multi-sub management dashboard | Phase 2 |

### 25.3 Deployment Commands

```bash
# Database migrations
supabase db push

# Edge Functions
supabase functions deploy generate-task
supabase functions deploy send-checkin
supabase functions deploy verify-photo
supabase functions deploy punishment-engine
supabase functions deploy wheel-of-fate
supabase functions deploy journal-analysis

# Frontend (Vercel)
npm run build
vercel --prod
```

### 25.4 Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://ompdzvxzxuptsdexrxah.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
GEMINI_API_KEY=<google_gemini_api_key>
NEXT_PUBLIC_TESTING_MODE=true
```

### 25.5 Supabase Realtime Channels (Enable in Dashboard)

- `chat_messages` — AI Master / slave chat
- `tasks` — Task assignments and status updates
- `sessions` — Session state and timer updates
- `notifications` — Push notification delivery

---

*LockedIn PRD v1.0 — DRAFT — 2026-02-16*
*Consolidates: LockedIn-spec-v1.md · context.md · supabase feature mapping.md*
*This document is the single source of truth. All future changes must be versioned.*
