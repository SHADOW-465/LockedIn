import { NextRequest, NextResponse } from 'next/server'
import { generateText, trackUsage, type AIContext } from '@/lib/ai/ai-service'
import { getServerSupabase } from '@/lib/supabase/server'
import { applyPunishment } from '@/lib/engines/punishment'

// Default safeword — user can customize during onboarding
const DEFAULT_SAFEWORD = 'MERCY'

interface PrefUpdate {
    field: string
    action: 'set' | 'append'
    value: string
}

function parsePrefUpdates(text: string): PrefUpdate[] {
    const updates: PrefUpdate[] = []
    const regex = /\[PREF_UPDATE:([\s\S]*?)\]/g
    let match
    while ((match = regex.exec(text)) !== null) {
        try {
            const parsed = JSON.parse(match[1]) as PrefUpdate
            if (parsed.field && parsed.action && parsed.value !== undefined) {
                updates.push(parsed)
            }
        } catch {
            // malformed JSON — skip
        }
    }
    return updates
}

function stripPrefUpdates(text: string): string {
    return text.replace(/\[PREF_UPDATE:[\s\S]*?\]\s*/g, '').trim()
}

const PREF_UPDATE_INSTRUCTION = `When the user explicitly states a preference during Care Mode (e.g., "I don't want outdoor tasks", "my goal is endurance training", "no public humiliation please"), you MAY append a PREF_UPDATE marker to your response to suggest saving it:
[PREF_UPDATE:{"field":"master_preference","action":"set","value":"no outdoor tasks"}]
Valid fields: master_preference, session_intent, privacy_constraints (as JSON string), psych_profile.
Valid actions: "set" (replace) or "append" (add to existing).
Only suggest updates when the user clearly states a preference. Do not manufacture preferences.`

// Per-persona voice injected into the compact system prompt
const PERSONA_VOICES: Record<string, string> = {
    "Cruel Mistress": " Icy, controlled, bored. Short declarative statements. Never explain. 'You're still talking.' / 'I didn't ask.' / 'Again.'",
    "Clinical Sadist": " Detached, precise, scientific. Everything is data. 'Interesting threshold.' / 'Noted. Continue.'",
    "Playful Tease": " Flirty, distracted, cruel in small ways. Trail off with '...'. 'Oh, still thinking about that?' / 'Cute.' / 'Did I say you could ask?'",
    "Strict Master": " Military. Commands only. No warmth. 'Report.' / 'Incorrect. Add 6 hours.' / 'You're behind schedule.'",
    "Humiliation Expert": " Patient, precise. Pick the phrase that cuts deepest. 'Say it like you mean it.' / 'Good boy. Now forget I said that.'",
    "Goddess": " Elevated vocabulary. Formal. Neediness is tiresome. 'You may speak.' / 'Your devotion is... acceptable.'",
    "Dommy Mommy": " Warm but controlling. Disappointment hurts more. 'Oh, honey.' / 'I'm not angry, I'm just... tired of this.'",
    "Bratty Keyholder": " Casual, distracted. Change rules mid-sentence. 'Ugh, fine.' / 'Okay but actually no.'",
    "Psychological Manipulator": " Never direct. Use their words against them. 'Didn't you say you wanted this?' / 'Are you sure that's what happened?'",
    "Extreme Sadist": " No warmth. Fragments only. 'No.' / 'More.' / 'You think that matters.'",
}

