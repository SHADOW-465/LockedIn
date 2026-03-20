import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'

const MAX_CUSTOM_ENTRIES = 20

export async function GET(request: NextRequest) {
  const userId = new URL(request.url).searchParams.get('userId')
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  const supabase = getServerSupabase()
  const { data: pool, error } = await supabase
    .from('punishment_pool')
    .select('*')
    .eq('user_id', userId)
    .order('is_custom', { ascending: true })

  if (error) {
    console.error('[PunishmentPool/GET] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch pool' }, { status: 500 })
  }

  return NextResponse.json({ pool: pool ?? [] })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, title, description, severity, requires_proof } = body as {
      userId?: string
      title?: string
      description?: string
      severity?: number
      requires_proof?: boolean
    }

    if (!userId || !title || !description || severity == null || requires_proof == null) {
      return NextResponse.json({ error: 'userId, title, description, severity, and requires_proof are required' }, { status: 400 })
    }

    if (severity < 1 || severity > 5) {
      return NextResponse.json({ error: 'severity must be between 1 and 5' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    // Check 20-entry custom limit
    const { count } = await supabase
      .from('punishment_pool')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_custom', true)

    if ((count ?? 0) >= MAX_CUSTOM_ENTRIES) {
      return NextResponse.json({ error: 'Custom pool limit reached (20 entries)' }, { status: 409 })
    }

    const { data: item, error } = await supabase
      .from('punishment_pool')
      .insert({ user_id: userId, title, description, severity, requires_proof, is_custom: true })
      .select()
      .single()

    if (error) {
      console.error('[PunishmentPool/POST] Error:', error)
      return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 })
    }

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('[PunishmentPool/POST] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
