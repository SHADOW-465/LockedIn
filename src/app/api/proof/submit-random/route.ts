import { NextRequest, NextResponse } from 'next/server'
import { verifyImage } from '@/lib/ai/ai-service'
import { getServerSupabase } from '@/lib/supabase/server'
import { applyPunishment } from '@/lib/engines/punishment'
import { awardCompletion } from '@/lib/engines/rewards'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { scheduleId, imageBase64, storagePath, userId, sessionId, tier } = body as {
            scheduleId: string
            imageBase64?: string
            storagePath?: string
            userId: string
            sessionId?: string
            tier?: string
        }

        if (!scheduleId || !userId) {
            return NextResponse.json({ error: 'scheduleId and userId are required' }, { status: 400 })
        }

        const supabase = getServerSupabase()
        let base64Image = imageBase64

        // 1. Download image from storage if path is provided
        if (storagePath) {
            const { data, error } = await supabase
                .storage
                .from('verification-proofs')
                .download(storagePath)

            if (error) {
                console.error('[Proof/SubmitRandom] Download error:', error)
                return NextResponse.json({ error: 'Failed to retrieve proof image' }, { status: 400 })
            }

            const arrayBuffer = await data.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            base64Image = buffer.toString('base64')
        }

        if (!base64Image) {
            return NextResponse.json({ error: 'Image data is required' }, { status: 400 })
        }

        // 2. Fetch proof schedule details
        const { data: schedule, error: fetchErr } = await supabase
            .from('proof_schedules')
            .select('*')
            .eq('id', scheduleId)
            .single()

        if (fetchErr || !schedule) {
            return NextResponse.json({ error: 'Proof schedule slot not found' }, { status: 404 })
        }

        // Check if window is active or expired
        const now = new Date()
        const winEnd = new Date(schedule.window_end)
        const isLate = now > winEnd

        // 3. Build verification prompt to detect lock state
        const prompt = `Analyze this image for chastity device verification.
        Does this image show the user's cage/penis locked securely inside a chastity device?
        Look for metallic, plastic, or locked rings/structures around the genitals.
        Respond with PASS if a closed/locked chastity device is clearly visible, or FAIL if no device is visible, or if the device is open/unlocked.
        Provide a brief reason for your decision.`

        const result = await verifyImage(base64Image, prompt)

        // 4. Update the schedule entry
        const updatePayload: Record<string, any> = {
            completed: result.success,
            missed: !result.success,
            photo_url: storagePath || null,
            ai_verified: result.success,
            verification_score: result.confidence || 0.8,
            verification_details: { reason: result.reason, late: isLate },
            submitted_at: now.toISOString()
        }

        const { error: updateErr } = await supabase
            .from('proof_schedules')
            .update(updatePayload)
            .eq('id', scheduleId)

        if (updateErr) {
            console.error('[Proof/SubmitRandom] Update schedule error:', updateErr)
        }

        let punishmentHours = 0
        let punishmentReason = null

        if (result.success) {
            // Reward compliance
            await awardCompletion(supabase, userId, 3) // 3 difficulty units
            
            // Log successful session event
            const activeSessionId = sessionId || schedule.session_id
            if (activeSessionId) {
                await supabase.from('session_events').insert({
                    session_id: activeSessionId,
                    user_id: userId,
                    event_type: 'random_proof_passed',
                    payload: { schedule_id: scheduleId, score: result.confidence }
                })
            }
        } else {
            // Failed verification -> trigger punishment
            const userTier = tier || 'Newbie'
            const activeSessionId = sessionId || schedule.session_id

            if (activeSessionId) {
                const punishment = await applyPunishment(
                    supabase,
                    userId,
                    activeSessionId,
                    'failed_verification',
                    userTier,
                    `Failed random proof checkin. AI feedback: ${result.reason}`
                )
                if (punishment) {
                    punishmentHours = punishment.hours
                    punishmentReason = punishment.reason
                }
            }

            // Deduct willpower
            const { data: profile } = await supabase
                .from('profiles')
                .select('willpower_score')
                .eq('id', userId)
                .single()

            const currentWP = profile?.willpower_score ?? 50
            const newWP = Math.max(0, currentWP - 5)
            await supabase.from('profiles').update({ willpower_score: newWP }).eq('id', userId)
        }

        return NextResponse.json({
            verified: result.success,
            reason: result.reason,
            confidence: result.confidence,
            punishmentHours,
            punishmentReason,
            late: isLate,
            timestamp: now.toISOString(),
        }, { status: 200 })

    } catch (err) {
        console.error('[Proof/SubmitRandom] Error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
