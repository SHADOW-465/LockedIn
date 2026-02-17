import { NextRequest, NextResponse } from 'next/server'
import { generateSimpleText } from '@/lib/ai/ai-service'
import { getSupabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { userId, sessionId, tier, fetishes, regimens, hardLimits, personality } = body as {
            userId: string
            sessionId?: string
            tier: string
            fetishes?: string[]
            regimens?: string[]
            hardLimits?: string[]
            personality?: string
        }

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 })
        }

        const systemPrompt = `You are a task generator for the LockedIn chastity app.
Generate a single task for the user based on their profile.

RULES:
- Task should match the tier intensity: ${tier}
- Task should relate to their interests: ${fetishes?.join(', ') || 'general obedience'}
- Task should align with their regimens: ${regimens?.join(', ') || 'general obedience'}
- NEVER include content that violates hard limits: ${hardLimits?.join(', ') || 'None specified'}
- Include clear instructions and a time limit
- Tone should match persona: ${personality || 'Stern Taskmaster'}

Response format: VALID JSON only. No markdown fences, no explanation.
{
  "title": "Short task title",
  "description": "Detailed multi-line instructions for the slave",
  "difficulty": 1-5,
  "duration_minutes": 10-120,
  "genres": ["genre1", "genre2"],
  "cage_status": "caged" or "uncaged" or "semi-caged",
  "verification_type": "photo" or "self-report" or "timer",
  "verification_requirement": "What the proof photo must show",
  "punishment_hours": 2-48,
  "punishment_additional": "Additional punishment description if failed"
}`

        const result = await generateSimpleText(systemPrompt, 'Generate one task now.')

        // Parse AI response into task fields
        let taskData: Record<string, unknown>
        try {
            // Strip markdown fences if AI added them
            const cleaned = result.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()
            taskData = JSON.parse(cleaned)
        } catch {
            // Fallback: create a generic task
            taskData = {
                title: 'Obedience Task',
                description: result,
                difficulty: 2,
                duration_minutes: 15,
                genres: ['obedience'],
                cage_status: 'caged',
                verification_type: 'self-report',
                verification_requirement: 'Confirm completion honestly',
                punishment_hours: 4,
                punishment_additional: null,
            }
        }

        // Insert into DB
        const supabase = getSupabase()
        const now = new Date()
        const deadlineMs = (typeof taskData.duration_minutes === 'number' ? taskData.duration_minutes : 30) * 60 * 1000

        const { data: savedTask, error } = await supabase
            .from('tasks')
            .insert({
                user_id: userId,
                session_id: sessionId || null,
                title: taskData.title || 'Obedience Task',
                description: taskData.description || '',
                difficulty: Math.min(5, Math.max(1, Number(taskData.difficulty) || 2)),
                duration_minutes: taskData.duration_minutes || 30,
                genres: Array.isArray(taskData.genres) ? taskData.genres : ['obedience'],
                cage_status: taskData.cage_status || 'caged',
                verification_type: taskData.verification_type || 'self-report',
                verification_requirement: taskData.verification_requirement || '',
                punishment_type: 'task_failed',
                punishment_hours: taskData.punishment_hours || 4,
                punishment_additional: taskData.punishment_additional || null,
                status: 'pending',
                assigned_at: now.toISOString(),
                deadline: new Date(now.getTime() + deadlineMs).toISOString(),
            })
            .select()
            .single()

        if (error) {
            console.error('[Task API] DB insert failed:', error)
            // Still return the task data even if DB write fails
            return NextResponse.json({
                task: taskData,
                saved: false,
                error: error.message,
                timestamp: now.toISOString(),
            })
        }

        return NextResponse.json({
            task: savedTask,
            saved: true,
            timestamp: now.toISOString(),
        })
    } catch (error) {
        console.error('[Task API] Error:', error)
        return NextResponse.json({ error: 'Failed to generate task' }, { status: 500 })
    }
}
