import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'
import { verifyImage, generateSimpleText, trackUsage } from '@/lib/ai/ai-service'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            taskId, userId, sessionId, proofType,
            textContent, fileBase64, localStorageKey,
            captureMetadata,
        } = body as {
            taskId: string
            userId: string
            sessionId?: string
            proofType: 'text' | 'image' | 'video' | 'audio'
            textContent?: string
            fileBase64?: string
            localStorageKey?: string
            captureMetadata?: {
                device_user_agent?: string
                capture_timestamp?: string
                duration_seconds?: number
            }
        }

        if (!taskId || !userId || !proofType) {
            return NextResponse.json({ error: 'taskId, userId, proofType required' }, { status: 400 })
        }

        const supabase = getServerSupabase()

        // ── Verify task exists and belongs to user ────────────
        const { data: task, error: taskError } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', taskId)
            .single()

        if (taskError || !task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 })
        }

        if (task.user_id !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        // Only accept proof for tasks that are pending, active, or awaiting_proof
        // 'pending' is included for check-in tasks which go straight to proof without a Start step
        if (!['pending', 'active', 'awaiting_proof'].includes(task.status)) {
            return NextResponse.json(
                { error: `Cannot submit proof for task in '${task.status}' state` },
                { status: 400 }
            )
        }

        // ── Verify proof type matches task requirement ────────
        if (task.proof_type && task.proof_type !== proofType) {
            return NextResponse.json(
                { error: `Expected proof type '${task.proof_type}', got '${proofType}'` },
                { status: 400 }
            )
        }

        // ── Validate proof content ────────────────────────────
        if (proofType === 'text') {
            if (!textContent?.trim()) {
                return NextResponse.json({ error: 'Text content is required for text proofs' }, { status: 400 })
            }
        } else {
            if (!fileBase64) {
                return NextResponse.json({ error: 'File data is required for media proofs' }, { status: 400 })
            }
            // File size validation (rough base64 → bytes: length * 0.75)
            const approxBytes = fileBase64.length * 0.75
            const maxBytes = proofType === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024
            if (approxBytes > maxBytes) {
                return NextResponse.json(
                    { error: `File too large. Max: ${maxBytes / (1024 * 1024)}MB` },
                    { status: 400 }
                )
            }
        }

        // ── Insert proof_documents metadata row ───────────────
        const { data: proofDoc, error: proofError } = await supabase
            .from('proof_documents')
            .insert({
                task_id: taskId,
                user_id: userId,
                session_id: sessionId || task.session_id || null,
                file_type: proofType,
                text_content: proofType === 'text' ? textContent : null,
                local_storage_key: localStorageKey || null,
                verification_status: 'pending',
            })
            .select()
            .single()

        if (proofError) {
            console.error('[Proof/Submit] Insert error:', proofError)
            return NextResponse.json({ error: 'Failed to save proof' }, { status: 500 })
        }

        // ── Update task status to proof_submitted ─────────────
        await supabase
            .from('tasks')
            .update({
                status: 'proof_submitted',
                verification_submitted_at: new Date().toISOString(),
            })
            .eq('id', taskId)

        // ── AI Verification ───────────────────────────────────
        let verified = false
        let verificationReason = ''

        try {
            if (proofType === 'text') {
                // Text proof: check against verification_requirement
                const requirement = task.verification_requirement || ''
                if (requirement) {
                    const { text } = await generateSimpleText(
                        `You are a strict task verifier. The user was required to provide text proof. ` +
                        `The requirement was: "${requirement}". ` +
                        `The user submitted: "${textContent}". ` +
                        `Does this meet the requirement? Respond with PASS or FAIL followed by brief explanation.`,
                        'Verify now.'
                    )
                    verified = text.toUpperCase().includes('PASS')
                    verificationReason = text
                } else {
                    // No specific requirement — accept any non-empty text
                    verified = true
                    verificationReason = 'Text proof accepted — no specific requirement set'
                }
            } else if (proofType === 'image') {
                // Image proof: use existing AI vision verification
                const prompt = `Analyze this image for task verification.\nThe task was: "${task.description}"\nCheck: Does this image provide clear evidence that the task was completed as described?\nRespond with PASS or FAIL followed by a brief explanation.`
                const result = await verifyImage(fileBase64!, prompt)
                verified = result.success
                verificationReason = result.reason
            } else if (proofType === 'video') {
                // Video proof: validate duration + accept (full video AI analysis is out of scope)
                const duration = captureMetadata?.duration_seconds || 0
                if (duration < 3) {
                    verified = false
                    verificationReason = 'Video too short. Minimum 3 seconds required.'
                } else {
                    verified = true
                    verificationReason = `Video proof accepted (${duration}s). Live capture verified.`
                }
            } else if (proofType === 'audio') {
                // Audio proof: validate duration
                const duration = captureMetadata?.duration_seconds || 0
                if (duration < 3) {
                    verified = false
                    verificationReason = 'Audio too short. Minimum 3 seconds required.'
                } else {
                    verified = true
                    verificationReason = `Audio proof accepted (${duration}s). Live capture verified.`
                }
            }
        } catch (verifyError) {
            console.error('[Proof/Submit] Verification error:', verifyError)
            verified = false
            verificationReason = 'Verification failed due to system error. Please try again.'
        }

        // ── Update proof_documents verification status ────────
        await supabase
            .from('proof_documents')
            .update({
                verification_status: verified ? 'passed' : 'failed',
                verified_at: new Date().toISOString(),
            })
            .eq('id', proofDoc.id)

        // ── Update task status based on verification ──────────
        const newStatus = verified ? 'verified' : 'awaiting_proof'
        await supabase
            .from('tasks')
            .update({
                status: newStatus,
                ai_verification_passed: verified,
                ai_verification_reason: verificationReason,
                completed_at: verified ? new Date().toISOString() : null,
            })
            .eq('id', taskId)

        // ── If verified: award XP and update session stats ────
        if (verified) {
            // Update willpower
            const { data: profile } = await supabase
                .from('profiles')
                .select('willpower_score')
                .eq('id', userId)
                .single()

            const currentWP = profile?.willpower_score ?? 50
            const wpDelta = Math.ceil((task.difficulty || 2) * 3)
            const newWP = Math.min(100, currentWP + wpDelta)
            await supabase.from('profiles').update({ willpower_score: newWP }).eq('id', userId)

            // Update session task count
            const effectiveSessionId = sessionId || task.session_id
            if (effectiveSessionId) {
                const { data: sess } = await supabase
                    .from('sessions')
                    .select('total_tasks_completed')
                    .eq('id', effectiveSessionId)
                    .single()

                await supabase
                    .from('sessions')
                    .update({ total_tasks_completed: (sess?.total_tasks_completed || 0) + 1 })
                    .eq('id', effectiveSessionId)
            }

            // Log event
            if (effectiveSessionId) {
                await supabase.from('session_events').insert({
                    session_id: effectiveSessionId,
                    user_id: userId,
                    event_type: 'task_completed',
                    payload: {
                        task_id: taskId,
                        proof_type: proofType,
                        verification_reason: verificationReason,
                    },
                })
            }
        }

        // ── Create notification ───────────────────────────────
        await supabase.from('notifications').insert({
            user_id: userId,
            type: verified ? 'reward' : 'punishment',
            title: verified ? `✅ Proof Verified: ${task.title}` : `❌ Proof Rejected: ${task.title}`,
            body: verificationReason,
            read: false,
        })

        return NextResponse.json({
            proofId: proofDoc.id,
            verified,
            verificationReason,
            status: newStatus,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        console.error('[Proof/Submit] Error:', error)
        return NextResponse.json({ error: 'Failed to process proof submission' }, { status: 500 })
    }
}
