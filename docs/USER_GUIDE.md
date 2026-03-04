# LockedIn — Complete User Guide

> Your AI-controlled chastity conditioning and obedience training platform.

---

## Table of Contents

1. [What Is LockedIn?](#1-what-is-lockedin)
2. [Core Concepts](#2-core-concepts)
3. [Getting Started — Onboarding](#3-getting-started--onboarding)
4. [Starting a Session](#4-starting-a-session)
5. [The Dashboard (Home)](#5-the-dashboard-home)
6. [Tasks](#6-tasks)
7. [Chat — Talking to Your Master](#7-chat--talking-to-your-master)
8. [Journal](#8-journal)
9. [Calendar](#9-calendar)
10. [Regimens](#10-regimens)
11. [Achievements](#11-achievements)
12. [Settings](#12-settings)
13. [Feedback](#13-feedback)
14. [Session Completion](#14-session-completion)
15. [Safety Features](#15-safety-features)
16. [Tier Reference](#16-tier-reference)

---

## 1. What Is LockedIn?

LockedIn is an AI-driven training app built around chastity conditioning and obedience. An AI persona — your **Master** — governs every session. It assigns tasks, issues punishments when you fail, monitors your compliance, and delivers a performance grade when the session ends.

Everything of consequence happens server-side. The AI controls when your session extends, when punishments apply, and when you are released. Your job is to comply.

**The core loop:**
1. Start a session and set your lock duration.
2. Receive daily tasks from your Master.
3. Complete them on time to build Willpower and maintain your streak.
4. Fail them and face extensions and punishment tasks.
5. When your timer expires, your session archives and you receive a grade.
6. Repeat, pushing deeper each time.

---

## 2. Core Concepts

### Willpower Score (0–100)
Your primary performance metric. Displayed as a circular meter on the Home page.

| Action | Effect |
|--------|--------|
| Task completed | +ceil(difficulty × 3) |
| Failed verification | −ceil(difficulty × 2) |
| Emergency Release | −30 (instant) |

A score above 70 is "Strong resistance." Below 40 is "Breaking point near." It resets somewhat between sessions but carries your history.

### Compliance Streak
The number of consecutive days you have met your task quota. Shown with a 🔥 icon. Breaking the streak resets it to zero. Milestones unlock achievements and bonus XP.

### XP (Experience Points)
Earned by completing tasks and unlocking achievements. Displayed on the Achievements page. Longer streaks and harder tasks award more XP.

### Denial Hours
Your cumulative total time spent in active lock sessions. Visible in Settings and the Home stats grid.

### Tiers
Five intensity levels that govern how demanding your training is. See the [Tier Reference](#16-tier-reference) section for the full breakdown. You set your tier during onboarding and again at the start of each session — different sessions can use different tiers.

### AI Personality
The voice and attitude of your AI Master. Five personalities are available:

| Personality | Style |
|-------------|-------|
| Strict Master | Formal, exacting, no excuses |
| Cruel Mistress | Cold, contemptuous, demanding |
| Sadistic Dom | Relishes failure, escalates fast |
| Cold Authority | Clinical, detached, utterly indifferent |
| Nurturing Dom | Firm but supportive, motivational |

You choose a personality per session. Each one changes the tone of every task description, chat message, and punishment.

### Hard Limits vs. Soft Limits
**Hard Limits** are absolute. The AI will never cross them — not during tasks, not in chat, not ever. They exist for your safety and can always be changed in Settings even mid-session.

**Soft Limits** are activities the AI will approach with care — never suddenly or at full intensity. They are used for gradual escalation.

---

## 3. Getting Started — Onboarding

Onboarding runs once when you create your account. It is an 11-step wizard that establishes your baseline configuration. All fields have defaults; nothing is irreversible (you can change everything in Settings later).

**Step 1 — Welcome**
Confirm you are 18 or older and accept the content warning. Read the safety guarantees: Hard Limits are always enforced, Emergency Release is always accessible, the safeword ("MERCY") is always active.

**Step 2 — Tier**
Choose your intensity level. If you are new to this type of app, start at **Newbie** or **Slave**. You can escalate once you know what to expect. Hardcore and above is not a challenge to rush toward — it is genuinely relentless.

**Step 3 — AI Personality**
Select the dominant voice you want governing your sessions. This is purely aesthetic and tonal — it does not affect task difficulty or punishment severity.

**Step 4 — Hard Limits**
Select every activity that is an absolute no-go. Be comprehensive. The AI will never include these in tasks or chat. This is one of the most important steps. When in doubt, add it to hard limits.

**Step 5 — Soft Limits**
Select activities the AI may introduce gradually and with care. Leave this empty if you prefer the AI to have no soft limits to work with.

**Step 6 — Physical Details (Optional)**
Body details used for personalised task content. Every field here is optional. Submit nothing if you prefer.

**Step 7 — Preferred Regimens**
Select training protocols you are interested in. These become the basis for AI-generated tasks and multi-day regimens. Pick everything that sounds interesting.

**Step 8 — Psychological Profile**
Open-ended notes about what motivates you, what your mental conditioning goals are, how you respond to different approaches. The more honest you are here, the better the AI can tailor its approach.

**Step 9 — Initial Lock Goal**
How long do you want your first session to be? Set this in days, hours, and minutes. You will confirm the exact duration again when you actually start each session.

**Step 10 — Notification Frequency**
How often should the app check in on you and send reminders?
- **Low** — minimal interruptions
- **Medium** — regular check-ins
- **High** — frequent reminders
- **Extreme** — constant presence

**Step 11 — Review and Lock In**
Review everything. Click "Lock In" to save. You are taken to the Home page and your profile is created.

> **Note:** Onboarding stores everything in memory until the final step, then writes it all at once. Do not close the app mid-onboarding or you will need to start over.

---

## 4. Starting a Session

From the Home page, click **"Start Session"** to open the session configuration wizard. This is a 6-step flow that configures the specific session — it does not overwrite your profile.

**Step 1 — Tier**
Choose the intensity for this session. Defaults to your profile tier. You can go up or down for any individual session.

**Step 2 — AI Personality**
Confirm or change the persona for this session.

**Step 3 — Hard Limits**
Your absolute limits are pre-filled from your profile. Review and adjust for this session only.

**Step 4 — Soft Limits**
Same as above — adjust for this session only.

**Step 5 — Regimens**
Select which training protocols you want active in this session.

**Step 6 — Duration**
Set your lock time using the days/hours/minutes inputs. **This field has no default** — you must set it explicitly. A running total is shown as you type. Click "Lock In" to start.

Once you confirm:
- The session row is created in the database.
- The server records the exact start time and calculates your scheduled release.
- A `session_started` event is logged.
- Your Home page timer activates.

> **If you already have an active session**, the app returns a 409 error and redirects you to the existing session. You cannot have two sessions running simultaneously.

---

## 5. The Dashboard (Home)

The Home page is your command centre during a session.

### Timer Card
The largest element on the page. Shows time remaining in your current lock period in `DDd HHh MMm SSs` format. The red countdown is the authoritative source of truth — it comes directly from the server (`scheduled_end_time`).

The progress bar along the bottom fills as the session progresses, calculated against the actual session duration you set (not a fixed 7-day window).

**Timer states:**

| Status | Display |
|--------|---------|
| `active` | Red countdown, progress bar ticking |
| `extending` | Countdown + pulsing "SESSION EXTENDED" badge |
| `completing` | "Session Ending... Archiving your session data." |
| `completed` | Checkmark + "Session Complete" |
| `emergency` | Checkmark + "Emergency Release" |

When there is no active session: a "No Active Session" card appears with a "Start Session" button.

### Willpower Meter
Circular indicator (0–100). Your score is recalculated every time you complete or fail a task. Aim to keep it above 70. Dropping below 40 unlocks harsher AI responses.

### Current Task Card
Shows the most recent active task: title, description preview, genres, cage status, and deadline. Tap "View Tasks" to go to the full task list.

### Compliance Streak
Your current streak in large numerals with a 7-day circle indicator. Each filled circle is a day in your current streak. The circle resets when you break streak.

### Next Release Date
The date your current session is scheduled to end. Labelled "Dynamic" because the AI can extend it via punishments or extensions.

### Session Stats
Four quick numbers: tasks done, violations, total denial hours, and total edges across all time.

---

## 6. Tasks

The Tasks page is where you receive and complete your training assignments.

### Daily Tasks
You can generate up to **5 tasks per day**. Click "New Task" to request a generation. The AI creates a task based on your tier, personality, preferred regimens, limits, and cage status.

Each task card shows:
- **Title and description** — what you need to do
- **Genres** — coloured tags (e.g., Edging, Obedience, Service)
- **Cage status** — whether the task requires you to be caged or not
- **Difficulty** — ★ rating (1–5)
- **Duration** — estimated completion time
- **Deadline** — countdown in monospace (task must be complete before this expires)
- **Punishment warning** — if the task carries a penalty for failure (lock extension hours + description)

**Task statuses:**

| Status | What it means |
|--------|---------------|
| `pending` | Ready to start |
| `active` | You've begun the task |
| `verification_pending` | Proof submitted, awaiting AI review |
| `completed` | Done and accepted |
| `failed` | You missed it or it was rejected |
| `overdue` | Deadline passed without completion |

**To complete a task:**
1. Click the task card to open the detail modal, or use the quick-action buttons on the card.
2. Click "Mark Done" — this calls the completion API, awards Willpower and XP.
3. If the task requires proof (photo, video, text), you will be prompted to submit it. Proof is sent to the AI vision verifier. If it fails, a punishment is triggered.

**To fail a task:**
Click "Mark Failed" if you cannot complete the task. This triggers the punishment pipeline: Willpower decreases, and lock time extends by the punishment hours shown on the card.

### Master Tasks
These appear above daily tasks in a **red-bordered section** labelled "⚔ Master Tasks."

Master tasks are assigned directly by the AI through the Chat page. When the AI decides you need a specific challenge, it embeds a task marker in its response. These tasks:
- Have a strict deadline (shown as a countdown timer per card)
- Have higher punishment hours for failure
- Cannot be limited by the daily task cap
- Are created with `task_type='master'`

When a master task's deadline passes without completion, the cron job detects it automatically and triggers punishment — you do not need to manually fail them.

### Punishment Tasks
Shown in an **orange-bordered section** labelled "⚠ Punishment Tasks."

These are created automatically when:
- A daily task is failed
- A master task goes overdue
- A proof photo fails AI verification
- The AI detects a rules violation in chat

Punishment tasks extend your lock time and must be completed (with proof) to clear the violation. Failing a punishment task escalates the penalty.

### Viewing Completed Tasks
Completed and failed tasks appear in a collapsed section at the bottom of the page with reduced opacity. Useful for reviewing your history during a session.

---

## 7. Chat — Talking to Your Master

The Chat page is your direct line to the AI that controls your session.

### Basic Use
Type in the input field and press the send button. The AI will respond in character as your chosen personality. You can ask questions, report compliance, request guidance, or simply address your Master.

> The placeholder text reads: **"Address Master respectfully..."** — the AI notices rudeness.

### Safeword — MERCY
Type the word **MERCY** at any time to immediately activate **Care Mode**.

Care Mode:
- Suspends all training and punishments
- Changes the AI's tone to supportive and non-demanding
- Persists until you type "resume training"
- Is never penalised — there is no cost to using it

A teal banner appears at the top of the chat when Care Mode is active: "All training and punishments are paused. You are safe and in control."

### Master Task Assignment via Chat
When the AI decides to assign you a challenge directly, it appends a hidden task marker to its response. You will see:
- The AI's message as normal
- A toast notification + task card appearing on the Tasks page
- The task count badge updating

You do not need to do anything special in chat to receive master tasks — they are automatic.

### Message Types
Messages are visually styled by type:

| Type | Appearance |
|------|-----------|
| Normal AI | Purple/teal border |
| Your message | Dark border, right-aligned |
| Safeword | Teal border, "🛡️ Safeword Used" label |
| Punishment | Red border, "⚠️" indicator |
| Care Mode | Teal border, "💚 Care Mode" label |

---

## 8. Journal

The Journal is your private space for reflection. Entries are stored permanently and can include AI analysis.

### Writing an Entry
1. Type your thoughts in the textarea. Be honest — the AI analysis is more useful when you are.
2. Select a **mood** (optional):
   - 🤤 Eager
   - 🧎 Submissive
   - 😐 Neutral
   - 😤 Resistant
   - 🖕 Defiant
   - 😵 Broken
3. Set your **obedience rating** using the slider (1 = Defiant, 10 = Obedient).
4. Click "Submit Entry."

After submission, the AI processes the entry in the background and attaches a psychological analysis below your text. This analysis is not judgemental — it reflects patterns the AI notices in your words.

### Past Entries
Shown in reverse chronological order below the form. Each entry displays:
- Timestamp
- Mood badge (if selected)
- Obedience rating badge (coloured by value)
- Your full entry text
- AI analysis (purple-bordered box with 🤖 icon)

---

## 9. Calendar

The Calendar page tracks your compliance history and shows when your release is scheduled.

### Release Date
The top card shows the date and time your current session is set to end. This updates in real time if the AI extends your session. If no session is active, it shows "No Active Session."

### Month View
A colour-coded calendar grid where each past day is marked:

| Colour | Meaning |
|--------|---------|
| Green | Good compliance day (more completions than failures) |
| Orange | Mixed day (equal completions and failures) |
| Red | Bad compliance day (more failures than completions) |
| Purple | Today |
| Glowing red | Your scheduled release date |

Use the left/right chevrons to navigate between months.

### Adjustment Log
Below the calendar, every change to your release date is listed in chronological order. Each entry shows:
- Whether time was added (📈 red) or subtracted (📉 teal)
- How many hours were adjusted
- The reason (e.g., "Task failed: Edge Control", "Regimen day completed")
- Whether the AI or a manual action caused it

---

## 10. Regimens

Regimens are multi-day training programmes with daily progression requirements. They run in parallel with your normal session tasks.

### Starting a Regimen
Click "New" → select a template:

| Regimen | Duration | Focus |
|---------|----------|-------|
| Endurance Protocol | 14 days | Progressive denial training |
| Obedience Bootcamp | 7 days | Strict daily task completion |
| Edge Control Mastery | 21 days | Increasing edge session durations |
| Mental Fortitude | 30 days | Psychological conditioning |
| Submission Training | 10 days | Compliance with any command |

### Daily Advancement
Each day you want to advance your regimen, click **"Day Done."** This triggers an AI gate check:

- The AI verifies you have completed enough daily tasks for your tier before allowing you to advance.
- If the gate passes: you advance to the next day, and a preview of tomorrow's task is shown.
- If the gate fails: an error message explains what is missing (e.g., "Complete at least 3 more daily tasks before advancing").

**You cannot rush a regimen.** The gate check is server-side and enforced.

### Regimen States

| State | Meaning |
|-------|---------|
| Active | Currently in progress |
| Paused | Manually paused (click Resume to continue) |
| Completed | All days finished |
| Abandoned | Manually quit |

---

## 11. Achievements

The Achievements page shows your earned badges and tracks total XP.

### XP Summary
Three numbers at the top: total XP earned, number of achievements unlocked, current compliance streak.

### Achievement Cards
Each card shows the achievement icon, name, XP value, description, and the date it was awarded. Achievements unlock automatically — you do not need to claim them. The system checks for milestones after every relevant action (task completion, streak advance, feedback submission, etc.).

Examples of milestone triggers:
- First task completed
- First 24h denial
- 7-day streak
- 30-day streak
- Completing your first regimen
- Submitting a detailed feedback suggestion

---

## 12. Settings

### Edit Profile (`/settings/profile`)
- Change your username
- Change your AI personality
- Update your tier (dev mode only — in production, tier changes lock once a session starts)
- Review hard and soft limits

### Notifications (`/settings/notifications`)
- Change notification frequency (Low / Medium / High / Extreme)
- Quiet hours configuration

### Help & Support (`/settings/help`)
Resources for the safeword, emergency release, and crisis links.

### Session Lock
When a session is active, a **lock overlay** covers the settings page:

> "Settings are locked during an active session. Your Master controls this space."

Individual form inputs are disabled. Hard Limits remain editable for safety — this is the one exception.

The lock lifts automatically when the session reaches `completed` or `emergency` status.

### Emergency Release
Located at the bottom of the Settings page.

Click the "Emergency Release" card to expand the confirmation panel. You will see the penalties listed clearly:
- Willpower score: −30
- Compliance streak: reset to 0
- Session marked as failed

Click **"Yes, Release Now"** to confirm. This is irreversible.

> Use Emergency Release only if you genuinely need to stop. The safeword ("MERCY") activates Care Mode without any penalties and is the better choice if you just need a break.

### Sign Out
Bottom of Settings. Signs you out and returns you to the login page.

---

## 13. Feedback

Submit feature requests, bug reports, or general suggestions.

### Submitting a Suggestion
1. Select a category: Bug Report, Feature Request, UI/UX Improvement, Task Suggestion, or General.
2. Write your suggestion. **Suggestions of 50 characters or more earn bonus XP.**
3. Optionally add a 1–5 star rating.
4. Click "Submit Feedback."

### Past Submissions
Shown below the form. Each submission shows its category, current status (Pending / Reviewed / Implemented), and your original text.

---

## 14. Session Completion

Sessions end in one of three ways:

### 1. Timer Expiry (Normal Completion)
When `scheduled_end_time` is reached:
1. The server marks the session as `completing`.
2. Your TimerCard shows "Session Ending... Archiving your session data."
3. The app automatically:
   - Fetches all your session data from the server
   - Requests persistent browser storage so data is not lost
   - Archives everything to local device storage (IndexedDB)
   - Calls the AI to generate your session summary
   - Cleans up server-side data
   - Marks the session as `completed`
4. A **Session Summary overlay** appears.

### 2. Emergency Release
Triggered from Settings. Session status becomes `emergency`. Penalties apply. See [Safety Features](#15-safety-features).

### 3. AI Extension (No Manual End)
If the AI extends your session (due to punishment accumulation or poor compliance), the session continues with a new scheduled end time. You cannot end early.

### Session Summary
The summary overlay includes:
- **Performance Grade** (S / A / B / C / D)
- **Compliance Rate** (percentage of tasks completed)
- **Narrative** — 2–3 paragraphs written by the AI Master in character, assessing your performance
- **Highlights** — things you did well (green ✓)
- **Areas to Improve** — recommendations (yellow →)

Click "Continue" to dismiss. Your archived session is stored locally and accessible from the calendar history indefinitely.

### Exporting Session Data
After a session is archived, you can export a ZIP file containing:
- `chat_history.json`
- `tasks.json`
- `session_summary.json`
- `session_events.json`
- `proof_documents.json`
- `proofs/` (any proof images submitted)
- `videos/` (any proof videos)

This ZIP can be uploaded to Google Drive or kept as a local backup. All heavy data (images, videos, chat) is stored **on your device only** — it is never retained on the server beyond session completion.

---

## 15. Safety Features

LockedIn is built with several hard safety layers that cannot be removed or overridden.

### Safeword — MERCY
Type "MERCY" in chat at any time. Instantly activates Care Mode. No penalties. No logging against you. The AI will shift to a supportive, non-demanding tone. Resume with "resume training" when ready.

### Hard Limits
Set during onboarding and editable in Settings **at any time, including during an active session**. The AI will never include hard-limited content in tasks or chat, regardless of tier, punishment level, or any other factor.

### Emergency Release
Always accessible from the Settings page regardless of session state. Ends the session immediately. Does carry in-game penalties (willpower, streak), but the real-world effect is instant release.

### Care Mode
Activated by safeword or detected automatically by the AI if your messages indicate distress. While active:
- No new tasks are assigned
- No punishments apply
- No lock extensions occur
- The AI speaks supportively

Care Mode is not a cheat or a workaround — it exists because real wellbeing always takes priority.

---

## 16. Tier Reference

| Tier | Intensity | Task Difficulty | Punishment Severity | Best For |
|------|-----------|-----------------|---------------------|----------|
| **Newbie** | Mild | 1–2 ★ | Light (1–2h extensions) | First-time users, gentle introduction |
| **Slave** | Moderate | 2–3 ★ | Moderate (2–4h extensions) | Regular training, building habits |
| **Hardcore** | High | 3–4 ★ | Severe (4–8h extensions) | Experienced users wanting intensity |
| **Extreme** | Very High | 4–5 ★ | Brutal (8h+ extensions) | Experienced users, extended sessions |
| **Total Destruction** | Absolute | 5 ★ | Extreme (12h+ extensions) | Long-term conditioning, no mercy |

**Changing tiers:** You select a tier at the start of each session. Between sessions, you can update your default in Settings > Edit Profile. Tier changes during an active session are not permitted.

---

*LockedIn stores all session chat, images, and videos on your device. Supabase holds only metadata and a rolling window of recent messages. Your privacy is maintained by design.*
