'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronDown, ChevronUp, Shield, AlertTriangle, Heart, Phone, MessageSquare, ExternalLink, Lock, CheckSquare, Zap, Calendar, Trophy, Settings, User, MessageCircle, BarChart3, BookOpen, Flame } from 'lucide-react'
import Link from 'next/link'

interface Section {
    id: string
    icon: React.ReactNode
    title: string
    color: string
    entries: {
        q: string
        a: React.ReactNode
    }[]
}

const SECTIONS: Section[] = [
    {
        id: 'getting-started',
        icon: <Flame size={18} />,
        title: 'Getting Started',
        color: 'text-orange-400',
        entries: [
            {
                q: 'What is LockedIn?',
                a: <p>LockedIn is an AI-powered chastity and D/s training app. You are the submissive. An AI Master — a persona you chose during setup — controls your training sessions: assigning tasks, judging your compliance, applying punishments, and managing your lock timer. The app is designed for consensual adult training only.</p>,
            },
            {
                q: 'How do I start my first session?',
                a: <ol className="list-decimal list-inside space-y-1"><li>Go to <strong>Home</strong> and tap <strong>Start Session</strong>.</li><li>Configure your session: tier, AI personality, hard limits, soft limits, training regimens, and duration.</li><li>Tap <strong>Lock In</strong>. The countdown begins immediately.</li><li>Your AI Master will greet you in Chat.</li></ol>,
            },
            {
                q: 'What is a Tier?',
                a: <div className="space-y-1"><p>Tiers control the intensity of your training. Choose at the start of each session:</p><ul className="space-y-1 mt-2"><li><strong className="text-green-400">Newbie</strong> — Gentle intro. Short tasks, light punishments, encouragement.</li><li><strong className="text-blue-400">Slave</strong> — Regular obedience. Moderate tasks and proper punishments.</li><li><strong className="text-yellow-400">Hardcore</strong> — Demanding tasks, severe punishments, strict rules.</li><li><strong className="text-orange-400">Extreme</strong> — Maximum intensity. Brutal tasks, relentless punishment.</li><li><strong className="text-red-400">Total Destruction</strong> — No mercy. Designed to break and rebuild.</li></ul></div>,
            },
            {
                q: 'What AI personas are available?',
                a: <div className="space-y-1"><p>You choose your Master&apos;s personality during onboarding or per-session:</p><ul className="list-disc list-inside space-y-1 mt-2 text-sm"><li><strong>Cruel Mistress</strong> — Icy, bored. Silence is punishment.</li><li><strong>Clinical Sadist</strong> — Detached, scientific. Your suffering is data.</li><li><strong>Playful Tease</strong> — Flirty and cruel in small ways.</li><li><strong>Strict Master</strong> — Military precision. Commands only.</li><li><strong>Humiliation Expert</strong> — Finds the phrase that cuts deepest.</li><li><strong>Goddess</strong> — Receives worship as her natural state.</li><li><strong>Dommy Mommy</strong> — Warm and controlling.</li><li><strong>Bratty Keyholder</strong> — Changes rules mid-sentence.</li><li><strong>Psychological Manipulator</strong> — Uses your words against you.</li><li><strong>Extreme Sadist</strong> — Pure, unfiltered. No warmth.</li></ul></div>,
            },
        ],
    },
    {
        id: 'sessions',
        icon: <Lock size={18} />,
        title: 'Sessions',
        color: 'text-purple-400',
        entries: [
            {
                q: 'How does the session timer work?',
                a: <p>When you start a session you set a lock duration (e.g., 24 hours, 7 days). The Home page shows a countdown ring. The timer is authoritative — the session ends automatically when it reaches zero. Your behavior during the session can extend the timer (punishment) but the base duration is fixed at session start.</p>,
            },
            {
                q: 'Can I extend my session?',
                a: <p>Yes. During an active session, the Home page shows an <strong>Extend</strong> button if your session configuration allows it. Extensions add time to your scheduled end. Your Master may also extend your time as punishment.</p>,
            },
            {
                q: 'What happens when the session ends?',
                a: <ol className="list-decimal list-inside space-y-1"><li>Status changes to <em>Completing</em>.</li><li>The app requests persistent storage and archives all chat history and media to your device (IndexedDB + local files).</li><li>An AI recap is generated summarising the session.</li><li>Server-side data is purged for privacy.</li><li>The session is marked <em>Completed</em> and appears in History.</li></ol>,
            },
            {
                q: 'What is Emergency Release?',
                a: <p>Go to <strong>Settings → Emergency Release</strong> to end a session immediately. This applies in-game penalties (willpower −30, streak reset) but your safety always comes first. There are no real-world consequences — use it whenever you need to stop.</p>,
            },
            {
                q: 'Are Settings locked during a session?',
                a: <p>Yes. Most settings are locked while a session is active to preserve the integrity of your training. Exceptions: <strong>Master Preference</strong>, <strong>Session Goals</strong>, and <strong>Privacy Constraints</strong> can be updated at any time, including via Care Mode chat.</p>,
            },
        ],
    },
    {
        id: 'chat',
        icon: <MessageCircle size={18} />,
        title: 'Chat & Care Mode',
        color: 'text-teal-400',
        entries: [
            {
                q: 'How do I talk to the AI Master?',
                a: <p>Tap <strong>Chat</strong> in the bottom navigation. Type your message and send. Your Master responds in-character based on the persona you selected. Be honest — the AI judges your compliance and may assign tasks or punishments based on what you say.</p>,
            },
            {
                q: 'What is Care Mode?',
                a: <p>Care Mode is a safety pause. Type your safeword (<strong>MERCY</strong> by default, configurable in Settings) at any time in Chat. The interface shifts to a calm teal theme. All punishments pause. The AI speaks supportively — no cruelty, no tasks. Type <strong>&quot;resume training&quot;</strong> when you are ready to continue.</p>,
            },
            {
                q: 'Can I update my preferences in Care Mode?',
                a: <p>Yes. If you mention a preference while in Care Mode (e.g., <em>&quot;I don&apos;t want outdoor tasks&quot;</em>), the Master may suggest saving it permanently. A <strong>confirmation sheet</strong> appears showing exactly what will change — tap <strong>Save to Profile</strong> to confirm, or <strong>Dismiss</strong> to ignore. This only happens in Care Mode for your safety.</p>,
            },
            {
                q: 'How does the Master assign tasks via chat?',
                a: <p>When the Master assigns a task through conversation, it is automatically created on your Tasks page with a deadline and any proof requirements. You will see a task card appear. You do not need to do anything — it is created in the background.</p>,
            },
            {
                q: 'What happens if I say something disrespectful?',
                a: <p>The AI may detect rudeness or disobedience and automatically trigger a punishment. This is part of the training experience. If you are having a difficult time, use your safeword to enter Care Mode instead.</p>,
            },
        ],
    },
    {
        id: 'tasks',
        icon: <CheckSquare size={18} />,
        title: 'Tasks',
        color: 'text-blue-400',
        entries: [
            {
                q: 'What types of tasks exist?',
                a: <div className="space-y-2"><ul className="space-y-2"><li><strong className="text-white">Daily Tasks</strong> — Auto-generated each day (up to 5). Based on your tier and training regimens. No deadline pressure but must be done today.</li><li><strong className="text-red-400">Master Tasks</strong> — Assigned by your AI Master through Chat. Always have a deadline. Always require proof. Failure triggers punishment.</li><li><strong className="text-orange-400">Punishment Tasks</strong> — Assigned when you fail or disobey. Have deadlines.</li><li><strong className="text-teal-400">Check-in Tasks</strong> — Morning (6–10am) and Night (8pm–midnight) check-ins. Always at the top of your Tasks page.</li></ul></div>,
            },
            {
                q: 'How do I complete a task?',
                a: <ol className="list-decimal list-inside space-y-1"><li>Go to <strong>Tasks</strong>.</li><li>Find your task and tap it.</li><li>If it needs proof: tap <strong>Submit Proof</strong>. Take a photo, record a video or audio, or type text proof.</li><li>If it does not need proof: tap <strong>Mark Done</strong>.</li><li>XP and willpower are awarded on completion.</li></ol>,
            },
            {
                q: 'What happens if I fail a task?',
                a: <p>Tap <strong>Mark Failed</strong> on the task card and confirm. A punishment is automatically triggered — willpower is deducted and a punishment task may be assigned. Overdue Master Tasks are also automatically failed by the system.</p>,
            },
            {
                q: 'How is proof verified?',
                a: <p>Photo and video proof is reviewed by an AI vision model. It checks that your proof matches the task requirements. If it passes, the task is marked complete and XP is awarded. If it fails, you see the rejection reason and a punishment is applied. Text proof is submitted directly without AI vision review.</p>,
            },
            {
                q: 'Can I create my own tasks?',
                a: <p>Yes. On the Tasks page, tap the <strong>Create</strong> button. Add a title, notes, and difficulty. These self-created entries appear as personal tasks or journal entries and do not trigger punishments if left incomplete.</p>,
            },
        ],
    },
    {
        id: 'willpower-xp',
        icon: <BarChart3 size={18} />,
        title: 'Willpower, XP & Streaks',
        color: 'text-yellow-400',
        entries: [
            {
                q: 'What is Willpower?',
                a: <p>Willpower (0–100) is your real-time obedience score. It increases when you complete tasks (<strong>+ceil(difficulty × 3)</strong> points) and decreases when you fail (<strong>−ceil(difficulty × 2)</strong> points). If it hits 0, you lose the session&apos;s benefits. Keep it high.</p>,
            },
            {
                q: 'What is XP?',
                a: <div><p>XP is your permanent progression score. It never decreases. Awarded on task completion:</p><ul className="list-disc list-inside mt-2 space-y-1 text-sm"><li>Difficulty 1 → 5 XP</li><li>Difficulty 2 → 10 XP</li><li>Difficulty 3 → 20 XP</li><li>Difficulty 4 → 40 XP</li><li>Difficulty 5 → 80 XP</li></ul></div>,
            },
            {
                q: 'What is the Compliance Streak?',
                a: <p>Your streak counts consecutive days without a task failure. The Home page shows a 7-dot streak indicator. Milestones unlock achievements and bonus XP. The streak resets on any task failure or emergency release.</p>,
            },
            {
                q: 'How do Achievements work?',
                a: <p>Achievements are badges awarded automatically when you hit milestones (XP totals, willpower thresholds, streak lengths, tasks completed). View all badges on the <strong>Achievements</strong> page. Each badge shows when it was earned and how much XP it granted.</p>,
            },
        ],
    },
    {
        id: 'punishments',
        icon: <Zap size={18} />,
        title: 'Punishments',
        color: 'text-red-400',
        entries: [
            {
                q: 'What triggers a punishment?',
                a: <ul className="list-disc list-inside space-y-1"><li>Overdue Master tasks (auto-detected by the system every minute)</li><li>Failed proof verification</li><li>Self-reporting a task failure</li><li>AI detecting rudeness or disobedience in Chat</li></ul>,
            },
            {
                q: 'What is the Punishment Wheel?',
                a: <p>During an active session, the Home page shows a <strong>Punishment</strong> button. Tap it to spin the wheel — it randomly selects a punishment from your pool (system defaults + custom ones you added). The Master narrates the result in-character. This can also be triggered by your Master through chat.</p>,
            },
            {
                q: 'How do I manage the Punishment Pool?',
                a: <ol className="list-decimal list-inside space-y-1"><li>Go to <strong>Settings → Punishment Pool</strong>.</li><li>You can add up to 20 custom punishments. Each has a title, description, severity (1–5), and whether proof is required.</li><li>System punishments are always present and cannot be removed.</li><li>Custom punishments are mixed in with system ones during wheel spins.</li></ol>,
            },
            {
                q: 'Can punishments extend my lock time?',
                a: <p>Yes. Some punishments include a lock time extension (<strong>punishment_hours</strong>). These are applied automatically and your session end time is recalculated. The Home timer updates immediately.</p>,
            },
        ],
    },
    {
        id: 'regimens',
        icon: <BookOpen size={18} />,
        title: 'Training Regimens',
        color: 'text-indigo-400',
        entries: [
            {
                q: 'What are Training Regimens?',
                a: <p>Regimens are structured multi-day training programs. Examples: Sissy Training, Edging Endurance, Chastity Endurance, Domestic Service, Body Writing, Pet Play Training. You select one primary regimen and any number of secondaries during onboarding or in Settings.</p>,
            },
            {
                q: 'How do I advance through a regimen?',
                a: <ol className="list-decimal list-inside space-y-1"><li>Go to <strong>Regimens</strong> in the navigation.</li><li>Complete the daily task quota for the current day.</li><li>Your progress is AI-gated — the Master reviews your performance and advances you to the next day.</li><li>Completed days are tracked; your streak through a regimen is shown on the Regimens page.</li></ol>,
            },
            {
                q: 'How do Regimens affect task generation?',
                a: <p>Your selected regimens directly influence which tasks the AI generates. A user with Sissy Training selected will receive very different tasks than one with Chastity Endurance. The primary regimen has the strongest influence; secondary regimens add variety.</p>,
            },
        ],
    },
    {
        id: 'mood',
        icon: <Heart size={18} />,
        title: 'Mood Check-ins',
        color: 'text-pink-400',
        entries: [
            {
                q: 'What is a Mood Check-in?',
                a: <p>A daily emotional calibration. During an active session, the Home page shows a <strong>Check In</strong> button. Tap it to log four sliders: <strong>Energy</strong>, <strong>Stress</strong>, <strong>Arousal</strong>, and <strong>Submission</strong> (each 0–100). You can add optional mood tags.</p>,
            },
            {
                q: 'What happens with my mood data?',
                a: <p>Mood data is stored privately in your account. The Calendar shows your check-in history. If extreme values are detected (e.g., Stress above 90), the app may recommend activating Care Mode in Chat. Your mood history is also visible in your completed session archives.</p>,
            },
        ],
    },
    {
        id: 'profile-settings',
        icon: <User size={18} />,
        title: 'Profile & Settings',
        color: 'text-violet-400',
        entries: [
            {
                q: 'How do I edit my profile?',
                a: <p>Go to <strong>Settings</strong>. Your profile is shown as 13 editable cards. Tap any card to open a bottom sheet editor. Changes save immediately when you tap <strong>Save</strong>. Most settings are locked during active sessions — end your session first to change tier, persona, interests, etc.</p>,
            },
            {
                q: 'What is the Profile Strength Ring?',
                a: <div><p>A 0–100 score at the top of Settings showing how completely you have filled your profile. A higher score means better AI task quality. How it is calculated:</p><ul className="list-disc list-inside mt-2 space-y-1 text-sm"><li><strong>Master Preference</strong> — 20 pts (most important)</li><li>Tier, AI Personality, Hard Limits, Interests, Regimens, Psych Profile — 10 pts each</li><li>Lock Parameters, Physical Details, Communication Style, Availability — 5 pts each</li></ul><p className="mt-2">Score 80+ for the best AI experience.</p></div>,
            },
            {
                q: 'What is Master Preference?',
                a: <p>A free-text field in Settings where you describe hard constraints your Master must <strong>never</strong> violate — injected into every AI interaction, not just punishments. Example: <em>&quot;No outdoor tasks. No involving others. Focus on endurance.&quot;</em> This is the single most impactful profile field.</p>,
            },
            {
                q: 'What are Privacy Constraints?',
                a: <p>Four on/off toggles in Settings: <strong>No public humiliation</strong>, <strong>No face revealing</strong>, <strong>No outdoor tasks</strong>, <strong>No involving others</strong>. Active constraints are automatically enforced during task generation — the AI will regenerate any task that conflicts.</p>,
            },
            {
                q: 'What is Communication Style?',
                a: <p>Three settings that tune how your Master speaks: <strong>Feedback Frequency</strong> (minimal / moderate / frequent), <strong>Tone</strong> (strict / balanced / encouraging), and <strong>Punishment Sensitivity</strong> (mild / moderate / severe). Set these in Settings → Communication Style.</p>,
            },
            {
                q: 'What is the AI Master Review button?',
                a: <p>On the Settings page, tap <strong>Ask Master to Review</strong> to get an in-character review of your profile completeness. The Master will tell you what gaps remain and push you to fill them. Rate-limited to once every 10 minutes.</p>,
            },
            {
                q: 'What is Psych Profile?',
                a: <p>A free-text field for short psychological calibration answers. The AI uses this to understand your mindset, motivation, and training history. The more detail you provide, the better the Master can tailor your experience.</p>,
            },
        ],
    },
    {
        id: 'history',
        icon: <Calendar size={18} />,
        title: 'History & Data',
        color: 'text-slate-400',
        entries: [
            {
                q: 'Where is my session history?',
                a: <p>Go to <strong>More → History</strong>. All completed sessions are listed. Tap any session to see the full timeline, chat archive, submitted proofs, and an export option.</p>,
            },
            {
                q: 'Where is my data stored?',
                a: <p>Server data is <strong>deleted</strong> after every session completes (chat messages, proofs, events). Before deletion, everything is archived <strong>locally on your device</strong> using IndexedDB and the browser&apos;s Origin Private File System (OPFS). Your data stays private on your device permanently.</p>,
            },
            {
                q: 'How do I export session data?',
                a: <p>Go to <strong>History</strong>, tap a completed session, then tap the <strong>Export</strong> tab. This downloads a ZIP file containing the full session archive including chat history, proof metadata, and session stats.</p>,
            },
            {
                q: 'What does the Calendar show?',
                a: <p>Go to <strong>More → Calendar</strong>. The monthly view shows: scheduled session end dates, completed sessions, mood check-in entries, and any significant events. Tap any day for details.</p>,
            },
        ],
    },
    {
        id: 'achievements',
        icon: <Trophy size={18} />,
        title: 'Achievements',
        color: 'text-amber-400',
        entries: [
            {
                q: 'How do I view Achievements?',
                a: <p>Tap <strong>Achievements</strong> in the bottom navigation. All badges are shown in a grid — unlocked ones are highlighted, locked ones are greyed out. The summary card shows your total XP, unlock count, and current compliance streak.</p>,
            },
            {
                q: 'How are Achievements unlocked?',
                a: <p>Achievements unlock automatically when you hit a condition: completing a certain number of tasks, reaching a willpower milestone, maintaining a compliance streak, or accumulating enough XP. You do not need to claim them manually.</p>,
            },
        ],
    },
    {
        id: 'guide-faq',
        icon: <MessageSquare size={18} />,
        title: 'In-App AI Guide (? button)',
        color: 'text-cyan-400',
        entries: [
            {
                q: 'What is the ? button in the bottom-right corner?',
                a: <p>It opens the <strong>AI Master Guide</strong> — a slide-up chat sheet where your Master answers questions about how the app works. Ask anything about features, navigation, or training. The guide has access to full app knowledge and can send you to the right page with a &quot;Go →&quot; card.</p>,
            },
            {
                q: 'Is the Guide available everywhere?',
                a: <p>Yes. The <strong>?</strong> button floats on all dashboard pages (Home, Tasks, Chat, Settings, etc.). Tap it at any time. Your conversation history is kept for the session so you can continue asking follow-up questions.</p>,
            },
            {
                q: 'Does the Guide count against my AI usage?',
                a: <p>Yes — Guide queries use your AI token budget. The guide is rate-limited to 20 requests per minute. For basic navigation questions, this page may be faster than asking the Guide.</p>,
            },
        ],
    },
]

