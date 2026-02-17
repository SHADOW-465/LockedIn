import { NextRequest, NextResponse } from 'next/server'
import { verifyImage } from '@/lib/ai/ai-service'
import { getServerSupabase } from '@/lib/supabase/server'
import { applyPunishment } from '@/lib/engines/punishment'
import { awardCompletion, checkAchievements, awardStreak } from '@/lib/engines/rewards'

// Snarky "pending" messages to deny them satisfaction
const PENDING_MESSAGES = [
    "Your proof has been submitted. Don't celebrate yet — I haven't decided if I'm impressed.",
    "Received. I'll review this when I feel like it. Patience is a virtue you clearly lack.",
    "Photo uploaded. Do you really think that's good enough? We'll see...",
    "Submission received. Don't hold your breath — actually, do. It's funnier.",
    "I've received your pathetic attempt. The verdict will come when I'm ready.",
    "Uploaded. Now wait. Good slaves wait in silence.",
    "Your proof is under review. I suggest you use this time to reflect on your inadequacy.",
    "Noted. I'll get to it when I get to it. You're not my only slave.",
]

// Deliberate delay range (ms) to maintain API rate limits and deny instant gratification
const MIN_DELAY_MS = 3000
const MAX_DELAY_MS = 8000

function randomDelay(): number {
    return Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) + MIN_DELAY_MS
}

function randomPendingMessage(): string {
    return PENDING_MESSAGES[Math.floor(Math.random() * PENDING_MESSAGES.length)]
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { imageBase64, taskId, userId, sessionId, taskType, taskDescription, tier } = body as {
            imageBase64: string
            taskId: string
            userId: string
            sessionId?: string
            taskType?: string
            taskDescription?: string
            tier?: string
        }

        if (!imageBase64) {
            return NextResponse.json({ error: 'Image data is required' }, { status: 400 })
        }
        if (!taskId || !userId) {
            return NextResponse.json({ error: 'taskId and userId are required' }, { status: 400 })
        }

        const supabase = getServerSupabase()

        // ── Look up the task from DB ─────────────────────────
        let type = taskType || 'general'
        let description = taskDescription || ''
        let difficulty = 2
        let punishmentHours = 4
        let actualSessionId = sessionId

        const { data: task } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', taskId)
            .single()

        if (task) {
            type = task.verification_type || type
            description = task.description || description
            difficulty = task.difficulty || difficulty
            punishmentHours = task.punishment_hours || punishmentHours
            actualSessionId = task.session_id || actualSessionId
        }

        // ── Set task to VERIFICATION_PENDING immediately ─────
        await supabase
            .from('tasks')
            .update({
                status: 'verification_pending',
                verification_submitted_at: new Date().toISOString(),
            })
            .eq('id', taskId)

        // ── Deliberate delay to maintain rate limits ─────────
        const delay = randomDelay()
        await new Promise(resolve => setTimeout(resolve, delay))

        // ── Build verification prompt and call AI ────────────
        const prompt = buildVerificationPrompt(type, description)
        const result = await verifyImage(imageBase64, prompt)

        // ── Update task status based on result ───────────────
        const newStatus = result.success ? 'completed' : 'failed'

        await supabase
            .from('tasks')
            .update({
                status: newStatus,
                ai_verification_passed: result.success,
                ai_verification_reason: result.reason,
                completed_at: result.success ? new Date().toISOString() : null,
            })
            .eq('id', taskId)

        let xpAwarded = 0
        let punishmentResult = null
        let achievements: string[] = []

        if (result.success) {
            // ── PASS: Award XP + check achievements ──────────
            xpAwarded = await awardCompletion(supabase, userId, difficulty)
            achievements = await checkAchievements(supabase, userId)

            // Increment tasks_completed on session
            if (actualSessionId) {
                const { data: sessionData } = await supabase
                    .from('sessions')
                    .select('total_tasks_completed')
                    .eq('id', actualSessionId)
                    .single()

                await supabase
                    .from('sessions')
                    .update({ total_tasks_completed: (sessionData?.total_tasks_completed || 0) + 1 })
                    .eq('id', actualSessionId)
            }

            // Update daily_task_log completed count
            const today = new Date().toISOString().split('T')[0]
            const { data: dailyLog } = await supabase
                .from('daily_task_log')
                .select('tasks_completed')
                .eq('user_id', userId)
                .eq('task_date', today)
                .maybeSingle()

            await supabase
                .from('daily_task_log')
                .upsert({
                    user_id: userId,
                    task_date: today,
                    tasks_completed: (dailyLog?.tasks_completed ?? 0) + 1,
                }, { onConflict: 'user_id,task_date' })

            // Check streak milestones
            const { data: profile } = await supabase
                .from('profiles')
                .select('compliance_streak')
                .eq('id', userId)
                .single()

            if (profile?.compliance_streak) {
                const streakAchievements = await awardStreak(supabase, userId, profile.compliance_streak)
                achievements.push(...streakAchievements)
            }
        } else {
            // ── FAIL: Apply punishment ───────────────────────
            const userTier = tier || task?.tier || 'Newbie'

            if (actualSessionId) {
                punishmentResult = await applyPunishment(
                    supabase,
                    userId,
                    actualSessionId,
                    'failed_verification',
                    userTier,
                    `Failed verification for task: ${task?.title || 'Unknown'}`
                )
            }
        }

        return NextResponse.json({
            verified: result.success,
            reason: result.reason,
            confidence: result.confidence,
            xpAwarded,
            punishmentHours: punishmentResult?.hours || 0,
            punishmentReason: punishmentResult?.reason || null,
            achievements,
            pendingMessage: randomPendingMessage(),
            processingDelayMs: delay,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        console.error('[Verify API] Error:', error)
        return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
    }
}

function buildVerificationPrompt(taskType: string, taskDescription: string): string {
    switch (taskType) {
        case 'cage_check':
        case 'photo':
            return `Analyze this image for task verification.
The task was: "${taskDescription}"
Check: Does this image provide clear evidence that the task was completed as described?
Look for specific indicators mentioned in the task description.
Respond with PASS or FAIL followed by a brief explanation of what you see.`

        case 'body_writing':
            return `Analyze this image for body writing verification.
The task was: "${taskDescription}"
Check: Is the specified text clearly written on the body as instructed?
Respond with PASS or FAIL followed by a brief explanation.`

        case 'outfit':
            return `Analyze this image for outfit/clothing verification.
The task was: "${taskDescription}"
Check: Is the subject wearing the specified clothing/outfit?
Respond with PASS or FAIL followed by a brief explanation.`

        default:
            return `Analyze this image for task completion verification.
The task was: "${taskDescription}"
Check: Does this image provide evidence of the task being completed?
Respond with PASS or FAIL followed by a brief explanation.`
    }
}
