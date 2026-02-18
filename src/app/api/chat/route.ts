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
        if (userId && !skipDbWrite) {
            await supabase.from('chat_messages').insert({
                user_id: userId,
                session_id: sessionId || null,
                sender: 'user',
                content: message,
                message_type: isSafeword ? 'safeword_detected' : 'normal',
                persona_used: context?.persona || 'Strict Master',
            })
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
            ? `You are the AI Master of the LockedIn chastity app. NEVER break character.\n\nUser profile: ${profileSummary}\n\nBe dominant, strict, and psychologically engaging. Never violate listed limits.`
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

        // ── Save AI response to DB ───────────────────────────
        if (userId && !skipDbWrite) {
            await supabase.from('chat_messages').insert({
                user_id: userId,
                session_id: sessionId || null,
                sender: 'ai',
                content: reply,
                message_type: messageType,
                persona_used: aiContext.persona,
            })
        }

        return NextResponse.json({
            reply,
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