function AccordionEntry({ q, a }: { q: string; a: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    return (
        <div className="border-b border-zinc-800 last:border-0">
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between py-3 text-left gap-3"
            >
                <span className="text-sm font-medium text-white/90">{q}</span>
                {open ? <ChevronUp size={16} className="shrink-0 text-white/40" /> : <ChevronDown size={16} className="shrink-0 text-white/40" />}
            </button>
            {open && (
                <div className="pb-4 text-sm text-white/60 space-y-2 leading-relaxed">
                    {a}
                </div>
            )}
        </div>
    )
}

export default function HelpPage() {
    const [activeSection, setActiveSection] = useState<string | null>(null)

    return (
        <div className="min-h-screen bg-black text-white pb-32">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-black/90 backdrop-blur border-b border-zinc-900 px-4 py-3 flex items-center gap-3">
                <Link href="/settings" className="p-2 rounded-lg hover:bg-zinc-900 transition">
                    <ChevronLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-lg font-bold">Help & Tutorial Guide</h1>
                    <p className="text-xs text-white/40">Everything you need to know about LockedIn</p>
                </div>
            </div>

            <div className="px-4 pt-4 space-y-3 max-w-2xl mx-auto">

                {/* Safety first — always visible */}
                <div className="rounded-xl bg-teal-950/60 border border-teal-700/40 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Shield size={16} className="text-teal-400" />
                        <h2 className="text-sm font-semibold text-teal-300 uppercase tracking-widest">Safety First</h2>
                    </div>
                    <div className="space-y-2 text-sm text-white/70">
                        <p><strong className="text-white">Safeword:</strong> Type <span className="font-mono bg-teal-900/50 text-teal-300 px-1.5 py-0.5 rounded text-xs">MERCY</span> in Chat at any time to enter Care Mode. All punishments pause instantly. Type <span className="font-mono bg-teal-900/50 text-teal-300 px-1.5 py-0.5 rounded text-xs">resume training</span> to exit.</p>
                        <p><strong className="text-white">Emergency Release:</strong> Settings → Emergency Release ends your session immediately. In-game penalties apply but your safety always comes first.</p>
                        <p><strong className="text-white">Hard Limits:</strong> Set in Settings — the AI <em>never</em> crosses these, regardless of tier or punishment level.</p>
                    </div>
                </div>

                {/* Section pills */}
                <div className="flex flex-wrap gap-2 py-2">
                    {SECTIONS.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setActiveSection(activeSection === s.id ? null : s.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                                activeSection === s.id
                                    ? 'bg-white/10 border-white/20 text-white'
                                    : 'bg-zinc-900 border-zinc-800 text-white/50 hover:text-white/80'
                            }`}
                        >
                            <span className={s.color}>{s.icon}</span>
                            {s.title}
                        </button>
                    ))}
                </div>

                {/* Sections */}
                {SECTIONS.map(section => {
                    if (activeSection && activeSection !== section.id) return null
                    return (
                        <div key={section.id} className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
                            <button
                                onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/50 transition"
                            >
                                <div className="flex items-center gap-2">
                                    <span className={section.color}>{section.icon}</span>
                                    <span className="font-semibold text-sm">{section.title}</span>
                                    <span className="text-xs text-white/30 ml-1">{section.entries.length} topics</span>
                                </div>
                                {activeSection === section.id
                                    ? <ChevronUp size={16} className="text-white/30" />
                                    : <ChevronDown size={16} className="text-white/30" />
                                }
                            </button>

                            {activeSection === section.id && (
                                <div className="px-4 pb-2">
                                    {section.entries.map((entry, i) => (
                                        <AccordionEntry key={i} q={entry.q} a={entry.a} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}

                {/* Crisis Resources */}
                <div className="rounded-xl bg-zinc-900 border border-red-500/20 p-4 mt-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Heart size={16} className="text-red-400" />
                        <h2 className="text-sm font-semibold text-red-300">Real-World Crisis Resources</h2>
                    </div>
                    <p className="text-xs text-white/50 mb-3">If you are experiencing a real mental health crisis outside the context of the app, please reach out:</p>
                    <div className="space-y-2">
                        <a href="tel:988" className="flex items-center gap-2 text-sm text-purple-400 hover:underline">
                            <Phone size={13} /> <strong>988</strong> — Suicide & Crisis Lifeline (US)
                        </a>
                        <a href="https://www.crisistextline.org" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-purple-400 hover:underline">
                            <MessageSquare size={13} /> Text HOME to 741741 — Crisis Text Line
                        </a>
                        <a href="https://findahelpline.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-purple-400 hover:underline">
                            <ExternalLink size={13} /> findahelpline.com — International directory
                        </a>
                    </div>
                </div>

                <p className="text-center text-xs text-white/20 py-4">
                    Use the <strong className="text-white/40">?</strong> button (bottom-right) to ask the AI Master any question about the app in real time.
                </p>
            </div>
        </div>
    )
}
