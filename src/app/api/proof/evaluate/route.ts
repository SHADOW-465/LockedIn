import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'
import { verifyImage } from '@/lib/ai/ai-service'

export async function POST(request: NextRequest) {
    try {
        const { proofDocId, taskId, userId, fileBase64 } = await request.json() as {
            proofDocId: string
            taskId: string
            userId: string
            fileBase64: string
        }

        if (!proofDocId || !taskId || !userId || !fileBase64) {
            return NextResponse.json({ error: 'proofDocId, taskId, userId, fileBase64 required' }, { status: 400 })
        }

        const supabase = getServerSupabase()

        const { data: task } = await supabase
            .from('tasks')
            .select('user_id, title, description, verification_requirement')
            .eq('id', taskId)
            .single()

        if (!task || task.user_id !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const requirement = task.verification_requirement || task.description
        const prompt = [
            'You are a strict visual proof verifier for a chastity training app.',
            `Requirement: "${requirement}"`,
            'Carefully examine the image and determine if it clearly satisfies the requirement above.',
            'Describe specifically what you see in the image (1–2 sentences), then state PASS or FAIL with a reason.',
            'Format: [what you see] — PASS/FAIL: [reason]',
        ].join('\n')

        const result = await verifyImage(fileBase64, prompt)

        await supabase
            .from('proof_documents')
            .update({
                verification_status: result.success ? 'passed' : 'failed',
                verified_at: new Date().toISOString(),
            })
            .eq('id', proofDocId)

        await supabase
            .from('tasks')
            .update({
                ai_verification_passed: result.success,
                ai_verification_reason: result.reason,
                status: result.success ? 'verified' : 'awaiting_proof',
                completed_at: result.success ? new Date().toISOString() : null,
            })
            .eq('id', taskId)

        return NextResponse.json({ verified: result.success, reason: result.reason })
    } catch (error) {
        console.error('[Proof/Evaluate] Error:', error)
        return NextResponse.json({ error: 'Failed to evaluate proof' }, { status: 500 })
    }
}
