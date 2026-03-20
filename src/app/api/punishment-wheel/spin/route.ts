import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'
import { buildWeightedPool, pickFromWeightedPool } from '@/lib/engines/punishment-wheel'
import { generateSimpleText, trackUsage } from '@/lib/ai/ai-service'
import type { PunishmentPoolItem } from '@/lib/supabase/schema'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, sessionId } = body as { userId?: string; sessionId?: string }

    if (!userId || !sessionId) {
      return NextResponse.json({ error: 'userId and sessionId are required' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    // Fetch session for violation count
    const { data: session } = await supabase
      .from('sessions')
      .select('id, total_tasks_failed, user_id')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .maybeSingle()

    const violations = (session?.total_tasks_failed as number | null) ?? 0

    // Fetch full pool
    const { data: poolData, error: poolError } = await supabase
      .from('punishment_pool')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (poolError) {
      return NextResponse.json({ error: 'Failed to fetch punishment pool' }, { status: 500 })
    }

    const pool = (poolData ?? []) as PunishmentPoolItem[]

    if (pool.length === 0) {
      return NextResponse.json({ error: 'Punishment pool is empty' }, { status: 422 })
    }

    // Weighted pick
    const weighted = buildWeightedPool(pool, violations)
    const selected = pickFromWeightedPool(weighted)

    // Create punishment task
    const deadline = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        session_id: sessionId,
        title: selected.title,
        description: selected.description,
        difficulty: selected.severity,
        task_type: 'punishment',
        source: 'system',
        status: 'active',
        cage_status: 'caged',
        genres: ['punishment'],
        deadline: deadline.toISOString(),
        requires_proof: selected.requires_proof,
        proof_type: selected.requires_proof ? 'image' : 'text',
        verification_requirement: selected.requires_proof ? 'Submit photo proof of completion.' : 'Acknowledge completion.',
        punishment_hours: 0,
      })
      .select()
      .single()

    if (taskError) {
      console.error('[WheelSpin] Task insert error:', taskError)
      return NextResponse.json({ error: 'Failed to create punishment task' }, { status: 500 })
    }

    // Write session event
    await supabase.from('session_events').insert({
      session_id: sessionId,
      user_id: userId,
      event_type: 'punishment_applied',
      payload: { source: 'wheel_spin', pool_item_id: selected.id, title: selected.title, severity: selected.severity, task_id: task?.id },
    })

    // Generate AI narration
    let narration = `You spun the wheel and landed on: ${selected.title}. ${selected.description}`
    try {
      const { text, usage } = await generateSimpleText(
        'You are a dominant AI delivering a punishment to a chastity subject. Be authoritative, brief (2-3 sentences max), and psychological.',
        `The punishment wheel has landed on: "${selected.title}". Severity: ${selected.severity}/5. Description: ${selected.description}. Deliver this punishment with menace.`,
      )
      narration = text
      await trackUsage(supabase, userId, 'llama-3.3-70b-versatile', usage, 'punishment_wheel')
    } catch (aiErr) {
      console.warn('[WheelSpin] AI narration failed, using fallback:', aiErr)
    }

    return NextResponse.json({ task, selected, narration })
  } catch (error) {
    console.error('[WheelSpin] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
