import { NextRequest, NextResponse } from 'next/server'
import { generateText, trackUsage, type AIContext } from '@/lib/ai/ai-service'
import { getServerSupabase } from '@/lib/supabase/server'
import { applyPunishment } from '@/lib/engines/punishment'

// Default safeword — user can customize during onboarding
const DEFAULT_SAFEWORD = 'MERCY'

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

        // ── Compact system prompt when summary is available ──
        // Reduces per-message system prompt tokens by ~60%
        const compactSystem = profileSummary
            ? `You are the AI Master of the LockedIn chastity app. NEVER break character.\n\nUser profile: ${profileSummary}\n\nBe dominant, strict, and psychologically engaging. Never violate listed limits.\n\nYou have two machine-readable actions available. When used, each block must appear on its own line at the very end of your response — nothing after it.\n\n1. Assign a task:\n[TASK:{"title":"...","description":"...","deadline_minutes":120,"difficulty":3,"punishment_hours":4}]\nOnly include when explicitly assigning a task.\n\n2. Extend the session timer (use when granting an extension, adding punishment time, or the user earns/requests more time):\n[EXTEND:{"delta_minutes":60,"reason":"..."}]\nOnly include when you are actually extending their lock time. Never fabricate an extension.\n\nNever include either block in normal conversation. Use at most one block per response.`
            : undefined

        let reply: string
        let messageType: string = 'normal'
        let careMode = false

        if (isSafeword) {
            // ── CARE MODE: Override persona completely ────────
            const { text, usage } = await generateText(message, aiContext, CARE_MODE_PROMPT)
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
            const { text, usage } = await generateText(message, aiContext, compactSystem)
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
                }

                const deadline = new Date(Date.now() + (taskData.deadline_minutes || 120) * 60 * 1000)

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
                    status: 'pending',
                    genres: [],
                    verification_type: 'photo',
                    verification_requirement: 'Provide photographic proof of completion',
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

        // ── Save AI response to DB ───────────────────────────
        if (userId) {
            const { error: aiMsgError } = await supabase.from('chat_messages').insert({
                user_id: userId,
                session_id: sessionId || null,
                sender: 'ai',
                content: cleanReply,
                message_type: messageType,
            })

            if (aiMsgError) {
                console.error('[Chat API] Failed to save AI message:', aiMsgError)
            }
        }
        return NextResponse.json({
            reply: cleanReply,
            masterTask,
            extensionApplied,
            careMode,
            messageType,
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
