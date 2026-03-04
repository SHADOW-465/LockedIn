import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'
import { generateSimpleText, trackUsage } from '@/lib/ai/ai-service'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId, sessionData } = await request.json()

    if (!sessionId || !userId || !sessionData) {
      return NextResponse.json({ error: 'sessionId, userId, sessionData required' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    const systemPrompt = `You are the AI Master of the LockedIn app. A session has just ended.
Generate a psychologically immersive session summary in your dominant persona.
Respond ONLY with valid JSON matching this exact structure:
{
  "narrative": "2-3 paragraph immersive recap in Master's voice",
  "compliance_rate": <number 0-100>,
  "performance_grade": "<S|A|B|C|D>",
  "highlights": ["<achievement 1>", "<achievement 2>"],
  "improvement_areas": ["<area 1>", "<area 2>"],
  "behavioral_insight": "One sentence psychological observation",
  "next_session_recommendation": "One sentence recommendation"
}`

    const userPrompt = `Session data:
- Duration: ${sessionData.actual_minutes} minutes (planned: ${sessionData.planned_minutes})
- Tasks: ${sessionData.tasks_completed} completed / ${sessionData.tasks_assigned} assigned / ${sessionData.tasks_failed} failed
- Master tasks: ${sessionData.master_completed} completed / ${sessionData.master_failed} failed
- Punishments: ${sessionData.punishment_count}
- Compliance rate: ${sessionData.compliance_rate}%
- Willpower: ${sessionData.willpower_start} → ${sessionData.willpower_end}
- Streak change: ${sessionData.streak_change > 0 ? '+' : ''}${sessionData.streak_change} days

Generate the session summary now.`

    const { text, usage } = await generateSimpleText(systemPrompt, userPrompt)
    await trackUsage(supabase, userId, 'llama-3.3-70b-versatile', usage, 'session_summary')

    let summary: Record<string, unknown>
    try {
      const cleaned = text.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()
      summary = JSON.parse(cleaned)
    } catch {
      summary = {
        narrative: text,
        compliance_rate: sessionData.compliance_rate,
        performance_grade: 'B',
        highlights: [],
        improvement_areas: [],
        behavioral_insight: 'Session data recorded.',
        next_session_recommendation: 'Continue training.',
      }
    }

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('[Sessions/Summary] Error:', error)
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
  }
}