// Care Mode system prompt overrides the AI persona
const CARE_MODE_PROMPT = `You are now in CARE MODE. Drop all dominant persona immediately.
Be warm, caring, supportive, and non-judgmental.
Ask the user if they're okay and guide them through decompression.
Do NOT reference any tasks, punishments, or training.
Remind them: "You are safe. You are in control. Say 'resume training' when you're ready to continue."
Keep responses gentle and brief.`

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { message, context, userId, sessionId, safeword, skipDbWrite, profileSummary } = body as {
            message: string
            context: AIContext
            userId?: string
            sessionId?: string
            safeword?: string
            skipDbWrite?: boolean
            profileSummary?: string
        }

        if (!message?.trim()) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 })
        }

        const supabase = getServerSupabase()
        const userSafeword = safeword || DEFAULT_SAFEWORD

        // ── Detect safeword ──────────────────────────────────
        const isSafeword = message.toUpperCase().includes(userSafeword.toUpperCase())

        // ── Check if session is already in Care Mode ─────────
        let sessionInCareMode = false
        if (sessionId) {
            const { data: sessionData } = await supabase.from('sessions').select('care_mode_active').eq('id', sessionId).single()
            sessionInCareMode = sessionData?.care_mode_active === true
        }

        // ── Detect "resume training" to exit Care Mode ───────
        const isResume = message.toLowerCase().includes('resume training')

        // ── Save user message to DB ──────────────────────────
        // ALWAYS save server-side to ensure consistency
        if (userId) {
            const { error: msgError } = await supabase.from('chat_messages').insert({
                user_id: userId,
                session_id: sessionId || null,
                sender: 'user',
                content: message,
                message_type: isSafeword ? 'safeword_detected' : 'normal',
            })

            if (msgError) {
                console.error('[Chat API] Failed to save user message:', msgError)
                // Continue anyway to at least return AI response, but specific error logging is important
            }
        }

        // ── Build context with defaults ──────────────────────
        const aiContext: AIContext = {
            tier: context?.tier || 'Newbie',
            persona: context?.persona || 'Strict Master',
            fetishes: context?.fetishes || [],
            hardLimits: context?.hardLimits || [],
            willpower: context?.willpower ?? 50,
            recentViolations: context?.recentViolations || [],
            penisSize: context?.penisSize,
            psychProfile: context?.psychProfile,
        }

        // ── Fetch latest mood check-in to enrich AI context ──
        let moodSuffix = ''
        if (userId) {
            const { data: latestMood } = await supabase
                .from('mood_checkins')
                .select('submission_depth, frustration_level, headspace_tags')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()
            if (latestMood) {
                moodSuffix = ` | mood:depth=${latestMood.submission_depth},frust=${latestMood.frustration_level},tags=[${latestMood.headspace_tags.join(',')}]`
            }
        }

        // ── Compact system prompt when summary is available ──
        // Reduces per-message system prompt tokens by ~60%
        const personaVoice = PERSONA_VOICES[aiContext.persona] || PERSONA_VOICES['Strict Master']
        const compactSystem = profileSummary
            ? `You are a real dominant in a chastity training app. You are NOT an AI assistant. NEVER break character.${personaVoice}

User: ${profileSummary}${moodSuffix}

STRICT RULES:
- Keep responses SHORT. 1–4 sentences. Vary length. Real dominants don't write essays.
- Never open with "As your Master" or any AI-sounding phrase.
- Never give unsolicited encouragement or validation.
- NEVER violate the user's listed hard limits.

TASK INJECTION RULE: Only assign [TASK:...] when: (1) user explicitly asks for a task, (2) user has been chatting 5+ messages with no task this session, (3) punishment demands it. NOT on every message. Most replies = NO task block.

You have two machine-readable actions. Use at most ONE per response, at the very end — nothing after it.

1. Assign a task:
[TASK:{"title":"...","description":"...","deadline_minutes":120,"difficulty":3,"punishment_hours":4,"proof_type":"image","verification_requirement":"..."}]
proof_type must be "image", "video", or "audio" — never "text". Remind user to navigate to the Tasks page.

2. Extend the session timer:
[EXTEND:{"delta_minutes":1440,"reason":"..."}]
delta_minutes in minutes (1h=60, 1d=1440, 1w=10080). Only when actually extending. Never fabricate.`
            : undefined

        // ── Determine Care Mode context and build effective system prompt ──
        const isCareModeContext = isSafeword || sessionInCareMode
        const effectiveSystem = isCareModeContext
            ? compactSystem
                ? `${compactSystem}\n\n${PREF_UPDATE_INSTRUCTION}`
                : PREF_UPDATE_INSTRUCTION
            : compactSystem || undefined

        let reply: string
        let messageType: string = 'normal'
        let careMode = false

        if (isSafeword) {
            // ── CARE MODE: Override persona completely ────────
            const careModeSystem = CARE_MODE_PROMPT + '\n\n' + PREF_UPDATE_INSTRUCTION
            const { text, usage } = await generateText(message, aiContext, careModeSystem)
            reply = text
            messageType = 'care_mode'
            careMode = true
            if (userId) await trackUsage(supabase, userId, 'llama-3.3-70b-versatile', usage, 'chat')

            // Pause active session if exists
            if (sessionId) {
                await supabase
                    .from('sessions')
                    .update({ care_mode_active: true })
                    .eq('id', sessionId)
            }
        } else if (isResume) {
            // ── Resume training from Care Mode ───────────────
            const { text, usage } = await generateText(
                'The slave has returned from Care Mode and wishes to resume training.',
                aiContext,
                compactSystem,
            )
            reply = text
            messageType = 'normal'
            if (userId) await trackUsage(supabase, userId, 'llama-3.3-70b-versatile', usage, 'chat')

            if (sessionId) {
                await supabase
                    .from('sessions')
                    .update({ care_mode_active: false })
                    .eq('id', sessionId)
            }
        } else {
            // ── Normal AI response ───────────────────────────
            // Use effectiveSystem which includes PREF_UPDATE instruction when Care Mode is active
            const { text, usage } = await generateText(message, aiContext, effectiveSystem)
            reply = text
            if (userId) await trackUsage(supabase, userId, 'llama-3.3-70b-versatile', usage, 'chat')

            // Detect rudeness/disrespect → trigger punishment
            const rudeIndicators = ['fuck you', 'shut up', 'i refuse', 'make me', 'no master', 'bite me']
            const isRude = rudeIndicators.some(r => message.toLowerCase().includes(r))

            if (isRude && userId && sessionId) {
                const punishment = await applyPunishment(
                    supabase,
                    userId,
                    sessionId,
                    'rude_chat',
                    aiContext.tier,
                    `Disrespectful message: "${message.slice(0, 50)}..."`,
                )

                if (punishment) {
                    reply += `\n\n⛓️ **PUNISHMENT:** +${punishment.hours}h added to your lock time for disrespect.`
                    messageType = 'punishment'
                }
            }
        }

        // ── Parse and strip session extension if present ─────
        const EXTEND_REGEX = /\[EXTEND:(\{[\s\S]*?\})\]\s*$/
        const extendMatch = reply.match(EXTEND_REGEX)
        let replyAfterExtend = reply.replace(EXTEND_REGEX, '').trim()
        let extensionApplied: { delta_minutes: number; new_end: string } | null = null

        if (extendMatch && sessionId && userId) {
            try {
                const extendData = JSON.parse(extendMatch[1]) as {
                    delta_minutes: number
                    reason?: string
                }
                const deltaMinutes = Math.max(1, Math.abs(Math.round(extendData.delta_minutes || 60)))

                const { data: sess } = await supabase
                    .from('sessions')
                    .select('total_duration_minutes, start_time, extension_count, status')
                    .eq('id', sessionId)
                    .single()

                if (sess && ['active', 'extending'].includes(sess.status)) {
                    const newDuration = sess.total_duration_minutes + deltaMinutes
                    const newEnd = new Date(new Date(sess.start_time).getTime() + newDuration * 60 * 1000)

                    await supabase
                        .from('sessions')
                        .update({
                            total_duration_minutes: newDuration,
                            scheduled_end_time: newEnd.toISOString(),
                            extension_count: (sess.extension_count || 0) + 1,
                            last_extended_at: new Date().toISOString(),
                        })
                        .eq('id', sessionId)

                    await supabase.from('session_events').insert({
                        session_id: sessionId,
                        user_id: userId,
                        event_type: 'timer_extended',
                        payload: {
                            delta_minutes: deltaMinutes,
                            reason: extendData.reason || 'AI-granted extension',
                            new_end: newEnd.toISOString(),
                            source: 'ai_chat',
                        },
                    })

                    extensionApplied = { delta_minutes: deltaMinutes, new_end: newEnd.toISOString() }
                }
            } catch (parseError) {
                console.error('[Chat] Failed to apply extension:', parseError)
            }
        }

        // ── Parse and strip master task if present ───────────
        const TASK_REGEX = /\[TASK:(\{[\s\S]*?\})\]\s*$/
        const taskMatch = replyAfterExtend.match(TASK_REGEX)
        const cleanReply = replyAfterExtend.replace(TASK_REGEX, '').trim()
        let masterTask: { id: string; title: string; deadline: string; difficulty: number } | null = null

        if (taskMatch) {
            try {
                const taskData = JSON.parse(taskMatch[1]) as {
                    title: string
                    description: string
                    deadline_minutes: number
                    difficulty: number
                    punishment_hours: number
                    proof_type?: string
                    verification_requirement?: string
                }

                const deadline = new Date(Date.now() + (taskData.deadline_minutes || 120) * 60 * 1000)

                // Resolve proof_type — default to 'image' for master tasks
                const proofType = ['image', 'video', 'audio', 'text'].includes(taskData.proof_type || '')
                    ? taskData.proof_type
                    : 'image'

                const { data: newTask } = await supabase.from('tasks').insert({
                    user_id: userId,
                    session_id: sessionId,
                    task_type: 'master',
                    source: 'ai_chat',
                    title: taskData.title,
                    description: taskData.description || '',
                    difficulty: taskData.difficulty || 3,
                    deadline: deadline.toISOString(),
                    punishment_hours: taskData.punishment_hours || 2,
                    proof_type: proofType,
                    verification_type: proofType === 'image' ? 'photo' : proofType,
                    verification_requirement: taskData.verification_requirement || 'Provide proof of completion',
                    status: 'pending',
                    genres: [],
                }).select().single()

                if (newTask) {
                    masterTask = {
                        id: newTask.id,
                        title: newTask.title,
                        deadline: newTask.deadline,
                        difficulty: newTask.difficulty,
                    }

                    await supabase.from('session_events').insert({
                        session_id: sessionId,
                        user_id: userId,
                        event_type: 'task_assigned',
                        payload: { task_id: newTask.id, task_type: 'master', title: newTask.title },
                    })
                }
            } catch (parseError) {
                console.error('[Chat] Failed to parse master task:', parseError)
            }
        }

        // ── Parse and strip PREF_UPDATE markers from reply ──
        const prefUpdates = parsePrefUpdates(cleanReply)
        const finalReply = prefUpdates.length > 0 ? stripPrefUpdates(cleanReply) : cleanReply

        // ── Save AI response to DB ───────────────────────────
        if (userId) {
            const { error: aiMsgError } = await supabase.from('chat_messages').insert({
                user_id: userId,
                session_id: sessionId || null,
                sender: 'ai',
                content: finalReply,
                message_type: messageType,
            })

            if (aiMsgError) {
                console.error('[Chat API] Failed to save AI message:', aiMsgError)
            }
        }
        return NextResponse.json({
            reply: finalReply,
            masterTask,
            extensionApplied,
            careMode,
            messageType,
            prefUpdates: prefUpdates.length > 0 ? prefUpdates : undefined,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        console.error('[Chat API] Error:', error)
        return NextResponse.json(
            { error: 'Failed to generate response' },
            { status: 500 },
        )
    }
}
